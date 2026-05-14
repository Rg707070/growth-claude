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
    const hour = new Date().getHours()
    if (hour < 21) return

    const today = new Date().toISOString().split('T')[0]
    const key = `night_checkin_${today}`
    if (localStorage.getItem(key)) return

    setVisible(true)
  }, [])

  const dismiss = () => {
    const today = new Date().toISOString().split('T')[0]
    localStorage.setItem(`night_checkin_${today}`, 'dismissed')
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
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[oklch(0.12_0.04_240)] border border-white/10 rounded-2xl p-6 shadow-2xl">
        {submitted ? (
          <div className="text-center py-4">
            <p className="text-4xl mb-2">🌙</p>
            <p className="text-white font-semibold">
              {isRTL ? 'לילה טוב! המשך כך 💙' : 'Good night! Keep it up 💙'}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🌙</span>
                <span className="text-white font-semibold text-sm">
                  {isRTL ? 'צ\'ק-אין לילי' : 'Night Check-In'}
                </span>
              </div>
              <button onClick={dismiss} className="text-white/30 hover:text-white/70 text-lg">×</button>
            </div>

            <div className="space-y-4">
              {questions.map((q) => (
                <div key={q.id}>
                  <p className="text-white/70 text-xs mb-2" dir={isRTL ? 'rtl' : 'ltr'}>{q.text}</p>
                  <div className="flex gap-2 justify-center">
                    {q.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                        className={`text-2xl w-10 h-10 rounded-xl transition-all ${
                          answers[q.id] === opt
                            ? 'bg-cyan-500/30 ring-2 ring-cyan-400 scale-110'
                            : 'bg-white/8 hover:bg-white/15'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={submit}
              disabled={!allAnswered}
              className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              {isRTL ? 'שמור ✓' : 'Save ✓'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
