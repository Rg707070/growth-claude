'use client'

import Image from 'next/image'

interface GrowthLogoProps {
  variant?: 'full' | 'icon' | 'mark'
  size?: number
  className?: string
  monochrome?: 'light' | 'dark' | false
}

const TEXT_COLOR = '#1F5430'

export function GrowthLogo({
  variant = 'full',
  size = 40,
  className = '',
  monochrome = false,
}: GrowthLogoProps) {
  const textColor = monochrome === 'light'
    ? '#FFFFFF'
    : monochrome === 'dark'
      ? '#0B2447'
      : TEXT_COLOR

  const filter = monochrome === 'light'
    ? 'brightness(0) invert(1)'
    : monochrome === 'dark'
      ? 'brightness(0)'
      : undefined

  const Icon = (
    <Image
      src="/growth-emblem.png"
      alt="GROWTH"
      width={size}
      height={size}
      priority
      style={filter ? { filter } : undefined}
    />
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
