'use client'

import { useState } from 'react'
import { useLang } from '@/lib/lang'
import { DOMAINS } from '@/lib/domains'
import type { DomainEntry } from './page'

interface InsightsTabProps {
  entries: DomainEntry[]
}

export function InsightsTab({ entries }: InsightsTabProps) {
  const { isRTL } = useLang()
  const [filterSlug, setFilterSlug] = useState<string>('all')

  const domainMap = Object.fromEntries(DOMAINS.map((d) => [d.slug, d]))

  const filtered =
    filterSlug === 'all' ? entries : entries.filter((e) => e.domain_slug === filterSlug)

  const grouped = filtered.reduce<Record<string, DomainEntry[]>>((acc, entry) => {
    const key = entry.date
    if (!acc[key]) acc[key] = []
    acc[key].push(entry)
    return acc
  }, {})

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  const activeDomainSlugs = [...new Set(entries.map((e) => e.domain_slug))]

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString(isRTL ? 'he-IL' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })

  return (
    <div>
      {/* Domain filter chips */}
      <div className="flex gap-2 flex-wrap mb-6">
        <FilterChip
          active={filterSlug === 'all'}
          onClick={() => setFilterSlug('all')}
          color="var(--primary)"
        >
          {isRTL ? 'הכל' : 'All'}
        </FilterChip>
        {activeDomainSlugs.map((slug) => {
          const domain = domainMap[slug]
          if (!domain) return null
          return (
            <FilterChip
              key={slug}
              active={filterSlug === slug}
              onClick={() => setFilterSlug(slug)}
              color={domain.color}
            >
              {domain.icon} {isRTL ? domain.nameHe : domain.nameEn}
            </FilterChip>
          )
        })}
      </div>

      {sortedDates.length === 0 ? (
        <div
          className="text-center py-20 text-sm"
          style={{ color: 'var(--muted-foreground)' }}
        >
          {isRTL ? 'עדיין אין הארות — כתוב ביומן של כל תחום' : 'No insights yet — write in domain journals'}
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDates.map((date) => (
            <div key={date}>
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {fmtDate(date)}
              </p>
              <div className="space-y-2">
                {grouped[date].map((entry) => {
                  const domain = domainMap[entry.domain_slug]
                  return (
                    <div
                      key={entry.id}
                      className="flex gap-3 items-start p-4 rounded-2xl"
                      style={{ background: 'var(--c-card)', border: '1px solid var(--c-card-border)' }}
                    >
                      <span
                        className="flex-shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg mt-0.5"
                        style={{
                          background: domain ? `${domain.color}22` : 'var(--c-primary-glow)',
                          color: domain?.color ?? 'var(--primary)',
                        }}
                      >
                        {domain?.icon} {isRTL ? domain?.nameHe : domain?.nameEn}
                      </span>
                      <p
                        className="flex-1 text-sm leading-relaxed"
                        style={{ color: 'var(--foreground)', direction: isRTL ? 'rtl' : 'ltr' }}
                      >
                        {entry.text}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  color,
  children,
}: {
  active: boolean
  onClick: () => void
  color: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
      style={
        active
          ? { background: `${color}33`, color, border: `1px solid ${color}66` }
          : { background: 'var(--c-card)', color: 'var(--muted-foreground)', border: '1px solid var(--c-card-border)' }
      }
    >
      {children}
    </button>
  )
}
