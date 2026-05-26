'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, Grid3X3, CalendarDays, Settings, BookOpen } from 'lucide-react'
import { useLang } from '@/lib/lang'
import type { Profile } from '@/types'

const navItems = [
  { icon: Home,         href: '/dashboard', labelHe: 'בית',    labelEn: 'Home'     },
  { icon: Grid3X3,      href: '/domains',   labelHe: 'תחומים', labelEn: 'Domains'  },
  { icon: BookOpen,     href: '/reading',   labelHe: 'ספרים',  labelEn: 'Books'    },
  { icon: CalendarDays, href: '/schedule',  labelHe: 'לוח',    labelEn: 'Schedule' },
  { icon: Settings,     href: '/settings',  labelHe: 'הגדרות', labelEn: 'Settings' },
]

export function BottomNav({ profile: _profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isRTL } = useLang()

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 pb-safe md:hidden"
        style={{
          background: 'var(--c-nav)',
          borderTop: '1px solid var(--c-nav-border)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center justify-around py-2 px-2 max-w-md mx-auto">
          {navItems.map(({ icon: Icon, href, labelHe, labelEn }) => {
            const isActive =
              pathname === href ||
              (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <button
                key={href}
                onClick={() => router.push(href)}
                className="relative flex flex-col items-center gap-0.5 py-1.5 px-3.5 rounded-2xl transition-all duration-200 active:scale-90"
                style={isActive ? { background: 'var(--c-primary-glow)' } : {}}
              >
                {isActive && (
                  <span
                    aria-hidden
                    className="absolute -top-[3px] left-1/2 -translate-x-1/2 w-7 h-[3px] rounded-full"
                    style={{ background: 'var(--brand-gradient)' }}
                  />
                )}
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.4 : 1.7}
                  style={{ color: isActive ? 'var(--primary)' : 'var(--muted-foreground)' }}
                />
                <span
                  className="text-[10px] font-semibold transition-colors"
                  style={{ color: isActive ? 'var(--primary)' : 'var(--muted-foreground)' }}
                >
                  {isRTL ? labelHe : labelEn}
                </span>
              </button>
            )
          })}

        </div>
      </nav>
    </>
  )
}
