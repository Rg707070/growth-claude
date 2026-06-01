import { Skeleton } from '@/components/ui/skeleton'

interface PageSkeletonProps {
  variant?: 'list' | 'grid'
}

export function PageSkeleton({ variant = 'list' }: PageSkeletonProps) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <Skeleton className="h-28 w-full rounded-3xl" />
      {variant === 'grid' ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      )}
    </div>
  )
}
