'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Square, Plus, BookOpen, MessageSquare, HelpCircle, ChevronDown } from 'lucide-react'
import { useLang } from '@/lib/lang'
import { createClient } from '@/lib/supabase/client'
import type { LearningSession, LearningNote, TextCategory } from '@/types'

const TORAH_COLOR = '#0f766e'

const CATEGORIES: { value: TextCategory; labelHe: string }[] = [
  { value: 'gemara', labelHe: 'גמרא' },
  { value: 'mishnah', labelHe: 'משנה' },
  { value: 'tanakh', labelHe: 'תנ"ך' },
  { value: 'halacha', labelHe: 'הלכה' },
  { value: 'article', labelHe: 'מאמר' },
  { value: 'other', labelHe: 'אחר' },
]

type NoteType = 'note' | 'question'
type NoteTab = 'notes' | 'questions'

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  if (m < 60) return `${m} דק'`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem > 0 ? `${h}ש' ${rem}ד'` : `${h}ש'`
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 2) return 'עכשיו'
  if (m < 60) return `לפני ${m} דק'`
  const h = Math.floor(m / 60)
  if (h < 24) return `לפני ${h} שעות`
  return `לפני ${Math.floor(h / 24)} ימים`
}

interface Props {
  userId: string
  recentSessions: LearningSession[]
  onSessionSaved: (session: LearningSession, addedSeconds: number) => void
}

