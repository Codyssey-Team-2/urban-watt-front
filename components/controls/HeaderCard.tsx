import { Panel } from '@/components/layout/Panel'
import { DEMO_DATE, WEATHER } from '@/lib/mock'

interface HeaderCardProps {
  hour: number
}

export function HeaderCard({ hour }: HeaderCardProps) {
  const date = DEMO_DATE.replace(/-/g, '.')
  return (
    <Panel className="px-5 py-3">
      <div className="flex items-center gap-2.5">
        <span className="text-[15px] font-semibold tracking-[-0.015em] text-ink">
          진관동 · 구로동
        </span>
        {WEATHER.isHeatwave && (
          <span className="rounded-full bg-warm-light px-2.5 py-0.5 text-[13px] font-semibold text-warm-text-dark">
            폭염 {WEATHER.asosTemp}°C
          </span>
        )}
      </div>
      <div className="tnum mt-1 text-[13px] text-faint">
        {date} · {String(Math.floor(hour)).padStart(2, '0')}:
        {String(Math.floor((hour % 1) * 60)).padStart(2, '0')} KST
      </div>
    </Panel>
  )
}
