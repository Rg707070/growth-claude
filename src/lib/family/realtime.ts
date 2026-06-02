'use client'

import { createClient } from '@/lib/supabase/client'

type TableName = 'family_tasks' | 'family_habits' | 'routine_breakers' | 'family_events' | 'family_task_folders'

export type FamilyRealtimeEvent = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  row: Record<string, unknown>
}

type ChangeHandler = (event: FamilyRealtimeEvent) => void

export function subscribeFamilyRealtime(
  tables: TableName[],
  onUpdate: ChangeHandler | (() => void)
): () => void {
  const supabase = createClient()

  for (const table of tables) {
    const name = `family-${table}`
    supabase
      .channel(name)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload: { eventType: string; new: unknown; old: unknown }) =>
          (onUpdate as ChangeHandler)({
            eventType: payload.eventType as FamilyRealtimeEvent['eventType'],
            row: (payload.new ?? payload.old ?? {}) as Record<string, unknown>,
          })
      )
      .subscribe()
  }

  return () => {
    tables.forEach((table) => {
      const ch = supabase.channel(`family-${table}`)
      void supabase.removeChannel(ch)
    })
  }
}
