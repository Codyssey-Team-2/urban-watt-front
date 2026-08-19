'use client'

import { useCallback, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Sidebar } from '@/components/layout/Sidebar'
import { Panel } from '@/components/layout/Panel'
import { HeaderCard } from '@/components/controls/HeaderCard'
import { WeatherChips } from '@/components/controls/WeatherChips'
import { MicroclimateToggle } from '@/components/controls/MicroclimateToggle'
import { TimeScrubber } from '@/components/controls/TimeScrubber'
import { DemandChart } from '@/components/panels/DemandChart'
import { DistrictCard } from '@/components/panels/DistrictCard'
import { ModelPerfCard } from '@/components/panels/ModelPerfCard'
import {
  BriefingCard,
  type BriefingState,
} from '@/components/panels/BriefingCard'
import { ZoomControls } from '@/components/map/ZoomControls'
import { MiniMap } from '@/components/map/MiniMap'
import type { MapController, Viewport } from '@/components/map/MapView'
import {
  BRIEFINGS,
  CURRENT_HOUR,
  DISTRICTS,
  OVERALL_MAPE,
  getForecast,
} from '@/lib/mock'
import type { ScenarioKey } from '@/lib/types'

// MapLibre는 window/WebGL을 요구해 서버에서 렌더할 수 없다.
const MapView = dynamic(
  () => import('@/components/map/MapView').then((m) => m.MapView),
  { ssr: false },
)

export default function Page() {
  const [scenario, setScenario] = useState<ScenarioKey>('c')
  const [hour, setHour] = useState(CURRENT_HOUR)
  const [playing, setPlaying] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [viewport, setViewport] = useState<Viewport | null>(null)
  const mapRef = useRef<MapController | null>(null)

  const handleMapReady = useCallback((controller: MapController) => {
    mapRef.current = controller
  }, [])

  // Phase 3 검수용 — 백엔드 연동 시 실제 fetch 상태로 대체된다.
  const [briefingStatus, setBriefingStatus] =
    useState<BriefingState['status']>('success')
  const briefingState: BriefingState =
    briefingStatus === 'success'
      ? { status: 'success', briefing: BRIEFINGS[scenario] }
      : briefingStatus === 'error'
        ? { status: 'error' }
        : { status: 'loading' }

  return (
    <div className="relative size-full">
      {/* 지도는 화면을 꽉 채우는 배경 */}
      <div className="absolute inset-0 bg-mapbase">
        <MapView
          scenario={scenario}
          onReady={handleMapReady}
          onViewChange={setViewport}
        />
      </div>

      {/* 패널은 지도 위에 떠 있다. 폭이 줄면 겹치므로 절대위치가 아니라 flex로 짠다. */}
      <div className="absolute inset-0 flex gap-5 p-6">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((v) => !v)}
        />

        {/* 중앙 컬럼 — min-w-0 이 없으면 자식이 넘칠 때 레일을 밀어낸다 */}
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="flex flex-wrap items-start gap-5">
            <HeaderCard hour={hour} />
            <WeatherChips hour={hour} />
            <MicroclimateToggle scenario={scenario} onChange={setScenario} />
          </div>

          <div className="flex-1" />

          <div className="flex min-w-0 gap-5">
            {/* 1280px 미만에서는 미니맵을 숨긴다 */}
            <MiniMap
              viewport={viewport}
              className="hidden w-[240px] flex-none self-end xl:block"
            />
            {/* 차트는 218px면 그림 영역이 60px밖에 안 남아 두 동의 기울기 차이가
                묻힌다. 이 데모의 핵심이므로 미니맵보다 높게 잡는다. */}
            <Panel className="flex h-[288px] min-w-0 flex-1 flex-col px-5 pb-3 pt-4">
              <div className="min-h-0 flex-1">
                <DemandChart scenario={scenario} hour={hour} />
              </div>
              <TimeScrubber
                hour={hour}
                onHourChange={setHour}
                playing={playing}
                onPlayingChange={setPlaying}
              />
            </Panel>
          </div>
        </div>

        {/* 우측 레일 400px 고정 */}
        {/* 레일 자식은 절대 눌리지 않는다 — 눌리면 accent 패널의 overflow-hidden에
            걸려 카드 하단 지표가 소리 없이 잘린다. 넘치면 스크롤로 처리한다. */}
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
            onRetry={() => setBriefingStatus('success')}
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
      </div>

      {/* 브리핑 3상태 검수용 — Phase 8(백엔드 연동)에서 제거된다 */}
      <button
        type="button"
        onClick={() =>
          setBriefingStatus((s) =>
            s === 'success' ? 'loading' : s === 'loading' ? 'error' : 'success',
          )
        }
        className="tnum absolute bottom-1 right-1 rounded-full bg-ink/70 px-3 py-1 text-[13px] text-white"
      >
        브리핑 상태={briefingStatus}
      </button>
    </div>
  )
}
