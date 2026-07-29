import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** First letter of a display name/email/phone, uppercased. Falls back to "U". */
export function avatarInitial(display: string): string {
  return (display.replace(/[^a-zA-Z]/g, "")[0] ?? "U").toUpperCase()
}
