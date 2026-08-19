'use client'

import { Panel } from '@/components/layout/Panel'
import { HeaderCard } from '@/components/controls/HeaderCard'
import { MicroclimateToggle } from '@/components/controls/MicroclimateToggle'
import { ZoomControls } from '@/components/map/ZoomControls'
import { MiniMap } from '@/components/map/MiniMap'
import { cn } from '@/lib/cn'
import { DISTRICTS, getExcessAt, getRiskLevel } from '@/lib/mock'
import type { ViewProps } from './shared'

const RISK_LABEL = { stable: '안정', caution: '주의', danger: '위험' } as const

/**
 * 지도를 최대한 크게 쓰는 화면. 우측 레일과 차트를 걷어내고,
 * 지도 읽기에 필요한 범례와 컨트롤만 남긴다.
 */
export function MapFocusView({
  scenario,
  onScenarioChange,
  hour,
  mapRef,
  viewport,
}: ViewProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-5">
      <div className="flex flex-wrap items-start gap-5">
        <HeaderCard hour={hour} />
        <MicroclimateToggle scenario={scenario} onChange={onScenarioChange} />

        {/* 채색 기준을 명시하지 않으면 무엇을 보는 지도인지 알 수 없다. */}
        <Panel className="px-4 py-3">
          <div className="text-[13px] text-faint">채색 기준</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[13px] text-muted">평시 대비 초과율</span>
            <span
              aria-hidden
              className="h-2.5 w-24 rounded-full"
              style={{
                background:
                  'linear-gradient(90deg, rgba(111,196,154,0.25), rgba(232,120,92,0.75))',
              }}
            />
            <span className="tnum text-[13px] text-faint">+10% → +50%</span>
          </div>
        </Panel>
      </div>

      <div className="flex-1" />

      <div className="flex items-end justify-between gap-5">
        <MiniMap
          viewport={viewport}
          className="hidden w-[240px] flex-none xl:block"
        />

        <div className="flex items-end gap-5">
          {DISTRICTS.map((district) => {
            const excess = getExcessAt(district.code, scenario, hour)
            const risk = getRiskLevel(excess)
            const warm = district.variant === 'warm'
            return (
              <Panel
                key={district.code}
                accent={district.variant}
                tone={warm && risk === 'danger' ? 'warm' : 'default'}
                className="w-[196px]"
              >
                <div className="px-4 pb-4 pt-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[15px] font-semibold">
                      {district.name}
                    </span>
                    <span className="text-[13px] text-faint">
                      {RISK_LABEL[risk]}
                    </span>
                  </div>
                  <div
                    className={cn(
                      'tnum mt-2 text-[40px] font-semibold leading-none tracking-[-0.02em] transition-colors duration-200',
                      warm ? 'text-warm-text' : 'text-ink',
                    )}
                  >
                    +{Math.round(excess)}%
                  </div>
                </div>
              </Panel>
            )
          })}

          <ZoomControls
            onZoomIn={() => mapRef.current?.zoomIn()}
            onZoomOut={() => mapRef.current?.zoomOut()}
            onReset={() => mapRef.current?.reset()}
          />
        </div>
      </div>
    </div>
  )
}
