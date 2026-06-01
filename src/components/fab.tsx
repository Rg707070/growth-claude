'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useLang } from '@/lib/lang'
import { AddHabitSheet } from '@/components/add-habit-sheet'

export function FAB() {
  const { t } = useLang()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={t('quickAddHabit')}
        className="fixed bottom-24 end-5 z-40 w-14 h-14 rounded-full flex items-center justify-center text-white animate-fab-ring transition-transform active:scale-95 lg:bottom-8"
        style={{ background: 'var(--brand-gradient)', boxShadow: '0 8px 24px var(--c-hero-shadow)' }}
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>
      <AddHabitSheet open={open} onClose={() => setOpen(false)} />
    </>
  )
}
