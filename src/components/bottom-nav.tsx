'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Grid3X3, CalendarDays, Settings, BookOpen, NotebookPen, Plus, X, type LucideIcon } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useLang } from '@/lib/lang'
import { AddHabitDialog } from '@/components/add-habit-dialog'

type NavItem = {
  id: string
  icon: LucideIcon
  href: string
  labelHe: string
  labelEn: string
}

const DEFAULT_ITEMS: NavItem[] = [
  { id: 'dashboard', icon: Home,         href: '/dashboard', labelHe: 'בית',    labelEn: 'Home'     },
  { id: 'domains',   icon: Grid3X3,      href: '/domains',   labelHe: 'תחומים', labelEn: 'Domains'  },
  { id: 'reading',   icon: BookOpen,     href: '/reading',   labelHe: 'ספרים',  labelEn: 'Books'    },
  { id: 'journal',   icon: NotebookPen,  href: '/journal',   labelHe: 'יומן',   labelEn: 'Journal'  },
  { id: 'schedule',  icon: CalendarDays, href: '/schedule',  labelHe: 'לוז',    labelEn: 'Schedule' },
  { id: 'settings',  icon: Settings,     href: '/settings',  labelHe: 'הגדרות', labelEn: 'Settings' },
]

const STORAGE_KEY = 'nav-order'

function loadOrder(): NavItem[] {
  if (typeof window === 'undefined') return DEFAULT_ITEMS
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return DEFAULT_ITEMS
    const ids: string[] = JSON.parse(saved)
    const map = Object.fromEntries(DEFAULT_ITEMS.map((i) => [i.id, i]))
    const ordered = ids.map((id) => map[id]).filter(Boolean)
    // add any new items not yet in saved order
    const missing = DEFAULT_ITEMS.filter((i) => !ids.includes(i.id))
    return [...ordered, ...missing]
  } catch {
    return DEFAULT_ITEMS
  }
}

function saveOrder(items: NavItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.map((i) => i.id)))
}

// ─── Sortable nav button ───────────────────────────────────────────────────

function SortableNavButton({
  item,
  isActive,
  isEditMode,
  onClick,
  isRTL,
}: {
  item: NavItem
  isActive: boolean
  isEditMode: boolean
  onClick: () => void
  isRTL: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !isEditMode,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <button
      ref={setNodeRef}
      style={{
        ...style,
        background: isActive && !isEditMode ? 'var(--c-primary-glow)' : isEditMode ? 'var(--c-primary-glow)' : undefined,
        outline: isEditMode ? '1.5px dashed var(--c-nav-border)' : undefined,
        borderRadius: '50%',
      }}
      className="relative flex items-center justify-center w-11 h-11 rounded-full transition-colors duration-200 active:scale-90"
      onClick={isEditMode ? undefined : onClick}
      aria-label={isRTL ? item.labelHe : item.labelEn}
      {...(isEditMode ? { ...attributes, ...listeners } : {})}
    >
      <item.icon
        size={22}
        strokeWidth={isActive && !isEditMode ? 2.4 : 1.7}
        style={{ color: isActive && !isEditMode ? 'var(--primary)' : isEditMode ? 'var(--muted-foreground)' : 'var(--muted-foreground)' }}
      />
      {isActive && !isEditMode && (
        <span
          aria-hidden
          className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
          style={{ background: 'var(--primary)' }}
        />
      )}
      {isEditMode && (
        <span
          aria-hidden
          className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full flex items-center justify-center"
          style={{ background: 'var(--muted-foreground)', opacity: 0.5 }}
        />
      )}
    </button>
  )
}

