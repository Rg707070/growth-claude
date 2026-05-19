'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Grid3X3, CalendarDays, Settings, Bot } from 'lucide-react'
import { useLang } from '@/lib/lang'
import { AiChatPanel } from '@/components/ai-chat'
import type { Profile } from '@/types'

const navItems = [
  { icon: Home,         href: '/dashboard', labelHe: 'בית',    labelEn: 'Home'     },
  { icon: Grid3X3,      href: '/domains',   labelHe: 'תחומים', labelEn: 'Domains'  },
  { icon: CalendarDays, href: '/schedule',  labelHe: 'לוז',    labelEn: 'Schedule' },
  { icon: Settings,     href: '/settings',  labelHe: 'הגדרות', labelEn: 'Settings' },
]

export function BottomNav({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isRTL } = useLang()
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <>
      <AiChatPanel profile={profile} open={chatOpen} onClose={() => setChatOpen(false)} />
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

          <button
            onClick={() => setChatOpen(true)}
            className="relative flex flex-col items-center gap-0.5 py-1.5 px-3.5 rounded-2xl transition-all duration-200 active:scale-90"
            style={chatOpen ? { background: 'var(--c-primary-glow)' } : {}}
          >
            {chatOpen && (
              <span
                aria-hidden
                className="absolute -top-[3px] left-1/2 -translate-x-1/2 w-7 h-[3px] rounded-full"
                style={{ background: 'var(--brand-gradient)' }}
              />
            )}
            <Bot
              size={22}
              strokeWidth={chatOpen ? 2.4 : 1.7}
              style={{ color: chatOpen ? 'var(--primary)' : 'var(--muted-foreground)' }}
            />
            <span
              className="text-[10px] font-semibold transition-colors"
              style={{ color: chatOpen ? 'var(--primary)' : 'var(--muted-foreground)' }}
            >
              {isRTL ? 'AI' : 'AI'}
            </span>
          </button>
        </div>
      </nav>
    </>
  )
}
