import type { Metadata, Viewport } from 'next'
import { Geist, Space_Grotesk, Heebo } from 'next/font/google'
import './globals.css'
import { LangProvider } from '@/lib/lang'
import { ThemeProvider } from '@/lib/theme'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' })
const heebo = Heebo({ subsets: ['hebrew', 'latin'], variable: '--font-hebrew' })

export const metadata: Metadata = {
  metadataBase: new URL('https://growth-claude.vercel.app'),
  title: {
    default: 'GROWTH — אפליקציית הצמיחה האישית',
    template: '%s | GROWTH',
  },
  description: 'אפליקציית מעקב הרגלים לצמיחה אישית ב-7 תחומי חיים: משפחה, חברים, תורה, ספורט, מוזיקה, פיננסים ולימודים. Personal habit tracker app.',
  keywords: ['habit tracker', 'growth app', 'אפליקציית הרגלים', 'צמיחה אישית', 'מעקב הרגלים', 'self improvement'],
  authors: [{ name: 'GROWTH App' }],
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/growth-emblem.png', type: 'image/png' }],
    apple: [{ url: '/apple-icon.png', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GROWTH',
  },
  openGraph: {
    type: 'website',
    locale: 'he_IL',
    alternateLocale: 'en_US',
    url: 'https://growth-claude.vercel.app',
    siteName: 'GROWTH',
    title: 'GROWTH — אפליקציית הצמיחה האישית',
    description: 'מעקב הרגלים ב-7 תחומי חיים. עקוב, התמד וצמח.',
    images: [
      {
        url: '/growth-emblem.png',
        width: 1200,
        height: 630,
        alt: 'GROWTH App',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GROWTH — אפליקציית הצמיחה האישית',
    description: 'מעקב הרגלים ב-7 תחומי חיים. עקוב, התמד וצמח.',
    images: ['/growth-emblem.png'],
  },
  verification: {
    google: '4TlFuM9boKP1agKhuFM5XpM078jRK77_WREMXxscQms',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var v=localStorage.getItem('growth-theme-v');var t=(v!=='2')?'light':(localStorage.getItem('growth-theme')||'light');var h=document.documentElement;h.classList.remove('light','dark');h.classList.add(t);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="font-sans antialiased min-h-screen bg-background">
        <ThemeProvider><LangProvider>{children}</LangProvider></ThemeProvider>
      </body>
    </html>
  )
}
