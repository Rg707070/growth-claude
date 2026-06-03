'use client'

import { useEffect } from 'react'
import { registerSw, getGlobalReminders, syncGlobalRemindersToSw } from '@/lib/sw-register'

export function SwInit() {
  useEffect(() => {
    void registerSw().then(() => {
      void syncGlobalRemindersToSw(getGlobalReminders())
    })
  }, [])

  return null
}
