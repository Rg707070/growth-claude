'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DOMAINS } from '@/lib/domains'
import { HABIT_TEMPLATES, type HabitTemplate } from '@/lib/habit-templates'
import { useLang } from '@/lib/lang'
import { useToast } from '@/components/ui/toast'
import { GrowthLogo } from '@/components/growth-logo'

const PRESET_COLORS = [
  '#4F46E5', '#0EA5E9', '#0F766E', '#059669',
  '#65A30D', '#0891B2', '#7C3AED', '#DB2777',
]

export function OnboardingFlow({ userId, fullName }: { userId: string; fullName: string | null }) {
  const router = useRouter()
  const { t, lang, isRTL } = useLang()
  const { toast } = useToast()
  const [step, setStep] = useState(0)
  const [added, setAdded] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)

  // Domain selection state
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set())
  const [showCustom, setShowCustom] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customIcon, setCustomIcon] = useState('⭐')
  const [customColor, setCustomColor] = useState('#4F46E5')
  const [customDomains, setCustomDomains] = useState<{ name: string; icon: string; color: string }[]>([])

  const totalSteps = 3

  const toggleDomain = (slug: string) => {
    setSelectedDomains((prev: Set<string>) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  const addCustomDomain = () => {
    if (!customName.trim()) return
    setCustomDomains((prev: { name: string; icon: string; color: string }[]) => [
      ...prev,
      { name: customName.trim(), icon: customIcon, color: customColor },
    ])
    setCustomName('')
    setCustomIcon('⭐')
    setCustomColor('#4F46E5')
    setShowCustom(false)
  }

  const removeCustom = (i: number) => {
    setCustomDomains((prev: { name: string; icon: string; color: string }[]) =>
      prev.filter((_: { name: string; icon: string; color: string }, idx: number) => idx !== i)
    )
  }

  const saveDomains = async () => {
    const supabase = createClient()
    const rows: { user_id: string; slug: string; name: string; icon: string; color: string; sort_order: number }[] = []

    let order = 0
    for (const slug of selectedDomains) {
      const d = DOMAINS.find((x) => x.slug === slug)
      if (!d) continue
      rows.push({
        user_id: userId,
        slug: d.slug,
        name: lang === 'he' ? d.nameHe : d.nameEn,
        icon: d.icon,
        color: d.color,
        sort_order: order++,
      })
    }
    for (const cd of customDomains) {
      const slug = cd.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-֐-׿]/g, '') || `domain-${Date.now()}`
      rows.push({
        user_id: userId,
        slug,
        name: cd.name,
        icon: cd.icon,
        color: cd.color,
        sort_order: order++,
      })
    }

    if (rows.length > 0) {
      const { error } = await supabase.from('user_domains').insert(rows)
      if (error) throw error
    }
  }

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
      setAdded((p: Set<string>) => new Set([...p, key]))
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
      await saveDomains()
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

  const goNext = async () => {
    if (step === 1) {
      // Save domains before going to habits step
      if (selectedDomains.size === 0 && customDomains.length === 0) {
        // Skip domain saving, just advance
        setStep((s: number) => s + 1)
        return
      }
    }
    setStep((s: number) => s + 1)
  }

  // Domains available for habit templates: selected preset + custom
  const habitDomainSlugs = [...selectedDomains, ...customDomains.map((_: { name: string; icon: string; color: string }, i: number) => `__custom_${i}`)]
  const domainsForHabits = [
    ...DOMAINS.filter((d) => selectedDomains.has(d.slug)),
  ]

  const PRESET_EMOJIS = ['⭐', '🎯', '💪', '📚', '🎵', '💰', '🏃', '🧘', '✍️', '🌱', '🔥', '❤️']

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

        {/* Step 0: Welcome */}
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

        {/* Step 1: Choose domains */}
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

            {/* Preset domain chips */}
            <div className="grid grid-cols-2 gap-2.5">
              {DOMAINS.map((d) => {
                const isSelected = selectedDomains.has(d.slug)
                return (
                  <button
                    key={d.slug}
                    onClick={() => toggleDomain(d.slug)}
                    className="rounded-2xl p-3.5 flex items-center gap-2.5 transition-all active:scale-95"
                    style={{
                      background: isSelected ? `${d.color}22` : 'var(--c-surface-2)',
                      border: isSelected ? `1.5px solid ${d.color}` : '1px solid var(--c-border)',
                    }}
                  >
                    <span className="text-2xl">{d.icon}</span>
                    <span className="text-sm font-semibold flex-1 text-start" style={{ color: 'var(--foreground)' }}>
                      {lang === 'he' ? d.nameHe : d.nameEn}
                    </span>
                    {isSelected && <Check size={14} style={{ color: d.color, flexShrink: 0 }} />}
                  </button>
                )
              })}
            </div>

            {/* Custom domains added */}
            {customDomains.map((cd: { name: string; icon: string; color: string }, i: number) => (
              <div
                key={i}
                className="rounded-2xl p-3 flex items-center gap-2.5"
                style={{ background: `${cd.color}22`, border: `1.5px solid ${cd.color}` }}
              >
                <span className="text-xl">{cd.icon}</span>
                <span className="text-sm font-semibold flex-1" style={{ color: 'var(--foreground)' }}>{cd.name}</span>
                <button onClick={() => removeCustom(i)} style={{ color: 'var(--muted-foreground)' }}>
                  <X size={14} />
                </button>
              </div>
            ))}

            {/* Add custom domain */}
            {showCustom ? (
              <div
                className="rounded-2xl p-3 space-y-2.5"
                style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}
              >
                <input
                  autoFocus
                  value={customName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomName(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && addCustomDomain()}
                  placeholder={isRTL ? 'שם התחום...' : 'Domain name...'}
                  className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                  style={{
                    background: 'var(--c-input)',
                    border: '1px solid var(--c-input-border)',
                    color: 'var(--foreground)',
                  }}
                />
                <div className="flex flex-wrap gap-1">
                  {PRESET_EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setCustomIcon(e)}
                      className="w-8 h-8 rounded-lg text-base transition-all"
                      style={{
                        background: customIcon === e ? `${customColor}22` : 'var(--c-surface-2)',
                        border: customIcon === e ? `1.5px solid ${customColor}` : '1px solid var(--c-border)',
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCustomColor(c)}
                      className="w-6 h-6 rounded-full"
                      style={{ background: c, outline: customColor === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }}
                    />
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setShowCustom(false)}
                    className="flex-1 py-2 rounded-xl text-xs"
                    style={{ background: 'var(--c-surface-2)', color: 'var(--muted-foreground)' }}
                  >
                    {isRTL ? 'ביטול' : 'Cancel'}
                  </button>
                  <button
                    onClick={addCustomDomain}
                    disabled={!customName.trim()}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-50"
                    style={{ background: 'var(--brand-gradient)' }}
                  >
                    {isRTL ? 'הוסף' : 'Add'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCustom(true)}
                className="flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm transition-all active:scale-95"
                style={{
                  background: 'var(--c-surface-2)',
                  border: '1.5px dashed var(--c-border)',
                  color: 'var(--muted-foreground)',
                }}
              >
                <Plus size={15} />
                {isRTL ? 'הוסף תחום מותאם אישית' : 'Add custom domain'}
              </button>
            )}
          </div>
        )}

        {/* Step 2: Pick habits */}
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
              {domainsForHabits.map((d) => {
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
              {domainsForHabits.length === 0 && (
                <p className="text-sm text-center py-4" style={{ color: 'var(--muted-foreground)' }}>
                  {isRTL ? 'בחר תחומים בשלב הקודם כדי לראות הצעות.' : 'Select domains in the previous step to see suggestions.'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Footer nav */}
        <div className="flex items-center gap-3 pt-2">
          {step > 0 && (
            <button
              onClick={() => setStep((s: number) => s - 1)}
              disabled={busy}
              className="flex-1 h-12 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50"
              style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', color: 'var(--foreground)' }}
            >
              {t('back')}
            </button>
          )}
          {step < totalSteps - 1 ? (
            <button
              onClick={goNext}
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
