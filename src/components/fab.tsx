'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DOMAINS } from '@/lib/domains'
import { useLang } from '@/lib/lang'

export function FAB() {
  const { isRTL } = useLang()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'domain' | 'name'>('domain')
  const [selectedSlug, setSelectedSlug] = useState('')
  const [habitName, setHabitName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const reset = () => {
    setOpen(false)
    setStep('domain')
    setSelectedSlug('')
    setHabitName('')
    setSaveError(null)
  }

  const pickDomain = (slug: string) => {
    setSelectedSlug(slug)
    setStep('name')
  }

  const save = async () => {
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
        xp_reward: 10,
        is_active: true,
      })
      if (error) {
        setSaveError(isRTL ? 'שגיאה בשמירה — נסה שוב' : 'Save failed — try again')
        setSaving(false)
        return
      }
      setSaving(false)
      reset()
      router.refresh()
    } catch {
      setSaveError(isRTL ? 'שגיאה — נסה שוב' : 'Error — try again')
      setSaving(false)
    }
  }

  const selectedDomain = DOMAINS.find((d) => d.slug === selectedSlug)

  return (
    <>
      {/* Sheet backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm md:hidden"
          onClick={reset}
        />
      )}

      {/* Slide-up sheet */}
      {open && (
        <div className="fixed bottom-20 left-0 right-0 z-50 px-4 md:hidden">
          <div
            className="rounded-2xl p-5 shadow-xl"
            style={{ background: 'var(--c-fab-sheet)', border: '1px solid var(--c-border)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
                {step === 'domain'
                  ? isRTL ? 'בחר תחום' : 'Choose domain'
                  : isRTL ? `הרגל ל${selectedDomain?.nameHe}` : `Habit for ${selectedDomain?.nameEn}`}
              </span>
              <button
                onClick={reset}
                className="transition-colors"
                style={{ color: 'var(--muted-foreground)' }}
              >
                <X size={18} />
              </button>
            </div>

            {step === 'domain' && (
              <div className="grid grid-cols-4 gap-2">
                {DOMAINS.map((d) => (
                  <button
                    key={d.slug}
                    onClick={() => pickDomain(d.slug)}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl active:scale-95 transition-all"
                    style={{
                      background: 'var(--secondary)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <span className="text-xl">{d.icon}</span>
                    <span className="text-[10px] text-center leading-tight" style={{ color: 'var(--muted-foreground)' }}>
                      {isRTL ? d.nameHe : d.nameEn}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {step === 'name' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{selectedDomain?.icon}</span>
                  <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    {isRTL ? selectedDomain?.nameHe : selectedDomain?.nameEn}
                  </span>
                </div>
                <input
                  autoFocus
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && save()}
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
                    className="flex-1 py-2.5 rounded-xl text-sm transition-colors"
                    style={{
                      background: 'var(--secondary)',
                      color: 'var(--muted-foreground)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {isRTL ? 'חזור' : 'Back'}
                  </button>
                  <button
                    onClick={save}
                    disabled={!habitName.trim() || saving}
                    className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
                    style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                  >
                    {saving ? '...' : isRTL ? 'שמור' : 'Save'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-5 z-50 w-14 h-14 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform md:hidden"
        style={{
          background: 'var(--primary)',
          color: 'var(--primary-foreground)',
          boxShadow: '0 4px 12px var(--c-shadow-lg)',
        }}
        aria-label={isRTL ? 'הוסף הרגל' : 'Add habit'}
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>
    </>
  )
}
