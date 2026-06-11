import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = { title: '생산 기록 | Sidiz', description: 'Sidiz 평택공장 생산 기록' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="max-w-md mx-auto min-h-screen bg-gray-100">{children}</body>
    </html>
  )
}
