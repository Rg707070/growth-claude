'use client'

interface StreakBadgeProps {
  streak: number
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  if (streak === 0) return null

  const size = streak >= 30 ? 'text-2xl' : streak >= 14 ? 'text-xl' : streak >= 7 ? 'text-lg' : 'text-base'
  const label = streak >= 30 ? '🔥🔥🔥' : streak >= 14 ? '🔥🔥' : '🔥'
  const glow = streak >= 30
    ? 'shadow-[0_0_20px_rgba(251,146,60,0.6)]'
    : streak >= 14
    ? 'shadow-[0_0_14px_rgba(251,146,60,0.4)]'
    : streak >= 7
    ? 'shadow-[0_0_10px_rgba(251,146,60,0.25)]'
    : ''

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/30 ${glow}`}
    >
      <span className={`${size} animate-flame`}>{label}</span>
      <span className="text-orange-300 font-bold text-sm">{streak}</span>
      <span className="text-orange-300/60 text-xs">ימים</span>
    </div>
  )
}
