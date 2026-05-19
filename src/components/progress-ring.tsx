'use client'

import { useId } from 'react'

interface ProgressRingProps {
  percentage: number
  color: string
  size?: number
  strokeWidth?: number
  children?: React.ReactNode
  gradientTo?: string
}

export function ProgressRing({
  percentage,
  color,
  size = 60,
  strokeWidth = 5,
  children,
  gradientTo,
}: ProgressRingProps) {
  const gradId = useId()
  const radius = (size - strokeWidth * 2) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  const useGradient = Boolean(gradientTo)

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          {useGradient && (
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={gradientTo} />
            </linearGradient>
          )}
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeOpacity={0.14}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={useGradient ? `url(#${gradId})` : color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children ?? (
          <span className="text-xs font-bold" style={{ color }}>{percentage}%</span>
        )}
      </div>
    </div>
  )
}
