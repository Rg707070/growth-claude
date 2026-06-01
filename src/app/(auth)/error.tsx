'use client'

import { ErrorView } from '@/components/error-view'

export default function AuthError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorView reset={reset} />
}
