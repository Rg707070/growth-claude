'use client'

import { useState } from 'react'
import { useLang } from '@/lib/lang'

interface AIInsightsProps {
  weekXP: number
  streak: number
  topDomain: string
  completionPct: number
  habitCount: number
}

export function AIInsights({ weekXP, streak, topDomain, completionPct, habitCount }: AIInsightsProps) {
  const { isRTL } = useLang()
  const [insights, setInsights] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const load = async () => {
    if (loaded || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekXP, streak, topDomain, completionPct, habitCount }),
      })
      const data = await res.json()
      setInsights(data.insights ?? [])
      setLoaded(true)
    } catch {
      setInsights([])
    }
    setLoading(false)
  }

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-violet-600/5 border border-purple-500/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <span className="text-purple-300 text-xs font-semibold uppercase tracking-wide">
            {isRTL ? 'תובנות AI' : 'AI Insights'}
          </span>
        </div>
        {!loaded && (
          <button
            onClick={load}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 disabled:opacity-50 transition-colors"
          >
            {loading
              ? isRTL ? 'טוען...' : 'Loading...'
              : isRTL ? 'נתח שבוע' : 'Analyze week'}
          </button>
        )}
      </div>

      {insights.length > 0 ? (
        <ul className="space-y-2">
          {insights.map((insight, i) => (
            <li key={i} className="flex gap-2 items-start">
              <span className="text-purple-400 mt-0.5 flex-shrink-0">•</span>
              <p className="text-white/80 text-sm leading-relaxed" dir={isRTL ? 'rtl' : 'ltr'}>
                {insight}
              </p>
            </li>
          ))}
        </ul>
      ) : !loaded ? (
        <p className="text-white/30 text-xs text-center py-2">
          {isRTL ? 'לחץ לקבל תובנות מותאמות אישית' : 'Click to get personalized insights'}
        </p>
      ) : (
        <p className="text-white/30 text-xs text-center py-2">
          {isRTL ? 'לא ניתן לטעון תובנות כרגע' : 'Could not load insights'}
        </p>
      )}
    </div>
  )
}
