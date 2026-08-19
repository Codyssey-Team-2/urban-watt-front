import { Panel } from '@/components/layout/Panel'
import { cn } from '@/lib/cn'
import type { District, Forecast, RiskLevel } from '@/lib/types'

const RISK: Record<RiskLevel, { label: string; className: string }> = {
  stable: { label: '안정', className: 'bg-brand-light text-brand-dark' },
  caution: { label: '주의', className: 'bg-warm-light text-warm-text-dark' },
  danger: { label: '위험', className: 'bg-warm text-white' },
}

interface DistrictCardProps {
  district: District
  forecast: Forecast
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
          emphasize ? 'font-semibold text-warm-text' : 'text-ink',
        )}
      >
        {value}
      </div>
    </div>
  )
}

export function DistrictCard({
  district,
  forecast,
  demand,
  className,
}: DistrictCardProps) {
  const warm = district.variant === 'warm'
  const risk = RISK[forecast.riskLevel]
  const { balancePoint, coolingSlope, vegetationRate } = district.microclimate

  return (
    <Panel
      tone={warm && forecast.riskLevel === 'danger' ? 'warm' : 'default'}
      accent={district.variant}
      className={cn('transition-colors duration-200', className)}
    >
      <div className="px-5 pb-5 pt-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[15px] font-semibold text-ink">
            {district.name}
          </span>
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-[13px] font-semibold transition-colors duration-200',
              risk.className,
            )}
          >
            {risk.label}
          </span>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span
            className={cn(
              'tnum text-[40px] font-semibold leading-none tracking-[-0.02em] transition-colors duration-200',
              warm ? 'text-warm-text' : 'text-ink',
            )}
          >
            +{forecast.excessRate}%
          </span>
          <span className="text-[13px] text-faint">평시 대비</span>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-3 border-t border-hair pt-3">
          <Stat label="균형점" value={`${balancePoint.toFixed(1)}°C`} />
          <Stat
            label="기울기"
            value={`${coolingSlope.toFixed(1)}×`}
            emphasize={warm}
          />
          <Stat label="식생" value={`${vegetationRate}%`} />
          <Stat label="예측수요" value={`${demand.toFixed(1)}MW`} />
        </div>
      </div>
    </Panel>
  )
}
