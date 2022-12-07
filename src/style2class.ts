import * as vscode from 'vscode'

export async function style2classHandler(documentUri: vscode.Uri, pos: { line: number; character: number }) {
  const document = await vscode.workspace.openTextDocument(documentUri)
  const position = new vscode.Position(pos.line, pos.character)
  const wrapRange = getWrapRange(document, position)
  const inlineStyleRange = getRulesRange(document, wrapRange, 'style')
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
    .then((className) => {
      if (!className || !className.trim)
        return

      const headRange = getTagRange(document, 'head')
      if (!headRange)
        return

      const styleRange = getTagRange(document, 'style', headRange.tagRange)

      if (!styleRange)
        return

      const editor = vscode.window.activeTextEditor
      if (!editor)
        return
      editor.edit((editBuilder) => {
        const inlineStyleText = document.getText(inlineStyleRange)
        const classRulesText = getRules(inlineStyleText, className)
        const inlineClassText = createInlineClass(className)
        editBuilder.insert(styleRange.contentRange.end, classRulesText)
        editBuilder.replace(inlineStyleRange, inlineClassText)
      })
      vscode.commands.executeCommand('editor.action.formatDocument')
    })
}

function getRules(style: string, className: string) {
  // style="color: red; font-size: 12px;"
  style = style.slice(style.indexOf('"') + 1, style.lastIndexOf('"'))
  const rules = style.split(';').filter(v => v.trim().length > 0)
  return createClassText(className, rules)
}

function createClassText(className: string, rules: string[]) {
  let res = `.${className} {\n`
  for (const rule of rules)
    res += `\t${rule};\n`
  res += '}'
  return res
}

function createInlineClass(className: string) {
  return `class="${className}"`
}

function chooseStyles(rules: string[]) {
  vscode.window.showQuickPick(
    rules,
    {
      canPickMany: true,
      ignoreFocusOut: true,
      matchOnDescription: true,
      matchOnDetail: true,
      placeHolder: 'Choose style rules you want to convert',
    })
    .then((choices) => {
      console.log(choices)
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
