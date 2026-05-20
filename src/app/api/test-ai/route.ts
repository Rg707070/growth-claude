import { NextResponse } from 'next/server'

export async function GET() {
  const key = process.env.GOOGLE_AI_API_KEY
  if (!key) return NextResponse.json({ error: 'GOOGLE_AI_API_KEY is not set' })

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
    )
    const data = await res.json()
    const names = (data.models ?? []).map((m: { name: string }) => m.name)
    return NextResponse.json({ models: names })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) })
  }
}
