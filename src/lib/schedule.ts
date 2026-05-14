// Rotem's weekly yeshiva schedule (extracted from his Google Sheets)
// Day indices: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday

export interface ScheduleItem {
  time: string
  label: string
  type: 'torah' | 'break' | 'prayer' | 'shiur' | 'other'
}

export const WEEKLY_SCHEDULE: Record<number, ScheduleItem[]> = {
  0: [
    { time: '08:00', label: 'יציאה לישיבה', type: 'other' },
    { time: '08:10', label: 'פ"ש', type: 'torah' },
    { time: '08:30', label: 'סדר גמרא עיון', type: 'torah' },
    { time: '12:00', label: 'שיעור עיון', type: 'shiur' },
    { time: '13:00', label: 'הפסקת צהריים', type: 'break' },
    { time: '15:00', label: 'סדר גמרא עיון', type: 'torah' },
    { time: '18:00', label: 'שיעור גמרא עיון', type: 'shiur' },
    { time: '18:45', label: 'מנחה', type: 'prayer' },
    { time: '19:00', label: 'אורות התשובה — הרב ויצ', type: 'shiur' },
  ],
  1: [
    { time: '08:00', label: 'יציאה לישיבה', type: 'other' },
    { time: '08:10', label: 'פ"ש', type: 'torah' },
    { time: '08:30', label: 'סדר גמרא עיון', type: 'torah' },
    { time: '11:50', label: 'התארגנות לשיעור', type: 'other' },
    { time: '12:00', label: 'שיעור עיון', type: 'shiur' },
    { time: '13:00', label: 'הפסקת צהריים', type: 'break' },
    { time: '15:30', label: 'גמרא בקיאות', type: 'torah' },
    { time: '16:00', label: 'הלכה עם אסף', type: 'shiur' },
    { time: '18:45', label: 'מנחה', type: 'prayer' },
    { time: '19:00', label: "הכנה לחיים — ראש הישיבה", type: 'shiur' },
  ],
  2: [
    { time: '08:00', label: 'יציאה לישיבה', type: 'other' },
    { time: '08:10', label: 'פ"ש', type: 'torah' },
    { time: '08:30', label: 'סדר גמרא עיון', type: 'torah' },
    { time: '11:50', label: 'התארגנות לשיעור', type: 'other' },
    { time: '12:00', label: 'שיעור כללי', type: 'shiur' },
    { time: '13:00', label: 'הפסקת צהריים', type: 'break' },
    { time: '15:30', label: 'גמרא בקיאות', type: 'torah' },
    { time: '16:00', label: 'הלכה עם אסף', type: 'shiur' },
    { time: '18:45', label: 'מנחה', type: 'prayer' },
    { time: '19:00', label: "הכנה לחיים — ראש הישיבה", type: 'shiur' },
  ],
  3: [
    { time: '08:00', label: 'יציאה לישיבה', type: 'other' },
    { time: '08:10', label: 'פ"ש', type: 'torah' },
    { time: '08:30', label: 'סדר גמרא עיון', type: 'torah' },
    { time: '11:50', label: 'התארגנות לשיעור', type: 'other' },
    { time: '12:00', label: 'שיעור עיון', type: 'shiur' },
    { time: '13:00', label: 'הפסקת צהריים', type: 'break' },
    { time: '15:30', label: 'גמרא בקיאות', type: 'torah' },
    { time: '18:45', label: 'מנחה', type: 'prayer' },
  ],
  4: [
    { time: '08:00', label: 'יציאה לישיבה', type: 'other' },
    { time: '08:10', label: 'פ"ש', type: 'torah' },
    { time: '08:30', label: 'סדר גמרא עיון', type: 'torah' },
    { time: '11:50', label: 'התארגנות לשיעור', type: 'other' },
    { time: '12:00', label: 'שיעור עיון', type: 'shiur' },
    { time: '13:00', label: 'הפסקת צהריים', type: 'break' },
    { time: '15:30', label: 'גמרא בקיאות', type: 'torah' },
    { time: '17:00', label: 'אורות עם יואב בנד', type: 'shiur' },
    { time: '18:00', label: "פ\"ש + מדרש — ראש הישיבה", type: 'torah' },
    { time: '18:45', label: 'מנחה', type: 'prayer' },
  ],
  5: [
    { time: '09:15', label: 'פ"ש — הרב מנשה וינר', type: 'torah' },
    { time: '19:00', label: 'שיחת מוסר — ראש הישיבה', type: 'shiur' },
  ],
  6: [
    { time: '09:00', label: 'שבת שלום 🕯️', type: 'other' },
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
