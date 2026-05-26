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
  Menu,
  X,
  Mic,
  MicOff,
} from 'lucide-react'
import type { DocMeta } from './page'

interface SpeechRecognitionInstance extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start(): void
  stop(): void
}

interface SpeechRecognitionResultEvent extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognitionInstance
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [hasSpeechSupport, setHasSpeechSupport] = useState(false)

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLoadingDoc = useRef(false)
  const activeDocIdRef = useRef(activeDocId)
  const titleRef = useRef(title)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  useEffect(() => {
    setHasSpeechSupport('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    return () => { recognitionRef.current?.stop() }
  }, [])

  useEffect(() => { activeDocIdRef.current = activeDocId }, [activeDocId])
  useEffect(() => { titleRef.current = title }, [title])

  const activeDoc = docs.find((d) => d.id === activeDocId)
  const docDate = activeDoc ? new Date(activeDoc.created_at) : new Date()
  const docDateStr = docDate.toLocaleDateString('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

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
        class: 'tiptap-writing focus:outline-none min-h-[50dvh]',
        dir: isRTL ? 'rtl' : 'ltr',
      },
    },
    onUpdate: ({ editor: ed }: { editor: import('@tiptap/react').Editor }) => {
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
      .insert({ user_id: userId, title: isRTL ? 'ללא כותרת' : 'Untitled', content: {} })
      .select('id, title, created_at, updated_at')
      .single()
    if (data) {
      const newDoc = data as DocMeta
      setDocs((prev) => [newDoc, ...prev])
      setActiveDocId(newDoc.id)
      setTitle(newDoc.title)
      editor?.commands.clearContent()
      setSidebarOpen(false)
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

  const toggleRecording = useCallback(() => {
    if (!hasSpeechSupport) return

    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
      return
    }

    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SR) return
    const recognition = new SR()
    recognition.lang = isRTL ? 'he-IL' : 'en-US'
    recognition.continuous = true
    recognition.interimResults = false

    recognition.onresult = (event: SpeechRecognitionResultEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          editor?.commands.insertContent(event.results[i][0].transcript + ' ')
        }
      }
    }

    recognition.onend = () => setIsRecording(false)
    recognition.onerror = () => setIsRecording(false)

    recognitionRef.current = recognition
    recognition.start()
    setIsRecording(true)
  }, [hasSpeechSupport, isRecording, isRTL, editor])

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString(isRTL ? 'he-IL' : 'en-US', { day: 'numeric', month: 'short' })

  const toolbarButtons = (
    <>
      <Btn onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')}>
        <Bold size={14} />
      </Btn>
      <Btn onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')}>
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
      {hasSpeechSupport && (
        <>
          <Sep />
          <Btn onClick={toggleRecording} active={isRecording}>
            {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
          </Btn>
        </>
      )}
    </>
  )

  return (
    <div
      className="flex rounded-2xl overflow-hidden border relative"
      style={{ background: 'var(--c-card)', borderColor: 'var(--c-card-border)', minHeight: '70vh' }}
    >
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed overlay on mobile, static on desktop */}
      <div
        className={[
          'flex-shrink-0 flex flex-col border-e',
          'fixed inset-y-0 z-50 w-72 transition-transform duration-300',
          isRTL ? 'right-0' : 'left-0',
          sidebarOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full',
          'md:static md:w-48 md:translate-x-0',
        ].join(' ')}
        style={{ borderColor: 'var(--c-card-border)', background: 'var(--c-card)' }}
      >
        <div className="flex items-center gap-2 p-3">
          <button
            onClick={createDoc}
            className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ background: 'var(--c-primary-glow)', color: 'var(--primary)' }}
          >
            <Plus size={14} />
            {isRTL ? 'מסמך חדש' : 'New doc'}
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
          {docs.map((doc) => {
            const isActive = doc.id === activeDocId
            return (
              <div
                key={doc.id}
                className="group flex items-center gap-1 rounded-xl px-2 py-2 cursor-pointer transition-colors"
                style={isActive ? { background: 'var(--c-primary-glow)' } : {}}
                onClick={() => { setActiveDocId(doc.id); setSidebarOpen(false) }}
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
                    onClick={(e) => { e.stopPropagation(); void deleteDoc(doc.id) }}
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
            {/* Desktop toolbar (top) */}
            <div
              className="hidden md:flex items-center gap-0.5 px-4 py-2 border-b flex-wrap"
              style={{ borderColor: 'var(--c-card-border)' }}
            >
              {toolbarButtons}
              <div className="flex-1" />
              <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                {saveState === 'saved' ? (isRTL ? '✓ נשמר' : '✓ Saved') : saveState === 'saving' ? '...' : ''}
              </span>
            </div>

            {/* Mobile top bar */}
            <div
              className="flex md:hidden items-center gap-2 px-4 py-2 border-b"
              style={{ borderColor: 'var(--c-card-border)' }}
            >
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg -ms-1"
                style={{ color: 'var(--muted-foreground)' }}
              >
                <Menu size={18} />
              </button>
              <span className="flex-1 text-xs font-medium truncate" style={{ color: 'var(--foreground)' }}>
                {title || (isRTL ? 'ללא כותרת' : 'Untitled')}
              </span>
              <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                {saveState === 'saved' ? (isRTL ? '✓ נשמר' : '✓ Saved') : saveState === 'saving' ? '...' : ''}
              </span>
            </div>

            {/* Document — extra bottom padding on mobile for the fixed toolbar */}
            <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
              <div className="max-w-2xl mx-auto px-4 md:px-8 py-6">

                {/* בס"ד + date — outside the writing zone */}
                <div
                  className="text-center mb-6 pb-4 border-b"
                  style={{ borderColor: 'var(--c-card-border)' }}
                >
                  <p
                    className="text-xs font-semibold tracking-widest"
                    style={{ color: 'var(--muted-foreground)' }}
                    dir="rtl"
                  >
                    בס"ד
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                    {docDateStr}
                  </p>
                </div>

                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => void saveTitle()}
                  placeholder={isRTL ? 'כותרת...' : 'Title...'}
                  className="w-full text-2xl font-bold bg-transparent border-none outline-none mb-6"
                  style={{ color: 'var(--foreground)', direction: isRTL ? 'rtl' : 'ltr' }}
                />
                <EditorContent editor={editor} />
              </div>
            </div>

            {/* Mobile bottom toolbar — fixed above keyboard */}
            <div
              className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center gap-0.5 px-4 py-3 border-t"
              style={{
                borderColor: 'var(--c-card-border)',
                background: 'var(--c-card)',
                paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))',
              }}
            >
              {toolbarButtons}
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
      className="p-2 md:p-1.5 rounded-lg transition-colors"
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
