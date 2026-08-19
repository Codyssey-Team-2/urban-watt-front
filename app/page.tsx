'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
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
import {
  BRIEFINGS,
  CURRENT_HOUR,
  DEMO_DATE,
  DISTRICTS,
  GURO_CODE,
  WEATHER,
  getDemandAt,
  getExcessAt,
  getRiskLevel,
  getTempAt,
} from '@/lib/mock'
import { interpolateHour } from '@/lib/api/adapt'
import type {
  CardModel,
  ChartModel,
  HeaderModel,
  MapDistrict,
  WeatherChip,
} from '@/components/views/shared'
import type { RiskLevel } from '@/lib/types'
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
  data: DataInfoView,
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

  // 서버 등급 문자열을 화면 스타일용 3단계로 접는다.
  // 색과 문구는 서버 값을 그대로 쓰고, 여기서는 강조 수준만 정한다.
  const toRisk = (grade: string): RiskLevel =>
    grade === '위험' ? 'danger' : grade === '안전' ? 'stable' : 'caution'

  const cards: CardModel[] = useMemo(() => {
    if (dashboard.status !== 'ready') {
      // API가 없거나 아직 로딩 중이면 목데이터로 화면을 유지한다.
      return DISTRICTS.map((d) => {
        const excess = getExcessAt(d.code, scenario, hour)
        const m = d.microclimate
        return {
          code: d.code,
          name: d.name,
          variant: d.variant,
          headline: `+${Math.round(excess)}%`,
          headlineLabel: '평시 대비',
          grade: { stable: '안정', caution: '주의', danger: '위험' }[
            getRiskLevel(excess)
          ],
          risk: getRiskLevel(excess),
          stats: [
            { label: '냉방 시작', value: `${m.balancePoint.toFixed(1)}°C` },
            {
              label: '1℃당',
              value: `${m.coolingSlope.toFixed(1)}×`,
              emphasize: d.variant === 'urban',
            },
            { label: '나무·풀밭', value: `${m.vegetationRate}%` },
            {
              label: '예측수요',
              value: `${getDemandAt(d.code, scenario, hour).toFixed(1)}MW`,
            },
          ],
        }
      })
    }

    const { districts, days, meta } = dashboard.data
    return districts.map((d) => {
      const day = days[d.code]
      const point = day ? interpolateHour(day.hours, hour) : null
      const info = meta.dongs.find((x) => x.code === d.code)
      const variant = d.identityColor === '#2E9E6B' ? 'cool' : 'urban'

      return {
        code: d.code,
        name: d.name,
        variant,
        // 위험도는 초과율이 아니라 위험선 대비 비율이다 (계약 7항).
        headline: point
          ? `${point.riskPercent.toFixed(1)}%`
          : d.demand.extraPercent != null
            ? `+${d.demand.extraPercent.toFixed(1)}%`
            : '—',
        headlineLabel: point ? '위험선 대비' : '평소 대비 추가 사용',
        // 시계열이 없으면 위험 등급이 없다. 도시열 등급을 대신 보여주되
        // 무엇의 등급인지 밝힌다 — '매우 높음'만 있으면 위험도로 읽힌다.
        grade: point ? point.grade : `도시열 ${d.heat.grade}`,
        gradeColor: point ? point.color : d.heat.color,
        // 패널 강조는 위험 등급에만 건다. 도시열이 높다고 지금 위험한 건 아니다.
        risk: point ? toRisk(point.grade) : 'stable',
        stats: [
          {
            label: '냉방 시작',
            value:
              d.cooling.switchOnTemp != null
                ? `${d.cooling.switchOnTemp.toFixed(1)}°C`
                : '—',
          },
          {
            label: '1℃당',
            value:
              d.cooling.sensitivity != null
                ? `${d.cooling.sensitivity.toFixed(2)}%`
                : '—',
          },
          { label: '나무·풀밭', value: d.cover.green.text ?? '—' },
          {
            label: point ? '사용량' : '도시열 지수',
            value: point
              ? `${Math.round(point.usageKwh).toLocaleString()} kWh`
              : d.heat.index != null
                ? `${d.heat.index}`
                : '—',
          },
        ],
        note: point ? null : (info?.forecast_note ?? null),
      }
    })
  }, [dashboard, scenario, hour])

  /**
   * 두 동이 모두 준비됐을 때만 비교 차트를 그린다는 계약(8항)을 따른다.
   * 한쪽만 선으로 그리면 없는 쪽이 0인 것처럼 읽힌다.
   * 대신 준비된 동의 실측 곡선을 단독으로 보여준다 — 위험선을 넘는 순간이
   * 이 화면의 핵심이라 빈 화면으로 두지 않는다.
   */
  const chart: ChartModel = useMemo(() => {
    if (dashboard.status !== 'ready') return { mode: 'mock' }
    const { districts, days, meta } = dashboard.data
    const withDay = districts.find((d) => days[d.code])
    if (!withDay) return { mode: 'mock' }

    const missing = districts
      .filter((d) => !days[d.code])
      .map((d) => meta.dongs.find((x) => x.code === d.code))
      .filter(Boolean)
    return {
      mode: 'forecast',
      day: days[withDay.code],
      districtName: withDay.name,
      identityColor: withDay.identityColor,
      missingNote: missing.length
        ? `${missing.map((m) => m!.name).join(' · ')}: ${missing[0]!.forecast_note ?? '시계열 없음'}`
        : null,
    }
  }, [dashboard])

  /** 지도 채색. 서버 등급 색을 그대로 쓰고, 없으면 지역색으로 떨어진다. */
  const mapDistricts: MapDistrict[] = useMemo(() => {
    if (dashboard.status !== 'ready') {
      return DISTRICTS.map((d) => {
        const excess = getExcessAt(d.code, scenario, hour)
        const danger = getRiskLevel(excess) === 'danger'
        return {
          code: d.code,
          name: d.name,
          variant: d.variant,
          headline: `+${Math.round(excess)}%`,
          fillColor: danger
            ? '#E57373'
            : d.variant === 'cool'
              ? '#6FC49A'
              : '#7FA9E8',
          fillOpacity: 0.2 + Math.min(excess, 50) / 50 * 0.46,
          strokeColor: danger
            ? '#C62828'
            : d.variant === 'cool'
              ? '#2E9E6B'
              : '#2D6FD1',
          danger,
        }
      })
    }
    const { districts, days } = dashboard.data
    return districts.map((d) => {
      const point = days[d.code] ? interpolateHour(days[d.code].hours, hour) : null
      const variant: 'cool' | 'urban' =
        d.identityColor === '#2E9E6B' ? 'cool' : 'urban'
      const danger = point?.grade === '위험'
      return {
        code: d.code,
        name: d.name,
        variant,
        headline: point
          ? `${point.riskPercent.toFixed(0)}%`
          : d.heat.index != null
            ? `도시열 ${d.heat.index}`
            : '—',
        // 시계열이 있으면 그 시각의 등급 색, 없으면 도시열 등급 색을 쓴다.
        fillColor: point?.color ?? d.heat.color,
        fillOpacity: point
          ? 0.25 + Math.min(point.riskPercent, 120) / 120 * 0.45
          : 0.3,
        strokeColor: danger ? '#C62828' : d.identityColor,
        danger,
      }
    })
  }, [dashboard, scenario, hour])

  /** 상단 헤더와 기상 칩. 값이 없는 항목은 칩을 만들지 않는다. */
  const header: HeaderModel = useMemo(() => {
    if (dashboard.status !== 'ready') {
      const temp = getTempAt(GURO_CODE, hour)
      return {
        date: DEMO_DATE.replace(/-/g, '.'),
        tMax: WEATHER.asosTemp,
        heatwave: WEATHER.isHeatwave,
        chips: [
          {
            key: 'sdot',
            label: 'S-DoT 격차',
            value: `+${(temp.sdot - temp.asos).toFixed(1)}°C`,
            emphasize: true,
          },
          { key: 'humidity', label: '습도', value: `${WEATHER.humidity}%` },
          { key: 'wind', label: '풍속', value: `${WEATHER.windSpeed}m/s` },
        ],
        source: '서울 열린데이터광장 · S-DoT',
      }
    }

    const { districts, days, meta } = dashboard.data
    const day = Object.values(days)[0]
    const chips: WeatherChip[] = []
    // 계약대로 원자료가 없는 값은 칩을 아예 만들지 않는다.
    if (day?.weather.humidity != null)
      chips.push({
        key: 'humidity',
        label: '습도',
        value: `${day.weather.humidity}%`,
      })
    if (day?.weather.wind != null)
      chips.push({
        key: 'wind',
        label: '풍속',
        value: `${day.weather.wind}m/s`,
      })
    // 빈자리는 서버가 이미 문장으로 만들어 준 값으로 채운다.
    const withRisk = districts.find((d) => d.peak.riskDaysText)
    if (withRisk?.peak.riskDaysText)
      chips.push({
        key: 'riskDays',
        label: `${withRisk.name} 위험일`,
        value: withRisk.peak.riskDaysText.replace(/^여름 /, ''),
      })
    const withPattern = districts.find((d) => d.demand.pattern)
    if (withPattern?.demand.pattern)
      chips.push({
        key: 'pattern',
        label: `${withPattern.name} 수요 패턴`,
        value: withPattern.demand.pattern,
      })

    return {
      date: (day?.date ?? meta.period?.start ?? '').replace(/-/g, '.'),
      tMax: day?.weather.tMax ?? null,
      heatwave: day?.weather.heatwave ?? false,
      chips,
      source: `${meta.service} · ${meta.mode}`,
    }
  }, [dashboard, hour])

  // 기상만·미기후 예측이 아직 없으면 토글을 잠근다.
  const scenarioNote =
    dashboard.status === 'ready'
      ? (dashboard.data.meta.forecast_scenarios?.microclimate?.status ===
        'pending'
          ? dashboard.data.meta.forecast_scenarios.microclimate.note
          : null)
      : null

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
    cards,
    chart,
    mapDistricts,
    header,
    scenarioNote,
    mapRef,
    viewport,
  }

  return (
    <div className="relative size-full">
      {/* 지도는 화면을 꽉 채우는 배경이며 뷰가 바뀌어도 마운트를 유지한다.
          다시 만들면 전환할 때마다 깜빡이고 초기화 비용이 든다. */}
      <div className="absolute inset-0 bg-mapbase">
        <MapView
          districts={mapDistricts}
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

      {/*
        실데이터가 아닐 때는 이유를 가리지 않고 항상 알린다.
        주소 미설정과 서버 장애를 구분하지 않고 조용히 목데이터를 띄우면
        시연 중 가짜 수치를 실측처럼 설명하게 된다.
      */}
      {dashboard.status === 'error' && (
        <div className="pointer-events-auto absolute left-1/2 top-1.5 -translate-x-1/2 rounded-full bg-caution-light px-3 py-1 text-[13px] text-caution-text">
          {isApiEnabled()
            ? '분석 서버 응답 없음'
            : '분석 서버 주소 미설정'} — 아래 수치는 시연용 목데이터입니다
        </div>
      )}

      {/* 지도 배경 출처. OSM 데이터(ODbL)는 표기 의무가 있다. */}
      <p className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 text-[13px] text-faint/70">
        경계 southkorea/seoul-maps · 한강 © OpenStreetMap contributors
      </p>

    </div>
  )
}