export function TorahLearnTab({ userId, recentSessions, onSessionSaved }: Props) {
  const { t } = useLang()
  const supabase = createClient()

  const [activeSession, setActiveSession] = useState<LearningSession | null>(null)
  const [textTitle, setTextTitle] = useState('')
  const [category, setCategory] = useState<TextCategory>('gemara')
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [notes, setNotes] = useState<LearningNote[]>([])
  const [noteInput, setNoteInput] = useState('')
  const [noteType, setNoteType] = useState<NoteType>('note')
  const [noteTab, setNoteTab] = useState<NoteTab>('notes')
  const [saving, setSaving] = useState(false)
  const [showCatPicker, setShowCatPicker] = useState(false)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  function startTimer() {
    if (!textTitle.trim()) return
    startTimeRef.current = Date.now() - elapsed * 1000
    setRunning(true)
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)
  }

  function pauseTimer() {
    setRunning(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  async function beginSession() {
    if (!textTitle.trim()) return
    const { data } = await supabase
      .from('learning_sessions')
      .insert({
        user_id: userId,
        text_title: textTitle.trim(),
        text_category: category,
        duration_seconds: 0,
      })
      .select()
      .single()
    if (data) {
      setActiveSession(data as LearningSession)
      startTimer()
    }
  }

  async function endSession() {
    if (!activeSession) return
    setSaving(true)
    if (running) pauseTimer()

    const { data } = await supabase
      .from('learning_sessions')
      .update({ ended_at: new Date().toISOString(), duration_seconds: elapsed })
      .eq('id', activeSession.id)
      .select()
      .single()

    if (data) {
      onSessionSaved(data as LearningSession, elapsed)
    }

    setActiveSession(null)
    setElapsed(0)
    setTextTitle('')
    setNotes([])
    setSaving(false)
  }

  async function addNote() {
    if (!noteInput.trim() || !activeSession) return
    const { data } = await supabase
      .from('learning_notes')
      .insert({
        user_id: userId,
        session_id: activeSession.id,
        content: noteInput.trim(),
        type: noteType,
      })
      .select()
      .single()
    if (data) setNotes((prev) => [data as LearningNote, ...prev])
    setNoteInput('')
  }

  const visibleNotes = notes.filter((n) => (noteTab === 'notes' ? n.type === 'note' : n.type === 'question'))
  const selectedCat = CATEGORIES.find((c) => c.value === category)

  return (
    <div className="p-4 space-y-4">
      {!activeSession ? (
        <>
          {/* Start new session */}
          <div
            className="rounded-2xl p-4 space-y-3"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-sm font-medium text-white/70 text-right">{t('whatLearning')}</p>

            <input
              value={textTitle}
              onChange={(e) => setTextTitle(e.target.value)}
              placeholder="ברכות ב:א — הגמרא על קריאת שמע..."
              className="w-full bg-transparent text-white placeholder-white/20 text-sm py-2 border-b outline-none text-right"
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}
              dir="rtl"
            />

            {/* Category picker */}
            <div className="relative">
              <button
                onClick={() => setShowCatPicker((v) => !v)}
                className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full"
                style={{ background: `${TORAH_COLOR}22`, color: TORAH_COLOR }}
              >
                {selectedCat?.labelHe}
                <ChevronDown size={12} />
              </button>
              {showCatPicker && (
                <div
                  className="absolute top-8 right-0 z-20 rounded-xl p-2 flex flex-col gap-1 min-w-32"
                  style={{ background: 'oklch(0.14 0.04 238)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => { setCategory(c.value); setShowCatPicker(false) }}
                      className="text-sm text-right px-3 py-1.5 rounded-lg transition-colors hover:bg-white/5"
                      style={{ color: category === c.value ? TORAH_COLOR : 'rgba(255,255,255,0.7)' }}
                    >
                      {c.labelHe}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={beginSession}
              disabled={!textTitle.trim()}
              className="w-full py-3 rounded-xl text-sm font-medium transition-opacity disabled:opacity-30"
              style={{ background: TORAH_COLOR, color: '#fff' }}
            >
              {t('startLearning')}
            </button>
          </div>

          {/* Recent sessions */}
          {recentSessions.length > 0 && (
            <section>
              <p className="text-xs text-white/40 mb-3 text-right">{t('recentSessions')}</p>
              <div className="space-y-2">
                {recentSessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <span className="text-xs text-white/30">{timeAgo(s.created_at)}</span>
                    <div className="text-right">
                      <p className="text-sm text-white/85">{s.text_title}</p>
                      <p className="text-xs text-white/35 mt-0.5">
                        {CATEGORIES.find((c) => c.value === s.text_category)?.labelHe} · {formatDuration(s.duration_seconds)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <>
          {/* Active session */}
          <div
            className="rounded-2xl p-4"
            style={{ background: `${TORAH_COLOR}14`, border: `1px solid ${TORAH_COLOR}33` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-2">
                <button
                  onClick={running ? pauseTimer : startTimer}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                  style={{ background: TORAH_COLOR }}
                >
                  {running ? <Square size={14} color="#fff" /> : <Play size={14} color="#fff" />}
                </button>
                <button
                  onClick={endSession}
                  disabled={saving}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
                >
                  {t('endSession')}
                </button>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/40 mb-0.5">{activeSession.text_title}</p>
                <p
                  className="text-2xl font-mono font-bold tracking-wider"
                  style={{ color: running ? TORAH_COLOR : 'rgba(255,255,255,0.4)' }}
                >
                  {formatTime(elapsed)}
                </p>
              </div>
            </div>
          </div>

          {/* Notes area */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {/* Note type tabs */}
            <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {(['notes', 'questions'] as NoteTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setNoteTab(tab)}
                  className="flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  style={{
                    background: noteTab === tab ? `${TORAH_COLOR}15` : 'transparent',
                    color: noteTab === tab ? TORAH_COLOR : 'rgba(255,255,255,0.35)',
                    borderBottom: noteTab === tab ? `2px solid ${TORAH_COLOR}` : '2px solid transparent',
                  }}
                >
                  {tab === 'notes' ? <MessageSquare size={13} /> : <HelpCircle size={13} />}
                  {tab === 'notes' ? t('notes') : t('questions')}
                </button>
              ))}
            </div>

            {/* Note input */}
            <div className="p-3">
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => { setNoteType(noteTab === 'notes' ? 'note' : 'question'); addNote() }}
                  disabled={!noteInput.trim()}
                  className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30 transition-opacity"
                  style={{ background: TORAH_COLOR }}
                >
                  <Plus size={15} color="#fff" />
                </button>
                <input
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { setNoteType(noteTab === 'notes' ? 'note' : 'question'); addNote() } }}
                  placeholder={noteTab === 'notes' ? t('addNote') : t('addQuestion')}
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/20 outline-none text-right"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto">
                {visibleNotes.length === 0 ? (
                  <p className="text-xs text-white/25 text-center py-4">
                    {noteTab === 'notes' ? 'הוסף הערות תוך כדי הלימוד' : 'רשום שאלות שעולות בלימוד'}
                  </p>
                ) : (
                  visibleNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-2.5 rounded-lg text-right"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    >
                      <p className="text-sm text-white/80">{note.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
