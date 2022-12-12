import * as vscode from 'vscode'
import { StyleHoverProvider } from './styleHoverProvider'
import { style2classHandler } from './style2class'

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('style-to-class.convertStyle', style2classHandler))
  context.subscriptions.push(vscode.languages.registerHoverProvider([{
    language: 'html',
    scheme: 'file',
  }], new StyleHoverProvider('html')))
  context.subscriptions.push(vscode.languages.registerHoverProvider([{
    language: 'vue-html',
    scheme: 'file',
  }, {
    language: 'vue',
    scheme: 'file',
  }], new StyleHoverProvider('vue')))
}

export function deactivate() {}
