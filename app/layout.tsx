import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google'
import { Navbar } from '@/components/layout/Navbar'
import { MainLayout } from '@/components/layout/MainLayout'
import { SyncManager } from '@/components/shared/SyncManager'
import { Suspense } from 'react'
import './globals.css'

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] })
const jetBrainsMono = JetBrains_Mono({ variable: '--font-jetbrains-mono', subsets: ['latin'] })
const spaceGrotesk = Space_Grotesk({ variable: '--font-space-grotesk', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Northbound AI',
  description: 'Track your placement exam preparation with DSA problems, subjects, projects, and certifications',
  generator: 'v0.app',
  icons: {
    icon: {
      url: '/icon.svg',
      type: 'image/svg+xml',
    },
    apple: '/icon.svg',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetBrainsMono.variable} ${spaceGrotesk.variable} bg-background`} suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <SyncManager />
        <div className="flex flex-col h-screen bg-background">
          <Navbar />
          <MainLayout>{children}</MainLayout>
        </div>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
