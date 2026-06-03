export interface ScheduleItem {
  time: string
  label: string
  type: 'torah' | 'break' | 'prayer' | 'shiur' | 'other' | 'sports'
}

const WEEKDAY_TEMPLATE: ScheduleItem[] = [
  { time: '07:00', label: 'בוקר', type: 'other' },
  { time: '09:00', label: 'עבודה / לימוד', type: 'other' },
  { time: '13:00', label: 'הפסקת צהריים', type: 'break' },
  { time: '18:00', label: 'ערב', type: 'other' },
]

export const WEEKLY_SCHEDULE: Record<number, ScheduleItem[]> = {
  0: WEEKDAY_TEMPLATE,
  1: WEEKDAY_TEMPLATE,
  2: WEEKDAY_TEMPLATE,
  3: WEEKDAY_TEMPLATE,
  4: WEEKDAY_TEMPLATE,
  5: [
    { time: '09:00', label: 'בוקר', type: 'other' },
    { time: '13:00', label: 'צהריים', type: 'break' },
  ],
  6: [
    { time: '10:00', label: 'מנוחה', type: 'break' },
  ],
}

export const DAY_NAMES_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
export const DAY_NAMES_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function getTodaySchedule(): ScheduleItem[] {
  const day = new Date().getDay()
  return WEEKLY_SCHEDULE[day] ?? []
}

export function getCurrentAndNextItems(): { current: ScheduleItem | null; upcoming: ScheduleItem[] } {
  const items = getTodaySchedule()
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number)
    return h * 60 + m
  }

  let currentIndex = -1
  for (let i = items.length - 1; i >= 0; i--) {
    if (toMinutes(items[i].time) <= currentMinutes) {
      currentIndex = i
      break
    }
  }

  return {
    current: currentIndex >= 0 ? items[currentIndex] : null,
    upcoming: items.slice(currentIndex + 1, currentIndex + 4),
  }
}
