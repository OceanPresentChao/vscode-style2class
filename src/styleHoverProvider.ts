import * as vscode from 'vscode'
import { checkRangeValid } from './style2class'
export class StyleHoverProvider implements vscode.HoverProvider {
  languageId: string
  constructor(languageId: string) {
    this.languageId = languageId
  }

  public provideHover(document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {
    const range = document.getWordRangeAtPosition(position)
    const word = document.getText(range)
    if (word === 'style' && checkRangeValid(document, position)) {
      const args = position
      const commandUriAll = vscode.Uri.parse(`command:style-to-class.convertStyle?${encodeURIComponent(JSON.stringify([args, { partial: false, languageId: this.languageId }]))}`)
      const commandUriPart = vscode.Uri.parse(`command:style-to-class.convertStyle?${encodeURIComponent(JSON.stringify([args, { partial: true, languageId: this.languageId }]))}`)
      const markdownText = new vscode.MarkdownString(`[Convert Style](${commandUriAll})  [Choose Style](${commandUriPart})`)
      markdownText.isTrusted = true
      return new vscode.Hover(markdownText, new vscode.Range(position, position))
    }
  }
}

