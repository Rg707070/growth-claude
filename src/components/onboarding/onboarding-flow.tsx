'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DOMAINS } from '@/lib/domains'
import { HABIT_TEMPLATES, type HabitTemplate } from '@/lib/habit-templates'
import { useLang } from '@/lib/lang'
import { useToast } from '@/components/ui/toast'
import { GrowthLogo } from '@/components/growth-logo'

export function OnboardingFlow({ userId, fullName }: { userId: string; fullName: string | null }) {
  const router = useRouter()
  const { t, lang } = useLang()
  const { toast } = useToast()
  const [step, setStep] = useState(0)
  const [added, setAdded] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)

  const totalSteps = 3

  const addTemplate = async (slug: string, tmpl: HabitTemplate, key: string) => {
    if (added.has(key) || busy) return
    setBusy(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('habits').insert({
        user_id: userId,
        domain_slug: slug,
        name: lang === 'he' ? tmpl.he : tmpl.en,
        frequency: 'daily',
      })
      if (error) throw error
      setAdded((p) => new Set([...p, key]))
    } catch {
      toast(t('saveFailed'), 'error')
    } finally {
      setBusy(false)
    }
  }

  const finish = async () => {
    if (busy) return
    setBusy(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_complete: true })
        .eq('id', userId)
      if (error) throw error
      router.refresh()
    } catch {
      setBusy(false)
      toast(t('saveFailed'), 'error')
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto flex flex-col items-center justify-start py-10 px-5"
      style={{ background: 'var(--background)' }}
    >
      <div className="w-full max-w-md flex flex-col gap-6 animate-fade-up">
        {/* Progress dots + skip */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <span
                key={i}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: i === step ? '1.5rem' : '0.5rem',
                  background: i <= step ? 'var(--primary)' : 'var(--c-border)',
                }}
              />
            ))}
          </div>
          <button
            onClick={finish}
            disabled={busy}
            className="text-xs font-medium disabled:opacity-50"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {t('onbSkip')}
          </button>
        </div>

        {step === 0 && (
          <div className="flex flex-col items-center text-center gap-4 pt-6">
            <GrowthLogo variant="icon" size={84} />
            <h1 className="text-2xl font-black brand-gradient-text">
              {t('onbWelcomeTitle')}
            </h1>
            {fullName && (
              <p className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                {fullName} 👋
              </p>
            )}
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {t('onbWelcomeBody')}
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--foreground)' }}>
                {t('onbDomainsTitle')}
              </h2>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {t('onbDomainsBody')}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {DOMAINS.map((d) => (
                <div
                  key={d.slug}
                  className="rounded-2xl p-3.5 flex items-center gap-2.5"
                  style={{ background: `${d.color}14`, border: `1px solid ${d.color}33` }}
                >
                  <span className="text-2xl">{d.icon}</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                    {lang === 'he' ? d.nameHe : d.nameEn}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--foreground)' }}>
                {t('onbHabitsTitle')}
              </h2>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {t('onbHabitsBody')}
              </p>
            </div>
            <div className="flex flex-col gap-4">
              {DOMAINS.map((d) => {
                const tmpls = HABIT_TEMPLATES[d.slug] ?? []
                if (tmpls.length === 0) return null
                return (
                  <div key={d.slug}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">{d.icon}</span>
                      <span className="text-xs font-bold" style={{ color: d.color }}>
                        {lang === 'he' ? d.nameHe : d.nameEn}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tmpls.map((tmpl, i) => {
                        const key = `${d.slug}:${i}`
                        const isAdded = added.has(key)
                        return (
                          <button
                            key={key}
                            onClick={() => addTemplate(d.slug, tmpl, key)}
                            disabled={isAdded || busy}
                            className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 transition-all active:scale-95"
                            style={{
                              background: isAdded ? `${d.color}22` : 'var(--c-surface-2)',
                              border: `1px solid ${isAdded ? d.color : 'var(--c-border)'}`,
                              color: isAdded ? d.color : 'var(--foreground)',
                            }}
                          >
                            {isAdded ? <Check size={13} /> : <span>+</span>}
                            {lang === 'he' ? tmpl.he : tmpl.en}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer nav */}
        <div className="flex items-center gap-3 pt-2">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              disabled={busy}
              className="flex-1 h-12 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50"
              style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', color: 'var(--foreground)' }}
            >
              {t('back')}
            </button>
          )}
          {step < totalSteps - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="flex-1 h-12 rounded-xl font-semibold text-sm text-white transition-all active:scale-[0.98] hover:shadow-lg"
              style={{ background: 'var(--brand-gradient)', boxShadow: '0 6px 18px var(--c-hero-shadow)' }}
            >
              {t('onbNext')}
            </button>
          ) : (
            <button
              onClick={finish}
              disabled={busy}
              className="flex-1 h-12 rounded-xl font-semibold text-sm text-white transition-all active:scale-[0.98] hover:shadow-lg disabled:opacity-50"
              style={{ background: 'var(--brand-gradient)', boxShadow: '0 6px 18px var(--c-hero-shadow)' }}
            >
              {t('onbFinish')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
