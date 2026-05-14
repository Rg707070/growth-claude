import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { LangProvider } from '@/lib/lang'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GROWTH',
  description: 'Personal optimization · הצמיחה האישית שלך',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl" className="dark">
      <body className={`${geist.className} antialiased min-h-screen bg-background`}>
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  )
}
