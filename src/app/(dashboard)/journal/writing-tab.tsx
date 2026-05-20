'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Plus,
  Trash2,
} from 'lucide-react'
import type { DocMeta } from './page'

interface WritingTabProps {
  userId: string
  initialDocs: DocMeta[]
}

export function WritingTab({ userId, initialDocs }: WritingTabProps) {
  const { isRTL } = useLang()
  const [docs, setDocs] = useState<DocMeta[]>(initialDocs)
  const [activeDocId, setActiveDocId] = useState<string | null>(initialDocs[0]?.id ?? null)
  const [title, setTitle] = useState(initialDocs[0]?.title ?? '')
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLoadingDoc = useRef(false)
  const activeDocIdRef = useRef(activeDocId)
  const titleRef = useRef(title)

  useEffect(() => { activeDocIdRef.current = activeDocId }, [activeDocId])
  useEffect(() => { titleRef.current = title }, [title])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: isRTL ? 'התחל לכתוב...' : 'Start writing...',
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'tiptap-writing focus:outline-none min-h-96',
        dir: isRTL ? 'rtl' : 'ltr',
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (isLoadingDoc.current) return
      setSaveState('unsaved')
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        void persistDoc(ed.getJSON())
      }, 1400)
    },
  })

  const persistDoc = useCallback(
    async (content: object) => {
      const docId = activeDocIdRef.current
      if (!docId) return
      setSaveState('saving')
      const supabase = createClient()
      await supabase
        .from('journal_documents')
        .update({ content, title: titleRef.current, updated_at: new Date().toISOString() })
        .eq('id', docId)
        .eq('user_id', userId)
      setSaveState('saved')
      setDocs((prev) =>
        prev.map((d) =>
          d.id === docId ? { ...d, title: titleRef.current, updated_at: new Date().toISOString() } : d
        )
      )
    },
    [userId]
  )

  const loadDoc = useCallback(
    async (docId: string) => {
      isLoadingDoc.current = true
      const supabase = createClient()
      const { data } = await supabase
        .from('journal_documents')
        .select('title, content')
        .eq('id', docId)
        .eq('user_id', userId)
        .single()
      if (data) {
        setTitle(data.title as string)
        editor?.commands.setContent(data.content as object)
      }
      isLoadingDoc.current = false
    },
    [editor, userId]
  )

  useEffect(() => {
    if (activeDocId) void loadDoc(activeDocId)
  }, [activeDocId, loadDoc])

  const saveTitle = useCallback(async () => {
    if (!activeDocId) return
    const supabase = createClient()
    await supabase
      .from('journal_documents')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', activeDocId)
      .eq('user_id', userId)
    setDocs((prev) => prev.map((d) => (d.id === activeDocId ? { ...d, title } : d)))
  }, [activeDocId, title, userId])

  const createDoc = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('journal_documents')
      .insert({
        user_id: userId,
        title: isRTL ? 'ללא כותרת' : 'Untitled',
        content: {},
      })
      .select('id, title, created_at, updated_at')
      .single()
    if (data) {
      const newDoc = data as DocMeta
      setDocs((prev) => [newDoc, ...prev])
      setActiveDocId(newDoc.id)
      setTitle(newDoc.title)
      editor?.commands.clearContent()
    }
  }

  const deleteDoc = async (docId: string) => {
    if (!confirm(isRTL ? 'למחוק מסמך זה?' : 'Delete this document?')) return
    const supabase = createClient()
    await supabase.from('journal_documents').delete().eq('id', docId).eq('user_id', userId)
    const remaining = docs.filter((d) => d.id !== docId)
    setDocs(remaining)
    if (activeDocId === docId) {
      setActiveDocId(remaining[0]?.id ?? null)
      setTitle(remaining[0]?.title ?? '')
    }
  }

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString(isRTL ? 'he-IL' : 'en-US', { day: 'numeric', month: 'short' })

  return (
    <div
      className="flex rounded-2xl overflow-hidden border"
      style={{
        background: 'var(--c-card)',
        borderColor: 'var(--c-card-border)',
        minHeight: '70vh',
      }}
    >
      {/* Sidebar */}
      <div
        className="w-48 flex-shrink-0 flex flex-col border-e"
        style={{ borderColor: 'var(--c-card-border)' }}
      >
        <button
          onClick={createDoc}
          className="flex items-center gap-2 m-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
          style={{ background: 'var(--c-primary-glow)', color: 'var(--primary)' }}
        >
          <Plus size={14} />
          {isRTL ? 'מסמך חדש' : 'New doc'}
        </button>

        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
          {docs.map((doc) => {
            const isActive = doc.id === activeDocId
            return (
              <div
                key={doc.id}
                className="group flex items-center gap-1 rounded-xl px-2 py-2 cursor-pointer transition-colors"
                style={isActive ? { background: 'var(--c-primary-glow)' } : {}}
                onClick={() => setActiveDocId(doc.id)}
              >
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-medium truncate"
                    style={{ color: isActive ? 'var(--primary)' : 'var(--foreground)' }}
                  >
                    {doc.title || (isRTL ? 'ללא כותרת' : 'Untitled')}
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                    {fmt(doc.updated_at)}
                  </p>
                </div>
                {docs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      void deleteDoc(doc.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity hover:text-red-400"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            )
          })}

          {docs.length === 0 && (
            <p className="text-xs text-center py-6" style={{ color: 'var(--muted-foreground)' }}>
              {isRTL ? 'אין מסמכים' : 'No documents'}
            </p>
          )}
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeDocId ? (
          <>
            {/* Toolbar */}
            <div
              className="flex items-center gap-0.5 px-4 py-2 border-b flex-wrap"
              style={{ borderColor: 'var(--c-card-border)' }}
            >
              <Btn
                onClick={() => editor?.chain().focus().toggleBold().run()}
                active={editor?.isActive('bold')}
              >
                <Bold size={14} />
              </Btn>
              <Btn
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                active={editor?.isActive('italic')}
              >
                <Italic size={14} />
              </Btn>
              <Sep />
              <Btn
                onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                active={editor?.isActive('heading', { level: 1 })}
              >
                <Heading1 size={14} />
              </Btn>
              <Btn
                onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                active={editor?.isActive('heading', { level: 2 })}
              >
                <Heading2 size={14} />
              </Btn>
              <Sep />
              <Btn
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                active={editor?.isActive('bulletList')}
              >
                <List size={14} />
              </Btn>
              <Btn
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                active={editor?.isActive('orderedList')}
              >
                <ListOrdered size={14} />
              </Btn>
              <Btn
                onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                active={editor?.isActive('blockquote')}
              >
                <Quote size={14} />
              </Btn>
              <div className="flex-1" />
              <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                {saveState === 'saved'
                  ? isRTL
                    ? '✓ נשמר'
                    : '✓ Saved'
                  : saveState === 'saving'
                  ? '...'
                  : ''}
              </span>
            </div>

            {/* Document */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto px-8 py-8">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => void saveTitle()}
                  placeholder={isRTL ? 'כותרת...' : 'Title...'}
                  className="w-full text-2xl font-bold bg-transparent border-none outline-none mb-6"
                  style={{
                    color: 'var(--foreground)',
                    direction: isRTL ? 'rtl' : 'ltr',
                  }}
                />
                <EditorContent editor={editor} />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <button
              onClick={createDoc}
              className="flex flex-col items-center gap-3 p-10 rounded-2xl transition-colors hover:bg-white/5"
            >
              <Plus size={36} style={{ color: 'var(--muted-foreground)' }} />
              <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {isRTL ? 'צור מסמך ראשון' : 'Create your first document'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Btn({
  onClick,
  active,
  children,
}: {
  onClick: () => void
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="p-1.5 rounded-lg transition-colors"
      style={
        active
          ? { background: 'var(--c-primary-glow)', color: 'var(--primary)' }
          : { color: 'var(--muted-foreground)' }
      }
    >
      {children}
    </button>
  )
}

function Sep() {
  return <div className="w-px h-4 mx-1" style={{ background: 'var(--c-card-border)' }} />
}
