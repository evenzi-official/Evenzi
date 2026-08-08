import { describe, it, expect } from 'vitest'
import { getFocusableElements, nextTrapFocus } from '@/lib/hooks/useOverlaySurface'

/**
 * Minimal container that understands the FOCUSABLE selector string used by
 * getFocusableElements. Vitest runs in node; jsdom 29 is broken on Node 22
 * in this repo (ERR_REQUIRE_ASYNC_MODULE), so we stub just enough DOM.
 */
function makeContainer(html: string): HTMLElement {
  type NodeLike = {
    tag: string
    id: string
    disabled: boolean
    attrs: Record<string, string>
    getAttribute(name: string): string | null
  }

  const nodes: NodeLike[] = []
  const tagRe =
    /<(button|a|input|select|textarea)(\s[^>]*)?\/?>/gi
  let m: RegExpExecArray | null
  while ((m = tagRe.exec(html)) !== null) {
    const tag = m[1].toLowerCase()
    const attrStr = m[2] ?? ''
    const attrs: Record<string, string> = {}
    const attrRe = /([:\w-]+)(?:="([^"]*)")?/g
    let am: RegExpExecArray | null
    while ((am = attrRe.exec(attrStr)) !== null) {
      attrs[am[1].toLowerCase()] = am[2] ?? ''
    }
    const disabled = Object.prototype.hasOwnProperty.call(attrs, 'disabled')
    nodes.push({
      tag,
      id: attrs.id ?? '',
      disabled,
      attrs,
      getAttribute(name: string): string | null {
        const key = name.toLowerCase()
        if (!Object.prototype.hasOwnProperty.call(this.attrs, key)) return null
        return this.attrs[key]
      },
    })
  }

  function matches(node: NodeLike, sel: string): boolean {
    const s = sel.trim()
    if (s === 'button:not([disabled])') return node.tag === 'button' && !node.disabled
    if (s === 'a[href]') return node.tag === 'a' && node.getAttribute('href') !== null
    if (s === 'input:not([disabled])') return node.tag === 'input' && !node.disabled
    if (s === 'select:not([disabled])') return node.tag === 'select' && !node.disabled
    if (s === 'textarea:not([disabled])') return node.tag === 'textarea' && !node.disabled
    if (s === '[tabindex]:not([tabindex="-1"])') {
      const t = node.getAttribute('tabindex')
      return t !== null && t !== '-1'
    }
    return false
  }

  return {
    querySelectorAll(selector: string): NodeLike[] {
      const parts = selector.split(',').map((p) => p.trim())
      return nodes.filter((n) => parts.some((p) => matches(n, p)))
    },
  } as unknown as HTMLElement
}

describe('getFocusableElements', () => {
  it('finds buttons, links with href, and inputs', () => {
    const c = makeContainer(`
      <button id="a">a</button>
      <a id="b" href="/x">b</a>
      <input id="c" />
    `)
    expect(getFocusableElements(c).map((e) => e.id)).toEqual(['a', 'b', 'c'])
  })

  it('excludes disabled controls and anchors without href', () => {
    const c = makeContainer(`
      <button id="a" disabled>a</button>
      <a id="b">b</a>
      <button id="c">c</button>
    `)
    expect(getFocusableElements(c).map((e) => e.id)).toEqual(['c'])
  })

  it('excludes elements with tabindex="-1"', () => {
    const c = makeContainer(`
      <button id="a" tabindex="-1">a</button>
      <button id="b">b</button>
    `)
    expect(getFocusableElements(c).map((e) => e.id)).toEqual(['b'])
  })
})

describe('nextTrapFocus', () => {
  const items = ['first', 'middle', 'last']

  it('wraps forward from the last element to the first', () => {
    expect(nextTrapFocus(items, 'last', false)).toBe('first')
  })

  it('wraps backward from the first element to the last', () => {
    expect(nextTrapFocus(items, 'first', true)).toBe('last')
  })

  it('moves forward normally in the middle', () => {
    expect(nextTrapFocus(items, 'first', false)).toBe('middle')
  })

  it('returns the first element when focus is outside the trap', () => {
    expect(nextTrapFocus(items, 'elsewhere', false)).toBe('first')
  })

  it('returns null for an empty trap', () => {
    expect(nextTrapFocus([], 'anything', false)).toBeNull()
  })
})
