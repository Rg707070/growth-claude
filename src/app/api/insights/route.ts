import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { weekXP, streak, topDomain, completionPct, habitCount } = body

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system:
        'אתה מאמן אישי מעודד ותומך. תן 2-3 תובנות קצרות בעברית על הנתונים של המשתמש. כל תובנה בשורה נפרדת עם • בהתחלה. היה מעודד, ספציפי, ותעזור לו לצמוח.',
      messages: [
        {
          role: 'user',
          content: `נתוני השבוע שלי:
- XP השבוע: ${weekXP}
- רצף ימים: ${streak}
- תחום מוביל: ${topDomain}
- אחוז השלמה: ${completionPct}%
- מספר הרגלים פעילים: ${habitCount}

תן לי תובנות מעודדות ומעשיות.`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const insights = text
      .split('\n')
      .filter((line) => line.trim().startsWith('•'))
      .map((line) => line.replace(/^•\s*/, '').trim())

    return NextResponse.json({ insights })
  } catch {
    return NextResponse.json({ insights: [] }, { status: 500 })
  }
}
