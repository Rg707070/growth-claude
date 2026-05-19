'use client'

import { useId } from 'react'

interface GrowthLogoProps {
  variant?: 'full' | 'icon' | 'mark'
  size?: number
  className?: string
  monochrome?: 'light' | 'dark' | false
}

export function GrowthLogo({
  variant = 'full',
  size = 40,
  className = '',
  monochrome = false,
}: GrowthLogoProps) {
  const gradId = useId()
  const leafId = useId()

  const mainGrad = monochrome === 'light'
    ? '#FFFFFF'
    : monochrome === 'dark'
      ? '#0B2447'
      : `url(#${gradId})`

  const leafGrad = monochrome === 'light'
    ? '#FFFFFF'
    : monochrome === 'dark'
      ? '#0B2447'
      : `url(#${leafId})`

  const Icon = (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0B2447" />
          <stop offset="35%" stopColor="#1E5F8C" />
          <stop offset="70%" stopColor="#0E9F6E" />
          <stop offset="100%" stopColor="#84CC16" />
        </linearGradient>
        <linearGradient id={leafId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0E9F6E" />
          <stop offset="100%" stopColor="#A3E635" />
        </linearGradient>
      </defs>

      <path
        d="M 10 88 Q 32 78 50 56 Q 66 36 78 20"
        stroke={mainGrad}
        strokeWidth="11"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 22 90 Q 40 82 54 66 Q 66 52 72 38"
        stroke={mainGrad}
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M 34 92 Q 46 86 56 76 Q 64 66 68 56"
        stroke={mainGrad}
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        opacity="0.45"
      />

      <path
        d="M 64 18 L 82 16 L 80 36"
        stroke={mainGrad}
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M 78 14 L 78 6"
        stroke={monochrome ? mainGrad : '#0E9F6E'}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 78 12 C 72 11 70 5 75 4 C 80 5 80 11 78 12 Z"
        fill={leafGrad}
      />
      <path
        d="M 78 9 C 84 8 86 3 81 2 C 76 3 76 9 78 9 Z"
        fill={leafGrad}
      />
    </svg>
  )

  if (variant === 'icon') {
    return <span className={`inline-flex ${className}`}>{Icon}</span>
  }

  if (variant === 'mark') {
    return (
      <span
        className={`font-black tracking-tight leading-none ${className}`}
        style={{
          fontSize: size,
          background: monochrome
            ? monochrome === 'light' ? '#FFFFFF' : '#0B2447'
            : 'linear-gradient(135deg, #0B2447 0%, #1E5F8C 40%, #0E9F6E 75%, #84CC16 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.02em',
        }}
      >
        GROWTH
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {Icon}
      <span
        className="font-black tracking-tight leading-none"
        style={{
          fontSize: size * 0.62,
          background: monochrome
            ? monochrome === 'light' ? '#FFFFFF' : '#0B2447'
            : 'linear-gradient(135deg, #0B2447 0%, #1E5F8C 40%, #0E9F6E 75%, #84CC16 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.02em',
        }}
      >
        GROWTH
      </span>
    </span>
  )
}
