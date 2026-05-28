'use client'

import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  emoji?: string
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  icon: Icon,
  emoji,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-10 px-6 rounded-2xl ${className}`}
      style={{
        background: 'var(--c-surface-2)',
        border: '1px dashed var(--c-border)',
      }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
        style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
      >
        {Icon ? (
          <Icon size={22} strokeWidth={1.5} style={{ color: 'var(--muted-foreground)' }} />
        ) : (
          <span className="text-2xl leading-none">{emoji ?? '✨'}</span>
        )}
      </div>
      <p
        className="text-sm font-semibold mb-1"
        style={{ color: 'var(--foreground)' }}
      >
        {title}
      </p>
      {description && (
        <p
          className="text-xs leading-relaxed max-w-[260px]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 text-xs font-semibold px-4 py-2 rounded-xl transition-all active:scale-[0.97]"
          style={{
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
