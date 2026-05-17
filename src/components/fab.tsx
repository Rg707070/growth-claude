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

  const reset = () => {
    setOpen(false)
    setStep('domain')
    setSelectedSlug('')
    setHabitName('')
  }

  const pickDomain = (slug: string) => {
    setSelectedSlug(slug)
    setStep('name')
  }

  const save = async () => {
    if (!habitName.trim() || !selectedSlug) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('habits').insert({
        user_id: user.id,
        domain_slug: selectedSlug,
        name: habitName.trim(),
        frequency: 'daily',
        xp_reward: 10,
        is_active: true,
      })
    }
    setSaving(false)
    reset()
    router.refresh()
  }

  const selectedDomain = DOMAINS.find((d) => d.slug === selectedSlug)

  return (
    <>
      {/* Sheet backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm md:hidden"
          onClick={reset}
        />
      )}

      {/* Slide-up sheet */}
      {open && (
        <div className="fixed bottom-20 left-0 right-0 z-50 px-4 md:hidden">
          <div className="rounded-2xl p-5 shadow-2xl" style={{ background: 'var(--c-fab-sheet)', border: '1px solid var(--c-border)' }}>
            {/* Close */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-white font-semibold text-sm">
                {step === 'domain'
                  ? isRTL ? 'בחר תחום' : 'Choose domain'
                  : isRTL ? `הרגל ל${selectedDomain?.nameHe}` : `Habit for ${selectedDomain?.nameEn}`}
              </span>
              <button onClick={reset} className="text-white/40 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {step === 'domain' && (
              <div className="grid grid-cols-4 gap-2">
                {DOMAINS.map((d) => (
                  <button
                    key={d.slug}
                    onClick={() => pickDomain(d.slug)}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all border border-white/8"
                  >
                    <span className="text-2xl">{d.icon}</span>
                    <span className="text-[9px] text-white/60 text-center leading-tight">
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
                  <span className="text-sm text-white/60">
                    {isRTL ? selectedDomain?.nameHe : selectedDomain?.nameEn}
                  </span>
                </div>
                <input
                  autoFocus
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && save()}
                  placeholder={isRTL ? 'שם ההרגל...' : 'Habit name...'}
                  className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50"
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setStep('domain')}
                    className="flex-1 py-2.5 rounded-xl bg-white/8 text-white/60 text-sm hover:bg-white/15 transition-colors"
                  >
                    {isRTL ? 'חזור' : 'Back'}
                  </button>
                  <button
                    onClick={save}
                    disabled={!habitName.trim() || saving}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-400 disabled:opacity-50 transition-colors"
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
        className="fixed bottom-24 right-5 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-[0_0_20px_rgba(52,211,153,0.4)] flex items-center justify-center animate-fab-ring hover:scale-110 active:scale-95 transition-transform md:hidden"
        aria-label={isRTL ? 'הוסף הרגל' : 'Add habit'}
      >
        <Plus size={24} className="text-white" strokeWidth={2.5} />
      </button>
    </>
  )
}
