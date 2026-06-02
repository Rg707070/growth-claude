import type { SupabaseClient } from '@supabase/supabase-js'

export type BookLinkSourceType = 'learning_summary' | 'journal_document' | 'journal_entry'

export interface BookLink {
  id: string
  user_id: string
  book_id: string
  source_type: BookLinkSourceType
  source_id: string
  created_at: string
}

export interface LinkedItem {
  id: string
  sourceType: BookLinkSourceType
  sourceId: string
  title: string
  preview: string
  href: string
}

type SourceRow = Record<string, unknown>

interface SourceConfig {
  table: string
  selectColumns: string
  toTitle: (row: SourceRow) => string
  toPreview: (row: SourceRow) => string
  toHref: (row: SourceRow) => string
}

const PREVIEW_LEN = 140

// journal_documents.content stores Tiptap JSON (the column is `text`, so it may
// arrive as an object or a JSON string). Walk the node tree collecting text.
function extractTiptapText(content: unknown): string {
  let node: unknown = content
  if (typeof node === 'string') {
    const trimmed = node.trim()
    if (!trimmed) return ''
    try {
      node = JSON.parse(trimmed)
    } catch {
      return trimmed
    }
  }
  if (!node || typeof node !== 'object') return ''
  const parts: string[] = []
  const walk = (n: unknown): void => {
    if (!n || typeof n !== 'object') return
    const obj = n as Record<string, unknown>
    if (typeof obj.text === 'string') parts.push(obj.text)
    if (Array.isArray(obj.content)) obj.content.forEach(walk)
  }
  walk(node)
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

export const BOOK_LINK_SOURCES: Record<BookLinkSourceType, SourceConfig> = {
  learning_summary: {
    table: 'learning_summaries',
    selectColumns: 'id, title, content',
    toTitle: (r) => String(r.title ?? ''),
    toPreview: (r) => String(r.content ?? '').slice(0, PREVIEW_LEN),
    toHref: (r) => `/domain/torah?tab=summaries&summary=${String(r.id)}`,
  },
  journal_document: {
    table: 'journal_documents',
    selectColumns: 'id, title, content',
    toTitle: (r) => String(r.title ?? ''),
    toPreview: (r) => extractTiptapText(r.content).slice(0, PREVIEW_LEN),
    toHref: (r) => `/journal?tab=writing&doc=${String(r.id)}`,
  },
  journal_entry: {
    table: 'journal_entries',
    selectColumns: 'id, domain_slug, date, text',
    toTitle: (r) => String(r.date ?? ''),
    toPreview: (r) => String(r.text ?? '').slice(0, PREVIEW_LEN),
    toHref: (r) => `/domain/${String(r.domain_slug)}`,
  },
}

export async function fetchLinksForSource(
  supabase: SupabaseClient,
  params: { sourceType: BookLinkSourceType; sourceId: string },
): Promise<BookLink[]> {
  const { data } = await supabase
    .from('book_links')
    .select('*')
    .eq('source_type', params.sourceType)
    .eq('source_id', params.sourceId)
  return (data as BookLink[] | null) ?? []
}

export async function attachLink(
  supabase: SupabaseClient,
  params: { userId: string; bookId: string; sourceType: BookLinkSourceType; sourceId: string },
): Promise<void> {
  await supabase.from('book_links').upsert(
    {
      user_id: params.userId,
      book_id: params.bookId,
      source_type: params.sourceType,
      source_id: params.sourceId,
    },
    { onConflict: 'book_id,source_type,source_id', ignoreDuplicates: true },
  )
}

export async function detachLink(
  supabase: SupabaseClient,
  params: { bookId: string; sourceType: BookLinkSourceType; sourceId: string },
): Promise<void> {
  await supabase
    .from('book_links')
    .delete()
    .eq('book_id', params.bookId)
    .eq('source_type', params.sourceType)
    .eq('source_id', params.sourceId)
}

// Fetch all linked items for a book, normalized for display. Link rows whose
// underlying source row was deleted are silently skipped (orphan filtering).
export async function fetchLinkedItems(
  supabase: SupabaseClient,
  bookId: string,
): Promise<LinkedItem[]> {
  const { data: links } = await supabase
    .from('book_links')
    .select('id, source_type, source_id')
    .eq('book_id', bookId)
    .order('created_at', { ascending: false })

  const typed = (links as Pick<BookLink, 'id' | 'source_type' | 'source_id'>[] | null) ?? []
  if (typed.length === 0) return []

  const idsByType = new Map<BookLinkSourceType, string[]>()
  for (const link of typed) {
    const arr = idsByType.get(link.source_type) ?? []
    arr.push(link.source_id)
    idsByType.set(link.source_type, arr)
  }

  const rowsByType = new Map<BookLinkSourceType, Map<string, SourceRow>>()
  for (const [sourceType, ids] of idsByType) {
    const cfg = BOOK_LINK_SOURCES[sourceType]
    const { data: rows } = await supabase.from(cfg.table).select(cfg.selectColumns).in('id', ids)
    const map = new Map<string, SourceRow>()
    for (const row of (rows as SourceRow[] | null) ?? []) {
      map.set(String(row.id), row)
    }
    rowsByType.set(sourceType, map)
  }

  const items: LinkedItem[] = []
  for (const link of typed) {
    const row = rowsByType.get(link.source_type)?.get(link.source_id)
    if (!row) continue
    const cfg = BOOK_LINK_SOURCES[link.source_type]
    items.push({
      id: link.id,
      sourceType: link.source_type,
      sourceId: link.source_id,
      title: cfg.toTitle(row),
      preview: cfg.toPreview(row),
      href: cfg.toHref(row),
    })
  }
  return items
}
