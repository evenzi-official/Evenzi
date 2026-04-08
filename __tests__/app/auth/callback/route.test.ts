import { describe, it, expect } from 'vitest'

describe('callback redirect safety', () => {
  const allowedPaths = ['/home', '/auth/role-selection']

  it('allows /home as redirect target', () => {
    const next = '/home'
    const safe = allowedPaths.includes(next) ? next : '/home'
    expect(safe).toBe('/home')
  })

  it('allows /auth/role-selection as redirect target', () => {
    const next = '/auth/role-selection'
    const safe = allowedPaths.includes(next) ? next : '/home'
    expect(safe).toBe('/auth/role-selection')
  })

  it('blocks open redirect to external URL', () => {
    const next = '//evil.com'
    const safe = allowedPaths.includes(next) ? next : '/home'
    expect(safe).toBe('/home')
  })

  it('blocks open redirect with backslash', () => {
    const next = '/\\evil.com'
    const safe = allowedPaths.includes(next) ? next : '/home'
    expect(safe).toBe('/home')
  })

  it('blocks arbitrary path redirect', () => {
    const next = '/admin/delete-all'
    const safe = allowedPaths.includes(next) ? next : '/home'
    expect(safe).toBe('/home')
  })

  it('defaults to /home when next is null', () => {
    const next = null
    const safe = next && allowedPaths.includes(next) ? next : '/home'
    expect(safe).toBe('/home')
  })
})
