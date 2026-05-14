'use client'

import { ExternalLink, TrendingUp } from 'lucide-react'

// Rotem's portfolio stocks
const PORTFOLIO_STOCKS = [
  { ticker: 'LUNR', exchange: 'NASDAQ' },
  { ticker: 'AFRM', exchange: 'NASDAQ' },
  { ticker: 'CVNA', exchange: 'NASDAQ' },
  { ticker: 'GME', exchange: 'NYSE' },
  { ticker: 'OKLO', exchange: 'NYSE' },
  { ticker: 'DELL', exchange: 'NYSE' },
  { ticker: 'OPEN', exchange: 'NASDAQ' },
  { ticker: 'NNE', exchange: 'NASDAQ' },
  { ticker: 'AAPL', exchange: 'NASDAQ' },
  { ticker: 'ASTS', exchange: 'NASDAQ' },
  { ticker: 'JNJ', exchange: 'NYSE' },
]

export function TradingViewWidget() {
  return (
    <div className="space-y-3">
      {/* Main link */}
      <a
        href="https://www.tradingview.com"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 transition-colors"
      >
        <TrendingUp size={18} className="text-violet-400" />
        <span className="text-white font-medium text-sm flex-1">פתח TradingView</span>
        <ExternalLink size={14} className="text-violet-400/60" />
      </a>

      {/* Portfolio watchlist */}
      <div>
        <p className="text-white/40 text-xs font-medium mb-2">תיק המניות שלך</p>
        <div className="flex flex-wrap gap-1.5">
          {PORTFOLIO_STOCKS.map(({ ticker, exchange }) => (
            <a
              key={ticker}
              href={`https://www.tradingview.com/chart/?symbol=${exchange}:${ticker}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-2.5 py-1.5 rounded-lg bg-violet-500/15 text-violet-300 hover:bg-violet-500/30 transition-colors font-mono font-semibold border border-violet-500/20"
            >
              {ticker}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
