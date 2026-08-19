import type { Dispatch, SetStateAction } from 'react'
import type { BriefingState } from '@/components/panels/BriefingCard'
import type { ChartTab, Settings } from '@/lib/nav'
import type { MapController } from '@/components/map/MapView'
import type { ScenarioKey } from '@/lib/types'

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
  onBriefingRetry: () => void
  mapRef: React.RefObject<MapController | null>
  viewport: import('@/components/map/MapView').Viewport | null
}
