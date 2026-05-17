'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'
import type { TradingAccount } from '@/types/trading'

interface Props {
  userId: string
  account: TradingAccount | null
  onClose: () => void
}

export function CapitalModal({ userId, account, onClose }: Props) {
  const router = useRouter()
  const { isRTL } = useLang()
  const [startingCapital, setStartingCapital] = useState(
    account?.starting_capital?.toString() ?? ''
  )
  const [riskPct, setRiskPct] = useState(account?.default_risk_pct?.toString() ?? '1')
  const [dailyLimit, setDailyLimit] = useState(
    account?.daily_loss_limit_pct?.toString() ?? '3'
  )
  const [saving, setSaving] = useState(false)

  const save = async () => {
    const capital = parseFloat(startingCapital)
    const risk = parseFloat(riskPct)
    const limit = parseFloat(dailyLimit)
    if (!capital || capital <= 0 || saving) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('trading_account').upsert({
      user_id: userId,
      starting_capital: capital,
      current_capital: account?.current_capital ?? capital,
      default_risk_pct: risk || 1,
      daily_loss_limit_pct: limit || 3,
      updated_at: new Date().toISOString(),
    })
    router.refresh()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-slate-900 border border-white/10 p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-white font-bold">
              {isRTL ? 'הגדרות חשבון' : 'Account Settings'}
            </h2>
            <p className="text-white/40 text-xs mt-0.5">
              {isRTL ? 'הון התחלתי ופרמטרי סיכון' : 'Starting capital & risk parameters'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60"
          >
            <X size={16} />
          </button>
        </div>

        <label className="block">
          <span className="text-white/60 text-xs font-medium block mb-1">
            {isRTL ? 'הון התחלתי ($)' : 'Starting Capital ($)'}
          </span>
          <input
            type="number"
            step="0.01"
            value={startingCapital}
            onChange={(e) => setStartingCapital(e.target.value)}
            placeholder="10000"
            className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white font-mono text-base focus:outline-none focus:border-cyan-400/40"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-white/60 text-xs font-medium block mb-1">
              {isRTL ? 'סיכון ברירת מחדל %' : 'Default Risk %'}
            </span>
            <input
              type="number"
              step="0.1"
              value={riskPct}
              onChange={(e) => setRiskPct(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white font-mono focus:outline-none focus:border-cyan-400/40"
            />
          </label>
          <label className="block">
            <span className="text-white/60 text-xs font-medium block mb-1">
              {isRTL ? 'הפסד יומי מקס %' : 'Daily Loss Limit %'}
            </span>
            <input
              type="number"
              step="0.1"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white font-mono focus:outline-none focus:border-cyan-400/40"
            />
          </label>
        </div>

        <button
          onClick={save}
          disabled={!startingCapital || saving}
          className="w-full py-2.5 rounded-xl text-sm font-semibold bg-cyan-500 text-slate-900 disabled:opacity-40"
        >
          {saving ? (isRTL ? 'שומר...' : 'Saving...') : isRTL ? 'שמור' : 'Save'}
        </button>
      </div>
    </div>
  )
}
