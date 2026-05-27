'use client'

import { useState } from 'react'
import { useLang } from '@/lib/lang'
import { WritingTab } from './writing-tab'
import { InsightsTab } from './insights-tab'
import { AlbumTab } from './album-tab'
import { ScheduleTab } from './schedule-tab'
import type { DocMeta, DomainEntry, PhotoEntry } from './page'

type Tab = 'writing' | 'insights' | 'album' | 'schedule'

interface JournalClientProps {
  userId: string
  documents: DocMeta[]
  domainEntries: DomainEntry[]
  photos: PhotoEntry[]
}

export function JournalClient({ userId, documents, domainEntries, photos }: JournalClientProps) {
  const { isRTL } = useLang()
  const [tab, setTab] = useState<Tab>('writing')

  const tabs: { id: Tab; labelHe: string; labelEn: string }[] = [
    { id: 'writing',  labelHe: 'כתיבה',  labelEn: 'Writing'  },
    { id: 'insights', labelHe: 'הארות',  labelEn: 'Insights' },
    { id: 'album',    labelHe: 'אלבום',  labelEn: 'Album'    },
    { id: 'schedule', labelHe: 'לו"ז',   labelEn: 'Schedule' },
  ]

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--background)' }}>
      <div className="max-w-5xl mx-auto px-4 pt-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            {isRTL ? 'יומן' : 'Journal'}
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
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
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
        {tab === 'writing'  && <WritingTab userId={userId} initialDocs={documents} />}
        {tab === 'insights' && <InsightsTab entries={domainEntries} />}
        {tab === 'album'    && <AlbumTab userId={userId} initialPhotos={photos} />}
        {tab === 'schedule' && <ScheduleTab userId={userId} />}
      </div>
    </div>
  )
}
