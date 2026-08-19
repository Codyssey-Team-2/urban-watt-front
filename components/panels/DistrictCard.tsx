import { Panel } from '@/components/layout/Panel'
import { cn } from '@/lib/cn'
import { readableOn } from '@/lib/api/contrast'
import type { CardModel } from '@/components/views/shared'

/** 서버가 등급 색을 주지 않을 때 쓰는 자체 스타일 */
const FALLBACK = {
  stable: 'bg-brand-light text-brand-dark',
  caution: 'bg-caution-light text-caution-text',
  danger: 'bg-danger text-white',
} as const

interface DistrictCardProps {
  card: CardModel
  className?: string
}

function Stat({
  label,
  value,
  emphasize,
}: {
  label: string
  value: string
  emphasize?: boolean
}) {
  return (
    <div className="min-w-0">
      <div className="truncate text-[13px] leading-tight text-faint">{label}</div>
      <div
        className={cn(
          'tnum mt-0.5 truncate text-[15px] leading-tight text-ink',
          // 강조는 굵기로만. 색은 상태 신호로 아껴 둔다.
          emphasize && 'font-semibold',
        )}
      >
        {value}
      </div>
    </div>
  )
}

export function DistrictCard({ card, className }: DistrictCardProps) {
  const danger = card.risk === 'danger'

  return (
    <Panel
      tone={danger ? 'danger' : 'default'}
      accent={card.variant}
      className={cn('transition-colors duration-200', className)}
    >
      <div className="px-5 pb-5 pt-4 short:pb-3 short:pt-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[15px] font-semibold text-ink">{card.name}</span>
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-[13px] font-semibold transition-colors duration-200',
              !card.gradeColor && FALLBACK[card.risk],
            )}
            // 등급 색은 서버가 정한다. 글자색만 대비로 고른다.
            style={
              card.gradeColor
                ? {
                    background: card.gradeColor,
                    color: readableOn(card.gradeColor),
                  }
                : undefined
            }
          >
            {card.grade}
          </span>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span
            className={cn(
              'tnum text-[40px] font-semibold leading-none tracking-[-0.02em] transition-colors duration-200',
              // 평소에는 검정. 위험 상태에서만 빨강이 나온다.
              danger ? 'text-danger-text' : 'text-ink',
            )}
          >
            {card.headline}
          </span>
          <span className="text-[13px] text-faint">{card.headlineLabel}</span>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-3 border-t border-hair pt-3">
          {card.stats.map((s) => (
            <Stat key={s.label} {...s} />
          ))}
        </div>

        {card.note && (
          <p className="mt-3 border-t border-hair pt-3 text-[13px] leading-relaxed text-faint">
            {card.note}
          </p>
        )}
      </div>
    </Panel>
  )
}
