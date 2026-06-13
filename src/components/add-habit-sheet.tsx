'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Clock, AlignLeft, Sparkles, Repeat } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DOMAINS } from '@/lib/domains'
import { useLang } from '@/lib/lang'
import { useToast } from '@/components/ui/toast'
import { HABIT_TEMPLATES } from '@/lib/habit-templates'

const DAY_KEYS = ['dayShortSun', 'dayShortMon', 'dayShortTue', 'dayShortWed', 'dayShortThu', 'dayShortFri', 'dayShortSat'] as const

interface AddHabitSheetProps {
  open: boolean
  onClose: () => void
  defaultDomain?: string
}

export function AddHabitSheet({ open, onClose, defaultDomain }: AddHabitSheetProps) {
  const router = useRouter()
  const { t, lang, isRTL } = useLang()
  const { toast } = useToast()
  const [domainSlug, setDomainSlug] = useState(defaultDomain ?? DOMAINS[0].slug)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [time, setTime] = useState('')
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily')
  const [allDays, setAllDays] = useState(true)
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [showNote, setShowNote] = useState(false)

  if (!open) return null

  const selectedDomain = DOMAINS.find(d => d.slug === domainSlug) ?? DOMAINS[0]
  const templates = HABIT_TEMPLATES[domainSlug] ?? []
  const accent = selectedDomain.color

  const reset = () => {
    setName('')
    setDescription('')
    setTime('')
    setFrequency('daily')
    setAllDays(true)
    setSelectedDays([])
    setSaving(false)
    setShowNote(false)
  }

  const toggleDay = (day: number) => {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])
  }

  const canSubmit = name.trim().length > 0 && (frequency === 'weekly' || allDays || selectedDays.length > 0)

  const submit = async () => {
    if (!canSubmit || saving) return
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('no user')
      const { error } = await supabase.from('habits').insert({
        user_id: user.id,
        domain_slug: domainSlug,
        name: name.trim(),
        description: description.trim() || null,
        frequency,
        schedule_time: time || null,
        scheduled_days: frequency === 'daily' && !allDays ? selectedDays.sort((a, b) => a - b) : null,
      })
      if (error) throw error
      reset()
      onClose()
      router.refresh()
    } catch {
      setSaving(false)
      toast(t('saveFailed'), 'error')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center animate-fade-in"
      style={{ background: 'rgba(4,16,40,0.72)', backdropFilter: 'blur(14px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-3xl animate-fade-up"
        style={{
          background: 'var(--c-fab-sheet)',
          border: '1px solid var(--c-border)',
          borderBottom: 'none',
          boxShadow: `0 -24px 60px rgba(0,0,0,0.45), 0 -2px 24px ${accent}18`,
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-[3px] rounded-full" style={{ background: 'var(--muted-foreground)', opacity: 0.25 }} />
        </div>

        <div className="px-5 pb-7 pt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-2xl flex items-center justify-center text-lg"
                style={{ background: `${accent}22`, border: `1.5px solid ${accent}35` }}
              >
                {selectedDomain.icon}
              </div>
              <div>
                <p className="font-bold text-sm leading-snug" style={{ color: 'var(--foreground)' }}>
                  {t('newHabit')}
                </p>
                <p className="text-[11px] font-medium" style={{ color: accent }}>
                  {lang === 'he' ? selectedDomain.nameHe : selectedDomain.nameEn}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label={t('close')}
              className="p-2 rounded-xl"
              style={{ color: 'var(--muted-foreground)', background: 'var(--c-surface-2)' }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Domain selection */}
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>
              {t('chooseDomain')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {DOMAINS.map((d) => {
                const active = d.slug === domainSlug
                return (
                  <button
                    key={d.slug}
                    onClick={() => { setDomainSlug(d.slug); setName('') }}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all active:scale-95"
                    style={{
                      background: active ? `${d.color}22` : 'var(--c-surface-2)',
                      border: `1.5px solid ${active ? d.color : 'transparent'}`,
                      color: active ? d.color : 'var(--muted-foreground)',
                    }}
                  >
                    {d.icon} {lang === 'he' ? d.nameHe : d.nameEn}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quick template picks */}
          {templates.length > 0 && (
            <div className="mb-4 rounded-2xl p-3" style={{ background: `${accent}09`, border: `1px solid ${accent}22` }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles size={11} style={{ color: accent }} />
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: accent }}>
                  {t('quickPicks')}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {templates.map((tmpl, i) => {
                  const label = lang === 'he' ? tmpl.he : tmpl.en
                  const active = name === label
                  return (
                    <button
                      key={i}
                      onClick={() => setName(active ? '' : label)}
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all active:scale-95"
                      style={{
                        background: active ? `${accent}30` : `${accent}14`,
                        border: `1.5px solid ${active ? accent : `${accent}30`}`,
                        color: active ? accent : 'var(--foreground)',
                        fontWeight: active ? 700 : 500,
                      }}
                    >
                      {active ? '✓ ' : ''}{label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Habit name */}
          <div className="mb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>
              {t('habitName')}
            </p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
              placeholder={lang === 'he' ? 'שם ההרגל...' : 'Name your habit...'}
              dir={isRTL ? 'rtl' : 'ltr'}
              autoFocus
              className="w-full h-12 rounded-xl px-4 text-sm outline-none transition-all font-medium"
              style={{
                background: 'var(--c-input)',
                border: `1.5px solid ${name.trim() ? `${accent}55` : 'var(--c-input-border)'}`,
                color: 'var(--foreground)',
              }}
            />
          </div>

          {/* Note toggle / textarea */}
          {showNote ? (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <AlignLeft size={10} style={{ color: 'var(--muted-foreground)' }} />
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
                    {lang === 'he' ? 'הערה' : 'Note'}
                  </p>
                </div>
                <button onClick={() => { setShowNote(false); setDescription('') }} style={{ color: 'var(--muted-foreground)' }}>
                  <X size={12} />
                </button>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={lang === 'he' ? 'מה המטרה של ההרגל הזה?' : "What's the goal of this habit?"}
                dir={isRTL ? 'rtl' : 'ltr'}
                rows={2}
                autoFocus
                className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none transition-all"
                style={{
                  background: 'var(--c-input)',
                  border: '1.5px solid var(--c-input-border)',
                  color: 'var(--foreground)',
                }}
              />
            </div>
          ) : (
            <button
              onClick={() => setShowNote(true)}
              className="flex items-center gap-1.5 text-[11px] mb-4 mt-1 transition-opacity hover:opacity-80"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <AlignLeft size={11} />
              {lang === 'he' ? '+ הוסף הערה' : '+ Add a note'}
            </button>
          )}

          {/* Divider */}
          <div className="h-px mb-4" style={{ background: 'var(--c-border)' }} />

          {/* Frequency */}
          <div className="mb-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Repeat size={10} style={{ color: 'var(--muted-foreground)' }} />
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
                {t('habitFrequency')}
              </p>
            </div>
            <div
              className="flex rounded-xl overflow-hidden"
              style={{ border: '1.5px solid var(--c-border)', background: 'var(--c-surface-2)' }}
            >
              {(['daily', 'weekly'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFrequency(f)}
                  className="flex-1 py-2.5 text-xs font-semibold transition-all"
                  style={{
                    background: frequency === f ? accent : 'transparent',
                    color: frequency === f ? '#fff' : 'var(--muted-foreground)',
                  }}
                >
                  {f === 'daily'
                    ? (lang === 'he' ? 'יומי' : 'Daily')
                    : (lang === 'he' ? 'שבועי' : 'Weekly')}
                </button>
              ))}
            </div>
          </div>

          {/* Day schedule (daily only) */}
          {frequency === 'daily' && (
            <div className="mb-4">
              <div
                className="flex rounded-xl overflow-hidden mb-2"
                style={{ border: '1.5px solid var(--c-border)', background: 'var(--c-surface-2)' }}
              >
                <button
                  onClick={() => setAllDays(true)}
                  className="flex-1 text-xs py-2 font-semibold transition-all"
                  style={{
                    background: allDays ? `${accent}22` : 'transparent',
                    color: allDays ? accent : 'var(--muted-foreground)',
                  }}
                >
                  {t('everyDay')}
                </button>
                <button
                  onClick={() => setAllDays(false)}
                  className="flex-1 text-xs py-2 font-semibold transition-all"
                  style={{
                    background: !allDays ? `${accent}22` : 'transparent',
                    color: !allDays ? accent : 'var(--muted-foreground)',
                  }}
                >
                  {t('specificDays')}
                </button>
              </div>

              {!allDays && (
                <div className="flex gap-1 justify-between">
                  {DAY_KEYS.map((key, idx) => {
                    const active = selectedDays.includes(idx)
                    return (
                      <button
                        key={idx}
                        onClick={() => toggleDay(idx)}
                        className="flex-1 py-2 rounded-xl text-[10px] font-bold transition-all active:scale-95"
                        style={{
                          background: active ? accent : 'var(--c-surface-2)',
                          color: active ? '#fff' : 'var(--muted-foreground)',
                          border: `1.5px solid ${active ? accent : 'transparent'}`,
                        }}
                      >
                        {t(key)}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Time */}
          <div className="mb-5">
            <div className="flex items-center gap-1.5 mb-2">
              <Clock size={10} style={{ color: 'var(--muted-foreground)' }} />
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
                {t('habitTimeOptional')}
              </p>
            </div>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full h-11 rounded-xl px-4 text-sm outline-none transition-all"
              style={{
                background: 'var(--c-input)',
                border: `1.5px solid ${time ? `${accent}55` : 'var(--c-input-border)'}`,
                color: 'var(--foreground)',
              }}
            />
          </div>

          {/* Submit */}
          <button
            onClick={submit}
            disabled={saving || !canSubmit}
            className="w-full h-12 rounded-xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-40"
            style={{
              background: canSubmit ? accent : 'var(--c-surface-2)',
              color: canSubmit ? '#fff' : 'var(--muted-foreground)',
              boxShadow: canSubmit ? `0 6px 22px ${accent}45` : 'none',
            }}
          >
            {saving ? t('adding') : `${t('addHabit')} ${selectedDomain.icon}`}
          </button>
        </div>
      </div>
    </div>
  )
}
