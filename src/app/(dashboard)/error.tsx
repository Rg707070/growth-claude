'use client'

import { ErrorView } from '@/components/error-view'

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorView reset={reset} />
}
