# Evenzi Brand Guidelines

> **Status:** DRAFT — Pending confirmation. All values below are placeholders.
> Once confirmed, update this file and all UI components will reference these tokens.

---

## Brand Name
- **Full name:** Evenzi
- **Tagline:** TBD

## Logo
- **Primary logo:** TBD (currently using text "Evenzi" in bold)
- **Icon/favicon:** TBD
- **Usage rules:** TBD

---

## Color Palette

> These are placeholder values. Update when brand colors are confirmed.

### Primary Colors
| Token | Name | Hex | Usage |
|-------|------|-----|-------|
| `--color-primary` | Primary | `#111827` | Buttons, headings, key actions |
| `--color-primary-hover` | Primary Hover | `#1f2937` | Button hover states |

### Accent Colors
| Token | Name | Hex | Usage |
|-------|------|-----|-------|
| `--color-accent` | Accent | TBD | Highlights, badges, active states |
| `--color-accent-hover` | Accent Hover | TBD | Accent hover states |

### Neutrals
| Token | Name | Hex | Usage |
|-------|------|-----|-------|
| `--color-bg-primary` | Background | `#f9fafb` | Page backgrounds |
| `--color-bg-card` | Card Background | `#ffffff` | Card/panel backgrounds |
| `--color-text-primary` | Text Primary | `#111827` | Headings, body text |
| `--color-text-secondary` | Text Secondary | `#6b7280` | Subtitles, descriptions |
| `--color-text-muted` | Text Muted | `#9ca3af` | Footers, fine print |
| `--color-border` | Border | `#e5e7eb` | Card borders, dividers |

### Semantic Colors
| Token | Name | Hex | Usage |
|-------|------|-----|-------|
| `--color-success` | Success | `#22c55e` | Success messages, confirmations |
| `--color-error` | Error | `#ef4444` | Error messages, alerts |
| `--color-warning` | Warning | `#f59e0b` | Warnings, caution states |
| `--color-info` | Info | `#3b82f6` | Informational messages |

---

## Typography

> Placeholder fonts. Update when brand typography is confirmed.

### Font Families
| Token | Name | Font | Usage |
|-------|------|------|-------|
| `--font-display` | Display | TBD | Page headings, hero text |
| `--font-body` | Body | TBD | Body text, descriptions |
| `--font-mono` | Mono | TBD | Code, technical text |

### Font Sizes
| Token | Size | Line Height | Usage |
|-------|------|-------------|-------|
| `--text-xs` | 12px | 16px | Badges, fine print |
| `--text-sm` | 14px | 20px | Captions, labels |
| `--text-base` | 16px | 24px | Body text |
| `--text-lg` | 18px | 28px | Subtitles |
| `--text-xl` | 20px | 28px | Section headings |
| `--text-2xl` | 24px | 32px | Card titles |
| `--text-3xl` | 30px | 36px | Page subheadings |
| `--text-4xl` | 36px | 40px | Page headings |

### Font Weights
| Token | Weight | Usage |
|-------|--------|-------|
| `--font-normal` | 400 | Body text |
| `--font-medium` | 500 | Labels, subtle emphasis |
| `--font-semibold` | 600 | Buttons, CTAs |
| `--font-bold` | 700 | Headings |

---

## Spacing & Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 8px | Small buttons, inputs |
| `--radius-md` | 12px | Buttons, cards |
| `--radius-lg` | 16px | Large cards, modals |
| `--radius-full` | 9999px | Pills, badges, avatars |

---

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0px 1px 2px rgba(0,0,0,0.05)` | Cards, subtle elevation |
| `--shadow-md` | `0px 4px 6px rgba(0,0,0,0.07)` | Dropdowns, modals |
| `--shadow-lg` | `0px 10px 15px rgba(0,0,0,0.1)` | Popovers, dialogs |

---

## Implementation Notes

All brand values should be defined as **CSS custom properties** (via Tailwind `theme.extend` in `tailwind.config.ts`) so components reference tokens, not raw values. When brand guidelines are confirmed:

1. Update this document with final values
2. Update `tailwind.config.ts` theme tokens
3. All components automatically pick up changes — no per-file edits needed
