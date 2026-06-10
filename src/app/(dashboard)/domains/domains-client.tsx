'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/lib/lang'
import { DOMAINS } from '@/lib/domains'
import { createClient } from '@/lib/supabase/client'
import { Check, ChevronRight, LayoutGrid, Plus, Trash2, X } from 'lucide-react'
import type { Domain } from '@/types'

const PRESET_COLORS = [
  '#4F46E5', '#0EA5E9', '#0F766E', '#059669',
  '#65A30D', '#0891B2', '#7C3AED', '#DB2777',
  '#EA580C', '#CA8A04', '#16A34A', '#DC2626',
]

const PRESET_EMOJIS = [
  '⭐', '🎯', '💪', '📚', '🎵', '💰', '🏃', '🧘',
  '✍️', '🌱', '🔥', '❤️', '🎨', '🌍', '🧠', '🏠',
  '👥', '📖', '⚡', '🎓', '🏋️', '🍎', '😴', '💻',
]

interface DomainsClientProps {
  userId: string
  domains: Domain[]
  hasCustomDomains: boolean
}

export function DomainsClient({ userId, domains, hasCustomDomains }: DomainsClientProps) {
  const { isRTL } = useLang()
  const router = useRouter()
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('⭐')
  const [newColor, setNewColor] = useState('#4F46E5')
  const [saving, setSaving] = useState(false)
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null)

  const resetAdd = () => {
    setShowAdd(false)
    setNewName('')
    setNewIcon('⭐')
    setNewColor('#4F46E5')
  }

  const addDomain = async () => {
    if (!newName.trim() || saving) return
    setSaving(true)
    await ensureMigrated()
    const slug = newName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || `domain-${Date.now()}`
    const supabase = createClient()
    const { error } = await supabase.from('user_domains').insert({
      user_id: userId,
      slug,
      name: newName.trim(),
      icon: newIcon,
      color: newColor,
      sort_order: domains.length,
    })
    setSaving(false)
    if (!error) {
      resetAdd()
      router.refresh()
    }
  }

  const deleteDomain = async (slug: string) => {
    if (deletingSlug) return
    setDeletingSlug(slug)
    const supabase = createClient()
    await supabase.from('user_domains').delete().eq('user_id', userId).eq('slug', slug)
    setDeletingSlug(null)
    router.refresh()
  }

  const migrateToCustom = async () => {
    setSaving(true)
    const supabase = createClient()
    const rows = DOMAINS.map((d, i) => ({
      user_id: userId,
      slug: d.slug,
      name: isRTL ? d.nameHe : d.nameEn,
      icon: d.icon,
      color: d.color,
      sort_order: i,
    }))
    await supabase.from('user_domains').insert(rows)
    setSaving(false)
    router.refresh()
  }

  // Ensure current defaults are saved before any custom modification
  const ensureMigrated = async () => {
    if (hasCustomDomains) return
    const supabase = createClient()
    const rows = DOMAINS.map((d, i) => ({
      user_id: userId,
      slug: d.slug,
      name: isRTL ? d.nameHe : d.nameEn,
      icon: d.icon,
      color: d.color,
      sort_order: i,
    }))
    await supabase.from('user_domains').upsert(rows, { ignoreDuplicates: true })
  }

  const addPresetDomain = async (d: typeof DOMAINS[number]) => {
    if (saving) return
    setSaving(true)
    await ensureMigrated()
    const alreadyActive = domains.some((dom) => dom.slug === d.slug)
    if (!alreadyActive) {
      const supabase = createClient()
      await supabase.from('user_domains').insert({
        user_id: userId,
        slug: d.slug,
        name: isRTL ? d.nameHe : d.nameEn,
        icon: d.icon,
        color: d.color,
        sort_order: domains.length,
      })
    }
    setSaving(false)
    resetAdd()
    router.refresh()
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto pb-24 md:pb-6">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 md:max-w-none md:px-0 md:py-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center md:hidden"
              style={{ background: 'var(--c-primary-glow)', color: 'var(--primary)' }}
            >
              <LayoutGrid size={20} />
            </div>
            <div>
              <h1 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
                {isRTL ? 'תחומים' : 'Domains'}
              </h1>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {isRTL ? 'תחומי החיים שלך' : 'Your life domains'}
              </p>
            </div>
          </div>

          {hasCustomDomains && (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95"
              style={{ background: 'var(--c-primary-glow)', color: 'var(--primary)' }}
            >
              <Plus size={15} strokeWidth={2.5} />
              {isRTL ? 'הוסף' : 'Add'}
            </button>
          )}
        </div>

        {/* Migrate CTA for users with default domains */}
        {!hasCustomDomains && (
          <div
            className="rounded-2xl p-4 space-y-3"
            style={{ background: 'var(--c-primary-glow)', border: '1px solid var(--c-border)' }}
          >
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              {isRTL ? '🎨 התאם את התחומים שלך' : '🎨 Customize your domains'}
            </p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {isRTL
                ? 'כרגע אתה משתמש בתחומים הברירת-מחדל. תוכל להתחיל מהתחומים האלה ולערוך אותם, או ליצור תחומים חדשים לגמרי.'
                : 'You\'re using the default domains. Start from these and customize them, or create your own from scratch.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={migrateToCustom}
                disabled={saving}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-50 active:scale-95"
                style={{ background: 'var(--brand-gradient)' }}
              >
                {saving ? '...' : isRTL ? 'התחל מהתחומים הקיימים' : 'Start from defaults'}
              </button>
              <button
                onClick={() => { setShowAdd(true) }}
                className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
                style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', color: 'var(--foreground)' }}
              >
                {isRTL ? 'צור חדש' : 'Create new'}
              </button>
            </div>
          </div>
        )}

        {/* Add domain form */}
        {showAdd && (
          <div
            className="rounded-2xl p-4 space-y-4"
            style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                {isRTL ? 'הוסף תחום' : 'Add domain'}
              </span>
              <button onClick={resetAdd} style={{ color: 'var(--muted-foreground)' }}>
                <X size={16} />
              </button>
            </div>

            {/* Preset domains section */}
            <div>
              <p className="text-[11px] font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
                {isRTL ? 'מהמוצעים' : 'From suggestions'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DOMAINS.map((d) => {
                  const active = hasCustomDomains && domains.some((dom) => dom.slug === d.slug)
                  return (
                    <button
                      key={d.slug}
                      onClick={() => !active && addPresetDomain(d)}
                      disabled={saving}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-start transition-all active:scale-[0.97] disabled:opacity-60"
                      style={{
                        background: active ? `${d.color}12` : 'var(--c-surface-2)',
                        border: `1.5px solid ${active ? d.color + '50' : 'var(--c-border)'}`,
                        cursor: active ? 'default' : 'pointer',
                      }}
                    >
                      <span
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                        style={{ background: `${d.color}22` }}
                      >
                        {d.icon}
                      </span>
                      <span className="flex-1 text-xs font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                        {isRTL ? d.nameHe : d.nameEn}
                      </span>
                      {active && (
                        <Check size={13} strokeWidth={2.5} style={{ color: d.color, flexShrink: 0 }} />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: 'var(--c-border)' }} />
              <span className="text-[11px] font-medium" style={{ color: 'var(--muted-foreground)' }}>
                {isRTL ? 'או צור חדש' : 'or create custom'}
              </span>
              <div className="flex-1 h-px" style={{ background: 'var(--c-border)' }} />
            </div>

            {/* Custom domain */}
            <input
              value={newName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && addDomain()}
              placeholder={isRTL ? 'שם התחום המותאם...' : 'Custom domain name...'}
              className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-all"
              style={{
                background: 'var(--c-input)',
                border: '1px solid var(--c-input-border)',
                color: 'var(--foreground)',
              }}
              onFocus={(e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = 'var(--ring)')}
              onBlur={(e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = 'var(--c-input-border)')}
            />

            {newName.trim() && (
              <>
                {/* Emoji picker */}
                <div>
                  <p className="text-[11px] font-medium mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
                    {isRTL ? 'אייקון' : 'Icon'}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_EMOJIS.map((e) => (
                      <button
                        key={e}
                        onClick={() => setNewIcon(e)}
                        className="w-8 h-8 rounded-lg text-base transition-all active:scale-90"
                        style={{
                          background: newIcon === e ? `${newColor}22` : 'var(--c-surface-2)',
                          border: newIcon === e ? `1.5px solid ${newColor}` : '1px solid var(--c-border)',
                        }}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color picker */}
                <div>
                  <p className="text-[11px] font-medium mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
                    {isRTL ? 'צבע' : 'Color'}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setNewColor(c)}
                        className="w-7 h-7 rounded-full transition-all active:scale-90"
                        style={{
                          background: c,
                          outline: newColor === c ? `2px solid ${c}` : 'none',
                          outlineOffset: '2px',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Preview + save */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: `${newColor}22`, border: `1px solid ${newColor}44` }}
                  >
                    {newIcon}
                  </div>
                  <span className="flex-1 text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                    {newName}
                  </span>
                  <button
                    onClick={addDomain}
                    disabled={saving}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 active:scale-95"
                    style={{ background: 'var(--brand-gradient)' }}
                  >
                    {saving ? '...' : isRTL ? 'הוסף' : 'Add'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Domain list */}
        <div className="space-y-2 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 lg:grid-cols-3 xl:grid-cols-4">
          {domains.map((domain) => (
            <div key={domain.slug} className="relative group">
              <button
                onClick={() => router.push(`/domain/${domain.slug}`)}
                className="w-full flex items-center gap-4 text-start active:scale-[0.98] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg overflow-hidden md:flex-col md:items-start md:gap-3"
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--c-border)',
                  borderRadius: '1.1rem',
                  padding: '0.95rem 1.1rem',
                  boxShadow: '0 1px 3px var(--c-shadow)',
                }}
              >
                <span
                  aria-hidden
                  className="absolute inset-y-3 w-1 rounded-full opacity-90 md:inset-x-3 md:inset-y-auto md:top-0 md:h-1 md:w-auto"
                  style={{
                    insetInlineStart: 0,
                    background: `linear-gradient(180deg, ${domain.color}, ${domain.color}80)`,
                  }}
                />
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ms-1 md:ms-0 md:w-14 md:h-14 md:text-2xl md:mt-2"
                  style={{
                    background: `linear-gradient(135deg, ${domain.color}1f, ${domain.color}10)`,
                    border: `1px solid ${domain.color}26`,
                  }}
                >
                  {domain.icon}
                </div>
                <div className="flex-1 min-w-0 md:w-full">
                  <p className="font-semibold text-base leading-tight" style={{ color: 'var(--foreground)' }}>
                    {isRTL ? domain.nameHe : domain.nameEn}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                    {isRTL ? 'לחץ לניהול הרגלים' : 'Tap to manage habits'}
                  </p>
                </div>
                <ChevronRight
                  size={18}
                  strokeWidth={2}
                  style={{ color: 'var(--muted-foreground)', transform: isRTL ? 'scaleX(-1)' : 'none' }}
                  className="flex-shrink-0 md:hidden"
                />
              </button>

              {/* Delete button — only for custom domains */}
              {hasCustomDomains && (
                <button
                  onClick={() => deleteDomain(domain.slug)}
                  disabled={deletingSlug === domain.slug}
                  className="absolute top-2 end-2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all active:scale-90 disabled:opacity-30"
                  style={{ background: 'rgba(220,38,38,0.12)', color: '#DC2626' }}
                  aria-label={isRTL ? 'מחק' : 'Delete'}
                >
                  <Trash2 size={12} strokeWidth={2} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add more button when custom domains exist */}
        {hasCustomDomains && !showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all active:scale-[0.98]"
            style={{
              background: 'var(--c-surface-2)',
              border: '1.5px dashed var(--c-border)',
              color: 'var(--muted-foreground)',
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            {isRTL ? 'הוסף תחום חדש' : 'Add new domain'}
          </button>
        )}
      </div>
    </div>
  )
}
