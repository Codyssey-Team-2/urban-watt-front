export type ViewKey =
  | 'comparison'
  | 'map'
  | 'chart'
  | 'data'
  | 'settings'

export type ChartTab = 'demand' | 'temp' | 'error'

export interface NavItem {
  key: ViewKey
  label: string
}

export const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: '분석',
    items: [
      { key: 'comparison', label: '지역 비교' },
      { key: 'map', label: '지도 보기' },
      { key: 'chart', label: '예측 그래프' },
    ],
  },
  {
    title: '데이터',
    items: [
      { key: 'data', label: '데이터 정보' },
      { key: 'settings', label: '설정' },
    ],
  },
]

/** 재생 속도 — 한 시간당 머무는 시간(ms) */
export const PLAYBACK_SPEED = {
  slow: 1100,
  normal: 620,
  fast: 300,
} as const

export type PlaybackSpeed = keyof typeof PLAYBACK_SPEED

export interface Settings {
  playbackSpeed: PlaybackSpeed
  /** 차트 마커 간격(시간). 좁을수록 색각 구분이 쉬워지고 선은 조금 지저분해진다. */
  markerInterval: number
  /** 지도 위 동 이름·초과율 라벨 */
  showMapLabels: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  playbackSpeed: 'normal',
  markerInterval: 4,
  showMapLabels: true,
}

/**
 * 뷰마다 지도를 가리는 패널이 달라서, 두 동이 빈 영역에 오도록 여백도 달라진다.
 */
export const VIEW_MAP_PADDING: Record<
  ViewKey,
  { top: number; bottom: number; left: number; right: number }
> = {
  comparison: { top: 110, bottom: 340, left: 330, right: 460 },
  map: { top: 110, bottom: 90, left: 330, right: 100 },
  chart: { top: 110, bottom: 480, left: 330, right: 100 },
  data: { top: 90, bottom: 90, left: 330, right: 100 },
  settings: { top: 90, bottom: 90, left: 330, right: 100 },
}
