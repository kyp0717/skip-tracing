import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AE Solutions - Skip Trace System',
  description: 'Foreclosure case scraping and skip trace system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <header className="bg-gray-100 border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <Link href="/" className="text-2xl font-semibold text-gray-800 hover:text-gray-600 transition-colors">
                AE Solutions
              </Link>
            </div>
          </header>
          {/* Main Content */}
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}