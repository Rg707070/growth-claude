'use client'

import { ExternalLink } from 'lucide-react'
import { useLang } from '@/lib/lang'

interface ConnectPlaceholderProps {
  service: string
  icon: string
  description: string
  url: string
}

export function ConnectPlaceholder({
  service,
  icon,
  description,
  url,
}: ConnectPlaceholderProps) {
  const { isRTL } = useLang()

  return (
    <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <span className="text-sm font-semibold text-white">{service}</span>
        </div>
        <span className="text-[10px] text-white/40 bg-white/10 px-2 py-0.5 rounded-full">
          {isRTL ? 'בקרוב' : 'Coming soon'}
        </span>
      </div>
      <p className="text-xs text-white/40">{description}</p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 text-xs transition-colors"
      >
        <span>{isRTL ? `פתח ${service}` : `Open ${service}`}</span>
        <ExternalLink size={11} />
      </a>
    </div>
  )
}
