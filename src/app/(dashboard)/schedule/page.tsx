import { SchedulePageClient } from './schedule-client'

export interface ScheduleRow {
  id: string
  day_of_week: number
  time: string
  label: string
  type: string
  sort_order: number
}

export default function SchedulePage() {
  return <SchedulePageClient />
}
