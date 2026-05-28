'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'

const QUESTIONS_HE = [
  { id: 'mood',        text: 'איך הרגשת היום?',        options: ['😞', '😐', '🙂', '😊', '🤩'] },
  { id: 'productive',  text: 'כמה היית פרודוקטיבי?',   options: ['😴', '😑', '👍', '💪', '🚀'] },
  { id: 'gratitude',   text: 'תודה על משהו אחד היום?', options: ['🌱', '❤️', '✨', '🙏', '⭐'] },
]
const QUESTIONS_EN = [
  { id: 'mood',        text: 'How did you feel today?',   options: ['😞', '😐', '🙂', '😊', '🤩'] },
  { id: 'productive',  text: 'How productive were you?',  options: ['😴', '😑', '👍', '💪', '🚀'] },
  { id: 'gratitude',   text: 'Grateful for one thing?',   options: ['🌱', '❤️', '✨', '🙏', '⭐'] },
]

export function NightCheckIn() {
  const { isRTL } = useLang()
  const [visible, setVisible] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const now = new Date()
    const hour = now.getHours()
    // Window: 20:00 through 01:59 (next morning)
    const inWindow = hour >= 20 || hour < 2
    if (!inWindow) return

    // Use yesterday's date as the key if it's past midnight, so we still capture the right night
    const ref = new Date(now)
    if (hour < 2) ref.setDate(ref.getDate() - 1)
    const dateKey = ref.toISOString().split('T')[0]
    const key = `night_checkin_${dateKey}`
    const stored = localStorage.getItem(key)

    if (stored === 'done' || stored === 'dismissed') return

    if (stored?.startsWith('snooze:')) {
      const until = Number(stored.split(':')[1])
      if (Date.now() < until) return
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs SSR-unsafe state (time + localStorage) into render
    setVisible(true)
  }, [])

  const dismiss = () => {
    const today = new Date().toISOString().split('T')[0]
    localStorage.setItem(`night_checkin_${today}`, 'dismissed')
    setVisible(false)
  }

  const snooze = () => {
    const today = new Date().toISOString().split('T')[0]
    const until = Date.now() + 30 * 60 * 1000 // 30 minutes
    localStorage.setItem(`night_checkin_${today}`, `snooze:${until}`)
    setVisible(false)
  }

  const submit = async () => {
    const today = new Date().toISOString().split('T')[0]
    localStorage.setItem(`night_checkin_${today}`, 'done')
    setSubmitted(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('night_checkins').upsert({
        user_id: user.id,
        date: today,
        mood: answers.mood ?? null,
        productive: answers.productive ?? null,
        gratitude: answers.gratitude ?? null,
      })
    }

    setTimeout(() => setVisible(false), 1500)
  }

  if (!visible) return null

  const questions = isRTL ? QUESTIONS_HE : QUESTIONS_EN
  const allAnswered = questions.every((q) => answers[q.id])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(11,36,71,0.55)', backdropFilter: 'blur(10px)' }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6 animate-fade-up"
        style={{
          background: 'var(--c-fab-sheet)',
          border: '1px solid var(--c-border)',
          boxShadow: '0 20px 60px var(--c-shadow-lg)',
        }}
      >
        {submitted ? (
          <div className="text-center py-4">
            <p className="text-4xl mb-2">🌙</p>
            <p className="font-semibold" style={{ color: 'var(--foreground)' }}>
              {isRTL ? 'לילה טוב! המשך כך 💙' : 'Good night! Keep it up 💙'}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl leading-none">🌙</span>
                <span className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
                  {isRTL ? 'צ\'ק-אין לילי' : 'Night Check-In'}
                </span>
              </div>
              <button
                onClick={dismiss}
                className="text-lg transition-colors"
                style={{ color: 'var(--muted-foreground)' }}
              >×</button>
            </div>

            <div className="space-y-4">
              {questions.map((q) => (
                <div key={q.id}>
                  <p className="text-xs mb-2" dir={isRTL ? 'rtl' : 'ltr'} style={{ color: 'var(--muted-foreground)' }}>
                    {q.text}
                  </p>
                  <div className="flex gap-2 justify-center">
                    {q.options.map((opt) => {
                      const isSelected = answers[q.id] === opt
                      return (
                        <button
                          key={opt}
                          onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                          className="text-2xl w-10 h-10 rounded-xl transition-all active:scale-95"
                          style={
                            isSelected
                              ? {
                                  background: 'var(--c-primary-glow)',
                                  outline: '2px solid var(--primary)',
                                  transform: 'scale(1.1)',
                                }
                              : {
                                  background: 'var(--c-surface-2)',
                                  border: '1px solid var(--c-border)',
                                }
                          }
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={submit}
                disabled={!allAnswered}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-40 transition-all active:scale-[0.97] hover:shadow-lg"
                style={{
                  background: 'var(--brand-gradient)',
                  boxShadow: '0 4px 14px var(--c-hero-shadow)',
                }}
              >
                {isRTL ? 'שמור ✓' : 'Save ✓'}
              </button>
              <button
                onClick={snooze}
                className="w-full py-2 rounded-xl text-xs font-medium transition-colors"
                style={{
                  background: 'transparent',
                  color: 'var(--muted-foreground)',
                }}
              >
                {isRTL ? 'תזכיר לי בעוד 30 דק׳' : 'Remind me in 30 min'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
