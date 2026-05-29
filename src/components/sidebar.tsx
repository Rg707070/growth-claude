'use client'

import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  Grid3X3,
  CalendarDays,
  Settings,
  Plus,
  BookOpen,
  NotebookPen,
} from 'lucide-react'
import { useState } from 'react'
import { useLang } from '@/lib/lang'
import { GrowthLogo } from '@/components/growth-logo'
import { AddHabitDialog } from '@/components/add-habit-dialog'
import type { Profile } from '@/types'

const navItems = [
  { icon: Home,         href: '/dashboard', labelHe: 'בית',     labelEn: 'Home'     },
  { icon: Grid3X3,      href: '/domains',   labelHe: 'תחומים',  labelEn: 'Domains'  },
  { icon: BookOpen,     href: '/reading',   labelHe: 'ספרים',   labelEn: 'Books'    },
  { icon: NotebookPen,  href: '/journal',   labelHe: 'יומן',    labelEn: 'Journal'  },
  { icon: CalendarDays, href: '/schedule',  labelHe: 'לוז',     labelEn: 'Schedule' },
  { icon: Settings,     href: '/settings',  labelHe: 'הגדרות',  labelEn: 'Settings' },
]

interface SidebarProps {
  profile: Profile
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isRTL } = useLang()
  const [addOpen, setAddOpen] = useState(false)

  const displayName = profile.full_name?.split(' ')[0] ?? (isRTL ? 'משתמש' : 'User')

  return (
    <>
      <aside
        className="hidden md:flex fixed inset-y-0 start-0 z-40 w-72 flex-col"
        style={{
          background: 'var(--c-nav)',
          borderInlineEnd: '1px solid var(--c-nav-border)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
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

        {/* Nav */}
        <nav className="flex-1 px-3">
          <ul className="space-y-0.5">
            {navItems.map(({ icon: Icon, href, labelHe, labelEn }) => {
              const isActive =
                pathname === href ||
                (href !== '/dashboard' && pathname.startsWith(href))
              return (
                <li key={href}>
                  <button
                    onClick={() => router.push(href)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] active:scale-[0.97]"
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

        {/* Add habit button */}
        <div className="px-4 pb-6">
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
        </div>
      </aside>

      {addOpen && <AddHabitDialog variant="modal" onClose={() => setAddOpen(false)} />}
    </>
  )
}
