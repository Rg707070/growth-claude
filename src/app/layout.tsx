import type { Metadata, Viewport } from 'next'
import { Geist, Space_Grotesk, Heebo } from 'next/font/google'
import './globals.css'
import { LangProvider } from '@/lib/lang'
import { ThemeProvider } from '@/lib/theme'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' })
const heebo = Heebo({ subsets: ['hebrew', 'latin'], variable: '--font-hebrew' })

export const metadata: Metadata = {
  title: 'GROWTH',
  description: 'Personal optimization · הצמיחה האישית שלך',
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/apple-icon.svg', type: 'image/svg+xml' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GROWTH',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAFCFD' },
    { media: '(prefers-color-scheme: dark)', color: '#0A1628' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`light ${geist.variable} ${spaceGrotesk.variable} ${heebo.variable}`}
    >
      <body className="font-sans antialiased min-h-screen bg-background">
        <ThemeProvider><LangProvider>{children}</LangProvider></ThemeProvider>
      </body>
    </html>
  )
}
