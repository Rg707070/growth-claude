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
  const orbId = useId()
  const leafLightId = useId()
  const leafDarkId = useId()
  const arrowId = useId()
  const highlightId = useId()

  const orbFill = monochrome === 'light'
    ? '#FFFFFF'
    : monochrome === 'dark'
      ? '#0B2447'
      : `url(#${orbId})`

  const leafFill = monochrome === 'light'
    ? '#FFFFFF'
    : monochrome === 'dark'
      ? '#0B2447'
      : `url(#${leafLightId})`

  const leafDarkFill = monochrome === 'light'
    ? '#FFFFFF'
    : monochrome === 'dark'
      ? '#0B2447'
      : `url(#${leafDarkId})`

  const arrowStroke = monochrome === 'light'
    ? '#FFFFFF'
    : monochrome === 'dark'
      ? '#0B2447'
      : `url(#${arrowId})`

  const textColor = monochrome === 'light'
    ? '#FFFFFF'
    : '#1F5430'

  const Icon = (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={orbId} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#BFD8EE" />
          <stop offset="55%" stopColor="#5288B8" />
          <stop offset="100%" stopColor="#1F3F66" />
        </radialGradient>
        <linearGradient id={leafLightId} x1="20%" y1="100%" x2="80%" y2="0%">
          <stop offset="0%" stopColor="#2D7032" />
          <stop offset="55%" stopColor="#5BA84A" />
          <stop offset="100%" stopColor="#A8D86B" />
        </linearGradient>
        <linearGradient id={leafDarkId} x1="20%" y1="100%" x2="80%" y2="0%">
          <stop offset="0%" stopColor="#1F4D22" />
          <stop offset="100%" stopColor="#4A8F3F" />
        </linearGradient>
        <linearGradient id={arrowId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2D7A2D" />
          <stop offset="100%" stopColor="#8FC846" />
        </linearGradient>
        <radialGradient id={highlightId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="50" cy="50" r="40" fill={orbFill} />

      {!monochrome && (
        <>
          <ellipse cx="36" cy="30" rx="16" ry="10" fill={`url(#${highlightId})`} />
          <ellipse cx="60" cy="72" rx="22" ry="5" fill="#0A1F38" opacity="0.22" />
        </>
      )}

      <path
        d="M 50 62 Q 24 60 22 38 Q 30 32 42 38 Q 50 48 50 62 Z"
        fill={leafDarkFill}
      />
      <path
        d="M 50 58 Q 30 56 28 36 Q 38 32 46 40 Q 50 50 50 58 Z"
        fill={leafFill}
      />
      <path
        d="M 50 62 Q 66 64 72 48 Q 66 44 58 50 Q 52 56 50 62 Z"
        fill={leafFill}
        opacity="0.92"
      />
      <path
        d="M 47 44 Q 41 32 48 24 Q 55 32 50 44 Z"
        fill={leafFill}
      />

      <path
        d="M 30 70 Q 46 58 58 40 L 70 24"
        stroke={arrowStroke}
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 58 24 L 73 22 L 71 36"
        stroke={arrowStroke}
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {!monochrome && (
        <g transform="translate(76 18)">
          <path d="M 0 -4.5 L 0 4.5 M -4.5 0 L 4.5 0" stroke="#FFFFFF" strokeWidth="1.1" strokeLinecap="round" />
          <circle cx="0" cy="0" r="1.4" fill="#FFFFFF" />
        </g>
      )}
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
          color: textColor,
          letterSpacing: '0.02em',
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
          color: textColor,
          letterSpacing: '0.02em',
        }}
      >
        GROWTH
      </span>
    </span>
  )
}
