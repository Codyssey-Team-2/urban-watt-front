import type { Dispatch, SetStateAction } from 'react'
import type { BriefingState } from '@/components/panels/BriefingCard'
import type { ChartTab, Settings } from '@/lib/nav'
import type { MapController } from '@/components/map/MapView'
import type { RiskLevel, ScenarioKey } from '@/lib/types'

/** 차트가 무엇을 그릴지. 실측이 없으면 목데이터로 떨어진다. */
export type ChartModel =
  | { mode: 'mock' }
  | {
      mode: 'forecast'
      day: import('@/lib/api/adapt').DayView
      districtName: string
      identityColor: string
      /** 비교 대상 동의 시계열이 없을 때의 안내 */
      missingNote: string | null
    }

/**
 * 카드가 그릴 내용. 실서버와 목데이터가 모두 이 모양으로 들어온다.
 * 카드가 데이터 출처를 알 필요가 없어야 어느 쪽이 붙어도 화면이 흔들리지 않는다.
 */
export interface CardModel {
  code: string
  name: string
  variant: 'cool' | 'urban'
  /** '+47%' · '100.6%' 처럼 이미 완성된 문자열 */
  headline: string
  /** '평시 대비' · '위험선 대비' */
  headlineLabel: string
  grade: string
  /** 서버가 정한 등급 색. 없으면 자체 스타일로 떨어진다. */
  gradeColor?: string
  risk: RiskLevel
  stats: { label: string; value: string; emphasize?: boolean }[]
  /** '24시간 시계열 스냅샷이 없습니다' 같은 단서 */
  note?: string | null
}

/** 모든 뷰가 공유하는 상태. page.tsx가 단일 출처다. */
export interface ViewProps {
  scenario: ScenarioKey
  onScenarioChange: (scenario: ScenarioKey) => void
  hour: number
  onHourChange: Dispatch<SetStateAction<number>>
  playing: boolean
  onPlayingChange: (playing: boolean) => void
  chartTab: ChartTab
  onChartTabChange: (tab: ChartTab) => void
  settings: Settings
  onSettingsChange: (settings: Settings) => void
  briefingState: BriefingState
  briefingSource?: string
  briefingUnverified?: string[]
  onBriefingRetry: () => void
  dashboard: import('@/lib/api/useDashboard').Loadable<
    import('@/lib/api/useDashboard').DashboardData
  >
  cards: CardModel[]
  chart: ChartModel
  /** 시나리오가 준비되지 않으면 토글을 잠근다 */
  scenarioNote: string | null
  mapRef: React.RefObject<MapController | null>
  viewport: import('@/components/map/MapView').Viewport | null
}
