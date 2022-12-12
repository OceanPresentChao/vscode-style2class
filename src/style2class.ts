import * as vscode from 'vscode'

export async function style2classHandler(textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, pos: { line: number; character: number }, partial: boolean) {
  const document = textEditor.document
  const position = new vscode.Position(pos.line, pos.character)
  const wrapRange = getWrapRange(document, position)
  const inlineStyleRange = getRulesRange(document, wrapRange, 'style')
  const inlineClassRange = getRulesRange(document, wrapRange, 'class')
  let headRange = getTagRange(document, 'head')
  if (!headRange) {
    vscode.window.showErrorMessage('No head tag found')
    return
  }
  let styleRange = getTagRange(document, 'style', headRange.tagRange)
  if (!styleRange) {
    await textEditor.edit((edit) => {
      edit.insert(headRange!.contentRange.end, '<style>\n<\/style>\n')
    })
    headRange = getTagRange(document, 'head')
    styleRange = getTagRange(document, 'style', headRange!.tagRange)
  }
  const inlineStyleText = document.getText(inlineStyleRange)
  const inlineClassText = document.getText(inlineClassRange)
  const styleItems = getItems(inlineStyleText)
  const classItems = getItems(inlineClassText)
  const choices = partial ? await chooseStyles(styleItems) : styleItems
  if (!choices || choices.length === 0)
    return
  vscode.window.showInputBox(
    {
      password: false,
      ignoreFocusOut: true,
      placeHolder: 'class name',
      prompt: 'Input class name you want to convert into',
      validateInput(text) {
        if (!/-?[_a-zA-Z]+[_a-zA-Z0-9-]*/.test(text.trim()))
          return 'class name is invalid'
      },
    })
    .then(async (className) => {
      if (!className)
        return
      await textEditor.edit((edit) => {
        const classRulesText = createClassText(className, choices)
        const remainingStyleItems = styleItems.filter(v => !choices.includes(v))
        const inlineStyleText = createInlineText('style', remainingStyleItems)
        const inlineClassText = createInlineText('class', [...classItems, className])
        edit.insert(styleRange!.contentRange.end, classRulesText)
        if (choices.length === styleItems.length) {
          edit.replace(inlineStyleRange, inlineClassText)
        }
        else {
          edit.replace(inlineClassRange, inlineClassText)
          edit.replace(inlineStyleRange, inlineStyleText)
        }
      })
      vscode.commands.executeCommand('editor.action.formatDocument')
    })
}

function getItems(inlineText: string) {
  // style="color: red; font-size: 12px;"
  inlineText = inlineText.slice(inlineText.indexOf('"') + 1, inlineText.lastIndexOf('"'))
  const rules = inlineText.split(';').filter(v => v.trim().length > 0)
  return rules
}

function createClassText(className: string, rules: string[]) {
  let res = `.${className} {\n`
  for (const rule of rules)
    res += `\t${rule};\n`
  res += '}'
  return res
}

function chooseStyles(rules: string[]) {
  return vscode.window.showQuickPick(
    rules,
    {
      canPickMany: true,
      ignoreFocusOut: true,
      matchOnDescription: true,
      matchOnDetail: true,
      placeHolder: 'Choose style rules you want to convert',
    })
}

function getRulesRange(document: vscode.TextDocument, range: vscode.Range, key: string) {
  const html = document.getText(range)
  const idx = html.indexOf(key)
  const quote1 = html.substring(idx).indexOf('"')
  const quote2 = html.substring(idx + quote1 + 1).indexOf('"')
  return new vscode.Range(document.positionAt(idx + document.offsetAt(range.start)), document.positionAt(idx + quote1 + quote2 + 2 + document.offsetAt(range.start)))
}

function getWrapRange(document: vscode.TextDocument, position: vscode.Position) {
  const index = document.offsetAt(position)
  const html = document.getText()
  const left = html.substring(0, index)
  const right = html.substring(index)
  const leftIdx = left.lastIndexOf('<')
  const rightIdx = right.indexOf('>')
  return new vscode.Range(document.positionAt(leftIdx), document.positionAt(index + rightIdx + 1))
}

function getTagRange(document: vscode.TextDocument, tag: string, range?: vscode.Range) {
  const html = document.getText(range)
  const match = new RegExp(`<${tag}>(?<content>.*)<\/${tag}>`, 'dis').exec(html)
  if (!match) {
    return null
  }
  else {
    const tagStart = match.index + (range ? document.offsetAt(range.start) : 0)
    const tagEnd = match.index + match[0].length + (range ? document.offsetAt(range.start) : 0)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const contentStart = match.indices.groups.content[0] + (range ? document.offsetAt(range.start) : 0)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const contentEnd = match.indices.groups.content[1] + (range ? document.offsetAt(range.start) : 0)
    return {
      contentRange: new vscode.Range(document.positionAt(contentStart), document.positionAt(contentEnd)),
      tagRange: new vscode.Range(document.positionAt(tagStart), document.positionAt(tagEnd)),
    }
  }
}

export function checkRangeValid(document: vscode.TextDocument, position: vscode.Position) {
  const wrapRange = getWrapRange(document, position)
  const tagContent = document.getText(wrapRange)
  return /^\<(?<tag>\w+)(?:\s*[\d\w\s-\.:;\"\'=]+\s*)*\>$/.test(tagContent)
}

function createInlineText(key: string, items: string[]) {
  let res = `${key}="`
  for (const item of items) {
    res += ` ${item}`
    if (key === 'style')
      res += ';'
  }
  res += '"'
  return res
}
