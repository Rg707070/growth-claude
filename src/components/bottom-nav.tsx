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
    <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/10 z-50 pb-safe">
      <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
        {navItems.map(({ icon: Icon, href, labelHe, labelEn }) => {
          const isActive =
            pathname === href ||
            (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <button
              key={href}
              onClick={() => router.push(href)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                isActive ? 'text-white' : 'text-white/40'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">
                {isRTL ? labelHe : labelEn}
              </span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-white" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
