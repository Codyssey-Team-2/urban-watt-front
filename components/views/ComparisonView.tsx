'use client'

import { Panel } from '@/components/layout/Panel'
import { HeaderCard } from '@/components/controls/HeaderCard'
import { WeatherChips } from '@/components/controls/WeatherChips'
import { MicroclimateToggle } from '@/components/controls/MicroclimateToggle'
import { TimeScrubber } from '@/components/controls/TimeScrubber'
import { DemandChart } from '@/components/panels/DemandChart'
import { ForecastChart } from '@/components/panels/ForecastChart'
import { DistrictCard } from '@/components/panels/DistrictCard'
import { BriefingCard } from '@/components/panels/BriefingCard'
import { ZoomControls } from '@/components/map/ZoomControls'
import { MiniMap } from '@/components/map/MiniMap'
import { PLAYBACK_SPEED } from '@/lib/nav'
import type { ViewProps } from './shared'

/** 기본 화면 — 지도·카드·차트를 한 화면에서 비교한다. */
export function ComparisonView(props: ViewProps) {
  const {
    scenario,
    onScenarioChange,
    scenarioNote,
    header,
    hour,
    onHourChange,
    playing,
    onPlayingChange,
    chart,
    chartTab,
    onChartTabChange,
    settings,
    cards,
    briefingState,
    briefingSource,
    briefingUnverified,
    onBriefingRetry,
    mapRef,
    viewport,
  } = props

  return (
    <>
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <div className="flex flex-wrap items-start gap-5">
          <HeaderCard hour={hour} header={header} />
          <WeatherChips chips={header.chips} />
          <MicroclimateToggle
            scenario={scenario}
            onChange={onScenarioChange}
            disabledNote={scenarioNote}
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
              {chart.mode === 'forecast' ? (
                <ForecastChart
                  series={chart.series}
                  scenarioLabel={chart.scenarioLabel}
                  hour={hour}
                  tab={chartTab}
                  onTabChange={onChartTabChange}
                />
              ) : (
                <DemandChart
                  scenario={scenario}
                  hour={hour}
                  tab={chartTab}
                  onTabChange={onChartTabChange}
                  markerInterval={settings.markerInterval}
                />
              )}
            </div>
            <TimeScrubber
              hour={hour}
              onHourChange={onHourChange}
              playing={playing}
              onPlayingChange={onPlayingChange}
              stepMs={PLAYBACK_SPEED[settings.playbackSpeed]}
              source={header.source}
            />
          </Panel>
        </div>
      </div>

      {/* 넓을 때: 우측 400px 세로 레일. 좁을 때: 하단 가로 스크롤 시트. */}
      <aside
        // 가로 배치에서 stretch가 걸리면 카드가 세로로 늘어나 빈 공간이 생긴다.
        // 세로 레일로 돌아가면 stretch가 있어야 폭이 꽉 찬다.
        className="flex min-h-0 shrink-0 items-start gap-5 overflow-x-auto pb-1 short:gap-3 lg:w-[400px] lg:flex-col lg:items-stretch lg:overflow-x-visible lg:pb-0"
      >
        {/*
          카드만 스크롤하고 줌 컨트롤은 항상 보이게 둔다. 하나의 스크롤 영역에
          같이 넣으면 화면이 낮을 때 컨트롤이 스크롤 밖으로 밀려 잘린다.
          좁은 화면에서는 display:contents로 바깥 가로 배치에 그대로 참여시킨다.
        */}
        <div className="contents lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:gap-5 lg:overflow-y-auto short:lg:gap-3">
        {cards.map((card) => (
          <DistrictCard
            key={card.code}
            card={card}
            className="w-[320px] shrink-0 lg:w-auto"
          />
        ))}

        <BriefingCard
          state={briefingState}
          source={briefingSource}
          unverifiedNumbers={briefingUnverified}
          onRetry={onBriefingRetry}
          className="w-[360px] shrink-0 lg:w-auto"
        />


        </div>

        <ZoomControls
          onZoomIn={() => mapRef.current?.zoomIn()}
          onZoomOut={() => mapRef.current?.zoomOut()}
          onReset={() => mapRef.current?.reset()}
        />
      </aside>
    </>
  )
}
