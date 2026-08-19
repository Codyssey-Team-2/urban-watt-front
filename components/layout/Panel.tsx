import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface PanelProps {
  children: ReactNode
  className?: string
  /** 위험 상태를 강조해야 하는 패널. 지역 정체성이 아니라 상태를 뜻한다. */
  tone?: 'default' | 'danger'
  /** 카드 상단 3px 컬러바 */
  accent?: 'cool' | 'urban' | null
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
        'pointer-events-auto rounded-2xl border bg-white/96 backdrop-blur-[14px]',
        // 토글 시 tone이 바뀌면 테두리와 그림자가 같이 움직여야 한 몸으로 보인다.
        'transition-[border-color,box-shadow] duration-200',
        tone === 'danger'
          ? 'border-[rgba(198,40,40,0.30)] shadow-panel-danger'
          : 'border-[rgba(22,60,42,0.10)] shadow-panel',
        accent && 'overflow-hidden',
        className,
      )}
    >
      {accent && (
        <div
          className={cn('h-[3px]', accent === 'cool' ? 'bg-cool' : 'bg-urban')}
        />
      )}
      {children}
    </div>
  )
}
