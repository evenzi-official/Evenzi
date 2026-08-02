import { NextResponse } from 'next/server'

export const COOKIE_NAME = 'evz_guest_session'
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export function mapRpcError(message: string): { status: number; body: string } {
  switch (message) {
    case 'lookup failed':                         return { status: 401, body: 'No matching guest found' }
    case 'too many attempts, try again later':    return { status: 429, body: 'Too many attempts — please try again later' }
    case 'invalid session':                       return { status: 401, body: 'Session expired — please identify yourself again' }
    case 'guest is not tagged to this sub-event': return { status: 403, body: 'You are not registered for this event' }
    default:                                      return { status: 500, body: 'Something went wrong' }
  }
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, '', { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0 })
}
