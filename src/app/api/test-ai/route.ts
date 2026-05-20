import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function GET() {
  const key = process.env.GOOGLE_AI_API_KEY

  if (!key) {
    return NextResponse.json({ ok: false, error: 'GOOGLE_AI_API_KEY is not set' })
  }

  try {
    const genAI = new GoogleGenerativeAI(key)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' })
    const result = await model.generateContent('say hi in one word')
    return NextResponse.json({ ok: true, reply: result.response.text() })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) })
  }
}
