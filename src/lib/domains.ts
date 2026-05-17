import type { Domain } from '@/types'

export const DOMAINS: Domain[] = [
  {
    slug: 'family',
    nameHe: 'משפחה',
    nameEn: 'Family',
    icon: '🏠',
    color: '#15803d',
    gradient: 'from-green-700/20 to-green-800/5',
    glowColor: 'rgba(21,128,61,0.18)',
  },
  {
    slug: 'friends',
    nameHe: 'חברים',
    nameEn: 'Friends',
    icon: '👥',
    color: '#059669',
    gradient: 'from-emerald-600/20 to-emerald-700/5',
    glowColor: 'rgba(5,150,105,0.18)',
  },
  {
    slug: 'torah',
    nameHe: 'לימודי קודש',
    nameEn: 'Torah Study',
    icon: '📖',
    color: '#0f766e',
    gradient: 'from-teal-700/20 to-teal-800/5',
    glowColor: 'rgba(15,118,110,0.18)',
  },
  {
    slug: 'secular',
    nameHe: 'לימודי חול',
    nameEn: 'Secular Study',
    icon: '🎓',
    color: '#4d7c0f',
    gradient: 'from-lime-700/20 to-lime-800/5',
    glowColor: 'rgba(77,124,15,0.18)',
  },
  {
    slug: 'sports',
    nameHe: 'ספורט',
    nameEn: 'Sports',
    icon: '⚡',
    color: '#16a34a',
    gradient: 'from-green-600/20 to-green-700/5',
    glowColor: 'rgba(22,163,74,0.18)',
  },
  {
    slug: 'trading',
    nameHe: 'מסחר',
    nameEn: 'Trading',
    icon: '📈',
    color: '#047857',
    gradient: 'from-emerald-700/20 to-emerald-800/5',
    glowColor: 'rgba(4,120,87,0.18)',
  },
  {
    slug: 'finance',
    nameHe: 'כספים',
    nameEn: 'Finance',
    icon: '💰',
    color: '#166534',
    gradient: 'from-green-800/20 to-green-900/5',
    glowColor: 'rgba(22,101,52,0.18)',
  },
  {
    slug: 'music',
    nameHe: 'מוזיקה',
    nameEn: 'Music',
    icon: '🎵',
    color: '#0d9488',
    gradient: 'from-teal-600/20 to-teal-700/5',
    glowColor: 'rgba(13,148,136,0.18)',
  },
]

export function getDomainBySlug(slug: string): Domain | undefined {
  return DOMAINS.find((d) => d.slug === slug)
}
