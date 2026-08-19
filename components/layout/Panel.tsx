import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface PanelProps {
  children: ReactNode
  className?: string
  /** 창신동 카드처럼 위험을 강조해야 하는 패널 */
  tone?: 'default' | 'warm'
  /** 카드 상단 3px 컬러바 */
  accent?: 'cool' | 'warm' | null
}

/**
 * 지도 위에 떠 있는 공통 플로팅 패널.
 *
 * 그림자는 반드시 2겹이다 — 접촉 그림자(2px)가 없으면 패널이 지도에
 * 얹힌 게 아니라 붙여넣은 스티커처럼 보인다. shadow-panel 토큰 참조.
 */
export function Panel({
  children,
  className,
  tone = 'default',
  accent = null,
}: PanelProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border bg-white/96 backdrop-blur-[14px]',
        tone === 'warm'
          ? 'border-[rgba(210,84,58,0.30)] shadow-panel-warm'
          : 'border-[rgba(22,60,42,0.10)] shadow-panel',
        accent && 'overflow-hidden',
        className,
      )}
    >
      {accent && (
        <div
          className={cn('h-[3px]', accent === 'cool' ? 'bg-cool' : 'bg-warm')}
        />
      )}
      {children}
    </div>
  )
}
