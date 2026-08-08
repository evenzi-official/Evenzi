import { describe, it, expect } from 'vitest'
import { renderHelpMarkdown } from '@/lib/help/markdown'

describe('renderHelpMarkdown', () => {
  it('renders a numbered list as a real ordered list', async () => {
    const html = await renderHelpMarkdown('1. first\n2. second')
    expect(html).toContain('<ol>')
    expect(html).toContain('<li>first</li>')
  })

  it('strips raw HTML', async () => {
    const html = await renderHelpMarkdown('<script>alert(1)</script>hello')
    expect(html).not.toContain('<script>')
    expect(html).toContain('hello')
  })

  it('strips a javascript: URL', async () => {
    const html = await renderHelpMarkdown('[click](javascript:alert(1))')
    expect(html).not.toContain('javascript:')
  })

  it('strips an entity-encoded javascript: URL', async () => {
    const html = await renderHelpMarkdown('[click](&#106;avascript:alert(1))')
    expect(html.toLowerCase()).not.toContain('javascript:')
  })

  it('strips a data: URI', async () => {
    const html = await renderHelpMarkdown('![x](data:text/html;base64,PHNjcmlwdD4=)')
    expect(html).not.toContain('data:')
  })

  it('strips style attributes', async () => {
    const html = await renderHelpMarkdown('<p style="position:fixed">x</p>')
    expect(html).not.toContain('style=')
  })

  it('strips srcset', async () => {
    const html = await renderHelpMarkdown('<img src="/a.png" srcset="evil.png 2x">')
    expect(html).not.toContain('srcset')
  })

  it('strips svg', async () => {
    const html = await renderHelpMarkdown('<svg><foreignObject><body>x</body></foreignObject></svg>')
    expect(html).not.toContain('<svg')
  })

  it('keeps a normal https link', async () => {
    const html = await renderHelpMarkdown('[docs](https://evenzii.com/help)')
    expect(html).toContain('href="https://evenzii.com/help"')
  })

  it('keeps bold, italic and inline code', async () => {
    const html = await renderHelpMarkdown('**b** _i_ `c`')
    expect(html).toContain('<strong>b</strong>')
    expect(html).toContain('<code>c</code>')
  })
})
