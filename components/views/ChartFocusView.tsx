'use client'

import { Panel } from '@/components/layout/Panel'
import { HeaderCard } from '@/components/controls/HeaderCard'
import { WeatherChips } from '@/components/controls/WeatherChips'
import { MicroclimateToggle } from '@/components/controls/MicroclimateToggle'
import { TimeScrubber } from '@/components/controls/TimeScrubber'
import { DemandChart } from '@/components/panels/DemandChart'
import { cn } from '@/lib/cn'
import {
  DISTRICTS,
  GURO_CODE,
  getDemandAt,
  getExcessAt,
  getTempAt,
} from '@/lib/mock'
import { PLAYBACK_SPEED } from '@/lib/nav'
import type { ViewProps } from './shared'

/** 차트를 전체 폭으로 크게 보는 화면. 시간대별 수치를 자세히 읽는 용도. */
export function ChartFocusView({
  scenario,
  onScenarioChange,
  hour,
  onHourChange,
  playing,
  onPlayingChange,
  chartTab,
  onChartTabChange,
  settings,
}: ViewProps) {
  const guroTemp = getTempAt(GURO_CODE, hour)

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-5">
      <div className="flex flex-wrap items-start gap-5">
        <HeaderCard hour={hour} />
        <WeatherChips hour={hour} />
        <MicroclimateToggle scenario={scenario} onChange={onScenarioChange} />
      </div>

      <Panel className="flex min-h-0 flex-1 flex-col px-6 pb-4 pt-5">
        <div className="min-h-0 flex-1">
          <DemandChart
            scenario={scenario}
            hour={hour}
            tab={chartTab}
            onTabChange={onChartTabChange}
            markerInterval={settings.markerInterval}
          />
        </div>
        <TimeScrubber
          hour={hour}
          onHourChange={onHourChange}
          playing={playing}
          onPlayingChange={onPlayingChange}
          stepMs={PLAYBACK_SPEED[settings.playbackSpeed]}
        />
      </Panel>

      <div className="flex flex-wrap items-start gap-5">
        {DISTRICTS.map((district) => {
          const excess = getExcessAt(district.code, scenario, hour)
          const temp = getTempAt(district.code, hour)
          const value = getDemandAt(district.code, scenario, hour)
          const urban = district.variant === 'urban'
          return (
            <Panel
              key={district.code}
              accent={district.variant}
              className="min-w-[240px] flex-1"
            >
              <div className="flex items-center gap-6 px-5 py-4">
                <div>
                  <div className="text-[13px] text-faint">{district.name}</div>
                  <div
                    className={cn(
                      'tnum text-[24px] font-semibold leading-tight',
                      urban ? 'text-urban-text' : 'text-ink',
                    )}
                  >
                    {value.toFixed(1)}
                    <span className="ml-1 text-[13px] font-normal text-faint">
                      MW
                    </span>
                  </div>
                </div>
                <div className="border-l border-hair pl-6">
                  <div className="text-[13px] text-faint">평시 대비</div>
                  <div className="tnum text-[15px] font-semibold">
                    +{Math.round(excess)}%
                  </div>
                </div>
                <div>
                  <div className="text-[13px] text-faint">S-DoT 실측</div>
                  <div className="tnum text-[15px] font-semibold">
                    {temp.sdot.toFixed(1)}°C
                  </div>
                </div>
                <div>
                  <div className="text-[13px] text-faint">대표기상</div>
                  <div className="tnum text-[15px] text-muted">
                    {temp.asos.toFixed(1)}°C
                  </div>
                </div>
              </div>
            </Panel>
          )
        })}

      </div>

      <div className="text-[13px] text-faint">
        {String(Math.floor(hour)).padStart(2, '0')}시 기준 · 구로동 S-DoT 실측은 대표기상보다{' '}
        {(guroTemp.sdot - guroTemp.asos).toFixed(1)}°C 높습니다.
      </div>
    </div>
  )
}
