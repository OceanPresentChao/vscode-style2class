import * as vscode from 'vscode'
import type { IConvertOptions } from './type'
import { StrategyFactory } from './StrategyFactory'

export async function style2classHandler(textEditor: vscode.TextEditor, _edit: vscode.TextEditorEdit, pos: { line: number; character: number }, options: IConvertOptions) {
  const { partial, languageId } = options
  const strategyFactory = new StrategyFactory()
  const position = new vscode.Position(pos.line, pos.character)
  const document = textEditor.document
  const wrapRange = getWrapRange(document, position)
  const inlineStyleRange = getRulesRange(document, wrapRange, 'style')
  const inlineClassRange = getRulesRange(document, wrapRange, 'class')
  const inlineStyleText = document.getText(inlineStyleRange)
  const inlineClassText = document.getText(inlineClassRange)
  const styleItems = getItems(inlineStyleText, ';')
  const classItems = getItems(inlineClassText, ' ')
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
      const styleRange = await strategyFactory.getStrategy(languageId)?.getStyleRange(textEditor)
      if (!styleRange)
        return
      await textEditor.edit((edit) => {
        const classRulesText = createClassText(className, choices)
        const remainingStyleItems = styleItems.filter(v => !choices.includes(v))
        const inlineStyleText = createInlineText('style', remainingStyleItems)
        const inlineClassText = createInlineText('class', [...classItems, className])
        edit.insert(styleRange.contentRange.end, classRulesText)
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

function getItems(inlineText: string, split: string) {
  // style="color: red; font-size: 12px;"
  inlineText = inlineText.slice(inlineText.indexOf('"') + 1, inlineText.lastIndexOf('"'))
  const rules = inlineText.split(split).filter(v => v.trim().length > 0)
  return rules
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
  let idx = html.indexOf(key)
  if (idx === -1) {
    const insertPosition = new vscode.Position(range.end.line, range.end.character - 1)
    return new vscode.Range(insertPosition, insertPosition)
  }
  // 防止vue的bind语法干扰
  while (html[idx - 1] === ':')
    idx = html.indexOf(key, idx + 1)
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

export function checkRangeValid(document: vscode.TextDocument, position: vscode.Position) {
  const wrapRange = getWrapRange(document, position)
  const tagContent = document.getText(wrapRange)
  return /^\<(?<tag>\w+)(?:\s*[\d\w\s-\.:;\"\'=]+\s*)*\>$/.test(tagContent)
}

function createInlineText(key: string, items: string[]) {
  let res = ` ${key}="`
  for (const item of items) {
    res += ` ${item}`
    if (key === 'style')
      res += ';'
  }
  res += '" '
  return res
}

function createClassText(className: string, rules: string[]) {
  let res = `\n.${className} {\n`
  for (const rule of rules)
    res += `\t${rule};\n`
  res += '}\n'
  return res
}
