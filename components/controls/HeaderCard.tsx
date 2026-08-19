import { Panel } from '@/components/layout/Panel'
import type { HeaderModel } from '@/components/views/shared'

interface HeaderCardProps {
  hour: number
  header: HeaderModel
}

export function HeaderCard({ hour, header }: HeaderCardProps) {
  return (
    <Panel className="px-5 py-3">
      <div className="flex items-center gap-2.5">
        <span className="text-[15px] font-semibold tracking-[-0.015em] text-ink">
          진관동 · 구로동
        </span>
        {header.heatwave && header.tMax != null && (
          <span className="rounded-full bg-danger-light px-2.5 py-0.5 text-[13px] font-semibold text-danger-text-dark">
            폭염 {header.tMax.toFixed(1)}°C
          </span>
        )}
      </div>
      <div className="tnum mt-1 text-[13px] text-faint">
        {header.date} · {String(Math.floor(hour)).padStart(2, '0')}:
        {String(Math.floor((hour % 1) * 60)).padStart(2, '0')} KST
      </div>
    </Panel>
  )
}
