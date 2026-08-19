'use client'

import { useCallback, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Sidebar } from '@/components/layout/Sidebar'
import type { BriefingState } from '@/components/panels/BriefingCard'
import type { MapController, Viewport } from '@/components/map/MapView'
import { ComparisonView } from '@/components/views/ComparisonView'
import { MapFocusView } from '@/components/views/MapFocusView'
import { ChartFocusView } from '@/components/views/ChartFocusView'
import { DataInfoView } from '@/components/views/DataInfoView'
import { SettingsView } from '@/components/views/SettingsView'
import type { ViewProps } from '@/components/views/shared'
import { BRIEFINGS, CURRENT_HOUR } from '@/lib/mock'
import { useBriefing, useDashboard } from '@/lib/api/useDashboard'
import { isApiEnabled } from '@/lib/api/client'
import {
  DEFAULT_SETTINGS,
  VIEW_MAP_PADDING,
  type ChartTab,
  type Settings,
  type ViewKey,
} from '@/lib/nav'
import type { ScenarioKey } from '@/lib/types'

// MapLibre는 window/WebGL을 요구해 서버에서 렌더할 수 없다.
const MapView = dynamic(
  () => import('@/components/map/MapView').then((m) => m.MapView),
  { ssr: false },
)

const VIEWS: Record<ViewKey, (props: ViewProps) => React.ReactNode> = {
  comparison: ComparisonView,
  map: MapFocusView,
  chart: ChartFocusView,
  data: () => <DataInfoView />,
  settings: SettingsView,
}

export default function Page() {
  // 화면 전체가 공유하는 상태는 여기 한 곳에만 둔다.
  const [view, setView] = useState<ViewKey>('comparison')
  const [scenario, setScenario] = useState<ScenarioKey>('c')
  const [hour, setHour] = useState(CURRENT_HOUR)
  const [playing, setPlaying] = useState(false)
  const [chartTab, setChartTab] = useState<ChartTab>('demand')
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [viewport, setViewport] = useState<Viewport | null>(null)
  const mapRef = useRef<MapController | null>(null)

  const dashboard = useDashboard()
  const briefing = useBriefing()

  // API가 붙어 있으면 서버 브리핑, 아니면 목데이터로 화면을 유지한다.
  const briefingState: BriefingState = !isApiEnabled()
    ? { status: 'success', briefing: BRIEFINGS[scenario] }
    : briefing.state.status === 'ready'
      ? {
          status: 'success',
          briefing: {
            summary: briefing.state.data.text,
            evidence: [],
            caveat: briefing.state.data.note ?? undefined,
          },
        }
      : briefing.state.status === 'error'
        ? { status: 'error', message: briefing.state.message }
        : { status: 'loading' }

  const briefingSource =
    briefing.state.status === 'ready'
      ? [briefing.state.data.provider, briefing.state.data.model]
          .filter(Boolean)
          .join(' · ')
      : undefined

  const handleMapReady = useCallback((controller: MapController) => {
    mapRef.current = controller
  }, [])

  // 재생 중에 다른 화면으로 넘어가면 시간이 혼자 흐른다. 화면을 옮기면 멈춘다.
  const handleViewChange = useCallback((next: ViewKey) => {
    setView(next)
    setPlaying(false)
  }, [])

  const ActiveView = VIEWS[view]
  const viewProps: ViewProps = {
    scenario,
    onScenarioChange: setScenario,
    hour,
    onHourChange: setHour,
    playing,
    onPlayingChange: setPlaying,
    chartTab,
    onChartTabChange: setChartTab,
    settings,
    onSettingsChange: setSettings,
    briefingState,
    briefingSource,
    briefingUnverified:
      briefing.state.status === 'ready'
        ? briefing.state.data.unverified_numbers
        : undefined,
    onBriefingRetry: briefing.retry,
    dashboard,
    mapRef,
    viewport,
  }

  return (
    <div className="relative size-full">
      {/* 지도는 화면을 꽉 채우는 배경이며 뷰가 바뀌어도 마운트를 유지한다.
          다시 만들면 전환할 때마다 깜빡이고 초기화 비용이 든다. */}
      <div className="absolute inset-0 bg-mapbase">
        <MapView
          scenario={scenario}
          hour={hour}
          padding={VIEW_MAP_PADDING[view]}
          showLabels={settings.showMapLabels}
          onReady={handleMapReady}
          onViewChange={setViewport}
        />
      </div>

      {/* 패널은 지도 위에 떠 있다. 폭이 줄면 겹치므로 절대위치가 아니라 flex로 짠다.
          오버레이 자체는 화면 전체를 덮으므로 이벤트를 통과시켜야 지도를 끌 수 있다.
          실제로 이벤트를 받아야 하는 건 Panel(pointer-events-auto)뿐이다. */}
      <div className="pointer-events-none absolute inset-0 flex gap-5 p-6">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((v) => !v)}
          activeView={view}
          onViewChange={handleViewChange}
        />
        {/* 1024px 미만에서는 우측 레일을 아래로 내린다. 사이드바는 계속 왼쪽. */}
        <div className="flex min-w-0 flex-1 flex-col gap-5 lg:flex-row">
          <ActiveView {...viewProps} />
        </div>
      </div>

      {/* 지도 배경 출처. OSM 데이터(ODbL)는 표기 의무가 있다. */}
      <p className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 text-[13px] text-faint/70">
        경계 southkorea/seoul-maps · 한강 © OpenStreetMap contributors
      </p>

    </div>
  )
}
