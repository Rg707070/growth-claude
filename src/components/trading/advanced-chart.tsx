'use client'

import { useEffect, useRef } from 'react'

interface Props {
  symbol: string
  className?: string
}

export function AdvancedChart({ symbol, className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const lastSymbol = useRef<string>('')

  useEffect(() => {
    if (!containerRef.current) return
    if (lastSymbol.current === symbol) return
    lastSymbol.current = symbol

    containerRef.current.innerHTML = ''

    const widgetDiv = document.createElement('div')
    widgetDiv.className = 'tradingview-widget-container__widget'
    widgetDiv.style.height = '100%'
    widgetDiv.style.width = '100%'
    containerRef.current.appendChild(widgetDiv)

    const script = document.createElement('script')
    script.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.type = 'text/javascript'
    script.async = true
    script.text = JSON.stringify({
      autosize: true,
      symbol,
      interval: 'D',
      timezone: 'America/New_York',
      theme: 'dark',
      style: '1',
      locale: 'he_IL',
      withdateranges: true,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      save_image: false,
      details: true,
      hotlist: false,
      calendar: false,
      studies: [
        'RSI@tv-basicstudies',
        'MASimple@tv-basicstudies',
        'Volume@tv-basicstudies',
      ],
      support_host: 'https://www.tradingview.com',
      backgroundColor: 'rgba(15, 23, 42, 1)',
      gridColor: 'rgba(148, 163, 184, 0.06)',
    })
    containerRef.current.appendChild(script)
  }, [symbol])

  return (
    <div
      className={`tradingview-widget-container rounded-2xl overflow-hidden border border-white/10 bg-slate-900 ${className}`}
      ref={containerRef}
    />
  )
}
