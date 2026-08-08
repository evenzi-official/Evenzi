import { describe, it, expect } from 'vitest'
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '@/lib/constants/support'

const INTERIM = 'evenzi.official@gmail.com'

describe('SUPPORT_EMAIL', () => {
  it('resolves to the interim address (env or code fallback) until support@evenzii.com exists', () => {
    // Prefer NEXT_PUBLIC_SUPPORT_EMAIL when set; otherwise the code fallback.
    // Both should be the interim Gmail until launch.
    expect(SUPPORT_EMAIL).toBe(INTERIM)
  })
})

describe('SUPPORT_MAILTO', () => {
  it('builds a bare mailto with no arguments', () => {
    expect(SUPPORT_MAILTO()).toBe(`mailto:${INTERIM}`)
  })

  it('url-encodes subject and body', () => {
    expect(SUPPORT_MAILTO('Help & support', 'line one\nline two')).toBe(
      `mailto:${INTERIM}?subject=Help%20%26%20support&body=line%20one%0Aline%20two`
    )
  })

  it('omits body when not supplied', () => {
    expect(SUPPORT_MAILTO('Subject only')).toBe(
      `mailto:${INTERIM}?subject=Subject%20only`
    )
  })
})
