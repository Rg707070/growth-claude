'use client'

import { useState } from 'react'
import { Home, BookOpen, Rss, FileText, User } from 'lucide-react'
import { useLang } from '@/lib/lang'
import { TorahHomeTab } from './torah-home-tab'
import { TorahLearnTab } from './torah-learn-tab'
import { TorahFeedTab } from './torah-feed-tab'
import { TorahSummariesTab } from './torah-summaries-tab'
import { TorahProfileTab } from './torah-profile-tab'
import type { Habit, LearningSession, LearningSummary, TorahLesson, DailyTrack } from '@/types'

interface Props {
  userId: string
  habits: Habit[]
  completedIds: string[]
  sessions: LearningSession[]
  summaries: LearningSummary[]
  totalSeconds: number
  todaySeconds: number
  todaySessionCount: number
  lessons: TorahLesson[]
  savedLessonIds: string[]
  dailyTracks: DailyTrack[]
}

type Tab = 'home' | 'learn' | 'feed' | 'summaries' | 'profile'

const TORAH_COLOR = '#0f766e'
const TORAH_TINT = 'rgba(15,118,110,0.12)'

export function TorahWorkspaceClient({
  userId,
  habits,
  completedIds,
  sessions,
  summaries,
  totalSeconds,
  todaySeconds,
  todaySessionCount,
  lessons,
  savedLessonIds,
  dailyTracks,
}: Props) {
  const { t, isRTL } = useLang()
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [localSummaries, setLocalSummaries] = useState<LearningSummary[]>(summaries)
  const [localSessions, setLocalSessions] = useState<LearningSession[]>(sessions)
  const [localTodaySeconds, setLocalTodaySeconds] = useState(todaySeconds)
  const [localTodayCount, setLocalTodayCount] = useState(todaySessionCount)
  const [localSavedIds, setLocalSavedIds] = useState<string[]>(savedLessonIds)

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: t('torahHome'), icon: <Home size={18} /> },
    { id: 'learn', label: t('torahLearn'), icon: <BookOpen size={18} /> },
    { id: 'feed', label: t('torahFeed'), icon: <Rss size={18} /> },
    { id: 'summaries', label: t('torahSummaries'), icon: <FileText size={18} /> },
    { id: 'profile', label: t('torahProfile'), icon: <User size={18} /> },
  ]

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

  return (
    <div className="flex-1 min-h-0 overflow-y-auto pb-24 md:pb-6">
      {/* Header */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
            style={{ background: TORAH_TINT, color: TORAH_COLOR }}
          >
            📖
          </div>
          <div>
            <h1 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
              {t('torahWorkspace')}
            </h1>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {isRTL ? 'ניהול לימוד יומי' : 'Daily learning management'}
            </p>
          </div>
        </div>
      </div>

      {/* Internal tab bar */}
      <div
        className="flex overflow-x-auto scrollbar-hide px-3 py-2 gap-1 sticky top-0 z-10"
        style={{ background: 'var(--c-surface)', borderBottom: `1px solid ${TORAH_TINT}` }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0"
              style={
                isActive
                  ? { background: TORAH_COLOR, color: '#fff' }
                  : { background: 'transparent', color: 'var(--c-text-muted)' }
              }
            >
              {tab.icon}
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="max-w-2xl mx-auto">
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
        {activeTab === 'feed' && (
          <TorahFeedTab
            userId={userId}
            lessons={lessons}
            savedLessonIds={localSavedIds}
            onSavedChange={setLocalSavedIds}
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
        {activeTab === 'profile' && (
          <TorahProfileTab
            habits={habits}
            completedIds={completedIds}
            sessions={localSessions}
            summaries={localSummaries}
            totalSeconds={totalSeconds + (localTodaySeconds - todaySeconds)}
          />
        )}
      </div>
    </div>
  )
}
