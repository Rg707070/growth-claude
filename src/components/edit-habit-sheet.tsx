'use client'

import { useState } from 'react'
import React from 'react'
import { useRouter } from 'next/navigation'
import { X, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DOMAINS } from '@/lib/domains'
import { useLang } from '@/lib/lang'
import { useToast } from '@/components/ui/toast'
import type { Habit } from '@/types'

const DAY_KEYS = ['dayShortSun', 'dayShortMon', 'dayShortTue', 'dayShortWed', 'dayShortThu', 'dayShortFri', 'dayShortSat'] as const

interface EditHabitSheetProps {
  habit: Habit
  open: boolean
  onClose: () => void
}

export function EditHabitSheet({ habit, open, onClose }: EditHabitSheetProps) {
  const router = useRouter()
  const { t, lang, isRTL } = useLang()
  const { toast } = useToast()

  const [name, setName] = useState(habit.name)
  const [domainSlug, setDomainSlug] = useState(habit.domain_slug)
  const [time, setTime] = useState(habit.schedule_time?.slice(0, 5) ?? '')
  const [allDays, setAllDays] = useState(!habit.scheduled_days || habit.scheduled_days.length === 0)
  const [selectedDays, setSelectedDays] = useState<number[]>(habit.scheduled_days ?? [])
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (!open) return null

  const accentColor = DOMAINS.find((d) => d.slug === domainSlug)?.color ?? 'var(--c-primary)'

  const toggleDay = (day: number) => {
    setSelectedDays((prev: number[]) =>
      prev.includes(day) ? prev.filter((d: number) => d !== day) : [...prev, day]
    )
  }

  const save = async () => {
    if (!name.trim() || saving) return
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('habits')
        .update({
          name: name.trim(),
          domain_slug: domainSlug,
          schedule_time: time || null,
          scheduled_days: allDays ? null : selectedDays.sort((a: number, b: number) => a - b),
        })
        .eq('id', habit.id)
      if (error) throw error
      onClose()
      router.refresh()
    } catch {
      setSaving(false)
      toast(t('saveFailed'), 'error')
    }
  }

  const deleteHabit = async () => {
    if (deleting) return
    setDeleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('habits')
        .update({ is_active: false })
        .eq('id', habit.id)
      if (error) throw error
      onClose()
      router.refresh()
    } catch {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center px-4 pt-4 animate-fade-in"
      style={{ background: 'rgba(11,36,71,0.55)', backdropFilter: 'blur(10px)', paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6 animate-fade-up overflow-y-auto"
        style={{
          background: 'var(--c-fab-sheet)',
          border: '1px solid var(--c-border)',
          boxShadow: '0 20px 60px var(--c-shadow-lg)',
          maxHeight: 'calc(90vh - env(safe-area-inset-bottom, 0px))',
        }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>
            {t('editHabit')}
          </span>
          <button
            onClick={onClose}
            aria-label={t('close')}
            className="p-1 rounded-lg"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Domain selector */}
        <label className="text-xs font-medium block mb-2" style={{ color: 'var(--muted-foreground)' }}>
          {t('chooseDomain')}
        </label>
        <div className="flex flex-wrap gap-2 mb-4">
          {DOMAINS.map((d) => {
            const active = d.slug === domainSlug
            return (
              <button
                key={d.slug}
                onClick={() => setDomainSlug(d.slug)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95"
                style={{
                  background: active ? `${d.color}22` : 'var(--c-surface-2)',
                  border: `1px solid ${active ? d.color : 'var(--c-border)'}`,
                  color: active ? d.color : 'var(--muted-foreground)',
                }}
              >
                {d.icon} {lang === 'he' ? d.nameHe : d.nameEn}
              </button>
            )
          })}
        </div>

        {/* Name input */}
        <input
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') save() }}
          placeholder={t('habitName')}
          dir={isRTL ? 'rtl' : 'ltr'}
          autoFocus
          className="w-full h-11 rounded-xl px-4 text-sm outline-none mb-3 transition-colors"
          style={{ background: 'var(--c-input)', border: '1px solid var(--c-input-border)', color: 'var(--foreground)' }}
        />

        {/* Time input */}
        <input
          type="time"
          value={time}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTime(e.target.value)}
          aria-label={t('habitTimeOptional')}
          className="w-full h-11 rounded-xl px-4 text-sm outline-none mb-3 transition-colors"
          style={{ background: 'var(--c-input)', border: '1px solid var(--c-input-border)', color: 'var(--foreground)' }}
        />

        {/* Day schedule toggle */}
        <div className="flex rounded-xl overflow-hidden mb-3" style={{ border: '1px solid var(--c-border)' }}>
          <button
            onClick={() => setAllDays(true)}
            className="flex-1 text-xs py-2 font-medium transition-all"
            style={{
              background: allDays ? accentColor : 'transparent',
              color: allDays ? '#fff' : 'var(--muted-foreground)',
            }}
          >
            {t('everyDay')}
          </button>
          <button
            onClick={() => setAllDays(false)}
            className="flex-1 text-xs py-2 font-medium transition-all"
            style={{
              background: !allDays ? accentColor : 'transparent',
              color: !allDays ? '#fff' : 'var(--muted-foreground)',
            }}
          >
            {t('specificDays')}
          </button>
        </div>

        {/* Day picker */}
        {!allDays && (
          <div className="flex gap-1 mb-3 justify-between">
            {DAY_KEYS.map((key, idx) => {
              const active = selectedDays.includes(idx)
              return (
                <button
                  key={idx}
                  onClick={() => toggleDay(idx)}
                  className="flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95"
                  style={{
                    background: active ? accentColor : 'var(--c-surface-2)',
                    color: active ? '#fff' : 'var(--muted-foreground)',
                    border: `1px solid ${active ? accentColor : 'var(--c-border)'}`,
                  }}
                >
                  {t(key)}
                </button>
              )
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={saving || !name.trim() || (!allDays && selectedDays.length === 0)}
            className="flex-1 h-11 rounded-xl font-semibold text-sm text-white transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ background: 'var(--brand-gradient)', boxShadow: '0 6px 18px var(--c-hero-shadow)' }}
          >
            {saving ? t('saving') : t('save')}
          </button>
          {confirmDelete ? (
            <button
              onClick={deleteHabit}
              disabled={deleting}
              className="h-11 px-4 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50"
              style={{ background: '#ef4444' }}
            >
              {t('deleteConfirm')}
            </button>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="h-11 px-3 rounded-xl transition-all flex items-center justify-center"
              style={{ background: 'var(--secondary)', color: '#ef4444', border: '1px solid #ef444433' }}
              aria-label={t('deleteHabit')}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
