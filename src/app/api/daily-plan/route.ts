import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { WEEKLY_SCHEDULE } from '@/lib/schedule'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

interface HabitInput {
  name: string
  domain_slug: string
  xp_reward: number
}

function getFreeWindows(dayIndex: number): { start: string; end: string; minutes: number }[] {
  const items = WEEKLY_SCHEDULE[dayIndex] ?? []
  const windows: { start: string; end: string; minutes: number }[] = []

  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number)
    return h * 60 + m
  }

  const toTime = (minutes: number) => {
    const h = Math.floor(minutes / 60).toString().padStart(2, '0')
    const m = (minutes % 60).toString().padStart(2, '0')
    return `${h}:${m}`
  }

  for (let i = 0; i < items.length - 1; i++) {
    const endOfCurrent = toMinutes(items[i].time) + 30
    const startOfNext = toMinutes(items[i + 1].time)
    const gap = startOfNext - endOfCurrent
    if (gap >= 20) {
      windows.push({
        start: toTime(endOfCurrent),
        end: items[i + 1].time,
        minutes: gap,
      })
    }
  }

  return windows
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { habits, completedIds, streak, dayIndex } = body as {
      habits: HabitInput[]
      completedIds: string[]
      streak: number
      dayIndex: number
    }

    const completedSet = new Set(completedIds)
    const pendingHabits = habits.filter((h) => !completedSet.has(h.name))
    const freeWindows = getFreeWindows(dayIndex)
    const schedule = WEEKLY_SCHEDULE[dayIndex] ?? []

    if (pendingHabits.length === 0) {
      return NextResponse.json({
        plan: [],
        message: 'כל ההרגלים הושלמו היום! מדהים 🎉',
      })
    }

    if (freeWindows.length === 0) {
      return NextResponse.json({
        plan: [],
        message: 'לוח הזמנים היום צפוף — נסה למצוא 10 דקות בין הפעילויות.',
      })
    }

    const scheduleText = schedule.map((s) => `${s.time} — ${s.label}`).join('\n')
    const windowsText = freeWindows
      .map((w) => `${w.start}–${w.end} (${w.minutes} דקות פנויות)`)
      .join('\n')
    const habitsText = pendingHabits
      .map((h) => `• ${h.name} (תחום: ${h.domain_slug}, ${h.xp_reward} XP)`)
      .join('\n')

    const prompt = `אתה מתזמן יום חכם לרותם, בחור ישיבה.
המטרה: לשבץ את ההרגלים הפנדיינג שלו לתוך החלונות הפנויים בלוח הזמנים.
החזר JSON בלבד, ללא טקסט נוסף. הפורמט:
[{"time": "HH:MM", "habit": "שם ההרגל", "domain": "domain_slug", "duration": 20, "tip": "טיפ קצר בעברית"}]
כללים:
- שבץ רק הרגלים שמתאימים לחלון הזמן (לא לשבץ ספורט בחלון של 10 דקות)
- עד 3 המלצות
- הטיפ צריך להיות קצר ומעשי (לא יותר מ-8 מילים)

לוח הזמנים היום:
${scheduleText}

חלונות פנויים:
${windowsText}

הרגלים שעדיין לא בוצעו:
${habitsText}

רצף ימים: ${streak}

שבץ את ההרגלים לחלונות הפנויים.`

    const result = await model.generateContent(prompt)
    const raw = result.response.text().trim()

    let plan: { time: string; habit: string; domain: string; duration: number; tip: string }[] = []
    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/)
      if (jsonMatch) plan = JSON.parse(jsonMatch[0])
    } catch {
      plan = []
    }

    return NextResponse.json({ plan, message: null })
  } catch {
    return NextResponse.json({ plan: [], message: null }, { status: 500 })
  }
}
