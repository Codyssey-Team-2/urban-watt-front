import { Panel } from '@/components/layout/Panel'
import { cn } from '@/lib/cn'
import {
  ClockIcon,
  DropletIcon,
  TemperatureIcon,
  WindIcon,
} from '@/components/ui/icons'
import type { WeatherChip } from '@/components/views/shared'
import type { ComponentType } from 'react'

const ICONS: Record<WeatherChip['key'], ComponentType<{ size?: number; className?: string }>> = {
  humidity: DropletIcon,
  wind: WindIcon,
  sdot: TemperatureIcon,
  riskDays: ClockIcon,
  pattern: ClockIcon,
}

interface WeatherChipsProps {
  chips: WeatherChip[]
}

/** 값이 없는 항목은 애초에 배열에 없다. 전부 비면 패널 자체를 그리지 않는다. */
export function WeatherChips({ chips }: WeatherChipsProps) {
  if (chips.length === 0) return null

  return (
    <Panel className="flex items-center gap-6 px-4 py-3">
      {chips.map((chip) => {
        const Icon = ICONS[chip.key]
        return (
          <div key={chip.key} className="flex items-center gap-2">
            <Icon
              size={16}
              className={cn(
                'flex-none',
                chip.emphasize ? 'text-danger-text' : 'text-muted',
              )}
            />
            <div>
              <div className="whitespace-nowrap text-[13px] leading-tight text-faint">
                {chip.label}
              </div>
              <div
                className={cn(
                  'tnum whitespace-nowrap text-[15px] font-semibold leading-tight',
                  chip.emphasize ? 'text-danger-text' : 'text-ink',
                )}
              >
                {chip.value}
              </div>
            </div>
          </div>
        )
      })}
    </Panel>
  )
}
