'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'
import type { WatchlistItem } from '@/types/trading'

interface Props {
  userId: string
  items: WatchlistItem[]
  onPickSymbol: (sym: string) => void
}

export function WatchlistTab({ userId, items, onPickSymbol }: Props) {
  const router = useRouter()
  const { isRTL } = useLang()
  const [adding, setAdding] = useState(false)
  const [ticker, setTicker] = useState('')
  const [exchange, setExchange] = useState('NASDAQ')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const add = async () => {
    if (!ticker.trim() || saving) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('watchlist').insert({
      user_id: userId,
      ticker: ticker.trim().toUpperCase(),
      exchange,
      note: note.trim() || null,
      sort_order: items.length,
    })
    setTicker('')
    setNote('')
    setAdding(false)
    setSaving(false)
    router.refresh()
  }

  const remove = async (id: string) => {
    const supabase = createClient()
    await supabase.from('watchlist').delete().eq('id', id)
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="group flex items-center gap-3 p-3 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
          >
            <button
              onClick={() => onPickSymbol(`${item.exchange}:${item.ticker}`)}
              className="flex-1 text-right min-w-0"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-white font-bold text-sm">
                  {item.ticker}
                </span>
                <span className="text-white/30 text-[10px] font-mono">{item.exchange}</span>
              </div>
              {item.note && (
                <p className="text-white/50 text-xs mt-0.5 truncate text-right">
                  {item.note}
                </p>
              )}
            </button>
            <button
              onClick={() => onPickSymbol(`${item.exchange}:${item.ticker}`)}
              className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
            >
              <Eye size={14} />
            </button>
            <button
              onClick={() => remove(item.id)}
              className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-red-500/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {adding ? (
        <div className="rounded-2xl border border-cyan-400/30 bg-white/[0.03] p-3 space-y-2">
          <div className="flex gap-2">
            <select
              value={exchange}
              onChange={(e) => setExchange(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm font-mono focus:outline-none"
            >
              <option value="NASDAQ">NASDAQ</option>
              <option value="NYSE">NYSE</option>
              <option value="AMEX">AMEX</option>
            </select>
            <input
              autoFocus
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && add()}
              placeholder="AAPL"
              className="flex-1 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white font-mono font-semibold focus:outline-none focus:border-cyan-400/40"
            />
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder={isRTL ? 'הערה (אופציונלי)' : 'Note (optional)'}
            className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400/40"
          />
          <div className="flex gap-2">
            <button
              onClick={add}
              disabled={!ticker.trim() || saving}
              className="flex-1 py-2 rounded-xl text-xs font-semibold bg-cyan-500 text-slate-900 disabled:opacity-40"
            >
              {isRTL ? 'הוסף' : 'Add'}
            </button>
            <button
              onClick={() => {
                setAdding(false)
                setTicker('')
                setNote('')
              }}
              className="px-4 py-2 rounded-xl text-xs bg-white/5 text-white/60"
            >
              {isRTL ? 'ביטול' : 'Cancel'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl border border-dashed border-white/15 text-white/40 hover:text-white/70 hover:border-white/30 transition-all"
        >
          <Plus size={16} />
          <span className="text-sm">{isRTL ? 'הוסף מניה' : 'Add ticker'}</span>
        </button>
      )}

      {items.length === 0 && !adding && (
        <p className="text-center text-white/30 text-xs py-4">
          {isRTL ? 'הוסף את המניות שאתה עוקב אחריהן' : 'Add tickers you are watching'}
        </p>
      )}
    </div>
  )
}
