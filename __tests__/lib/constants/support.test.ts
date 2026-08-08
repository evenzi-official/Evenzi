import { describe, it, expect } from 'vitest'
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '@/lib/constants/support'

describe('SUPPORT_EMAIL', () => {
  it('defaults to the interim address while the support mailbox does not exist', () => {
    expect(SUPPORT_EMAIL).toBe('abhijith@evenzii.com')
  })

  it('is on the owned evenzii.com domain', () => {
    expect(SUPPORT_EMAIL).toMatch(/@evenzii\.com$/)
  })

  it('is never a consumer mail provider', () => {
    expect(SUPPORT_EMAIL).not.toMatch(/gmail|yahoo|outlook|hotmail/i)
  })
})

describe('SUPPORT_MAILTO', () => {
  it('builds a bare mailto with no arguments', () => {
    expect(SUPPORT_MAILTO()).toBe('mailto:abhijith@evenzii.com')
  })

  it('url-encodes subject and body', () => {
    expect(SUPPORT_MAILTO('Help & support', 'line one\nline two')).toBe(
      'mailto:abhijith@evenzii.com?subject=Help%20%26%20support&body=line%20one%0Aline%20two'
    )
  })

  it('omits body when not supplied', () => {
    expect(SUPPORT_MAILTO('Subject only')).toBe(
      'mailto:abhijith@evenzii.com?subject=Subject%20only'
    )
  })
})
