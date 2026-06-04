'use client'

import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  Grid3X3,
  CalendarDays,
  Settings,
  Plus,
  X,
  BookOpen,
  NotebookPen,
  LogOut,
  Sun,
  Moon,
  Languages,
} from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DOMAINS } from '@/lib/domains'
import { useLang } from '@/lib/lang'
import { useTheme } from '@/lib/theme'
import { GrowthLogo } from '@/components/growth-logo'
import type { Profile } from '@/types'

const navItems = [
  { icon: Home,         href: '/dashboard', labelHe: 'בית',     labelEn: 'Home'     },
  { icon: Grid3X3,      href: '/domains',   labelHe: 'תחומים',  labelEn: 'Domains'  },
  { icon: BookOpen,     href: '/reading',   labelHe: 'ספרים',   labelEn: 'Books'    },
  { icon: NotebookPen,  href: '/journal',   labelHe: 'יומן',    labelEn: 'Journal'  },
  { icon: CalendarDays, href: '/schedule',  labelHe: 'לו"ז',    labelEn: 'Schedule' },
  { icon: Settings,     href: '/settings',  labelHe: 'הגדרות',  labelEn: 'Settings' },
]

interface SidebarProps {
  profile: Profile
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isRTL, lang, toggleLang } = useLang()
  const { theme, toggleTheme } = useTheme()
  const [addOpen, setAddOpen] = useState(false)
  const [step, setStep] = useState<'domain' | 'name'>('domain')
  const [selectedSlug, setSelectedSlug] = useState('')
  const [habitName, setHabitName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const displayName = profile.full_name?.split(' ')[0] ?? (isRTL ? 'משתמש' : 'User')

  const resetAdd = () => {
    setAddOpen(false)
    setStep('domain')
    setSelectedSlug('')
    setHabitName('')
    setSaveError(null)
  }

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
      resetAdd()
      router.refresh()
    } catch {
      setSaveError(isRTL ? 'שגיאה — נסה שוב' : 'Error — try again')
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const selectedDomain = DOMAINS.find((d) => d.slug === selectedSlug)
  const activeDomainSlug = pathname.startsWith('/domain/') ? pathname.split('/')[2] : null

  return (
    <>
      <aside
        className="hidden md:flex fixed inset-y-0 start-0 z-40 w-72 xl:w-80 flex-col"
        style={{
          background: 'var(--c-nav)',
          borderInlineEnd: '1px solid var(--c-nav-border)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Logo */}
        <div className="px-6 pt-7 pb-5 border-b" style={{ borderColor: 'var(--c-nav-border)' }}>
          <GrowthLogo size={34} />
        </div>

        {/* Profile card */}
        <div className="px-4 py-4">
          <div
            className="rounded-2xl p-3.5 flex items-center gap-3"
            style={{
              background: 'var(--c-surface-2)',
              border: '1px solid var(--c-border)',
            }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 select-none"
              style={{ background: 'var(--brand-gradient)' }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                {displayName}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                {isRTL ? 'מחובר' : 'Signed in'}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable middle area: nav + domain shortcuts */}
        <div className="flex-1 overflow-y-auto px-3 pb-2">
          {/* Primary nav */}
          <p
            className="px-3 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {isRTL ? 'ניווט' : 'Navigation'}
          </p>
          <nav>
            <ul className="space-y-0.5">
              {navItems.map(({ icon: Icon, href, labelHe, labelEn }) => {
                const isActive =
                  pathname === href ||
                  (href !== '/dashboard' && pathname.startsWith(href))
                return (
                  <li key={href}>
                    <button
                      onClick={() => router.push(href)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                      style={isActive ? {
                        background: 'var(--c-primary-glow)',
                        color: 'var(--primary)',
                      } : {
                        color: 'var(--muted-foreground)',
                      }}
                    >
                      <Icon size={18} strokeWidth={isActive ? 2.5 : 1.75} />
                      <span className="text-sm font-medium">
                        {isRTL ? labelHe : labelEn}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Domain shortcuts */}
          <p
            className="px-3 pt-5 pb-2 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {isRTL ? 'תחומים' : 'Domains'}
          </p>
          <ul className="space-y-0.5">
            {DOMAINS.map((d) => {
              const isActive = activeDomainSlug === d.slug
              return (
                <li key={d.slug}>
                  <button
                    onClick={() => router.push(`/domain/${d.slug}`)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] group"
                    style={isActive ? {
                      background: `${d.color}15`,
                    } : {}}
                  >
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[14px] flex-shrink-0 transition-transform group-hover:scale-110"
                      style={{
                        background: `${d.color}1f`,
                        border: `1px solid ${d.color}30`,
                      }}
                    >
                      {d.icon}
                    </span>
                    <span
                      className="text-[13px] font-medium truncate"
                      style={isActive
                        ? { color: d.color }
                        : { color: 'var(--foreground)' }}
                    >
                      {isRTL ? d.nameHe : d.nameEn}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Footer: add habit + utilities */}
        <div className="px-4 pt-3 pb-5 border-t space-y-3" style={{ borderColor: 'var(--c-nav-border)' }}>
          <button
            onClick={() => setAddOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm text-white transition-all hover:opacity-95 hover:shadow-lg active:scale-[0.97]"
            style={{
              background: 'var(--brand-gradient)',
              boxShadow: '0 4px 14px var(--c-hero-shadow)',
            }}
          >
            <Plus size={16} strokeWidth={2.6} />
            <span>{isRTL ? 'הוסף הרגל' : 'Add habit'}</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleTheme}
              aria-label={isRTL ? 'מצב תצוגה' : 'Toggle theme'}
              title={isRTL ? 'מצב תצוגה' : 'Toggle theme'}
              className="flex-1 flex items-center justify-center py-2 rounded-xl transition-all hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
              style={{
                border: '1px solid var(--c-border)',
                color: 'var(--muted-foreground)',
              }}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button
              onClick={toggleLang}
              aria-label={isRTL ? 'שפה' : 'Language'}
              title={isRTL ? 'שפה' : 'Language'}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
              style={{
                border: '1px solid var(--c-border)',
                color: 'var(--muted-foreground)',
              }}
            >
              <Languages size={14} />
              <span className="text-[11px] font-semibold">
                {lang === 'he' ? 'EN' : 'עב'}
              </span>
            </button>
            <button
              onClick={handleLogout}
              aria-label={isRTL ? 'התנתק' : 'Sign out'}
              title={isRTL ? 'התנתק' : 'Sign out'}
              className="flex-1 flex items-center justify-center py-2 rounded-xl transition-all hover:bg-red-500/10"
              style={{
                border: '1px solid var(--c-border)',
                color: 'var(--muted-foreground)',
              }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Add habit modal (desktop) */}
      {addOpen && (
        <div
          className="hidden md:flex fixed inset-0 z-[60] items-center justify-center p-4"
          onClick={resetAdd}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl p-5 shadow-2xl"
            style={{ background: 'var(--c-fab-sheet)', border: '1px solid var(--c-border)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
                {step === 'domain'
                  ? isRTL ? 'בחר תחום' : 'Choose domain'
                  : isRTL ? `הרגל ל${selectedDomain?.nameHe}` : `Habit for ${selectedDomain?.nameEn}`}
              </span>
              <button
                onClick={resetAdd}
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
                    onClick={() => { setSelectedSlug(d.slug); setStep('name') }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-2xl active:scale-95 transition-all hover:-translate-y-0.5"
                    style={{
                      background: `linear-gradient(135deg, ${d.color}10, ${d.color}05)`,
                      border: `1px solid ${d.color}25`,
                    }}
                  >
                    <span className="text-2xl">{d.icon}</span>
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
                    onClick={saveHabit}
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
    </>
  )
}
