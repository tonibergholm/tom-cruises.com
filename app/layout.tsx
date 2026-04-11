import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Providers from '@/components/Providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tom Cruises - Yacht Tracking & Stories',
  description: 'Private yacht tracking and stories from Pamela and Lyyli',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;550;600;700;750&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>
          <Header />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
