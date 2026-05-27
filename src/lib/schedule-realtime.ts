'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface ScheduleRow {
  id: string
  day_of_week: number
  time: string
  label: string
  type: string
  color: string | null
  specific_date: string | null
}

export function useTodaySchedule(userId: string) {
  const [items, setItems] = useState<ScheduleRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetchItems = useCallback(async () => {
    const dow = new Date().getDay()
    const today = new Date()
    const d = new Date(today)
    d.setDate(today.getDate() + (dow - today.getDay()))
    const weekDate = d.toISOString().split('T')[0]

    const supabase = createClient()
    const { data } = await supabase
      .from('user_schedule')
      .select('id, day_of_week, time, label, type, color, specific_date')
      .eq('user_id', userId)
      .or(`specific_date.is.null,specific_date.eq.${weekDate}`)
      .order('time')

    const filtered = (data ?? []).filter((row: ScheduleRow) => {
      if (row.specific_date) {
        return new Date(row.specific_date + 'T12:00:00').getDay() === dow
      }
      return row.day_of_week === dow
    })

    setItems(filtered)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    void fetchItems()

    const supabase = createClient()
    const channel = supabase
      .channel(`schedule-today-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_schedule' }, () => {
        void fetchItems()
      })
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [userId, fetchItems])

  return { items, loading, refetch: fetchItems }
}
