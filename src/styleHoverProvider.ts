import * as vscode from 'vscode'
import { checkRangeValid } from './style2class'
export class StyleHoverProvider implements vscode.HoverProvider {
  constructor() {

  }

  public provideHover(document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {
    const range = document.getWordRangeAtPosition(position)
    const word = document.getText(range)
    if (word === 'style' && checkRangeValid(document, position)) {
      const args = [document.uri, position]
      const commandUri = vscode.Uri.parse(`command:style-to-class.convertStyle?${encodeURIComponent(JSON.stringify(args))}`)
      const markdownText = new vscode.MarkdownString(`[Convert Style](${commandUri})`)
      markdownText.isTrusted = true
      return new vscode.Hover(markdownText, new vscode.Range(position, position))
    }
  }
}

