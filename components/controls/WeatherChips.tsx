import { Panel } from '@/components/layout/Panel'
import {
  DropletIcon,
  TemperatureIcon,
  WindIcon,
} from '@/components/ui/icons'
import { GURO_CODE, WEATHER, getTempAt } from '@/lib/mock'
import { cn } from '@/lib/cn'
import type { ComponentType } from 'react'

interface ChipProps {
  icon: ComponentType<{ size?: number; className?: string }>
  label: string
  value: string
  emphasize?: boolean
}

function Chip({ icon: Icon, label, value, emphasize }: ChipProps) {
  return (
    <div className="flex items-center gap-2">
      <Icon
        size={16}
        className={cn('flex-none', emphasize ? 'text-warm-text' : 'text-muted')}
      />
      <div>
        <div className="text-[13px] leading-tight text-faint">{label}</div>
        <div
          className={cn(
            'tnum text-[15px] font-semibold leading-tight',
            emphasize ? 'text-warm-text' : 'text-ink',
          )}
        >
          {value}
        </div>
      </div>
    </div>
  )
}

interface WeatherChipsProps {
  hour: number
}

export function WeatherChips({ hour }: WeatherChipsProps) {
  // 격차는 시각에 따라 달라진다 — 낮에 벌어지고 새벽에 좁혀지는 게 핵심이라
  // 고정값이 아니라 선택된 시각의 실측 차이를 보여준다.
  const temp = getTempAt(GURO_CODE, hour)
  const gap = Math.round((temp.sdot - temp.asos) * 10) / 10

  return (
    <Panel className="flex items-center gap-6 px-4 py-3">
      <Chip
        icon={TemperatureIcon}
        label="S-DoT 격차"
        value={`${gap > 0 ? '+' : ''}${gap.toFixed(1)}°C`}
        emphasize={gap > 0}
      />
      <Chip icon={DropletIcon} label="습도" value={`${WEATHER.humidity}%`} />
      <Chip icon={WindIcon} label="풍속" value={`${WEATHER.windSpeed}m/s`} />
    </Panel>
  )
}
