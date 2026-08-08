import type { HelpAudience, HelpCategory } from '@/lib/help/types'

/** App-corpus categories — matches `config.faq_categories` seed (audience=app). */
export const APP_HELP_CATEGORIES: ReadonlyArray<
  Omit<HelpCategory, 'articleCount'>
> = [
  {
    slug: 'getting-started',
    name: 'Getting Started',
    description: 'Creating your account, signing in, and finding your way around.',
    iconName: 'rocket_launch',
  },
  {
    slug: 'creating-events',
    name: 'Creating Events',
    description: 'The event wizard, sub-events, and event settings.',
    iconName: 'event',
  },
  {
    slug: 'managing-guests',
    name: 'Managing Guests',
    description: 'Adding, importing and organising the people you are inviting.',
    iconName: 'groups',
  },
  {
    slug: 'invitations-rsvp',
    name: 'Invitations & RSVP',
    description: 'Sending invitations, sharing links, and tracking who is coming.',
    iconName: 'forward_to_inbox',
  },
  {
    slug: 'account-billing',
    name: 'Account & Billing',
    description: 'Your account, your plan, and your data.',
    iconName: 'account_circle',
  },
  {
    slug: 'troubleshooting',
    name: 'Troubleshooting',
    description: 'Common errors and what to do about them.',
    iconName: 'build',
  },
] as const

/** Public-corpus categories — matches seed (audience=public). */
export const PUBLIC_HELP_CATEGORIES: ReadonlyArray<
  Omit<HelpCategory, 'articleCount'>
> = [
  {
    slug: 'about-evenzi',
    name: 'About Evenzi',
    description: 'What Evenzi is and who it is for.',
    iconName: 'celebration',
  },
  {
    slug: 'how-it-works',
    name: 'How It Works',
    description: 'What happens when you sign up, and what you can do.',
    iconName: 'map',
  },
  {
    slug: 'pricing-plans',
    name: 'Pricing & Plans',
    description: 'What it costs and what is included.',
    iconName: 'sell',
  },
  {
    slug: 'privacy-data',
    name: 'Privacy & Your Data',
    description: 'How your information is handled and protected.',
    iconName: 'shield_lock',
  },
] as const

export function helpCategoriesForAudience(
  audience: HelpAudience
): ReadonlyArray<Omit<HelpCategory, 'articleCount'>> {
  return audience === 'app' ? APP_HELP_CATEGORIES : PUBLIC_HELP_CATEGORIES
}
