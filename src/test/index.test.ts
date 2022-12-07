import * as fs from 'fs/promises'
import * as path from 'path'
import { describe, expect, it } from 'vitest'

describe.skip('suite test', () => {
  it('test', async () => {
    const file = await fs.readFile(path.resolve(__dirname, './sample.html'), { encoding: 'utf-8' })
    expect(file).toMatchSnapshot()
  })
})

describe('is the string contained by a html tag', () => {
  it('true', () => {
    const html = '<div><div style ></div></div>'
    expect(checkValid(html, html.indexOf('style'))).toBe(true)
  })
  it('true', () => {
    const html = '<div><div style="display:none;" checked ></div></div>'
    expect(checkValid(html, html.indexOf('style'))).toBe(true)
  })
  it('false', () => {
    const html = '<div><div>style</div></div>'
    expect(checkValid(html, html.indexOf('style'))).toBe(false)
  })
  it('false', () => {
    const html = '<div><div></div style></div>'
    expect(checkValid(html, html.indexOf('style'))).toBe(false)
  })
  it('true', () => {
    const html = '<div><div style> \<  </div ></div>'
    expect(checkValid(html, html.indexOf('style'))).toBe(true)
  })
})

describe('get style rules', () => {
  it('test', () => {
    const html = '<div style="display:none;color:black;" checked >'
    const styleRules = getRulesRange(html, 'style')
    expect(styleRules).toMatchInlineSnapshot('"display:none;color:black;"')
  })
})

