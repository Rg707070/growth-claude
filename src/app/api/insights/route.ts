import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { weekXP, streak, topDomain, completionPct, habitCount } = body

    const prompt = `אתה מאמן אישי מעודד ותומך. תן 2-3 תובנות קצרות בעברית על הנתונים של המשתמש. כל תובנה בשורה נפרדת עם • בהתחלה. היה מעודד, ספציפי, ותעזור לו לצמוח.

נתוני השבוע שלי:
- XP השבוע: ${weekXP}
- רצף ימים: ${streak}
- תחום מוביל: ${topDomain}
- אחוז השלמה: ${completionPct}%
- מספר הרגלים פעילים: ${habitCount}

תן לי תובנות מעודדות ומעשיות.`

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    const insights = text
      .split('\n')
      .filter((line) => line.trim().startsWith('•'))
      .map((line) => line.replace(/^•\s*/, '').trim())

    return NextResponse.json({ insights })
  } catch {
    return NextResponse.json({ insights: [] }, { status: 500 })
  }
}
