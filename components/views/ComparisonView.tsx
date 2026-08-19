'use client'

import { Panel } from '@/components/layout/Panel'
import { HeaderCard } from '@/components/controls/HeaderCard'
import { WeatherChips } from '@/components/controls/WeatherChips'
import { MicroclimateToggle } from '@/components/controls/MicroclimateToggle'
import { TimeScrubber } from '@/components/controls/TimeScrubber'
import { DemandChart } from '@/components/panels/DemandChart'
import { DistrictCard } from '@/components/panels/DistrictCard'
import { ModelPerfCard } from '@/components/panels/ModelPerfCard'
import { BriefingCard } from '@/components/panels/BriefingCard'
import { ZoomControls } from '@/components/map/ZoomControls'
import { MiniMap } from '@/components/map/MiniMap'
import { DISTRICTS, OVERALL_MAPE, getForecast } from '@/lib/mock'
import { PLAYBACK_SPEED } from '@/lib/nav'
import type { ViewProps } from './shared'

/** 기본 화면 — 지도·카드·차트를 한 화면에서 비교한다. */
export function ComparisonView(props: ViewProps) {
  const {
    scenario,
    onScenarioChange,
    hour,
    onHourChange,
    playing,
    onPlayingChange,
    chartTab,
    onChartTabChange,
    settings,
    briefingState,
    onBriefingRetry,
    mapRef,
    viewport,
  } = props

  return (
    <>
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <div className="flex flex-wrap items-start gap-5">
          <HeaderCard hour={hour} />
          <WeatherChips hour={hour} />
          <MicroclimateToggle
            scenario={scenario}
            onChange={onScenarioChange}
          />
        </div>

        <div className="flex-1" />

        <div className="flex min-w-0 gap-5">
          {/* 1280px 미만에서는 미니맵을 숨긴다 */}
          <MiniMap
            viewport={viewport}
            className="hidden w-[240px] flex-none self-end xl:block"
          />
          <Panel className="flex h-[288px] min-w-0 flex-1 flex-col px-5 pb-3 pt-4">
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
        </div>
      </div>

      <aside className="flex w-[400px] flex-none flex-col gap-5 overflow-y-auto">
        {DISTRICTS.map((district) => {
          const forecast = getForecast(district.code, scenario)
          const point = forecast.hourly[hour]
          return (
            <DistrictCard
              key={district.code}
              district={district}
              forecast={forecast}
              demand={scenario === 'c' ? point.modelC : point.modelB}
              className="shrink-0"
            />
          )
        })}

        <BriefingCard
          state={briefingState}
          onRetry={onBriefingRetry}
          className="shrink-0"
        />

        <ModelPerfCard mape={OVERALL_MAPE} className="shrink-0" />

        <div className="min-h-5 flex-1" />

        <ZoomControls
          onZoomIn={() => mapRef.current?.zoomIn()}
          onZoomOut={() => mapRef.current?.zoomOut()}
          onReset={() => mapRef.current?.reset()}
        />
      </aside>
    </>
  )
}
