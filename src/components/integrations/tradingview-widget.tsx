'use client'

import { useEffect, useRef } from 'react'

const PORTFOLIO_SYMBOLS = [
  { s: 'NASDAQ:LUNR', d: 'LUNR' },
  { s: 'NASDAQ:AFRM', d: 'AFRM' },
  { s: 'NASDAQ:CVNA', d: 'CVNA' },
  { s: 'NYSE:GME', d: 'GME' },
  { s: 'NYSE:OKLO', d: 'OKLO' },
  { s: 'NYSE:DELL', d: 'DELL' },
  { s: 'NASDAQ:OPEN', d: 'OPEN' },
  { s: 'NASDAQ:NNE', d: 'NNE' },
  { s: 'NASDAQ:AAPL', d: 'AAPL' },
  { s: 'NASDAQ:ASTS', d: 'ASTS' },
  { s: 'NYSE:JNJ', d: 'JNJ' },
]

export function TradingViewWidget() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    containerRef.current.innerHTML = ''

    const widgetDiv = document.createElement('div')
    widgetDiv.className = 'tradingview-widget-container__widget'
    widgetDiv.style.height = '100%'
    containerRef.current.appendChild(widgetDiv)

    const script = document.createElement('script')
    script.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js'
    script.type = 'text/javascript'
    script.async = true
    script.text = JSON.stringify({
      colorTheme: 'dark',
      dateRange: '1D',
      showChart: true,
      locale: 'he_IL',
      isTransparent: true,
      showSymbolLogo: true,
      showFloatingTooltip: false,
      width: '100%',
      height: '520',
      tabs: [
        {
          title: 'תיק שלי',
          symbols: PORTFOLIO_SYMBOLS,
          originalTitle: 'My Portfolio',
        },
      ],
    })
    containerRef.current.appendChild(script)
  }, [])

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container rounded-xl overflow-hidden w-full"
      style={{ minHeight: 520 }}
    />
  )
}
