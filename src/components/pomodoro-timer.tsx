'use client'

import { useState, useEffect, useRef } from 'react'
import { useLang } from '@/lib/lang'

const WORK_SECONDS = 25 * 60
const BREAK_SECONDS = 5 * 60

export function PomodoroTimer() {
  const { isRTL } = useLang()
  const [seconds, setSeconds] = useState(WORK_SECONDS)
  const [running, setRunning] = useState(false)
  const [onBreak, setOnBreak] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            setRunning(false)
            navigator.vibrate?.([200, 100, 200])
            setOnBreak((b) => !b)
            return onBreak ? WORK_SECONDS : BREAK_SECONDS
          }
          return s - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running, onBreak])

  const reset = () => {
    setRunning(false)
    setOnBreak(false)
    setSeconds(WORK_SECONDS)
  }

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const pct = onBreak
    ? ((BREAK_SECONDS - seconds) / BREAK_SECONDS) * 100
    : ((WORK_SECONDS - seconds) / WORK_SECONDS) * 100

  const accentColor = onBreak ? '#0EA5E9' : '#0E9F6E'

  return (
    <div
      className="p-4 rounded-2xl"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--c-border)',
        boxShadow: '0 1px 3px var(--c-shadow)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg leading-none">⏱</span>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
          {isRTL
            ? onBreak ? 'הפסקה' : 'פומודורו'
            : onBreak ? 'Break' : 'Pomodoro'}
        </span>
      </div>

      {/* Ring */}
      <div className="flex items-center justify-center mb-4">
        <div className="relative w-28 h-28">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="var(--c-surface-2)" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="44"
              fill="none"
              stroke={accentColor}
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${2 * Math.PI * 44 * (1 - pct / 100)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear', filter: `drop-shadow(0 0 6px ${accentColor}88)` }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-mono font-bold tabular-nums" style={{ color: 'var(--foreground)' }}>
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => setRunning((r) => !r)}
          className="px-5 py-2 rounded-full text-sm font-semibold text-white transition-all active:scale-95 hover:shadow-lg"
          style={{ background: 'var(--brand-gradient)' }}
        >
          {running
            ? isRTL ? 'השהה' : 'Pause'
            : isRTL ? 'התחל' : 'Start'}
        </button>
        <button
          onClick={reset}
          className="px-4 py-2 rounded-full text-sm font-medium transition-colors active:scale-95"
          style={{
            background: 'var(--secondary)',
            color: 'var(--muted-foreground)',
            border: '1px solid var(--c-border)',
          }}
        >
          {isRTL ? 'אפס' : 'Reset'}
        </button>
      </div>
    </div>
  )
}
