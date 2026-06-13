'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLang } from '@/lib/lang'
import { WritingTab } from './writing-tab'
import { TasksTab } from './tasks-tab'
import type { DocMeta } from './page'
import type { DomainTask, DomainGoal } from '@/types/ecosystem'
import type { FamilyTask, FamilyEvent } from '@/types/family'

type Tab = 'writing' | 'tasks'

const TABS: Tab[] = ['writing', 'tasks']

interface JournalClientProps {
  userId: string
  documents: DocMeta[]
  domainTasks: DomainTask[]
  domainGoals: DomainGoal[]
  familyTasks: FamilyTask[]
  familyEvents: FamilyEvent[]
}

export function JournalClient({ userId, documents, domainTasks, domainGoals, familyTasks, familyEvents }: JournalClientProps) {
  const { isRTL } = useLang()
  const searchParams = useSearchParams()
  const paramTab = searchParams.get('tab') as Tab | null
  const [tab, setTab] = useState<Tab>(paramTab && TABS.includes(paramTab) ? paramTab : 'writing')
  const initialDocId = searchParams.get('doc')

  const tabs: { id: Tab; labelHe: string; labelEn: string }[] = [
    { id: 'writing', labelHe: 'כתיבה',   labelEn: 'Writing' },
    { id: 'tasks',   labelHe: 'משימות',  labelEn: 'Tasks'   },
  ]

  return (
    <div className="min-h-screen pb-24 md:pb-8" style={{ background: 'var(--background)' }}>
      <div className="max-w-5xl mx-auto px-4 pt-8 md:max-w-none md:px-0 md:pt-6">
        {/* Header (mobile-only; desktop has topbar) */}
        <div className="mb-6 md:hidden">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            {isRTL ? 'יומן ומשימות' : 'Journal & Tasks'}
          </h1>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-1 p-1 rounded-2xl mb-6 w-fit"
          style={{ background: 'var(--c-card)' }}
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
              style={
                tab === t.id
                  ? { background: 'var(--primary)', color: 'var(--primary-foreground)' }
                  : { color: 'var(--muted-foreground)' }
              }
            >
              {isRTL ? t.labelHe : t.labelEn}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'writing' && <WritingTab userId={userId} initialDocs={documents} initialDocId={initialDocId} />}
        {tab === 'tasks' && (
          <TasksTab
            userId={userId}
            domainTasks={domainTasks}
            domainGoals={domainGoals}
            familyTasks={familyTasks}
            familyEvents={familyEvents}
          />
        )}
      </div>
    </div>
  )
}
