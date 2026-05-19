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
  const accentId = useId()

  const stops = monochrome
    ? [
        { offset: '0%', color: monochrome === 'light' ? '#FFFFFF' : '#0B2447' },
        { offset: '100%', color: monochrome === 'light' ? '#FFFFFF' : '#0B2447' },
      ]
    : [
        { offset: '0%', color: '#0B2447' },
        { offset: '32%', color: '#1E5F74' },
        { offset: '62%', color: '#0E9F6E' },
        { offset: '100%', color: '#A3E635' },
      ]

  const Icon = (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="50%" y1="100%" x2="50%" y2="0%">
          {stops.map((s, i) => (
            <stop key={i} offset={s.offset} stopColor={s.color} />
          ))}
        </linearGradient>
        <linearGradient id={accentId} x1="50%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor="#0E9F6E" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#A3E635" stopOpacity="0.95" />
        </linearGradient>
      </defs>

      {/* Bottom-left leaf */}
      <path
        d="M 28 82 Q 14 68 22 48 Q 38 58 36 76 Q 34 82 28 82 Z"
        fill={`url(#${gradId})`}
        opacity="0.78"
      />
      {/* Bottom-right leaf */}
      <path
        d="M 72 82 Q 86 68 78 48 Q 62 58 64 76 Q 66 82 72 82 Z"
        fill={`url(#${gradId})`}
        opacity="0.78"
      />
      {/* Mid-left leaf */}
      <path
        d="M 22 56 Q 10 42 20 22 Q 36 32 34 52 Q 32 58 22 56 Z"
        fill={`url(#${gradId})`}
        opacity="0.9"
      />
      {/* Mid-right leaf */}
      <path
        d="M 78 56 Q 90 42 80 22 Q 64 32 66 52 Q 68 58 78 56 Z"
        fill={`url(#${gradId})`}
        opacity="0.9"
      />
      {/* Top leaf (the apex) */}
      <path
        d="M 50 8 Q 38 22 42 44 Q 50 52 58 44 Q 62 22 50 8 Z"
        fill={`url(#${accentId})`}
      />
      {/* Trunk + ascending arrow */}
      <path
        d="M 50 94 L 50 60"
        stroke={`url(#${gradId})`}
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 41 70 L 50 60 L 59 70"
        stroke={`url(#${gradId})`}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
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
            : 'linear-gradient(135deg, #0B2447 0%, #1E5F74 35%, #0E9F6E 75%, #65A30D 100%)',
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
            : 'linear-gradient(135deg, #0B2447 0%, #1E5F74 35%, #0E9F6E 75%, #65A30D 100%)',
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
