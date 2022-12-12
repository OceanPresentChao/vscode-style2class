import type { Range, TextEditor } from 'vscode'
export interface IConvertOptions {
  partial: boolean
  languageId: string
}

export interface RangeContext { contentRange: Range; tagRange: Range }

export interface Strategy {
  /**
   *
   * @param textEditor
   * @param position
   * @returns 返回Style标签的Range
   */
  getStyleRange(textEditor: TextEditor): Promise<RangeContext | null>
}
