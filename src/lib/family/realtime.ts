'use client'

import { createClient } from '@/lib/supabase/client'

type TableName = 'family_tasks' | 'family_habits' | 'routine_breakers'

export type FamilyRealtimeEvent = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  row: Record<string, unknown>
}

type ChangeHandler = (event: FamilyRealtimeEvent) => void

/**
 * Subscribes to real-time postgres changes for one or more family tables.
 * Returns a cleanup function — call it from useEffect's return.
 *
 * Example:
 *   useEffect(() => subscribeFamilyRealtime(['family_tasks'], () => router.refresh()), [])
 */
export function subscribeFamilyRealtime(
  tables: TableName[],
  onUpdate: ChangeHandler
): () => void {
  const supabase = createClient()
  const channelNames: string[] = []

  for (const table of tables) {
    const name = `family-${table}`
    channelNames.push(name)

    supabase
      .channel(name)
      .on(
        // @ts-ignore — 'postgres_changes' is a valid Supabase realtime event
        'postgres_changes',
        { event: '*', schema: 'public', table },
        // @ts-ignore — payload shape is provided by Supabase at runtime
        (payload: { eventType: string; new: unknown; old: unknown }) =>
          onUpdate({
            eventType: payload.eventType as FamilyRealtimeEvent['eventType'],
            row: (payload.new ?? payload.old ?? {}) as Record<string, unknown>,
          })
      )
      .subscribe()
  }

  return () => {
    const client = createClient()
    channelNames.forEach((name) => {
      const ch = client.channel(name)
      client.removeChannel(ch)
    })
  }
}
