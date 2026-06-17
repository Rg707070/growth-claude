'use client'

import { DomainHabitsTab } from '@/components/domain-habits-tab'
import { useLang } from '@/lib/lang'
import type { Habit, Domain } from '@/types'

const TORAH_DOMAIN: Domain = {
  slug: 'torah',
  nameHe: 'לימודי קודש',
  nameEn: 'Torah Study',
  icon: '📖',
  color: '#0F766E',
  gradient: 'from-teal-700/20 to-teal-800/5',
  glowColor: 'rgba(15,118,110,0.20)',
}

interface Props {
  habits: Habit[]
  completedIds: string[]
  userId: string
  onAdded: (h: Habit) => void
}

export function TorahHabitsTab({ habits, completedIds, userId, onAdded }: Props) {
  const { isRTL } = useLang()

  return (
    <DomainHabitsTab
      habits={habits}
      completedSet={new Set(completedIds)}
      domain={TORAH_DOMAIN}
      userId={userId}
      onAdded={onAdded}
      isRTL={isRTL}
    />
  )
}
