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
    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
    const { data } = await supabase
      .from('learning_summaries')
      .insert({ user_id: userId, title: title.trim(), content: content.trim(), source: source.trim() || null, folder, tags })
      .select().single()
    if (data) onCreated(data as LearningSummary)
    setSaving(false); setTitle(''); setContent(''); setSource(''); setTagsInput(''); setFolder('כללי'); setView('list')
  }

  async function updateSummary() {
    if (!selected || !title.trim() || !content.trim()) return
    setSaving(true)
    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
    const { data } = await supabase
      .from('learning_summaries')
      .update({ title: title.trim(), content: content.trim(), source: source.trim() || null, folder, tags })
      .eq('id', selected.id).select().single()
    if (data) {
      const updated = data as LearningSummary
      onUpdated(updated); setSelected(updated)
    }
    setSaving(false); setView('view')
  }

  async function toggleFavorite(summary: LearningSummary) {
    const next = !summary.is_favorite
    await supabase.from('learning_summaries').update({ is_favorite: next }).eq('id', summary.id)
    onUpdated({ ...summary, is_favorite: next })
    if (selected?.id === summary.id) setSelected({ ...summary, is_favorite: next })
  }

  async function deleteSummary(id: string) {
    await supabase.from('learning_summaries').delete().eq('id', id)
    onDeleted(id); setView('list'); setSelected(null)
  }

  if (view === 'create' || (view === 'edit' && selected)) {
    const isEdit = view === 'edit'
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <button
            onClick={() => isEdit ? setView('view') : setView('list')}
            className="text-xs transition-opacity hover:opacity-70"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {t('cancel')}
          </button>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            {isEdit ? t('editSummary') : t('newSummary')}
          </h2>
        </div>

        <div className="space-y-3">
          <Field label={t('summaryTitle')}>
            <input
              value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="כותרת הסיכום"
              className="w-full bg-transparent text-sm py-1 outline-none text-right font-medium"
              style={{ color: 'var(--foreground)' }}
              dir="rtl"
            />
          </Field>

          <Field label={t('summarySource')}>
            <input
              value={source} onChange={(e) => setSource(e.target.value)}
              placeholder="ברכות ב:א / שיעור של הרב..."
              className="w-full bg-transparent text-sm py-1 outline-none text-right"
              style={{ color: 'var(--foreground)' }}
              dir="rtl"
            />
          </Field>

          <Field label={t('summaryFolder')}>
            <div className="relative">
              <button
                onClick={() => setShowFolderPicker((v) => !v)}
                className="flex items-center gap-1.5 text-sm text-right font-medium"
                style={{ color: TORAH_COLOR }}
              >
                {folder} <ChevronDown size={13} />
              </button>
              {showFolderPicker && (
                <div className="absolute top-7 right-0 z-20 rounded-xl p-2 flex flex-col gap-1 min-w-36"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                  {DEFAULT_FOLDERS.map((f) => (
                    <button key={f} onClick={() => { setFolder(f); setShowFolderPicker(false) }}
                      className="text-sm text-right px-3 py-2 rounded-lg transition-colors"
                      style={{ color: folder === f ? TORAH_COLOR : 'var(--muted-foreground)', background: folder === f ? `${TORAH_COLOR}10` : 'transparent' }}>
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Field>

          <Field label={t('summaryTags')}>
            <input
              value={tagsInput} onChange={(e) => setTagsInput(e.target.value)}
              placeholder="ברכות, תפילה, שחרית"
              className="w-full bg-transparent text-sm py-1 outline-none text-right"
              style={{ color: 'var(--foreground)' }}
              dir="rtl"
            />
          </Field>

          <div>
            <p className="text-xs text-right mb-2" style={{ color: 'var(--muted-foreground)' }}>{t('summaryContent')}</p>
            <textarea
              value={content} onChange={(e) => setContent(e.target.value)}
              placeholder="כתוב כאן את הסיכום שלך..."
              rows={9}
              className="w-full bg-transparent text-sm outline-none text-right resize-none leading-relaxed border-b"
              style={{ color: 'var(--foreground)', borderColor: 'var(--border)' }}
              dir="rtl"
            />
          </div>
        </div>

        <button
          onClick={isEdit ? updateSummary : createSummary}
          disabled={!title.trim() || !content.trim() || saving}
          className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-30 active:scale-[0.99]"
          style={{
            background: TORAH_COLOR,
            color: '#fff',
            boxShadow: (title.trim() && content.trim()) ? `0 4px 16px ${TORAH_COLOR}40` : 'none',
          }}
        >
          {t('save')}
        </button>
      </div>
    )
  }

  if (view === 'view' && selected) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button onClick={() => toggleFavorite(selected)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95"
              style={{ background: 'var(--secondary)' }}>
              {selected.is_favorite
                ? <Star size={17} style={{ color: GOLD }} fill={GOLD} />
                : <StarOff size={17} style={{ color: 'var(--muted-foreground)' }} />
              }
            </button>
            <button
              onClick={() => {
                setTitle(selected.title); setContent(selected.content)
                setSource(selected.source ?? ''); setFolder(selected.folder)
                setTagsInput(selected.tags.join(', ')); setView('edit')
              }}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95"
              style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={() => deleteSummary(selected.id)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95"
              style={{ background: 'rgba(239,68,68,0.10)', color: 'rgba(239,68,68,0.65)' }}
            >
              <Trash2 size={16} />
            </button>
          </div>
          <button onClick={() => setView('list')} className="text-xs font-medium transition-opacity hover:opacity-70"
            style={{ color: 'var(--muted-foreground)' }}>
            ← חזרה
          </button>
        </div>

        <div>
          <span className="inline-block text-xs px-2.5 py-1 rounded-full mb-3"
            style={{ background: `${TORAH_COLOR}18`, color: TORAH_COLOR }}>
            {selected.folder}
          </span>
          <h2 className="text-xl font-bold text-right leading-snug mb-2"
            style={{ color: 'var(--foreground)' }}>
            {selected.title}
          </h2>
          {selected.source && (
            <p className="text-xs text-right mb-5" style={{ color: 'var(--muted-foreground)' }}>{selected.source}</p>
          )}
          <p className="text-sm leading-relaxed text-right whitespace-pre-wrap"
            style={{ color: 'var(--foreground)' }}>
            {selected.content}
          </p>
        </div>

        {selected.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-end pt-1">
            {selected.tags.map((tag) => (
              <span key={tag} className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}>
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search + new */}
      <div className="flex gap-2">
        <button
          onClick={() => setView('create')}
          className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:opacity-80 active:scale-95"
          style={{ background: TORAH_COLOR, boxShadow: `0 2px 10px ${TORAH_COLOR}40` }}
        >
          <Plus size={17} color="#fff" />
        </button>
        <div className="flex-1 flex items-center gap-2 rounded-xl px-3 h-10"
          style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }}>
          <Search size={14} className="shrink-0" style={{ color: 'var(--muted-foreground)' }} />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search')}
            className="flex-1 bg-transparent text-sm outline-none text-right"
            style={{ color: 'var(--foreground)' }}
            dir="rtl"
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ color: 'var(--muted-foreground)' }}>
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setFavOnly((v) => !v)}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
          style={favOnly
            ? { background: `${GOLD}20`, color: GOLD }
            : { background: 'var(--secondary)', color: 'var(--muted-foreground)' }
          }
        >
          <Star size={11} />
          {t('favorites')}
        </button>
        {allFolders.map((f) => (
          <button key={f} onClick={() => setFolderFilter(f)}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all"
            style={folderFilter === f
              ? { background: `${TORAH_COLOR}20`, color: TORAH_COLOR }
              : { background: 'var(--secondary)', color: 'var(--muted-foreground)' }
            }
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="py-14 text-center">
          <p className="text-sm mb-1" style={{ color: 'var(--muted-foreground)' }}>
            {summaries.length === 0 ? t('noSummariesYet') : 'אין תוצאות'}
          </p>
          {summaries.length === 0 && (
            <button
              onClick={() => setView('create')}
              className="mt-4 text-xs px-5 py-2.5 rounded-full transition-opacity hover:opacity-80"
              style={{ background: `${TORAH_COLOR}18`, color: TORAH_COLOR }}
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
              className="w-full text-right rounded-2xl overflow-hidden transition-all hover:opacity-80 active:scale-[0.99]"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-stretch">
                {/* Teal accent strip */}
                <div className="w-1 shrink-0" style={{ background: `${TORAH_COLOR}50` }} />
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 shrink-0">
                      {s.is_favorite && <Star size={13} style={{ color: GOLD }} fill={GOLD} />}
                      <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {formatDate(s.created_at)}
                      </span>
                    </div>
                    <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--foreground)' }}>
                      {s.title}
                    </p>
                  </div>
                  <p className="text-xs line-clamp-2 leading-relaxed text-right mb-2.5"
                    style={{ color: 'var(--muted-foreground)' }}>
                    {s.content}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    {s.tags.length > 0 ? (
                      <div className="flex gap-1.5 flex-wrap">
                        {s.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="text-xs px-1.5 py-0.5 rounded"
                            style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}>
                            #{tag}
                          </span>
                        ))}
                        {s.tags.length > 2 && (
                          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            +{s.tags.length - 2}
                          </span>
                        )}
                      </div>
                    ) : <span />}
                    <span className="text-xs px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: `${TORAH_COLOR}15`, color: `${TORAH_COLOR}cc` }}>
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
    <div className="p-4 rounded-xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <p className="text-xs mb-2 text-right font-medium" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
      {children}
    </div>
  )
}
