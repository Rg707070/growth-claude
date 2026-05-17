'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'

interface Position {
  id: string
  ticker: string
  buy_price: number
  last_price: number
  sort_order: number
}

function calcPnl(buy: number, last: number): { pnl: number; pct: number } | null {
  if (!buy || !last) return null
  const pnl = last - buy
  const pct = (pnl / buy) * 100
  return { pnl, pct }
}

export function PortfolioTracker() {
  const { isRTL } = useLang()
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [newTicker, setNewTicker] = useState('')
  const [adding, setAdding] = useState(false)

  const fetchPositions = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('portfolio_positions')
      .select('*')
      .order('sort_order', { ascending: true })
    setPositions((data as Position[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchPositions() }, [fetchPositions])

  const updatePrice = async (id: string, field: 'buy_price' | 'last_price', val: string) => {
    const num = parseFloat(val)
    if (isNaN(num) && val !== '') return

    setPositions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: isNaN(num) ? 0 : num } : p))
    )

    const supabase = createClient()
    await supabase
      .from('portfolio_positions')
      .update({ [field]: isNaN(num) ? 0 : num })
      .eq('id', id)
  }

  const addPosition = async () => {
    const ticker = newTicker.trim().toUpperCase()
    if (!ticker) return
    setAdding(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setAdding(false); return }

    const { data } = await supabase
      .from('portfolio_positions')
      .insert({
        user_id: user.id,
        ticker,
        buy_price: 0,
        last_price: 0,
        sort_order: positions.length,
      })
      .select()
      .single()

    if (data) setPositions((prev) => [...prev, data as Position])
    setNewTicker('')
    setAdding(false)
  }

  const deletePosition = async (id: string) => {
    setPositions((prev) => prev.filter((p) => p.id !== id))
    const supabase = createClient()
    await supabase.from('portfolio_positions').delete().eq('id', id)
  }

  if (loading) {
    return (
      <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-600/5 border border-violet-500/20">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">📈</span>
          <span className="text-violet-300 text-xs font-semibold uppercase tracking-wide">
            {isRTL ? 'תיק השקעות' : 'Portfolio'}
          </span>
        </div>
        <p className="text-white/30 text-xs text-center py-4">טוען...</p>
      </div>
    )
  }

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-600/5 border border-violet-500/20">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📈</span>
        <span className="text-violet-300 text-xs font-semibold uppercase tracking-wide">
          {isRTL ? 'תיק השקעות' : 'Portfolio'}
        </span>
      </div>

      {positions.length > 0 && (
        <>
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-1 mb-2 px-1">
            {[
              isRTL ? 'מניה' : 'Ticker',
              isRTL ? 'קנייה $' : 'Buy $',
              isRTL ? 'נוכחי $' : 'Now $',
              'P&L',
            ].map((h) => (
              <span key={h} className="text-[9px] text-white/30 font-semibold uppercase">{h}</span>
            ))}
          </div>

          <div className="space-y-1.5 mb-3">
            {positions.map((pos) => {
              const result = calcPnl(pos.buy_price, pos.last_price)
              return (
                <div key={pos.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-1 items-center">
                  <span className="text-xs font-bold text-white/70 font-mono truncate">{pos.ticker}</span>
                  <input
                    type="number"
                    defaultValue={pos.buy_price || ''}
                    onBlur={(e) => updatePrice(pos.id, 'buy_price', e.target.value)}
                    placeholder="0.00"
                    className="bg-white/8 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-violet-400/50 w-full"
                  />
                  <input
                    type="number"
                    defaultValue={pos.last_price || ''}
                    onBlur={(e) => updatePrice(pos.id, 'last_price', e.target.value)}
                    placeholder="0.00"
                    className="bg-white/8 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-violet-400/50 w-full"
                  />
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-xs font-mono font-semibold ${
                        !result ? 'text-white/20'
                        : result.pct >= 0 ? 'text-emerald-400'
                        : 'text-red-400'
                      }`}
                    >
                      {result
                        ? `${result.pct >= 0 ? '+' : ''}${result.pct.toFixed(1)}%`
                        : '—'}
                    </span>
                    <button
                      onClick={() => deletePosition(pos.id)}
                      className="text-white/15 hover:text-red-400/60 transition-colors p-0.5"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Add ticker */}
      <div className="flex gap-2 items-center">
        <input
          value={newTicker}
          onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && addPosition()}
          placeholder={isRTL ? 'AAPL, TSLA...' : 'AAPL, TSLA...'}
          maxLength={10}
          className="flex-1 bg-white/8 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-violet-400/50"
        />
        <button
          onClick={addPosition}
          disabled={!newTicker.trim() || adding}
          className="p-1.5 rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/25 hover:bg-violet-500/30 disabled:opacity-40 transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>
      {positions.length === 0 && (
        <p className="text-white/25 text-[11px] text-center mt-3">
          {isRTL ? 'הוסף מניה ראשונה לתיק' : 'Add your first position'}
        </p>
      )}
    </div>
  )
}
