'use client'

import { useState } from 'react'
import { ArrowRight, BookOpen, FileText, Home, CalendarDays } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/lib/lang'
import { TorahHomeTab } from './torah-home-tab'
import { TorahLearnTab } from './torah-learn-tab'
import { TorahSummariesTab } from './torah-summaries-tab'
import { TorahCalendarTab } from './torah-calendar-tab'
import type { Habit, LearningSession, LearningSummary, DailyTrack } from '@/types'

interface Props {
  userId: string
  habits: Habit[]
  completedIds: string[]
  sessions: LearningSession[]
  summaries: LearningSummary[]
  todaySeconds: number
  todaySessionCount: number
  dailyTracks: DailyTrack[]
}

type Tab = 'home' | 'learn' | 'summaries' | 'calendar'

const COLOR = '#0F766E'

export function TorahWorkspaceClient({
  userId,
  habits,
  completedIds,
  sessions,
  summaries,
  todaySeconds,
  todaySessionCount,
  dailyTracks,
}: Props) {
  const router = useRouter()
  const { t, isRTL } = useLang()
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [localSummaries, setLocalSummaries] = useState<LearningSummary[]>(summaries)
  const [localSessions, setLocalSessions] = useState<LearningSession[]>(sessions)
  const [localTodaySeconds, setLocalTodaySeconds] = useState(todaySeconds)
  const [localTodayCount, setLocalTodayCount] = useState(todaySessionCount)

  function onSessionSaved(session: LearningSession, addedSeconds: number) {
    setLocalSessions((prev) => [session, ...prev.slice(0, 9)])
    setLocalTodaySeconds((prev) => prev + addedSeconds)
    setLocalTodayCount((prev) => prev + 1)
  }

  function onSummaryCreated(summary: LearningSummary) {
    setLocalSummaries((prev) => [summary, ...prev])
  }

  function onSummaryUpdated(updated: LearningSummary) {
    setLocalSummaries((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
  }

  function onSummaryDeleted(id: string) {
    setLocalSummaries((prev) => prev.filter((s) => s.id !== id))
  }

  function onSessionDeleted(id: string) {
    setLocalSessions((prev) => prev.filter((s) => s.id !== id))
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'home',      label: t('torahHome'),      icon: <Home size={16} /> },
    { id: 'learn',     label: t('torahLearn'),     icon: <BookOpen size={16} /> },
    { id: 'summaries', label: t('torahSummaries'), icon: <FileText size={16} /> },
    { id: 'calendar',  label: isRTL ? 'לוח שנה' : 'Calendar', icon: <CalendarDays size={16} /> },
  ]

  return (
    <div className="flex-1 min-h-0 overflow-y-auto pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-4 space-y-5 md:max-w-none md:px-0 md:pt-8">

        {/* Header — same style as all other domain clients */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl flex-shrink-0"
            style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }}
          >
            <ArrowRight size={20} style={{ color: 'var(--foreground)', transform: isRTL ? 'none' : 'rotate(180deg)' }} />
          </button>
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: `${COLOR}22` }}
          >
            📖
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
              {isRTL ? 'לימודי קודש' : 'Torah Study'}
            </h1>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {isRTL ? 'ניהול לימוד יומי' : 'Daily learning'}
            </p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-xl" style={{ background: 'var(--secondary)' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: activeTab === tab.id ? COLOR : 'transparent',
                color: activeTab === tab.id ? 'white' : 'var(--muted-foreground)',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'home' && (
          <TorahHomeTab
            habits={habits}
            completedIds={completedIds}
            userId={userId}
            recentSessions={localSessions.slice(0, 3)}
            recentSummaries={localSummaries.slice(0, 2)}
            todaySeconds={localTodaySeconds}
            todaySessionCount={localTodayCount}
            onNavigate={setActiveTab}
          />
        )}
        {activeTab === 'learn' && (
          <TorahLearnTab
            userId={userId}
            recentSessions={localSessions}
            onSessionSaved={onSessionSaved}
            onSessionDeleted={onSessionDeleted}
            initialTracks={dailyTracks}
          />
        )}
        {activeTab === 'summaries' && (
          <TorahSummariesTab
            userId={userId}
            summaries={localSummaries}
            onCreated={onSummaryCreated}
            onUpdated={onSummaryUpdated}
            onDeleted={onSummaryDeleted}
          />
        )}
        {activeTab === 'calendar' && (
          <TorahCalendarTab userId={userId} />
        )}

      </div>
    </div>
  )
}
