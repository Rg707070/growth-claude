'use client'

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en" dir="ltr">
      <body
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          textAlign: 'center',
          background: '#0A1628',
          color: '#F0F6FC',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ maxWidth: '24rem' }}>
          <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌊</p>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: '1.5rem' }}>
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            style={{
              width: '100%',
              height: '3rem',
              borderRadius: '0.75rem',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              color: '#fff',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #0B2447 0%, #1E5F74 35%, #10B981 72%, #A3E635 100%)',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
