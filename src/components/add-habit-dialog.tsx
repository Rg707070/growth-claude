'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DOMAINS } from '@/lib/domains'
import { useLang } from '@/lib/lang'

interface AddHabitDialogProps {
  /** 'modal' = centered overlay (desktop sidebar). 'sheet' = bottom sheet (mobile nav). */
  variant: 'modal' | 'sheet'
  onClose: () => void
}

export function AddHabitDialog({ variant, onClose }: AddHabitDialogProps) {
  const router = useRouter()
  const { isRTL } = useLang()
  const [step, setStep] = useState<'domain' | 'name'>('domain')
  const [selectedSlug, setSelectedSlug] = useState('')
  const [habitName, setHabitName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const selectedDomain = DOMAINS.find((d) => d.slug === selectedSlug)

  const saveHabit = async () => {
    if (!habitName.trim() || !selectedSlug) return
    setSaving(true)
    setSaveError(null)
    try {
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        setSaveError(isRTL ? 'שגיאת אימות — התחבר מחדש' : 'Auth error — please log in again')
        setSaving(false)
        return
      }
      const { error } = await supabase.from('habits').insert({
        user_id: user.id,
        domain_slug: selectedSlug,
        name: habitName.trim(),
        frequency: 'daily',
        is_active: true,
      })
      if (error) {
        setSaveError(isRTL ? 'שגיאה בשמירה — נסה שוב' : 'Save failed — try again')
        setSaving(false)
        return
      }
      setSaving(false)
      onClose()
      router.refresh()
    } catch {
      setSaveError(isRTL ? 'שגיאה — נסה שוב' : 'Error — try again')
      setSaving(false)
    }
  }

  const formInner = (
    <div
      className={variant === 'modal' ? 'relative w-full max-w-md rounded-2xl p-5 shadow-2xl' : 'rounded-3xl p-5'}
      style={{
        background: 'var(--c-fab-sheet)',
        border: '1px solid var(--c-border)',
        ...(variant === 'sheet' && { boxShadow: '0 20px 60px var(--c-shadow-lg)' }),
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
          {step === 'domain'
            ? isRTL ? 'בחר תחום' : 'Choose domain'
            : isRTL ? `הרגל ל${selectedDomain?.nameHe}` : `Habit for ${selectedDomain?.nameEn}`}
        </span>
        <button
          onClick={onClose}
          className="transition-opacity duration-150 hover:opacity-70 active:opacity-50"
          style={{ color: 'var(--muted-foreground)' }}
          aria-label={isRTL ? 'סגור' : 'Close'}
        >
          <X size={18} />
        </button>
      </div>

      {step === 'domain' && (
        <div className="grid grid-cols-4 gap-2">
          {DOMAINS.map((d) => (
            <button
              key={d.slug}
              onClick={() => { setSelectedSlug(d.slug); setStep('name') }}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl active:scale-95 transition-all duration-150 hover:-translate-y-0.5"
              style={{
                background: `linear-gradient(135deg, ${d.color}10, ${d.color}05)`,
                border: `1px solid ${d.color}25`,
              }}
            >
              <span className="text-2xl">{d.icon}</span>
              <span
                className="text-[10px] text-center leading-tight font-medium"
                style={{ color: 'var(--foreground)' }}
              >
                {isRTL ? d.nameHe : d.nameEn}
              </span>
            </button>
          ))}
        </div>
      )}

      {step === 'name' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{selectedDomain?.icon}</span>
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {isRTL ? selectedDomain?.nameHe : selectedDomain?.nameEn}
            </span>
          </div>
          <input
            autoFocus
            value={habitName}
            onChange={(e) => setHabitName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveHabit()}
            placeholder={isRTL ? 'שם ההרגל...' : 'Habit name...'}
            className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
            style={{
              background: 'var(--c-input)',
              border: '1px solid var(--c-input-border)',
              color: 'var(--foreground)',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--ring)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--c-input-border)')}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
          {saveError && (
            <p className="text-red-400 text-xs text-center">{saveError}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setStep('domain')}
              className="flex-1 py-2.5 rounded-xl text-sm transition-colors duration-150"
              style={{
                background: 'var(--secondary)',
                color: 'var(--muted-foreground)',
                border: '1px solid var(--border)',
              }}
            >
              {isRTL ? 'חזור' : 'Back'}
            </button>
            <button
              onClick={saveHabit}
              disabled={!habitName.trim() || saving}
              className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white transition-all duration-150 disabled:opacity-50 active:scale-[0.97]"
              style={{
                background: 'var(--brand-gradient)',
                boxShadow: '0 4px 12px var(--c-hero-shadow)',
              }}
            >
              {saving ? '...' : isRTL ? 'שמור' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  )

  if (variant === 'modal') {
    return (
      <div
        className="hidden md:flex fixed inset-0 z-[60] items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        {formInner}
      </div>
    )
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm md:hidden"
        onClick={onClose}
      />
      <div className="fixed bottom-24 left-0 right-0 z-50 px-4 md:hidden animate-fade-up">
        {formInner}
      </div>
    </>
  )
}
