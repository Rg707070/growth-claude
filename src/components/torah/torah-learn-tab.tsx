'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Square, Plus, MessageSquare, HelpCircle, ChevronDown, ChevronUp, Trash2, Search, X, Camera, Loader2 } from 'lucide-react'
import { useLang } from '@/lib/lang'
import { createClient } from '@/lib/supabase/client'
import { TorahDailySchedule } from './torah-daily-schedule'
import { SefariaReader } from './sefaria-reader'
import type { LearningSession, LearningNote, TextCategory, DailyTrack } from '@/types'

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

function flattenHe(text: string | string[] | string[][]): string[] {
  if (!text) return []
  if (typeof text === 'string') return [text]
  return (text as (string | string[])[]).flatMap((v) => (Array.isArray(v) ? v : [v]))
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
  initialTracks: DailyTrack[]
  onSessionSaved: (session: LearningSession, addedSeconds: number) => void
  onSessionDeleted: (id: string) => void
}

export function TorahLearnTab({ userId, recentSessions, initialTracks, onSessionSaved, onSessionDeleted }: Props) {
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
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [sefariaOpen, setSefariaOpen] = useState(true)
  const [sefariaQuery, setSefariaQuery] = useState('')
  const [sefariaLoading, setSefariaLoading] = useState(false)
  const [sefariaResult, setSefariaResult] = useState<{ ref: string; heTitle: string; verses: string[] } | null>(null)
  const [readerRef, setReaderRef] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const scanInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
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
      .insert({ user_id: userId, text_title: textTitle.trim(), text_category: category, duration_seconds: 0 })
      .select().single()
    if (data) { setActiveSession(data as LearningSession); startTimer() }
  }

  async function endSession() {
    if (!activeSession) return
    setSaving(true)
    if (running) pauseTimer()
    const { data } = await supabase
      .from('learning_sessions')
      .update({ ended_at: new Date().toISOString(), duration_seconds: elapsed })
      .eq('id', activeSession.id).select().single()
    if (data) onSessionSaved(data as LearningSession, elapsed)
    setActiveSession(null); setElapsed(0); setTextTitle(''); setNotes([]); setSaving(false)
  }

  async function addNote() {
    if (!noteInput.trim() || !activeSession) return
    const { data } = await supabase
      .from('learning_notes')
      .insert({ user_id: userId, session_id: activeSession.id, content: noteInput.trim(), type: noteType })
      .select().single()
    if (data) setNotes((prev) => [data as LearningNote, ...prev])
    setNoteInput('')
  }

  async function searchSefaria() {
    if (!sefariaQuery.trim()) return
    setSefariaLoading(true); setSefariaResult(null)
    try {
      const r = await fetch(`https://www.sefaria.org/api/texts/${encodeURIComponent(sefariaQuery.trim())}?context=0&pad=0`)
      const data = await r.json()
      const verses = flattenHe(data.he).filter(Boolean).slice(0, 20)
      setSefariaResult({ ref: data.ref ?? sefariaQuery, heTitle: data.heTitle ?? sefariaQuery, verses })
    } catch { setSefariaResult(null) }
    setSefariaLoading(false)
  }

  function openReaderAndStartSession(ref: string) {
    setTextTitle(ref); setReaderRef(null)
  }

  async function handleScan(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true); e.target.value = ''
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      const base64 = dataUrl.split(',')[1]
      const mediaType = (file.type || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp'
      try {
        const res = await fetch('/api/torah/scan', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mediaType }),
        })
        const { ref } = await res.json()
        if (ref) setReaderRef(ref)
      } finally { setScanning(false) }
    }
    reader.readAsDataURL(file)
  }

  async function deleteSession(id: string) {
    setDeletingId(id)
    await supabase.from('learning_notes').delete().eq('session_id', id)
    await supabase.from('learning_sessions').delete().eq('id', id)
    onSessionDeleted(id); setDeletingId(null)
  }

  const visibleNotes = notes.filter((n) => (noteTab === 'notes' ? n.type === 'note' : n.type === 'question'))

  if (readerRef) {
    return (
      <SefariaReader
        initialRef={readerRef}
        userId={userId}
        onClose={() => setReaderRef(null)}
        onStartSession={openReaderAndStartSession}
      />
    )
  }

  return (
    <div className="space-y-5">
      {!activeSession ? (
        <>
          {/* Start new session */}
          <div className="rounded-2xl p-5 space-y-4"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-medium text-right" style={{ color: 'var(--muted-foreground)' }}>
              {t('whatLearning')}
            </p>

            <input
              value={textTitle}
              onChange={(e) => setTextTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && textTitle.trim()) beginSession() }}
              placeholder="ברכות ב:א — הגמרא על קריאת שמע..."
              className="w-full bg-transparent text-base py-2 border-b outline-none text-right font-medium"
              style={{ color: 'var(--foreground)', borderColor: 'var(--border)' }}
              dir="rtl"
            />

            {/* Category pills — horizontal scroll */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5" dir="rtl">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={category === c.value
                    ? { background: TORAH_COLOR, color: '#fff' }
                    : { background: 'var(--secondary)', color: 'var(--muted-foreground)' }
                  }
                >
                  {c.labelHe}
                </button>
              ))}
            </div>

            <button
              onClick={beginSession}
              disabled={!textTitle.trim()}
              className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-30 active:scale-[0.99]"
              style={{
                background: TORAH_COLOR,
                color: '#fff',
                boxShadow: textTitle.trim() ? `0 4px 16px ${TORAH_COLOR}40` : 'none',
              }}
            >
              {t('startLearning')}
            </button>
          </div>

          {/* Sefaria panel */}
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(245,158,11,0.3)' }}>
            <button
              onClick={() => setSefariaOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 transition-colors"
              style={{ background: 'rgba(245,158,11,0.09)' }}
            >
              <div className="flex items-center gap-1.5" style={{ color: 'rgba(245,158,11,0.6)' }}>
                {sefariaOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 text-sm font-semibold">ספריא</span>
                <span className="text-base">📚</span>
              </div>
            </button>

            {sefariaOpen && (
              <div className="p-4 space-y-4" style={{ background: 'var(--card)' }}>
                <div className="space-y-2">
                  <p className="text-xs text-right" style={{ color: 'var(--muted-foreground)' }}>חיפוש מראה מקום</p>
                  <div className="flex gap-2">
                    <input
                      ref={scanInputRef}
                      type="file" accept="image/*" capture="environment"
                      className="hidden" onChange={handleScan}
                    />
                    <button
                      onClick={() => scanInputRef.current?.click()}
                      disabled={scanning}
                      className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-opacity disabled:opacity-50"
                      style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}
                      title="סרוק טקסט מתמונה"
                    >
                      {scanning ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
                    </button>
                    <button
                      onClick={searchSefaria}
                      disabled={sefariaLoading || !sefariaQuery.trim()}
                      className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-opacity disabled:opacity-30"
                      style={{ background: 'rgba(245,158,11,0.18)', color: '#f59e0b' }}
                    >
                      <Search size={15} />
                    </button>
                    <input
                      value={sefariaQuery}
                      onChange={(e) => setSefariaQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') searchSefaria() }}
                      placeholder="ברכות ב:א — Berakhot 2a"
                      className="flex-1 bg-transparent text-sm outline-none text-right border-b"
                      style={{ color: 'var(--foreground)', borderColor: 'rgba(245,158,11,0.2)' }}
                      dir="rtl"
                    />
                  </div>

                  {sefariaLoading && (
                    <p className="text-xs text-right" style={{ color: 'var(--muted-foreground)' }}>טוען...</p>
                  )}

                  {sefariaResult && (
                    <div className="rounded-xl p-3 space-y-2"
                      style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.22)' }}>
                      <div className="flex items-center justify-between">
                        <button onClick={() => setSefariaResult(null)} style={{ color: 'var(--muted-foreground)' }}>
                          <X size={14} />
                        </button>
                        <p className="text-amber-400 text-xs font-semibold">{sefariaResult.heTitle}</p>
                      </div>
                      <button
                        onClick={() => setReaderRef(sefariaResult.ref)}
                        className="w-full text-xs py-2.5 rounded-lg font-medium transition-opacity hover:opacity-80"
                        style={{ background: 'rgba(245,158,11,0.18)', color: '#f59e0b' }}
                        dir="rtl"
                      >
                        📖 פתח בקורא
                      </button>
                      <button
                        onClick={() => { setTextTitle(sefariaResult.ref); setSefariaResult(null) }}
                        className="w-full text-xs py-2 rounded-lg transition-opacity hover:opacity-80"
                        style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}
                        dir="rtl"
                      >
                        התחל שיעור בלי לקרוא ←
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--border)' }} />
                <TorahDailySchedule userId={userId} initialTracks={initialTracks} onOpenReader={setReaderRef} />
              </div>
            )}
          </div>

          {/* Recent sessions */}
          {recentSessions.length > 0 && (
            <section>
              <p className="text-xs mb-3 text-right font-semibold uppercase tracking-wider"
                style={{ color: 'var(--muted-foreground)' }}>
                {t('recentSessions')}
              </p>
              <div className="space-y-2">
                {recentSessions.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-3.5 rounded-xl"
                    style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                    <button
                      onClick={() => deleteSession(s.id)}
                      disabled={deletingId === s.id}
                      className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-opacity hover:opacity-80 disabled:opacity-30"
                      style={{ background: 'rgba(239,68,68,0.10)', color: 'rgba(239,68,68,0.65)' }}
                    >
                      <Trash2 size={13} />
                    </button>
                    <div className="text-right flex-1">
                      <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{s.text_title}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                        {CATEGORIES.find((c) => c.value === s.text_category)?.labelHe}
                        {' · '}{formatDuration(s.duration_seconds)}
                        {' · '}{timeAgo(s.created_at)}
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
          {/* Active session — hero timer layout */}
          <div className="flex flex-col items-center pt-4 pb-2">
            <p className="text-xs font-medium text-center mb-6 max-w-[220px] leading-snug"
              style={{ color: 'var(--muted-foreground)' }}>
              {activeSession.text_title}
            </p>

            {/* HERO TIMER */}
            <p
              className="font-mono font-bold tracking-tighter leading-none transition-colors"
              style={{
                fontSize: 'clamp(64px, 18vw, 96px)',
                color: running ? TORAH_COLOR : 'var(--muted-foreground)',
              }}
            >
              {formatTime(elapsed)}
            </p>

            {running && (
              <div className="flex items-center gap-1.5 mt-4">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: TORAH_COLOR }} />
                <span className="text-xs font-medium" style={{ color: TORAH_COLOR }}>בלימוד</span>
              </div>
            )}
            {!running && elapsed > 0 && (
              <p className="text-xs mt-4" style={{ color: 'var(--muted-foreground)' }}>מושהה</p>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-5 pb-2">
            <button
              onClick={running ? pauseTimer : startTimer}
              className="w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-95"
              style={{ background: TORAH_COLOR, boxShadow: `0 4px 20px ${TORAH_COLOR}45` }}
            >
              {running
                ? <Square size={20} color="#fff" fill="#fff" />
                : <Play size={20} color="#fff" fill="#fff" />
              }
            </button>
            <button
              onClick={endSession}
              disabled={saving}
              className="px-5 py-3 rounded-full text-sm font-medium transition-opacity disabled:opacity-40"
              style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}
            >
              {saving ? '...' : t('endSession')}
            </button>
          </div>

          {/* Notes area */}
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {/* Note type tabs */}
            <div className="flex" style={{ borderBottom: '1px solid var(--border)' }}>
              {(['notes', 'questions'] as NoteTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setNoteTab(tab)}
                  className="flex-1 py-3 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  style={{
                    background: noteTab === tab ? `${TORAH_COLOR}12` : 'transparent',
                    color: noteTab === tab ? TORAH_COLOR : 'var(--muted-foreground)',
                    borderBottom: noteTab === tab ? `2px solid ${TORAH_COLOR}` : '2px solid transparent',
                  }}
                >
                  {tab === 'notes' ? <MessageSquare size={13} /> : <HelpCircle size={13} />}
                  {tab === 'notes' ? t('notes') : t('questions')}
                </button>
              ))}
            </div>

            {/* Note input */}
            <div className="p-4">
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => { setNoteType(noteTab === 'notes' ? 'note' : 'question'); addNote() }}
                  disabled={!noteInput.trim()}
                  className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-30 transition-opacity"
                  style={{ background: TORAH_COLOR }}
                >
                  <Plus size={16} color="#fff" />
                </button>
                <input
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setNoteType(noteTab === 'notes' ? 'note' : 'question')
                      addNote()
                    }
                  }}
                  placeholder={noteTab === 'notes' ? t('addNote') : t('addQuestion')}
                  className="flex-1 bg-transparent text-sm outline-none text-right"
                  style={{ color: 'var(--foreground)' }}
                  dir="rtl"
                />
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto">
                {visibleNotes.length === 0 ? (
                  <p className="text-xs text-center py-4" style={{ color: 'var(--muted-foreground)' }}>
                    {noteTab === 'notes' ? 'הוסף הערות תוך כדי הלימוד' : 'רשום שאלות שעולות בלימוד'}
                  </p>
                ) : (
                  visibleNotes.map((note) => (
                    <div key={note.id} className="p-3 rounded-xl text-right"
                      style={{ background: 'var(--secondary)' }}>
                      <p className="text-sm" style={{ color: 'var(--foreground)' }}>{note.content}</p>
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
