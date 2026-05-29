'use client'

import React, { useState, useEffect, useRef } from 'react'
import type { KeyboardEvent, ChangeEvent, RefObject, CSSProperties } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'

export function NightCheckIn() {
  const { isRTL } = useLang()
  const [visible, setVisible] = useState(false)
  const [doneItems, setDoneItems] = useState<string[]>([])
  const [leftItems, setLeftItems] = useState<string[]>([])
  const [doneInput, setDoneInput] = useState('')
  const [leftInput, setLeftInput] = useState('')
  const [habitStats, setHabitStats] = useState<{ completed: number; total: number } | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const doneRef = useRef<HTMLInputElement>(null)
  const leftRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 21) return

    const today = new Date().toISOString().split('T')[0]
    if (localStorage.getItem(`night_checkin_${today}`)) return

    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs SSR-unsafe state (time + localStorage) into render
    setVisible(true)
    ;(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ count: total }, { count: completed }] = await Promise.all([
        supabase.from('habits').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('habit_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('completed_at', today),
      ])
      setHabitStats({ completed: completed ?? 0, total: total ?? 0 })
    })()
  }, [])

  const addItem = (list: 'done' | 'left') => {
    if (list === 'done') {
      const val = doneInput.trim()
      if (!val) return
      setDoneItems((p: string[]) => [...p, val])
      setDoneInput('')
      doneRef.current?.focus()
    } else {
      const val = leftInput.trim()
      if (!val) return
      setLeftItems((p: string[]) => [...p, val])
      setLeftInput('')
      leftRef.current?.focus()
    }
  }

  const handleKey = (e: KeyboardEvent<HTMLInputElement>, list: 'done' | 'left') => {
    if (e.key === 'Enter') { e.preventDefault(); addItem(list) }
  }

  const removeItem = (list: 'done' | 'left', idx: number) => {
    if (list === 'done') setDoneItems((p: string[]) => p.filter((_: string, i: number) => i !== idx))
    else setLeftItems((p: string[]) => p.filter((_: string, i: number) => i !== idx))
  }

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
        mood: doneItems.length ? JSON.stringify(doneItems) : null,
        productive: leftItems.length ? JSON.stringify(leftItems) : null,
        gratitude: null,
      })
    }
    setTimeout(() => setVisible(false), 2000)
  }

  if (!visible) return null

  const dateStr = isRTL
    ? new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })
    : new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  const habitPct = habitStats && habitStats.total > 0
    ? Math.round((habitStats.completed / habitStats.total) * 100)
    : 0

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
          <div className="text-center py-6">
            <p className="text-5xl mb-3">🌙</p>
            <p className="font-bold text-base mb-1" style={{ color: 'var(--foreground)' }}>
              {isRTL ? 'שמור! לילה טוב 💙' : 'Saved! Good night 💙'}
            </p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {isRTL ? 'כל כך גאה בך היום' : 'So proud of you today'}
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xl leading-none">📋</span>
                  <span className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>
                    {isRTL ? 'סיכום יומי' : 'Daily Wrap-Up'}
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)', paddingInlineStart: '1.75rem' }}>
                  {dateStr}
                </p>
              </div>
              <button
                onClick={dismiss}
                className="text-xl leading-none transition-colors mt-0.5"
                style={{ color: 'var(--muted-foreground)' }}
              >×</button>
            </div>

            {/* Habit progress strip */}
            {habitStats && habitStats.total > 0 && (
              <div
                className="rounded-2xl px-4 py-3 mb-5 flex items-center gap-3"
                style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                      {isRTL ? 'הרגלים היום' : "Today's habits"}
                    </span>
                    <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--primary)' }}>
                      {habitStats.completed}/{habitStats.total}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--c-border)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${habitPct}%`, background: 'var(--primary)' }}
                    />
                  </div>
                </div>
                <span className="text-2xl flex-shrink-0">
                  {habitStats.completed === habitStats.total ? '🎯' : habitStats.completed > 0 ? '💪' : '🌱'}
                </span>
              </div>
            )}

            {/* What I did section */}
            <SummarySection
              emoji="✅"
              label={isRTL ? 'מה עשיתי היום' : 'What I did today'}
              items={doneItems}
              input={doneInput}
              inputRef={doneRef}
              isRTL={isRTL}
              placeholder={isRTL ? 'הוסף פריט...' : 'Add item...'}
              chipStyle={{
                background: 'oklch(0.22 0.08 160)',
                color: 'oklch(0.82 0.14 160)',
                border: '1px solid oklch(0.4 0.1 160 / 35%)',
              }}
              addBtnStyle={{
                background: 'oklch(0.22 0.08 160)',
                color: 'oklch(0.75 0.15 160)',
                border: '1px solid oklch(0.4 0.1 160 / 35%)',
              }}
              onInput={setDoneInput}
              onAdd={() => addItem('done')}
              onRemove={(i) => removeItem('done', i)}
              onKey={(e) => handleKey(e, 'done')}
            />

            {/* What's left section */}
            <SummarySection
              emoji="📝"
              label={isRTL ? 'מה נשאר' : "What's left"}
              items={leftItems}
              input={leftInput}
              inputRef={leftRef}
              isRTL={isRTL}
              placeholder={isRTL ? 'הוסף פריט...' : 'Add item...'}
              chipStyle={{
                background: 'oklch(0.20 0.07 55)',
                color: 'oklch(0.82 0.14 60)',
                border: '1px solid oklch(0.42 0.1 55 / 35%)',
              }}
              addBtnStyle={{
                background: 'oklch(0.20 0.07 55)',
                color: 'oklch(0.75 0.15 58)',
                border: '1px solid oklch(0.42 0.1 55 / 35%)',
              }}
              onInput={setLeftInput}
              onAdd={() => addItem('left')}
              onRemove={(i) => removeItem('left', i)}
              onKey={(e) => handleKey(e, 'left')}
            />

            {/* Save */}
            <button
              onClick={submit}
              className="mt-1 w-full py-3 rounded-xl text-white font-semibold text-sm transition-all active:scale-[0.97] hover:shadow-lg"
              style={{
                background: 'var(--brand-gradient)',
                boxShadow: '0 4px 14px var(--c-hero-shadow)',
              }}
            >
              {isRTL ? 'שמור סיכום ✓' : 'Save Summary ✓'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

interface SummarySectionProps {
  emoji: string
  label: string
  items: string[]
  input: string
  inputRef: RefObject<HTMLInputElement | null>
  isRTL: boolean
  placeholder: string
  chipStyle: CSSProperties
  addBtnStyle: CSSProperties
  onInput: (v: string) => void
  onAdd: () => void
  onRemove: (i: number) => void
  onKey: (e: KeyboardEvent<HTMLInputElement>) => void
}

function SummarySection({
  emoji, label, items, input, inputRef, isRTL, placeholder,
  chipStyle, addBtnStyle, onInput, onAdd, onRemove, onKey,
}: SummarySectionProps) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base leading-none">{emoji}</span>
        <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{label}</span>
      </div>

      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {items.map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
              style={chipStyle}
            >
              {item}
              <button
                onClick={() => onRemove(i)}
                className="opacity-50 hover:opacity-100 text-[10px] leading-none ml-0.5 transition-opacity"
              >×</button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2" dir={isRTL ? 'rtl' : 'ltr'}>
        <input
          ref={inputRef}
          value={input}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onInput(e.target.value)}
          onKeyDown={onKey}
          placeholder={placeholder}
          dir={isRTL ? 'rtl' : 'ltr'}
          className="flex-1 text-xs px-3 py-2 rounded-xl outline-none transition-colors"
          style={{
            background: 'var(--c-surface-2)',
            border: '1px solid var(--c-border)',
            color: 'var(--foreground)',
          }}
        />
        <button
          onClick={onAdd}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0 transition-all active:scale-95"
          style={addBtnStyle}
        >+</button>
      </div>
    </div>
  )
}
