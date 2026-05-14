'use client'

import { ExternalLink } from 'lucide-react'
import type { QuickLink } from '@/lib/domain-integrations'

export function QuickLinks({ links }: { links: QuickLink[] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {links.map((link) => (
        <a
          key={link.name}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all border border-white/10"
        >
          <span className="text-xl leading-none">{link.icon}</span>
          <span className="text-sm text-white/80 font-medium truncate flex-1">{link.name}</span>
          <ExternalLink size={12} className="text-white/30 flex-shrink-0" />
        </a>
      ))}
    </div>
  )
}
