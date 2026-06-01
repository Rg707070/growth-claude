interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl ${className}`}
      style={{ background: 'var(--c-surface-2, rgba(127,127,127,0.12))', ...style }}
    >
      <div className="absolute inset-0 animate-shimmer" />
    </div>
  )
}
