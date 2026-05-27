'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, Grid3X3, CalendarDays, Settings, BookOpen, BarChart2, Plus, X } from 'lucide-react'
import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DOMAINS } from '@/lib/domains'
import { useLang } from '@/lib/lang'
import type { Profile } from '@/types'

interface NavItem {
  icon: LucideIcon
  href: string
  labelHe: string
  labelEn: string
}

// In RTL flex, index 0 appears on the right. These render to the right of the FAB.
const navStart: NavItem[] = [
  { icon: Home,         href: '/dashboard', labelHe: 'בית',      labelEn: 'Home'     },
  { icon: Grid3X3,      href: '/domains',   labelHe: 'תחומים',   labelEn: 'Domains'  },
  { icon: BookOpen,     href: '/reading',   labelHe: 'ספרים',    labelEn: 'Books'    },
]

// These render to the left of the FAB.
const navEnd: NavItem[] = [
  { icon: BarChart2,    href: '/progress',  labelHe: 'התקדמות',  labelEn: 'Progress' },
  { icon: CalendarDays, href: '/schedule',  labelHe: 'לוח',      labelEn: 'Schedule' },
  { icon: Settings,     href: '/settings',  labelHe: 'הגדרות',   labelEn: 'Settings' },
]

export function BottomNav({ profile: _profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isRTL } = useLang()
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

  const renderNavItem = ({ icon: Icon, href, labelHe, labelEn }: NavItem) => {
    const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
    return (
      <button
        key={href}
        onClick={() => router.push(href)}
        className="relative flex flex-col items-center gap-0.5 py-1 rounded-2xl transition-all duration-200 active:scale-90 flex-1 min-w-0"
        style={isActive ? { background: 'var(--c-primary-glow)' } : {}}
      >
        {isActive && (
          <span
            aria-hidden
            className="absolute -top-[3px] left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-full"
            style={{ background: 'var(--brand-gradient)' }}
          />
        )}
        <Icon
          size={19}
          strokeWidth={isActive ? 2.4 : 1.7}
          style={{ color: isActive ? 'var(--primary)' : 'var(--muted-foreground)' }}
        />
        <span
          className="text-[9px] font-semibold leading-tight transition-colors"
          style={{ color: isActive ? 'var(--primary)' : 'var(--muted-foreground)' }}
        >
          {isRTL ? labelHe : labelEn}
        </span>
      </button>
    )
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm md:hidden"
          onClick={reset}
        />
      )}

      {open && (
        <div className="fixed bottom-20 left-0 right-0 z-50 px-4 md:hidden">
          <div
            className="rounded-3xl p-5 shadow-2xl"
            style={{
              background: 'var(--c-fab-sheet)',
              border: '1px solid var(--c-border)',
              boxShadow: '0 20px 60px var(--c-shadow-lg)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
                {step === 'domain'
                  ? isRTL ? 'בחר תחום' : 'Choose domain'
                  : isRTL ? `הרגל ל${selectedDomain?.nameHe}` : `Habit for ${selectedDomain?.nameEn}`}
              </span>
              <button onClick={reset} style={{ color: 'var(--muted-foreground)' }}>
                <X size={18} />
              </button>
            </div>

            {step === 'domain' && (
              <div className="grid grid-cols-4 gap-2">
                {DOMAINS.map((d) => (
                  <button
                    key={d.slug}
                    onClick={() => { setSelectedSlug(d.slug); setStep('name') }}
                    className="flex flex-col items-center gap-1 p-2.5 rounded-2xl active:scale-95 transition-all"
                    style={{
                      background: `linear-gradient(135deg, ${d.color}10, ${d.color}05)`,
                      border: `1px solid ${d.color}25`,
                    }}
                  >
                    <span className="text-xl">{d.icon}</span>
                    <span className="text-[10px] text-center leading-tight font-medium" style={{ color: 'var(--foreground)' }}>
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
                    className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 active:scale-[0.97]"
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
        </div>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 pb-safe md:hidden"
        style={{
          background: 'var(--c-nav)',
          borderTop: '1px solid var(--c-nav-border)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center py-2 px-1 max-w-md mx-auto">
          {navStart.map(renderNavItem)}

          <button
            onClick={() => setOpen(true)}
            className="flex-none mx-1 w-14 h-14 rounded-2xl flex items-center justify-center text-white active:scale-95 transition-all"
            style={{
              background: 'var(--brand-gradient)',
              boxShadow: '0 4px 18px var(--c-hero-shadow)',
            }}
            aria-label={isRTL ? 'הוסף הרגל' : 'Add habit'}
          >
            <Plus size={26} strokeWidth={2.6} />
          </button>

          {navEnd.map(renderNavItem)}
        </div>
      </nav>
    </>
  )
}
