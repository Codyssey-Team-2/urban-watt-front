export type ModelKey = 'a' | 'b' | 'c'

/** 토글 상태. 'b' = 기상만(ASOS), 'c' = 미기후 반영(S-DoT + 도시공간) */
export type ScenarioKey = Extract<ModelKey, 'b' | 'c'>

export type RiskLevel = 'stable' | 'caution' | 'danger'

export interface District {
  code: string // 법정동 코드
  name: string // '진관동'
  variant: 'cool' | 'urban'
  center: [number, number] // [lng, lat]
  microclimate: {
    vegetationRate: number // 식생피복률 %
    imperviousRate: number // 불투수피복률 %
    balancePoint: number // 냉방 균형점 °C
    coolingSlope: number // 기울기 배수
  }
}

export interface HourlyPoint {
  hour: number // 0-23
  actual: number | null
  modelB: number // 기상만
  modelC: number // 미기후 반영
  asos: number // 서울 대표 기상 기온 °C (전 지역 공통)
  sdot: number // 해당 지역 S-DoT 실측 기온 °C
}

export interface Forecast {
  districtCode: string
  date: string
  hourly: HourlyPoint[]
  peakHour: number
  excessRate: number // 평시 대비 %
  riskLevel: RiskLevel
}

export interface Metrics {
  districtCode: string
  mape: Record<ModelKey, number>
  rmse: Record<ModelKey, number>
}

export interface Briefing {
  summary: string
  evidence: string[]
  caveat?: string
}

/** 상단 기상칩 */
export interface WeatherSnapshot {
  date: string // '2023-08-05'
  asosTemp: number // 서울 대표 기상 °C
  sdotGap: number // S-DoT 실측과의 격차 °C
  humidity: number // %
  windSpeed: number // m/s
  isHeatwave: boolean
}
