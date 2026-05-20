import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' })

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType } = await req.json()

    const result = await model.generateContent([
      {
        inlineData: {
          data: imageBase64,
          mimeType: mediaType,
        },
      },
      'This is a photo of a Jewish text. Identify the specific tractate/book, chapter, and page/verse visible. Return ONLY the Sefaria reference in English format (e.g. "Berakhot 2a", "Genesis 1:1", "Mishnah Berakhot 1:1"). If you cannot identify the text clearly, return "unknown". Return nothing else.',
    ])

    const ref = result.response.text().trim()
    return NextResponse.json({ ref: ref === 'unknown' ? null : ref })
  } catch {
    return NextResponse.json({ ref: null }, { status: 500 })
  }
}
