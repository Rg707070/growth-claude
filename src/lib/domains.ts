import type { Domain } from '@/types'

export const DOMAINS: Domain[] = [
  {
    slug: 'family',
    nameHe: 'משפחה',
    nameEn: 'Family',
    icon: '🏠',
    color: '#4F46E5',
    gradient: 'from-indigo-600/20 to-indigo-700/5',
    glowColor: 'rgba(79,70,229,0.20)',
  },
  {
    slug: 'friends',
    nameHe: 'חברים',
    nameEn: 'Friends',
    icon: '👥',
    color: '#0EA5E9',
    gradient: 'from-sky-500/20 to-sky-600/5',
    glowColor: 'rgba(14,165,233,0.20)',
  },
  {
    slug: 'torah',
    nameHe: 'לימודי קודש',
    nameEn: 'Torah Study',
    icon: '📖',
    color: '#0F766E',
    gradient: 'from-teal-700/20 to-teal-800/5',
    glowColor: 'rgba(15,118,110,0.20)',
  },
  {
    slug: 'secular',
    nameHe: 'לימודי חול',
    nameEn: 'Secular Study',
    icon: '🎓',
    color: '#059669',
    gradient: 'from-emerald-600/20 to-emerald-700/5',
    glowColor: 'rgba(5,150,105,0.20)',
  },
  {
    slug: 'sports',
    nameHe: 'ספורט',
    nameEn: 'Sports',
    icon: '⚡',
    color: '#65A30D',
    gradient: 'from-lime-600/20 to-lime-700/5',
    glowColor: 'rgba(101,163,13,0.22)',
  },
  {
    slug: 'trading',
    nameHe: 'מסחר',
    nameEn: 'Trading',
    icon: '📈',
    color: '#D97706',
    gradient: 'from-amber-600/20 to-amber-700/5',
    glowColor: 'rgba(217,119,6,0.22)',
  },
  {
    slug: 'finance',
    nameHe: 'כספים',
    nameEn: 'Finance',
    icon: '💰',
    color: '#0891B2',
    gradient: 'from-cyan-600/20 to-cyan-700/5',
    glowColor: 'rgba(8,145,178,0.20)',
  },
  {
    slug: 'music',
    nameHe: 'מוזיקה',
    nameEn: 'Music',
    icon: '🎵',
    color: '#7C3AED',
    gradient: 'from-violet-600/20 to-violet-700/5',
    glowColor: 'rgba(124,58,237,0.20)',
  },
]

export function getDomainBySlug(slug: string): Domain | undefined {
  return DOMAINS.find((d) => d.slug === slug)
}
