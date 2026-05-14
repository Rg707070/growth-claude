import type { MesillatLevel } from '@/types'

export const MESILLAT_LEVELS: MesillatLevel[] = [
  { level: 1, nameHe: 'זהירות', nameEn: 'Watchfulness', minXp: 0, maxXp: 100 },
  { level: 2, nameHe: 'זריזות', nameEn: 'Alacrity', minXp: 100, maxXp: 250 },
  { level: 3, nameHe: 'נקיות', nameEn: 'Cleanliness', minXp: 250, maxXp: 500 },
  { level: 4, nameHe: 'פרישות', nameEn: 'Separation', minXp: 500, maxXp: 800 },
  { level: 5, nameHe: 'טהרה', nameEn: 'Purity', minXp: 800, maxXp: 1200 },
  { level: 6, nameHe: 'חסידות', nameEn: 'Piety', minXp: 1200, maxXp: 1700 },
  { level: 7, nameHe: 'ענווה', nameEn: 'Humility', minXp: 1700, maxXp: 2300 },
  { level: 8, nameHe: 'יראת חטא', nameEn: 'Fear of Sin', minXp: 2300, maxXp: 3000 },
  { level: 9, nameHe: 'קדושה', nameEn: 'Holiness', minXp: 3000, maxXp: Infinity },
]

export function getLevelFromXp(xp: number): MesillatLevel {
  for (let i = MESILLAT_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= MESILLAT_LEVELS[i].minXp) return MESILLAT_LEVELS[i]
  }
  return MESILLAT_LEVELS[0]
}

export function getXpProgress(xp: number): number {
  const level = getLevelFromXp(xp)
  if (level.maxXp === Infinity) return 100
  const levelXp = xp - level.minXp
  const levelRange = level.maxXp - level.minXp
  return Math.min(100, Math.round((levelXp / levelRange) * 100))
}
