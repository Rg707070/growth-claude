import type { Domain } from '@/types'

export const DOMAINS: Domain[] = [
  {
    slug: 'family',
    nameHe: 'משפחה',
    nameEn: 'Family',
    icon: '🏠',
    color: '#38BDF8',
    gradient: 'from-sky-400/25 to-sky-600/5',
    glowColor: 'rgba(56,189,248,0.22)',
  },
  {
    slug: 'friends',
    nameHe: 'חברים',
    nameEn: 'Friends',
    icon: '👥',
    color: '#34D399',
    gradient: 'from-emerald-400/25 to-teal-600/5',
    glowColor: 'rgba(52,211,153,0.22)',
  },
  {
    slug: 'torah',
    nameHe: 'לימודי קודש',
    nameEn: 'Torah Study',
    icon: '📖',
    color: '#FBD34D',
    gradient: 'from-yellow-400/25 to-amber-600/5',
    glowColor: 'rgba(251,211,77,0.22)',
  },
  {
    slug: 'secular',
    nameHe: 'לימודי חול',
    nameEn: 'Secular Study',
    icon: '🎓',
    color: '#FB923C',
    gradient: 'from-orange-400/25 to-orange-600/5',
    glowColor: 'rgba(251,146,60,0.22)',
  },
  {
    slug: 'sports',
    nameHe: 'ספורט',
    nameEn: 'Sports',
    icon: '⚡',
    color: '#F87171',
    gradient: 'from-red-400/25 to-red-600/5',
    glowColor: 'rgba(248,113,113,0.22)',
  },
  {
    slug: 'trading',
    nameHe: 'מסחר',
    nameEn: 'Trading',
    icon: '📈',
    color: '#A78BFA',
    gradient: 'from-violet-400/25 to-violet-600/5',
    glowColor: 'rgba(167,139,250,0.22)',
  },
  {
    slug: 'finance',
    nameHe: 'כספים',
    nameEn: 'Finance',
    icon: '💰',
    color: '#22D3EE',
    gradient: 'from-cyan-400/25 to-cyan-600/5',
    glowColor: 'rgba(34,211,238,0.22)',
  },
  {
    slug: 'music',
    nameHe: 'מוזיקה',
    nameEn: 'Music',
    icon: '🎵',
    color: '#F472B6',
    gradient: 'from-pink-400/25 to-pink-600/5',
    glowColor: 'rgba(244,114,182,0.22)',
  },
]

export function getDomainBySlug(slug: string): Domain | undefined {
  return DOMAINS.find((d) => d.slug === slug)
}
