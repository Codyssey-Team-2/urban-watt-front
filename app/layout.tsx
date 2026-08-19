import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'UrbanWatt · 지역 전력피크 예측',
  description:
    '서울시 진관동·구로동의 미기후 기반 시간대별 전력수요와 피크 위험을 비교하는 대시보드',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* 발표용 고정 뷰포트. 대시보드가 화면을 꽉 채우고 문서 스크롤은 없다. */}
      <body className="h-full overflow-hidden bg-mapbase text-ink">
        {children}
      </body>
    </html>
  )
}
