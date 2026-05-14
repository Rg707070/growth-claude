'use client'

export function WaveAnimation() {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 pointer-events-none z-0 overflow-hidden"
      style={{ height: 90 }}
      aria-hidden
    >
      {/* Back wave — slower */}
      <div className="absolute inset-0 opacity-20 animate-wave-slow" style={{ width: '200%' }}>
        <svg viewBox="0 0 1440 90" className="w-1/2 inline-block" preserveAspectRatio="none">
          <path
            d="M0,45 C180,80 360,10 540,45 C720,80 900,10 1080,45 C1260,80 1350,60 1440,45 L1440,90 L0,90 Z"
            fill="url(#waveGrad1)"
          />
          <defs>
            <linearGradient id="waveGrad1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>
        <svg viewBox="0 0 1440 90" className="w-1/2 inline-block" preserveAspectRatio="none">
          <path
            d="M0,45 C180,80 360,10 540,45 C720,80 900,10 1080,45 C1260,80 1350,60 1440,45 L1440,90 L0,90 Z"
            fill="url(#waveGrad1b)"
          />
          <defs>
            <linearGradient id="waveGrad1b" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Front wave — faster */}
      <div className="absolute inset-0 opacity-30 animate-wave-fast" style={{ width: '200%' }}>
        <svg viewBox="0 0 1440 90" className="w-1/2 inline-block" preserveAspectRatio="none">
          <path
            d="M0,55 C240,20 480,75 720,50 C960,25 1200,70 1440,55 L1440,90 L0,90 Z"
            fill="url(#waveGrad2)"
          />
          <defs>
            <linearGradient id="waveGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0284C7" stopOpacity="0.15" />
            </linearGradient>
          </defs>
        </svg>
        <svg viewBox="0 0 1440 90" className="w-1/2 inline-block" preserveAspectRatio="none">
          <path
            d="M0,55 C240,20 480,75 720,50 C960,25 1200,70 1440,55 L1440,90 L0,90 Z"
            fill="url(#waveGrad2b)"
          />
          <defs>
            <linearGradient id="waveGrad2b" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0284C7" stopOpacity="0.15" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  )
}
