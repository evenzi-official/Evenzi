/**
 * The single source of truth for the support address.
 *
 * Do not hardcode this address anywhere else. Before this constant existed it
 * appeared in seven application files as a personal Gmail account, while two
 * operations documents published a different address on a domain the company
 * does not own. See spec section 10.1.
 *
 * INTERIM ADDRESS. support@evenzii.com does not exist yet and will be created
 * at launch. Until then this is the founder's own mailbox, which is real and
 * monitored — unlike the address the operations documents currently publish.
 *
 * The launch flip is one environment variable, not a code change: set
 * NEXT_PUBLIC_SUPPORT_EMAIL=support@evenzii.com in Vercel. Nothing needs
 * redeploying beyond that, and no file needs editing.
 */
export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || 'abhijith@evenzii.com'

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
