'use client'

import { useState, useEffect, useRef } from 'react'
import { useLang } from '@/lib/lang'

const BREAK_SECONDS = 5 * 60
const RADIUS = 36
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function PomodoroTimer() {
  const { isRTL } = useLang()
  const [workMinutes, setWorkMinutes] = useState(25)
  const [seconds, setSeconds] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [onBreak, setOnBreak] = useState(false)
  const [sessionName, setSessionName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [editingDuration, setEditingDuration] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const durationInputRef = useRef<HTMLInputElement>(null)

  const workSeconds = workMinutes * 60
  const atStart = !running && seconds === workSeconds && !onBreak

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            setRunning(false)
            navigator.vibrate?.([200, 100, 200])
            setOnBreak((b) => !b)
            return onBreak ? workSeconds : BREAK_SECONDS
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
  }, [running, onBreak, workSeconds])

  useEffect(() => {
    if (editingName) nameInputRef.current?.focus()
  }, [editingName])

  useEffect(() => {
    if (editingDuration) durationInputRef.current?.select()
  }, [editingDuration])

  const applyDuration = (val: string) => {
    const mins = parseInt(val)
    if (!isNaN(mins) && mins >= 1 && mins <= 180) {
      setWorkMinutes(mins)
      setSeconds(mins * 60)
    }
    setEditingDuration(false)
  }

  const reset = () => {
    setRunning(false)
    setOnBreak(false)
    setSeconds(workSeconds)
  }

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const pct = onBreak
    ? ((BREAK_SECONDS - seconds) / BREAK_SECONDS) * 100
    : ((workSeconds - seconds) / workSeconds) * 100

  const accentColor = onBreak ? '#0EA5E9' : '#0E9F6E'
  const defaultLabel = isRTL ? (onBreak ? 'הפסקה' : 'פוקוס') : (onBreak ? 'Break' : 'Focus')

  return (
    <div
      className="p-3 rounded-2xl"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--c-border)',
      }}
    >
      {/* Editable session name */}
      <div className="mb-2 px-0.5" dir={isRTL ? 'rtl' : 'ltr'}>
        {editingName ? (
          <input
            ref={nameInputRef}
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditingName(false) }}
            placeholder={isRTL ? 'שם המשימה...' : 'Session name...'}
            className="w-full text-xs bg-transparent border-b outline-none pb-0.5"
            style={{ color: 'var(--foreground)', borderColor: accentColor }}
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="text-xs truncate max-w-full text-start"
            style={{ color: sessionName ? 'var(--foreground)' : 'var(--muted-foreground)' }}
          >
            {sessionName || defaultLabel}
          </button>
        )}
      </div>

      {/* Ring + buttons side by side */}
      <div className="flex items-center gap-3" dir="ltr">
        <div className="relative flex-shrink-0 w-20 h-20">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="var(--c-surface-2)" strokeWidth="9" />
            <circle
              cx="50" cy="50" r={RADIUS}
              fill="none"
              stroke={accentColor}
              strokeWidth="9"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - pct / 100)}
              strokeLinecap="round"
              style={{
                transition: 'stroke-dashoffset 1s linear',
                filter: `drop-shadow(0 0 5px ${accentColor}99)`,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {editingDuration ? (
              <input
                ref={durationInputRef}
                type="number"
                defaultValue={workMinutes}
                min={1}
                max={180}
                onBlur={(e) => applyDuration(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') applyDuration((e.target as HTMLInputElement).value)
                  if (e.key === 'Escape') setEditingDuration(false)
                }}
                className="w-10 text-center text-base font-mono font-bold bg-transparent outline-none"
                style={{ color: accentColor }}
              />
            ) : (
              <span
                className="text-base font-mono font-bold tabular-nums"
                style={{
                  color: 'var(--foreground)',
                  cursor: atStart ? 'pointer' : 'default',
                  textDecoration: atStart ? 'underline dotted' : 'none',
                  textUnderlineOffset: '2px',
                }}
                onClick={() => { if (atStart) setEditingDuration(true) }}
              >
                {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 flex-1">
          <button
            onClick={() => setRunning((r) => !r)}
            className="w-full py-1.5 rounded-full text-xs font-semibold text-white transition-all active:scale-95"
            style={{ background: 'var(--brand-gradient)' }}
          >
            {running
              ? isRTL ? 'השהה' : 'Pause'
              : isRTL ? 'התחל' : 'Start'}
          </button>
          <button
            onClick={reset}
            className="w-full py-1.5 rounded-full text-xs font-medium active:scale-95"
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
    </div>
  )
}
