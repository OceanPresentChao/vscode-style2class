import * as vscode from 'vscode'
import type { RangeContext, Strategy } from './type'
export class StrategyFactory {
  constructor() {

  }

  getStrategy(languageId: string) {
    if (languageId === 'html')
      return new HTMLStrategy()
    if (languageId === 'vue' || languageId === 'vue-html')
      return new VueStrategy()
  }
}

class HTMLStrategy implements Strategy {
  constructor() {

  }

  async getStyleRange(textEditor: vscode.TextEditor): Promise<RangeContext> {
    const document = textEditor.document
    let headRange = getTagRange(document, 'head')
    let styleRange = getTagRange(document, 'style', headRange!.tagRange)
    if (!styleRange) {
      await textEditor.edit((edit) => {
        edit.insert(headRange!.contentRange.end, '\n<style>\n<\/style>\n')
      })
      headRange = getTagRange(document, 'head')
      styleRange = getTagRange(document, 'style', headRange!.tagRange)
    }
    return styleRange!
  }

  checkValid(textEditor: vscode.TextEditor): boolean {
    const document = textEditor.document
    const headRange = getTagRange(document, 'head')
    if (!headRange) {
      vscode.window.showErrorMessage('No head tag found')
      return false
    }
    return true
  }
}

class VueStrategy implements Strategy {
  constructor() {

  }

  async getStyleRange(textEditor: vscode.TextEditor): Promise<RangeContext> {
    const document = textEditor.document
    let styleRange = getTagRange(document, 'style')
    if (!styleRange) {
      const text = '\n<style>\n<\/style>\n'
      const oldlen = document.getText().length
      const startPos = document.positionAt(oldlen)
      await textEditor.edit((edit) => {
        edit.insert(startPos, text)
      })
      const newlen = document.getText().length
      const endPos = document.positionAt(newlen)
      styleRange = getTagRange(document, 'style', new vscode.Range(startPos, endPos))
      // console.log(document.getText(styleRange!.tagRange))
      // console.log(document.getText(styleRange!.contentRange))
    }
    return styleRange!
  }

  checkValid(_textEditor: vscode.TextEditor): boolean {
    return true
  }
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