// ─── Main component ────────────────────────────────────────────────────────

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { isRTL } = useLang()

  const [items, setItems] = useState<NavItem[]>(DEFAULT_ITEMS)
  const [isEditMode, setIsEditMode] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const editModeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [open, setOpen] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is SSR-unsafe, must sync post-mount
    setItems(loadOrder())
  }, [])

  // Auto-exit edit mode after 4s of inactivity
  const resetEditTimer = useCallback(() => {
    if (editModeTimer.current) clearTimeout(editModeTimer.current)
    editModeTimer.current = setTimeout(() => setIsEditMode(false), 4000)
  }, [])

  const enterEditMode = useCallback(() => {
    setIsEditMode(true)
    resetEditTimer()
  }, [resetEditTimer])

  const exitEditMode = useCallback(() => {
    setIsEditMode(false)
    if (editModeTimer.current) clearTimeout(editModeTimer.current)
  }, [])

  const handleLongPressStart = () => {
    longPressTimer.current = setTimeout(enterEditMode, 500)
  }

  const handleLongPressEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((i) => i.id === active.id)
        const newIndex = prev.findIndex((i) => i.id === over.id)
        const next = arrayMove(prev, oldIndex, newIndex)
        saveOrder(next)
        return next
      })
    }
    resetEditTimer()
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 0, tolerance: 5 } }),
  )

  const half = Math.floor(items.length / 2)
  const leftItems = items.slice(0, half)
  const rightItems = items.slice(half)

  return (
    <>
      {open && <AddHabitDialog variant="sheet" onClose={() => setOpen(false)} />}

      {/* Floating pill */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={horizontalListSortingStrategy}>
          <nav
            className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 md:hidden"
            style={{
              background: 'var(--c-nav)',
              border: `1px solid ${isEditMode ? 'var(--primary)' : 'var(--c-nav-border)'}`,
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderRadius: '999px',
              boxShadow: `0 8px 32px var(--c-shadow-lg), 0 2px 8px var(--c-shadow-md)${isEditMode ? ', 0 0 0 2px var(--c-primary-glow)' : ''}`,
              padding: '8px 12px',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onPointerDown={handleLongPressStart}
            onPointerUp={handleLongPressEnd}
            onPointerLeave={handleLongPressEnd}
          >
            <div className="flex items-center gap-1">
              {leftItems.map((item) => (
                <SortableNavButton
                  key={item.id}
                  item={item}
                  isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                  isEditMode={isEditMode}
                  onClick={() => router.push(item.href)}
                  isRTL={isRTL}
                />
              ))}

              {/* Center: add habit or done button */}
              {isEditMode ? (
                <button
                  onClick={exitEditMode}
                  className="flex items-center justify-center w-11 h-11 rounded-full mx-1 transition-all duration-200 active:scale-90"
                  style={{
                    background: 'var(--brand-gradient)',
                    boxShadow: '0 4px 14px var(--c-shadow-md)',
                  }}
                  aria-label={isRTL ? 'סיום עריכה' : 'Done'}
                >
                  <X size={18} strokeWidth={2.6} color="white" />
                </button>
              ) : (
                <button
                  onClick={() => setOpen(true)}
                  className="flex items-center justify-center w-11 h-11 rounded-full mx-1 transition-all duration-200 active:scale-90 hover:scale-105"
                  style={{
                    background: 'var(--brand-gradient)',
                    boxShadow: '0 4px 14px var(--c-shadow-md)',
                  }}
                  aria-label={isRTL ? 'הוסף הרגל' : 'Add habit'}
                >
                  <Plus size={20} strokeWidth={2.6} color="white" />
                </button>
              )}

              {rightItems.map((item) => (
                <SortableNavButton
                  key={item.id}
                  item={item}
                  isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                  isEditMode={isEditMode}
                  onClick={() => router.push(item.href)}
                  isRTL={isRTL}
                />
              ))}
            </div>

            {/* Edit mode hint */}
            {isEditMode && (
              <div
                className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] px-3 py-1 rounded-full"
                style={{
                  background: 'var(--c-nav)',
                  border: '1px solid var(--c-nav-border)',
                  color: 'var(--muted-foreground)',
                }}
              >
                {isRTL ? 'גרור לסידור מחדש' : 'Drag to reorder'}
              </div>
            )}
          </nav>
        </SortableContext>
      </DndContext>
    </>
  )
}
