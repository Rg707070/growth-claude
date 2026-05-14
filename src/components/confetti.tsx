'use client'

import confetti from 'canvas-confetti'

export function triggerConfetti() {
  // Ocean color burst
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.55 },
    colors: ['#22D3EE', '#38BDF8', '#34D399', '#A78BFA', '#F472B6', '#FBD34D'],
    ticks: 200,
    gravity: 0.9,
    scalar: 1.1,
  })
  // Second burst after short delay
  setTimeout(() => {
    confetti({
      particleCount: 60,
      spread: 110,
      origin: { y: 0.6, x: 0.3 },
      colors: ['#22D3EE', '#34D399', '#38BDF8'],
      ticks: 160,
    })
    confetti({
      particleCount: 60,
      spread: 110,
      origin: { y: 0.6, x: 0.7 },
      colors: ['#A78BFA', '#F472B6', '#FBD34D'],
      ticks: 160,
    })
  }, 200)
}
