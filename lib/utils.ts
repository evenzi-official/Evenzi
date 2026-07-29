import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** First letter of a display name/email/phone, uppercased. Falls back to "U". */
export function avatarInitial(display: string): string {
  return (display.replace(/[^a-zA-Z]/g, "")[0] ?? "U").toUpperCase()
}

/**
 * Strips the India country code from a stored phone number for display.
 * Numbers are stored with the country code and no "+" (e.g. "919999999999"),
 * while the UI shows a separate "+91" prefix — without this the code appears twice.
 */
export function formatPhone(phone: string | null): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  return digits.startsWith('91') && digits.length > 10 ? digits.slice(2) : digits
}
