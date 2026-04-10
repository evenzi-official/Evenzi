/**
 * Shared icon mapping from database icon_name to emoji.
 * Used across wizard components, dashboard cards, and review screens.
 */
export const ICON_MAP: Record<string, string> = {
  heart: '💍',
  cake: '🎂',
  gem: '💎',
  briefcase: '💼',
  baby: '👶',
  calendar: '📅',
  sparkles: '✨',
  palette: '🎨',
  music: '🎵',
  utensils: '🍽️',
  wine: '🍷',
  coffee: '☕',
}

export function getIcon(iconName: string | null): string {
  return ICON_MAP[iconName ?? ''] ?? '🎉'
}
