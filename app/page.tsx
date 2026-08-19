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

  // 브리핑 3상태 검수용 — 백엔드 연동 시 실제 fetch 상태로 대체된다.
  const [briefingStatus, setBriefingStatus] =
    useState<BriefingState['status']>('success')
  const briefingState: BriefingState =
    briefingStatus === 'success'
      ? { status: 'success', briefing: BRIEFINGS[scenario] }
      : briefingStatus === 'error'
        ? { status: 'error' }
        : { status: 'loading' }

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
    onBriefingRetry: () => setBriefingStatus('success'),
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
          padding={VIEW_MAP_PADDING[view]}
          showLabels={settings.showMapLabels}
          onReady={handleMapReady}
          onViewChange={setViewport}
        />
      </div>

      {/* 패널은 지도 위에 떠 있다. 폭이 줄면 겹치므로 절대위치가 아니라 flex로 짠다. */}
      <div className="absolute inset-0 flex gap-5 p-6">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((v) => !v)}
          activeView={view}
          onViewChange={handleViewChange}
        />
        <ActiveView {...viewProps} />
      </div>

      {/* 브리핑 3상태 검수용 — 백엔드 연동 시 제거된다 */}
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
