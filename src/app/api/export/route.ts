import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function toCSV(rows: Record<string, unknown>[], columns: string[]): string {
  const header = columns.join(',')
  const lines = rows.map((row) =>
    columns
      .map((col) => {
        const val = String(row[col] ?? '')
        return val.includes(',') || val.includes('"') || val.includes('\n')
          ? `"${val.replace(/"/g, '""')}"`
          : val
      })
      .join(',')
  )
  return [header, ...lines].join('\n')
}

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')

  if (type === 'habits') {
    const { data } = await supabase
      .from('habit_logs')
      .select('completed_at, habits(name, domain_slug, xp_reward)')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })

    type HabitRef = { name: string; domain_slug: string; xp_reward: number } | null
    const rows = (data ?? []).map((row) => {
      const h = row.habits as unknown as HabitRef
      return { date: row.completed_at, domain: h?.domain_slug ?? '', habit: h?.name ?? '', xp: h?.xp_reward ?? 0 }
    })
    const csv = toCSV(rows as Record<string, unknown>[], ['date', 'domain', 'habit', 'xp'])
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="habit-log.csv"',
      },
    })
  }

  if (type === 'journal') {
    const { data } = await supabase
      .from('journal_entries')
      .select('date, domain_slug, text')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    const rows = (data ?? []).map((row) => ({
      date: row.date,
      domain: row.domain_slug,
      entry: row.text,
    }))
    const csv = toCSV(rows as Record<string, unknown>[], ['date', 'domain', 'entry'])
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="journal.csv"',
      },
    })
  }

  return NextResponse.json({ error: 'type must be habits or journal' }, { status: 400 })
}
