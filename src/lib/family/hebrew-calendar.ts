'use client'

export interface CalendarDay {
  gregorianDay: number
  hebrewDay: string
  hebrewMonth: string
  isHebrewMonthStart: boolean
  dateString: string  // YYYY-MM-DD
}

// Hebrew day-of-week abbreviations (Sun–Sat)
export const HEBREW_DAY_HEADERS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']

export function getHebrewDateStr(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  try {
    return new Intl.DateTimeFormat('he-u-ca-hebrew', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date)
  } catch {
    return dateStr
  }
}

export function getGregorianDateStr(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${d}.${String(m).padStart(2, '0')}.${y}`
}

export function getHebrewMonthYearForMonth(gregorianYear: number, gregorianMonth: number): string {
  const first = new Date(gregorianYear, gregorianMonth - 1, 1)
  const last = new Date(gregorianYear, gregorianMonth, 0)
  try {
    const mFmt = new Intl.DateTimeFormat('he-u-ca-hebrew', { month: 'long' })
    const yFmt = new Intl.DateTimeFormat('he-u-ca-hebrew', { year: 'numeric' })
    const m1 = mFmt.format(first)
    const m2 = mFmt.format(last)
    const year = yFmt.format(first)
    return `${m1 === m2 ? m1 : `${m1}–${m2}`} ${year}`
  } catch {
    return ''
  }
}

export function getGregorianMonthLabel(gregorianYear: number, gregorianMonth: number): string {
  const MONTHS_HE = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
  ]
  return `${MONTHS_HE[gregorianMonth - 1]} ${gregorianYear}`
}

export function buildMonthGrid(gregorianYear: number, gregorianMonth: number): (CalendarDay | null)[] {
  const firstDay = new Date(gregorianYear, gregorianMonth - 1, 1)
  const daysInMonth = new Date(gregorianYear, gregorianMonth, 0).getDate()
  const firstDayOfWeek = firstDay.getDay()  // 0 = Sunday

  const dayFmt = new Intl.DateTimeFormat('he-u-ca-hebrew', { day: 'numeric' })
  const monthFmt = new Intl.DateTimeFormat('he-u-ca-hebrew', { month: 'long' })

  const days: (CalendarDay | null)[] = []
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null)

  let prevMonth = ''

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(gregorianYear, gregorianMonth - 1, d)
    let hebrewDay = String(d)
    let hebrewMonth = ''

    try {
      hebrewDay = dayFmt.format(date)
      hebrewMonth = monthFmt.format(date)
    } catch { /* fallback to number */ }

    const mm = String(gregorianMonth).padStart(2, '0')
    const dd = String(d).padStart(2, '0')

    days.push({
      gregorianDay: d,
      hebrewDay,
      hebrewMonth,
      isHebrewMonthStart: prevMonth !== '' && hebrewMonth !== prevMonth,
      dateString: `${gregorianYear}-${mm}-${dd}`,
    })

    if (hebrewMonth) prevMonth = hebrewMonth
  }

  return days
}

export function todayDateString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
