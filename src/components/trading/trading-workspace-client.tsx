'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, LayoutDashboard, BookText, Eye, Settings as SettingsIcon } from 'lucide-react'
import { useLang } from '@/lib/lang'
import { computeAccountStats } from '@/lib/trading-utils'
import { AdvancedChart } from './advanced-chart'
import { AccountStatsBar } from './account-stats'
import { TradeEntryForm } from './trade-entry-form'
import { JournalTab } from './journal-tab'
import { WatchlistTab } from './watchlist-tab'
import { CapitalModal } from './capital-modal'
import type { Trade, TradingAccount, WatchlistItem } from '@/types/trading'

type Tab = 'dashboard' | 'journal' | 'watchlist'

interface Props {
  userId: string
  account: TradingAccount | null
  trades: Trade[]
  watchlist: WatchlistItem[]
}

export function TradingWorkspaceClient({ userId, account, trades, watchlist }: Props) {
  const router = useRouter()
  const { isRTL } = useLang()
  const [tab, setTab] = useState<Tab>('dashboard')
  const [symbol, setSymbol] = useState<string>(() => {
    if (watchlist.length > 0) return `${watchlist[0].exchange}:${watchlist[0].ticker}`
    const openTrade = trades.find((t) => t.status === 'open')
    if (openTrade) return `${openTrade.exchange}:${openTrade.ticker}`
    return 'NASDAQ:AAPL'
  })
  const [showCapital, setShowCapital] = useState(!account)

  const stats = useMemo(() => computeAccountStats(account, trades), [account, trades])

  const pickSymbol = (sym: string) => {
    setSymbol(sym)
    setTab('dashboard')
  }

  const tabs: { key: Tab; icon: typeof LayoutDashboard; labelHe: string; labelEn: string }[] = [
    { key: 'dashboard', icon: LayoutDashboard, labelHe: 'מסחר', labelEn: 'Trade' },
    { key: 'journal', icon: BookText, labelHe: 'יומן', labelEn: 'Journal' },
    { key: 'watchlist', icon: Eye, labelHe: 'מעקב', labelEn: 'Watch' },
  ]

  return (
    <div className="px-4 pt-12 pb-8 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/dashboard')}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
        >
          <ArrowRight size={20} className={`text-white ${isRTL ? '' : 'rotate-180'}`} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span>📊</span>
            <span>{isRTL ? 'מסחר' : 'Trading'}</span>
          </h1>
          <p className="text-white/40 text-xs mt-0.5">
            {isRTL ? 'סביבת עבודה שקטה וממוקדת' : 'Cold, focused workspace'}
          </p>
        </div>
        <button
          onClick={() => setShowCapital(true)}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/60"
        >
          <SettingsIcon size={18} />
        </button>
      </div>

      {/* Account stats */}
      <AccountStatsBar stats={stats} onEditCapital={() => setShowCapital(true)} />

      {/* Tab nav */}
      <div className="flex gap-1 p-1 rounded-2xl bg-white/[0.03] border border-white/5">
        {tabs.map(({ key, icon: Icon, labelHe, labelEn }) => {
          const active = tab === key
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{
                background: active ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                color: active ? '#06b6d4' : 'rgba(255,255,255,0.5)',
              }}
            >
              <Icon size={14} />
              <span>{isRTL ? labelHe : labelEn}</span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      {tab === 'dashboard' && (
        <div className="space-y-4">
          <AdvancedChart symbol={symbol} height={560} />
          {stats.equity > 0 ? (
            <TradeEntryForm
              userId={userId}
              equity={stats.equity}
              defaultRiskPct={account?.default_risk_pct ?? 1}
              symbol={symbol}
            />
          ) : (
            <button
              onClick={() => setShowCapital(true)}
              className="w-full py-4 rounded-2xl border border-dashed border-cyan-400/30 text-cyan-400 text-sm font-medium hover:bg-cyan-400/5 transition-colors"
            >
              {isRTL
                ? 'הגדר הון התחלתי כדי לפתוח עסקה ראשונה'
                : 'Set starting capital to open your first trade'}
            </button>
          )}
        </div>
      )}

      {tab === 'journal' && <JournalTab trades={trades} onPickSymbol={pickSymbol} />}

      {tab === 'watchlist' && (
        <WatchlistTab userId={userId} items={watchlist} onPickSymbol={pickSymbol} />
      )}

      {showCapital && (
        <CapitalModal
          userId={userId}
          account={account}
          onClose={() => setShowCapital(false)}
        />
      )}
    </div>
  )
}
