export interface Achievement {
  id: string
  nameHe: string
  nameEn: string
  icon: string
  descHe: string
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_habit',    nameHe: 'התחלה',       nameEn: 'First Step',   icon: '🌱', descHe: 'הוסף הרגל ראשון' },
  { id: 'streak_7',       nameHe: 'שבוע מלא',    nameEn: 'Week Warrior', icon: '🔥', descHe: '7 ימים ברצף' },
  { id: 'streak_30',      nameHe: 'חודש שלם',    nameEn: 'Month Master', icon: '⚡', descHe: '30 ימים ברצף' },
  { id: 'xp_100',         nameHe: 'יום מלא',     nameEn: 'Full Day',     icon: '💎', descHe: '100 XP ביום אחד' },
  { id: 'xp_500',         nameHe: 'חצי אלף',     nameEn: 'Half Grand',   icon: '🏆', descHe: '500 XP סה"כ' },
  { id: 'all_domains',    nameHe: 'שלמות',        nameEn: 'Wholeness',    icon: '🌊', descHe: 'הרגל בכל 8 תחומים' },
  { id: 'torah_streak_3', nameHe: 'שלושה ימים',  nameEn: 'Torah Trio',   icon: '📖', descHe: 'תורה 3 ימים ברצף' },
  { id: 'habits_10',      nameHe: 'בנאי הרגלים', nameEn: 'Habit Builder', icon: '🧱', descHe: '10 הרגלים שנוצרו' },
]

export interface AchievementData {
  xp: number
  streak: number
  habitCount: number
  domainSlugsWithHabits: string[]
  torahStreak: number
  maxXpInDay: number
}

export function getUnlockedIds(data: AchievementData): string[] {
  const unlocked: string[] = []
  if (data.habitCount >= 1)         unlocked.push('first_habit')
  if (data.streak >= 7)             unlocked.push('streak_7')
  if (data.streak >= 30)            unlocked.push('streak_30')
  if (data.maxXpInDay >= 100)       unlocked.push('xp_100')
  if (data.xp >= 500)               unlocked.push('xp_500')
  if (data.domainSlugsWithHabits.length >= 8) unlocked.push('all_domains')
  if (data.torahStreak >= 3)        unlocked.push('torah_streak_3')
  if (data.habitCount >= 10)        unlocked.push('habits_10')
  return unlocked
}
