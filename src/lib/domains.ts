import type { Domain } from '@/types'

export const DOMAINS: Domain[] = [
  {
    slug: 'family',
    nameHe: 'משפחה',
    nameEn: 'Family',
    icon: '🏠',
    color: '#3B82F6',
    gradient: 'from-blue-500/20 to-blue-600/5',
  },
  {
    slug: 'friends',
    nameHe: 'חברים',
    nameEn: 'Friends',
    icon: '👥',
    color: '#10B981',
    gradient: 'from-emerald-500/20 to-emerald-600/5',
  },
  {
    slug: 'torah',
    nameHe: 'לימודי קודש',
    nameEn: 'Torah Study',
    icon: '📖',
    color: '#F59E0B',
    gradient: 'from-amber-500/20 to-amber-600/5',
  },
  {
    slug: 'secular',
    nameHe: 'לימודי חול',
    nameEn: 'Secular Study',
    icon: '🎓',
    color: '#F97316',
    gradient: 'from-orange-500/20 to-orange-600/5',
  },
  {
    slug: 'sports',
    nameHe: 'ספורט',
    nameEn: 'Sports',
    icon: '⚡',
    color: '#EF4444',
    gradient: 'from-red-500/20 to-red-600/5',
  },
  {
    slug: 'trading',
    nameHe: 'מסחר',
    nameEn: 'Trading',
    icon: '📈',
    color: '#8B5CF6',
    gradient: 'from-violet-500/20 to-violet-600/5',
  },
  {
    slug: 'finance',
    nameHe: 'כספים',
    nameEn: 'Finance',
    icon: '💰',
    color: '#06B6D4',
    gradient: 'from-cyan-500/20 to-cyan-600/5',
  },
  {
    slug: 'music',
    nameHe: 'מוזיקה',
    nameEn: 'Music',
    icon: '🎵',
    color: '#EC4899',
    gradient: 'from-pink-500/20 to-pink-600/5',
  },
]

export function getDomainBySlug(slug: string): Domain | undefined {
  return DOMAINS.find((d) => d.slug === slug)
}
