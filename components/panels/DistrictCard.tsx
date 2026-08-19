import { Panel } from '@/components/layout/Panel'
import { cn } from '@/lib/cn'
import type { District, RiskLevel } from '@/lib/types'

/** 배지는 상태만 나타낸다. 지역 정체성 색과 섞지 않는다. */
const RISK: Record<RiskLevel, { label: string; className: string }> = {
  stable: { label: '안정', className: 'bg-brand-light text-brand-dark' },
  caution: { label: '주의', className: 'bg-caution-light text-caution-text' },
  danger: { label: '위험', className: 'bg-danger text-white' },
}

interface DistrictCardProps {
  district: District
  /** 선택 시각의 평시 대비 초과율 (%) */
  excess: number
  risk: RiskLevel
  /** 선택 시각의 예측 수요 MW */
  demand: number
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
      <div className="text-[13px] leading-tight text-faint">{label}</div>
      <div
        className={cn(
          'tnum mt-0.5 text-[15px] leading-tight',
          emphasize ? 'font-semibold text-urban-text' : 'text-ink',
        )}
      >
        {value}
      </div>
    </div>
  )
}

export function DistrictCard({
  district,
  excess,
  risk,
  demand,
  className,
}: DistrictCardProps) {
  const urban = district.variant === 'urban'
  const riskStyle = RISK[risk]
  const { balancePoint, coolingSlope, vegetationRate } = district.microclimate

  return (
    <Panel
      tone={risk === 'danger' ? 'danger' : 'default'}
      accent={district.variant}
      className={cn('transition-colors duration-200', className)}
    >
      <div className="px-5 pb-5 pt-4 short:pb-3 short:pt-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[15px] font-semibold text-ink">
            {district.name}
          </span>
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-[13px] font-semibold transition-colors duration-200',
              riskStyle.className,
            )}
          >
            {riskStyle.label}
          </span>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span
            className={cn(
              'tnum text-[40px] font-semibold leading-none tracking-[-0.02em] transition-colors duration-200',
              // 평소에는 지역 정체성 색, 위험 상태에서만 빨강으로 바뀐다.
              risk === 'danger'
                ? 'text-danger-text'
                : urban
                  ? 'text-urban-text'
                  : 'text-ink',
            )}
          >
            +{Math.round(excess)}%
          </span>
          <span className="text-[13px] text-faint">평시 대비</span>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-3 border-t border-hair pt-3">
          <Stat label="균형점" value={`${balancePoint.toFixed(1)}°C`} />
          <Stat
            label="기울기"
            value={`${coolingSlope.toFixed(1)}×`}
            emphasize={urban}
          />
          <Stat label="식생" value={`${vegetationRate}%`} />
          <Stat label="예측수요" value={`${demand.toFixed(1)}MW`} />
        </div>
      </div>
    </Panel>
  )
}
