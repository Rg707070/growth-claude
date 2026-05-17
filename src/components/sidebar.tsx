'use client'

import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  Grid3X3,
  BarChart2,
  CalendarDays,
  Settings,
  Plus,
} from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DOMAINS } from '@/lib/domains'
import { useLang } from '@/lib/lang'
import type { Profile } from '@/types'

const navItems = [
  { icon: Home,         href: '/dashboard', labelHe: 'בית',     labelEn: 'Home'     },
  { icon: Grid3X3,      href: '/domains',   labelHe: 'תחומים',  labelEn: 'Domains'  },
  { icon: CalendarDays, href: '/schedule',  labelHe: 'לוז',     labelEn: 'Schedule' },
  { icon: BarChart2,    href: '/progress',  labelHe: 'התקדמות', labelEn: 'Progress' },
  { icon: Settings,     href: '/settings',  labelHe: 'הגדרות',  labelEn: 'Settings' },
]

const LEVELS: { min: number; emoji: string; he: string; en: string }[] = [
  { min: 0,    emoji: '👁️', he: 'זהירות',    en: 'Watchfulness' },
  { min: 100,  emoji: '⚡', he: 'זריזות',    en: 'Alacrity'     },
  { min: 250,  emoji: '✨', he: 'נקיות',     en: 'Cleanliness'  },
  { min: 500,  emoji: '🌿', he: 'פרישות',    en: 'Separation'   },
  { min: 800,  emoji: '💧', he: 'טהרה',      en: 'Purity'       },
  { min: 1200, emoji: '❤️', he: 'חסידות',    en: 'Piety'        },
  { min: 1700, emoji: '🕊️', he: 'ענווה',     en: 'Humility'     },
  { min: 2300, emoji: '🌟', he: 'יראת חטא',  en: 'Fear of Sin'  },
  { min: 3000, emoji: '👑', he: 'קדושה',     en: 'Holiness'     },
]

function getLevel(xp: number) {
  let level = LEVELS[0]
  for (const l of LEVELS) if (xp >= l.min) level = l
  return level
}

interface SidebarProps {
  profile: Profile
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isRTL } = useLang()
  const [addOpen, setAddOpen] = useState(false)
  const [step, setStep] = useState<'domain' | 'name'>('domain')
  const [selectedSlug, setSelectedSlug] = useState('')
  const [habitName, setHabitName] = useState('')
  const [saving, setSaving] = useState(false)

  const level = getLevel(profile.xp)
  const displayName = profile.full_name?.split(' ')[0] ?? (isRTL ? 'משתמש' : 'User')

  const resetAdd = () => {
    setAddOpen(false)
    setStep('domain')
    setSelectedSlug('')
    setHabitName('')
  }

  const saveHabit = async () => {
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
    resetAdd()
    router.refresh()
  }

  const selectedDomain = DOMAINS.find((d) => d.slug === selectedSlug)

  return (
    <>
      <aside
        className="hidden md:flex fixed inset-y-0 start-0 z-40 w-64 flex-col"
        style={{
          background: 'var(--c-nav)',
          borderInlineEnd: '1px solid var(--c-nav-border)',
          backdropFilter: 'blur(24px)',
        }}
      >
        {/* Logo */}
        <div className="px-6 pt-8 pb-6">
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-black"
              style={{
                background: 'linear-gradient(135deg, var(--c-hero-start), var(--c-hero-end))',
                color: 'white',
                boxShadow: '0 0 16px var(--c-primary-glow)',
              }}
            >
              G
            </div>
            <span className="text-lg font-black" style={{ color: 'var(--foreground)' }}>
              GROWTH
            </span>
          </div>
        </div>

        {/* Profile card */}
        <div className="px-4 pb-4">
          <div
            className="rounded-2xl p-3"
            style={{
              background: 'var(--c-surface-2)',
              border: '1px solid var(--c-border)',
            }}
          >
            <p className="text-sm font-bold truncate" style={{ color: 'var(--foreground)' }}>
              {displayName}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-base leading-none">{level.emoji}</span>
              <span className="text-[11px] font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                {isRTL ? level.he : level.en}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
              <span className="font-semibold">{profile.xp} XP</span>
              {profile.current_streak > 0 && (
                <span className="font-semibold">🔥 {profile.current_streak}</span>
              )}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3">
          <ul className="space-y-1">
            {navItems.map(({ icon: Icon, href, labelHe, labelEn }) => {
              const isActive =
                pathname === href ||
                (href !== '/dashboard' && pathname.startsWith(href))
              return (
                <li key={href}>
                  <button
                    onClick={() => router.push(href)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 hover:bg-white/5"
                    style={isActive ? {
                      background: 'var(--c-primary-glow)',
                      color: 'var(--primary)',
                    } : {
                      color: 'var(--muted-foreground)',
                    }}
                  >
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
                    <span className="text-sm font-semibold">
                      {isRTL ? labelHe : labelEn}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Add habit button */}
        <div className="px-4 pb-6">
          <button
            onClick={() => setAddOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-95"
            style={{
              background: 'linear-gradient(135deg, var(--c-hero-start), var(--c-hero-end))',
              color: 'white',
              boxShadow: '0 4px 16px var(--c-primary-glow)',
            }}
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>{isRTL ? 'הוסף הרגל' : 'Add habit'}</span>
          </button>
        </div>
      </aside>

      {/* Add habit modal (desktop) */}
      {addOpen && (
        <div
          className="hidden md:flex fixed inset-0 z-[60] items-center justify-center p-4"
          onClick={resetAdd}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl p-5 shadow-2xl"
            style={{ background: 'var(--c-fab-sheet)', border: '1px solid var(--c-border)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-white font-semibold text-sm">
                {step === 'domain'
                  ? isRTL ? 'בחר תחום' : 'Choose domain'
                  : isRTL ? `הרגל ל${selectedDomain?.nameHe}` : `Habit for ${selectedDomain?.nameEn}`}
              </span>
              <button onClick={resetAdd} className="text-white/40 hover:text-white text-xl leading-none">
                ×
              </button>
            </div>

            {step === 'domain' && (
              <div className="grid grid-cols-4 gap-2">
                {DOMAINS.map((d) => (
                  <button
                    key={d.slug}
                    onClick={() => { setSelectedSlug(d.slug); setStep('name') }}
                    className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all border border-white/8"
                  >
                    <span className="text-2xl">{d.icon}</span>
                    <span className="text-[10px] text-white/60 text-center leading-tight">
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
                  onKeyDown={(e) => e.key === 'Enter' && saveHabit()}
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
                    onClick={saveHabit}
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
    </>
  )
}
