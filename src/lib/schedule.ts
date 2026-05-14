export interface ScheduleItem {
  time: string
  label: string
  type: 'torah' | 'break' | 'prayer' | 'shiur' | 'other' | 'sports'
}

const MORNING_ROUTINE: ScheduleItem[] = [
  { time: '05:45', label: 'השכמה', type: 'other' },
  { time: '06:00', label: 'תפילה', type: 'prayer' },
  { time: '06:45', label: 'אימון', type: 'sports' },
  { time: '07:25', label: 'התעדכנות על החדשות', type: 'other' },
  { time: '07:35', label: 'מקלחת', type: 'other' },
  { time: '07:40', label: 'קפה עם זיו', type: 'break' },
  { time: '08:00', label: 'יציאה לישיבה', type: 'other' },
]

export const WEEKLY_SCHEDULE: Record<number, ScheduleItem[]> = {
  // ראשון — Sunday
  0: [
    ...MORNING_ROUTINE,
    { time: '08:10', label: 'פ"ש', type: 'torah' },
    { time: '08:30', label: 'סדר גמרא עיון', type: 'torah' },
    { time: '12:00', label: 'שיעור עיון', type: 'shiur' },
    { time: '13:00', label: 'הפסקת צהריים', type: 'break' },
    { time: '18:45', label: 'מנחה', type: 'prayer' },
    { time: '19:00', label: 'אורות התשובה — הרב ויץ', type: 'shiur' },
  ],

  // שני — Monday
  1: [
    ...MORNING_ROUTINE,
    { time: '08:30', label: 'סדר גמרא עיון', type: 'torah' },
    { time: '09:30', label: 'דרכי למוד — ראש הישיבה', type: 'shiur' },
    { time: '11:50', label: 'התארגנות לשיעור', type: 'other' },
    { time: '12:00', label: 'שיעור עיון', type: 'shiur' },
    { time: '13:00', label: 'הפסקת צהריים', type: 'break' },
    { time: '15:30', label: 'גמרא בקיאות', type: 'torah' },
    { time: '17:00', label: 'אורות עם יואב בנד', type: 'shiur' },
    { time: '18:45', label: 'מנחה', type: 'prayer' },
    { time: '19:00', label: 'הכנה לחיים — ראש הישיבה', type: 'shiur' },
  ],

  // שלישי — Tuesday
  2: [
    ...MORNING_ROUTINE,
    { time: '08:10', label: 'פ"ש', type: 'torah' },
    { time: '08:30', label: 'סדר גמרא עיון', type: 'torah' },
    { time: '11:50', label: 'התארגנות לשיעור', type: 'other' },
    { time: '12:00', label: 'שיעור כללי', type: 'shiur' },
    { time: '13:00', label: 'הפסקת צהריים', type: 'break' },
    { time: '15:30', label: 'גמרא בקיאות', type: 'torah' },
    { time: '16:00', label: 'אורות הקודש — שיעור ה׳ ומעלה — ראש הישיבה', type: 'shiur' },
    { time: '18:45', label: 'מנחה', type: 'prayer' },
  ],

  // רביעי — Wednesday
  3: [
    ...MORNING_ROUTINE,
    { time: '08:30', label: 'סדר גמרא עיון', type: 'torah' },
    { time: '11:50', label: 'התארגנות לשיעור', type: 'other' },
    { time: '12:00', label: 'שיעור עיון', type: 'shiur' },
    { time: '13:00', label: 'הפסקת צהריים', type: 'break' },
    { time: '15:30', label: 'גמרא בקיאות', type: 'torah' },
    { time: '16:45', label: 'הלכה עם אסף', type: 'shiur' },
    { time: '18:45', label: 'מנחה', type: 'prayer' },
  ],

  // חמישי — Thursday
  4: [
    ...MORNING_ROUTINE,
    { time: '08:10', label: 'פ"ש', type: 'torah' },
    { time: '08:30', label: 'סדר גמרא עיון', type: 'torah' },
    { time: '11:50', label: 'התארגנות לשיעור', type: 'other' },
    { time: '12:00', label: 'שיעור עיון', type: 'shiur' },
    { time: '15:00', label: 'סדר גמרא עיון', type: 'torah' },
    { time: '15:30', label: 'גמרא בקיאות', type: 'torah' },
    { time: '18:00', label: 'פ"ש + מדרש — ראש הישיבה', type: 'torah' },
    { time: '18:45', label: 'מנחה', type: 'prayer' },
  ],

  // שישי — Friday
  5: [
    ...MORNING_ROUTINE,
    { time: '09:15', label: 'פ"ש — הרב מנשה וינר', type: 'torah' },
    { time: '19:00', label: 'שיחת מוסר — ראש הישיבה', type: 'shiur' },
  ],

  // שבת — Saturday
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
