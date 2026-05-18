import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType } = await req.json()

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: imageBase64 },
            },
            {
              type: 'text',
              text: 'This is a photo of a Jewish text. Identify the specific tractate/book, chapter, and page/verse visible. Return ONLY the Sefaria reference in English format (e.g. "Berakhot 2a", "Genesis 1:1", "Mishnah Berakhot 1:1"). If you cannot identify the text clearly, return "unknown". Return nothing else.',
            },
          ],
        },
      ],
    })

    const ref = message.content[0].type === 'text' ? message.content[0].text.trim() : 'unknown'
    return NextResponse.json({ ref: ref === 'unknown' ? null : ref })
  } catch {
    return NextResponse.json({ ref: null }, { status: 500 })
  }
}
