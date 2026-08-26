/**
 * WhatsApp "click-to-chat" invite helpers (Path A).
 *
 * The host sends invitations from their OWN WhatsApp via a wa.me link. wa.me
 * only pre-fills TEXT — it cannot attach the invitation card image (that is
 * Path B, the Business API). See docs/superpowers/specs/2026-08-26-whatsapp-invites-path-a-design.md.
 *
 * Security note (council 2026-08-26): the phone goes into the wa.me PATH, which
 * encodeURIComponent on the text does NOT protect. normalizeWhatsAppPhone hard-
 * strips to digits and validates before it can ever reach the URL, so a value
 * like `911234?text=EVIL&x=` cannot smuggle query params or a different target.
 */

const DEFAULT_COUNTRY_CODE = '91' // India — matches the app's phone-auth config.

/**
 * Normalise a stored/host-entered phone into bare E.164 digits (no `+`, no
 * spaces) suitable for the wa.me path. Returns null when the result isn't a
 * plausible phone — callers MUST skip a guest whose phone returns null rather
 * than interpolate it.
 *
 * Rules:
 * - strip every non-digit;
 * - a bare 10-digit number gets the +91 default;
 * - a `0091…` international-prefix form drops the `00`;
 * - an already-country-coded number (e.g. `91XXXXXXXXXX`) is left as-is — never
 *   double-prefixed (the earlier "double +91" bug);
 * - the final value must be 10–15 digits, else null.
 */
export function normalizeWhatsAppPhone(raw: string | null | undefined): string | null {
  if (!raw) return null

  let digits = String(raw).replace(/\D/g, '')
  if (digits === '') return null

  // 00 international prefix → drop it.
  if (digits.startsWith('00')) digits = digits.slice(2)

  // Bare local 10-digit number → apply the country default.
  if (digits.length === 10) digits = DEFAULT_COUNTRY_CODE + digits

  // Plausibility gate. Anything outside E.164's 10–15 digit range is rejected.
  if (!/^\d{10,15}$/.test(digits)) return null

  return digits
}

/**
 * Build the pre-filled message body: greeting + the event's default guest
 * message + the site link, separated by blank lines. Falls back to a generic
 * invite line when the host hasn't set a default message.
 */
export function buildInviteText({
  guestName,
  defaultMessage,
  siteUrl,
}: {
  guestName: string | null | undefined
  defaultMessage: string | null | undefined
  siteUrl: string
}): string {
  const name = (guestName ?? '').trim()
  const message = (defaultMessage ?? '').trim()
    || "You're invited to our celebration — details and RSVP here:"

  const greeting = name ? `Hi ${name},` : ''
  // Join only the non-empty parts so a missing greeting doesn't leave a blank
  // line at the top.
  return [greeting, message, siteUrl].filter(Boolean).join('\n\n')
}

/**
 * Build the full wa.me click-to-chat URL. Returns null when the phone can't be
 * normalised — the caller treats that as "this guest can't be messaged".
 * Only the text is percent-encoded; the phone has already been reduced to a
 * validated digit string.
 */
export function buildWhatsAppUrl({
  phone,
  text,
}: {
  phone: string | null | undefined
  text: string
}): string | null {
  const digits = normalizeWhatsAppPhone(phone)
  if (!digits) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

/**
 * Convenience: build the ready-to-open wa.me URL for one guest. Returns null if
 * the guest has no usable phone.
 */
export function buildGuestInviteUrl({
  guestName,
  phone,
  defaultMessage,
  siteUrl,
}: {
  guestName: string | null | undefined
  phone: string | null | undefined
  defaultMessage: string | null | undefined
  siteUrl: string
}): string | null {
  const text = buildInviteText({ guestName, defaultMessage, siteUrl })
  return buildWhatsAppUrl({ phone, text })
}
