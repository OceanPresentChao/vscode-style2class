import * as vscode from 'vscode'
import { StyleHoverProvider } from './styleHoverProvider'
import { style2classHandler } from './style2class'

export function activate(context: vscode.ExtensionContext) {
  const selectors: vscode.DocumentSelector = [{
    language: 'html',
    scheme: 'file',
  }, {
    language: 'vue-html',
    scheme: 'file',
  }]
  context.subscriptions.push(vscode.commands.registerCommand('style-to-class.convertStyle', style2classHandler))
  context.subscriptions.push(vscode.languages.registerHoverProvider(selectors, new StyleHoverProvider()))
}

export function deactivate() {}
