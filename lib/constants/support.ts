/**
 * The single source of truth for the support address.
 *
 * Do not hardcode this address anywhere else. Before this constant existed it
 * appeared in seven application files as a personal Gmail account, while two
 * operations documents published a different address on a domain the company
 * does not own. See spec section 10.1.
 *
 * INTERIM: evenzi.official@gmail.com (monitored). At launch, set
 * NEXT_PUBLIC_SUPPORT_EMAIL=support@evenzii.com in Vercel — no code change.
 * Local: same var in `.env.local`. Fallback below matches the interim inbox
 * so a missing env does not silently revert to a stale address.
 */
export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || 'evenzi.official@gmail.com'

/** Support hours as published in platform-policies.md section 7.2. */
export const SUPPORT_HOURS = 'Mon–Sat, 9 AM–7 PM IST'

/** First-response commitment as published in platform-policies.md section 7.2. */
export const SUPPORT_RESPONSE_HOURS = 24

export function SUPPORT_MAILTO(subject?: string, body?: string): string {
  const params: string[] = []
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`)
  if (body) params.push(`body=${encodeURIComponent(body)}`)
  return params.length > 0
    ? `mailto:${SUPPORT_EMAIL}?${params.join('&')}`
    : `mailto:${SUPPORT_EMAIL}`
}
