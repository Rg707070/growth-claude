'use client'

import { useEffect } from 'react'
import type { ReactNode } from 'react'

function getTimeClass(): string {
  const h = new Date().getHours()
  if (h >= 5  && h < 8)  return 'bg-dawn'
  if (h >= 8  && h < 12) return 'bg-morning'
  if (h >= 12 && h < 17) return 'bg-noon'
  if (h >= 17 && h < 21) return 'bg-sunset'
  return 'bg-night'
}

const ALL_BG = ['bg-dawn', 'bg-morning', 'bg-noon', 'bg-sunset', 'bg-night']

export function TimeBackground({ children }: { children?: ReactNode }) {
  useEffect(() => {
    const body = document.body
    ALL_BG.forEach((c) => body.classList.remove(c))
    body.classList.add(getTimeClass())

    const id = setInterval(() => {
      ALL_BG.forEach((c) => body.classList.remove(c))
      body.classList.add(getTimeClass())
    }, 10 * 60 * 1000)

    return () => clearInterval(id)
  }, [])

  return <>{children}</>
}
