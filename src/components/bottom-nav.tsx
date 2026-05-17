'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, Grid3X3, BarChart2, CalendarDays, Settings } from 'lucide-react'
import { useLang } from '@/lib/lang'

const navItems = [
  { icon: Home,         href: '/dashboard', labelHe: 'בית',     labelEn: 'Home'     },
  { icon: Grid3X3,      href: '/domains',   labelHe: 'תחומים',  labelEn: 'Domains'  },
  { icon: CalendarDays, href: '/schedule',  labelHe: 'לוז',     labelEn: 'Schedule' },
  { icon: BarChart2,    href: '/progress',  labelHe: 'התקדמות', labelEn: 'Progress' },
  { icon: Settings,     href: '/settings',  labelHe: 'הגדרות',  labelEn: 'Settings' },
]

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { isRTL } = useLang()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 pb-safe"
      style={{
        background: 'oklch(0.09 0.04 145 / 92%)',
        borderTop: '1px solid oklch(0.72 0.14 145 / 14%)',
        backdropFilter: 'blur(24px)',
      }}
    >
      <div className="flex items-center justify-around py-1.5 px-2 max-w-md mx-auto">
        {navItems.map(({ icon: Icon, href, labelHe, labelEn }) => {
          const isActive =
            pathname === href ||
            (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <button
              key={href}
              onClick={() => router.push(href)}
              className="relative flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-2xl transition-all duration-200 active:scale-90"
              style={isActive ? {
                background: 'oklch(0.72 0.20 145 / 12%)',
              } : {}}
            >
              {/* Active top bar */}
              {isActive && (
                <div
                  className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ background: 'oklch(0.72 0.20 145)' }}
                />
              )}
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.5}
                style={{ color: isActive ? 'oklch(0.72 0.20 145)' : 'oklch(0.55 0.06 145)' }}
              />
              <span
                className="text-[10px] font-semibold transition-all"
                style={{ color: isActive ? 'oklch(0.72 0.20 145)' : 'oklch(0.50 0.06 145)' }}
              >
                {isRTL ? labelHe : labelEn}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
