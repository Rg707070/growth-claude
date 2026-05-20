import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

interface Message {
  role: 'user' | 'model'
  content: string
}

interface Context {
  name: string | null
  xp: number
  streak: number
}

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = (await req.json()) as {
      messages: Message[]
      context: Context
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash-latest',
      systemInstruction: `אתה מאמן אישי של ${context.name ?? 'רותם'}, בחור ישיבה שמשתמש באפליקציית GROWTH לעקוב אחר הרגלים ב-8 תחומי חיים: משפחה, חברים, תורה, חול, ספורט, מסחר, פיננסים, מוזיקה.
סטטוס נוכחי: ${context.xp} XP, רצף של ${context.streak} ימים.
תן תמיכה, עידוד, ועצות מעשיות. ענה תמיד בעברית. היה קצר, ישיר, ואנושי.`,
    })

    const history = messages.slice(0, -1).map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    }))

    const chat = model.startChat({ history })
    const result = await chat.sendMessage(messages[messages.length - 1].content)

    return NextResponse.json({ reply: result.response.text() })
  } catch (e) {
    const error = e instanceof Error ? e.message : 'unknown error'
    return NextResponse.json({ reply: null, error }, { status: 500 })
  }
}
