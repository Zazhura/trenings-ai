import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Trenings AI',
  description: 'Gruppeøkt med tydelig flyt og timer',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="no">
      <body>{children}</body>
    </html>
  )
}

