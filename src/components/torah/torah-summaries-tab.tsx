'use client'

import { useState } from 'react'
import { Plus, Star, StarOff, Search, X, Trash2, ChevronDown, Pencil } from 'lucide-react'
import { useLang } from '@/lib/lang'
import { createClient } from '@/lib/supabase/client'
import type { LearningSummary } from '@/types'

const TORAH_COLOR = '#0f766e'
const GOLD = '#c4963a'

interface Props {
  userId: string
  summaries: LearningSummary[]
  onCreated: (s: LearningSummary) => void
  onUpdated: (s: LearningSummary) => void
  onDeleted: (id: string) => void
}

type View = 'list' | 'create' | 'view' | 'edit'

const DEFAULT_FOLDERS = ['כללי', 'גמרא', 'הלכה', 'מחשבה', 'תנ"ך', 'שיעורים']

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })
}

export function TorahSummariesTab({ userId, summaries, onCreated, onUpdated, onDeleted }: Props) {
  const { t } = useLang()
  const supabase = createClient()

  const [view, setView] = useState<View>('list')
  const [selected, setSelected] = useState<LearningSummary | null>(null)
  const [search, setSearch] = useState('')
  const [folderFilter, setFolderFilter] = useState('הכל')
  const [favOnly, setFavOnly] = useState(false)

  // Create form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [source, setSource] = useState('')
  const [folder, setFolder] = useState('כללי')
  const [tagsInput, setTagsInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [showFolderPicker, setShowFolderPicker] = useState(false)

  const allFolders = ['הכל', ...Array.from(new Set(['כללי', ...summaries.map((s) => s.folder)]))]

  const filtered = summaries.filter((s) => {
    const matchSearch = !search || s.title.includes(search) || s.content.includes(search)
    const matchFolder = folderFilter === 'הכל' || s.folder === folderFilter
    const matchFav = !favOnly || s.is_favorite
    return matchSearch && matchFolder && matchFav
  })

  async function createSummary() {
    if (!title.trim() || !content.trim()) return
    setSaving(true)
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    const { data } = await supabase
      .from('learning_summaries')
      .insert({ user_id: userId, title: title.trim(), content: content.trim(), source: source.trim() || null, folder, tags })
      .select()
      .single()
    if (data) onCreated(data as LearningSummary)
    setSaving(false)
    setTitle('')
    setContent('')
    setSource('')
    setTagsInput('')
    setFolder('כללי')
    setView('list')
  }

  async function updateSummary() {
    if (!selected || !title.trim() || !content.trim()) return
    setSaving(true)
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    const { data } = await supabase
      .from('learning_summaries')
      .update({ title: title.trim(), content: content.trim(), source: source.trim() || null, folder, tags })
      .eq('id', selected.id)
      .select()
      .single()
    if (data) {
      const updated = data as LearningSummary
      onUpdated(updated)
      setSelected(updated)
    }
    setSaving(false)
    setView('view')
  }

  async function toggleFavorite(summary: LearningSummary) {
    const next = !summary.is_favorite
    await supabase.from('learning_summaries').update({ is_favorite: next }).eq('id', summary.id)
    onUpdated({ ...summary, is_favorite: next })
    if (selected?.id === summary.id) setSelected({ ...summary, is_favorite: next })
  }

  async function deleteSummary(id: string) {
    await supabase.from('learning_summaries').delete().eq('id', id)
    onDeleted(id)
    setView('list')
    setSelected(null)
  }

  if (view === 'create') {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => setView('list')} className="text-xs text-white/40 hover:text-white/70 transition-colors">
            {t('cancel')}
          </button>
          <h2 className="text-sm font-semibold text-white">{t('newSummary')}</h2>
        </div>

        <div className="space-y-3">
          <Field label={t('summaryTitle')}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="כותרת הסיכום"
              className="w-full bg-transparent text-white text-sm placeholder-white/20 outline-none text-right py-1"
              dir="rtl"
            />
          </Field>

          <Field label={t('summarySource')}>
            <input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="ברכות ב:א / שיעור של הרב..."
              className="w-full bg-transparent text-white text-sm placeholder-white/20 outline-none text-right py-1"
              dir="rtl"
            />
          </Field>

          <Field label={t('summaryFolder')}>
            <div className="relative">
              <button
                onClick={() => setShowFolderPicker((v) => !v)}
                className="flex items-center gap-1.5 text-sm text-right"
                style={{ color: TORAH_COLOR }}
              >
                {folder} <ChevronDown size={13} />
              </button>
              {showFolderPicker && (
                <div
                  className="absolute top-7 right-0 z-20 rounded-xl p-2 flex flex-col gap-1 min-w-36"
                  style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
                >
                  {DEFAULT_FOLDERS.map((f) => (
                    <button
                      key={f}
                      onClick={() => { setFolder(f); setShowFolderPicker(false) }}
                      className="text-sm text-right px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                      style={{ color: folder === f ? TORAH_COLOR : 'var(--c-text-2)' }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Field>

          <Field label={t('summaryTags')}>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="ברכות, תפילה, שחרית"
              className="w-full bg-transparent text-white text-sm placeholder-white/20 outline-none text-right py-1"
              dir="rtl"
            />
          </Field>

          <div>
            <p className="text-xs text-white/40 text-right mb-2">{t('summaryContent')}</p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="כתוב כאן את הסיכום שלך..."
              rows={8}
              className="w-full bg-transparent text-white text-sm placeholder-white/20 outline-none text-right resize-none leading-relaxed"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
              dir="rtl"
            />
          </div>
        </div>

        <button
          onClick={createSummary}
          disabled={!title.trim() || !content.trim() || saving}
          className="w-full py-3 rounded-xl text-sm font-medium transition-opacity disabled:opacity-30"
          style={{ background: TORAH_COLOR, color: '#fff' }}
        >
          {t('save')}
        </button>
      </div>
    )
  }

  if (view === 'view' && selected) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => toggleFavorite(selected)}
              className="transition-opacity hover:opacity-70"
            >
              {selected.is_favorite ? (
                <Star size={18} style={{ color: GOLD }} fill={GOLD} />
              ) : (
                <StarOff size={18} className="text-white/30" />
              )}
            </button>
            <button
              onClick={() => {
                setTitle(selected.title)
                setContent(selected.content)
                setSource(selected.source ?? '')
                setFolder(selected.folder)
                setTagsInput(selected.tags.join(', '))
                setView('edit')
              }}
              className="text-white/30 hover:text-white/70 transition-colors"
            >
              <Pencil size={17} />
            </button>
            <button
              onClick={() => deleteSummary(selected.id)}
              className="text-white/30 hover:text-red-400 transition-colors"
            >
              <Trash2 size={17} />
            </button>
          </div>
          <button onClick={() => setView('list')} className="text-xs text-white/40 hover:text-white/70 transition-colors">
            ← חזרה
          </button>
        </div>

        <div>
          <span
            className="inline-block text-xs px-2 py-0.5 rounded-full mb-2"
            style={{ background: `${TORAH_COLOR}20`, color: TORAH_COLOR }}
          >
            {selected.folder}
          </span>
          <h2 className="text-lg font-semibold text-white text-right leading-snug mb-1">
            {selected.title}
          </h2>
          {selected.source && (
            <p className="text-xs text-white/40 text-right mb-4">{selected.source}</p>
          )}
          <p className="text-sm text-white/75 leading-relaxed text-right whitespace-pre-wrap">
            {selected.content}
          </p>
        </div>

        {selected.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-end">
            {selected.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--c-text-subtle)' }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (view === 'edit' && selected) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => setView('view')} className="text-xs text-white/40 hover:text-white/70 transition-colors">
            {t('cancel')}
          </button>
          <h2 className="text-sm font-semibold text-white">{t('editSummary')}</h2>
        </div>

        <div className="space-y-3">
          <Field label={t('summaryTitle')}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="כותרת הסיכום"
              className="w-full bg-transparent text-white text-sm placeholder-white/20 outline-none text-right py-1"
              dir="rtl"
            />
          </Field>

          <Field label={t('summarySource')}>
            <input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="ברכות ב:א / שיעור של הרב..."
              className="w-full bg-transparent text-white text-sm placeholder-white/20 outline-none text-right py-1"
              dir="rtl"
            />
          </Field>

          <Field label={t('summaryFolder')}>
            <div className="relative">
              <button
                onClick={() => setShowFolderPicker((v) => !v)}
                className="flex items-center gap-1.5 text-sm text-right"
                style={{ color: TORAH_COLOR }}
              >
                {folder} <ChevronDown size={13} />
              </button>
              {showFolderPicker && (
                <div
                  className="absolute top-7 right-0 z-20 rounded-xl p-2 flex flex-col gap-1 min-w-36"
                  style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
                >
                  {DEFAULT_FOLDERS.map((f) => (
                    <button
                      key={f}
                      onClick={() => { setFolder(f); setShowFolderPicker(false) }}
                      className="text-sm text-right px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                      style={{ color: folder === f ? TORAH_COLOR : 'var(--c-text-2)' }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Field>

          <Field label={t('summaryTags')}>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="ברכות, תפילה, שחרית"
              className="w-full bg-transparent text-white text-sm placeholder-white/20 outline-none text-right py-1"
              dir="rtl"
            />
          </Field>

          <div>
            <p className="text-xs text-white/40 text-right mb-2">{t('summaryContent')}</p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="כתוב כאן את הסיכום שלך..."
              rows={8}
              className="w-full bg-transparent text-white text-sm placeholder-white/20 outline-none text-right resize-none leading-relaxed"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
              dir="rtl"
            />
          </div>
        </div>

        <button
          onClick={updateSummary}
          disabled={!title.trim() || !content.trim() || saving}
          className="w-full py-3 rounded-xl text-sm font-medium transition-opacity disabled:opacity-30"
          style={{ background: TORAH_COLOR, color: '#fff' }}
        >
          {t('save')}
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Search + new */}
      <div className="flex gap-2">
        <button
          onClick={() => setView('create')}
          className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
          style={{ background: TORAH_COLOR }}
        >
          <Plus size={16} color="#fff" />
        </button>
        <div
          className="flex-1 flex items-center gap-2 rounded-xl px-3 h-9"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <Search size={14} className="text-white/30 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search')}
            className="flex-1 bg-transparent text-sm text-white placeholder-white/20 outline-none text-right"
            dir="rtl"
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <X size={13} className="text-white/30" />
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setFavOnly((v) => !v)}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all"
          style={
            favOnly
              ? { background: `${GOLD}22`, color: GOLD }
              : { background: 'rgba(255,255,255,0.04)', color: 'var(--c-text-subtle)' }
          }
        >
          <Star size={11} />
          {t('favorites')}
        </button>
        {allFolders.map((f) => (
          <button
            key={f}
            onClick={() => setFolderFilter(f)}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all"
            style={
              folderFilter === f
                ? { background: `${TORAH_COLOR}22`, color: TORAH_COLOR }
                : { background: 'rgba(255,255,255,0.04)', color: 'var(--c-text-subtle)' }
            }
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-white/25 text-sm">{summaries.length === 0 ? t('noSummariesYet') : 'אין תוצאות'}</p>
          {summaries.length === 0 && (
            <button
              onClick={() => setView('create')}
              className="mt-4 text-xs px-4 py-2 rounded-full transition-opacity hover:opacity-80"
              style={{ background: `${TORAH_COLOR}22`, color: TORAH_COLOR }}
            >
              + {t('newSummary')}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => (
            <button
              key={s.id}
              onClick={() => { setSelected(s); setView('view') }}
              className="w-full text-right rounded-2xl p-4 transition-opacity hover:opacity-80"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {s.is_favorite && <Star size={13} style={{ color: GOLD }} fill={GOLD} />}
                  <span className="text-xs text-white/25">{formatDate(s.created_at)}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white/90 mb-1 leading-snug">{s.title}</p>
                  <p className="text-xs text-white/40 line-clamp-2 leading-relaxed">{s.content}</p>
                  <div className="flex items-center gap-2 mt-2 justify-end">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: `${TORAH_COLOR}18`, color: `${TORAH_COLOR}cc` }}
                    >
                      {s.folder}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="p-3 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <p className="text-xs text-white/35 mb-1.5 text-right">{label}</p>
      {children}
    </div>
  )
}
