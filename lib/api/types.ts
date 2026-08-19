/**
 * 백엔드 API 계약을 그대로 옮긴 타입.
 *
 * 이 파일은 서버 응답의 거울이다. 화면 편의를 위한 가공은 하지 않는다.
 * 계약이 바뀌면 여기와 adapt.ts만 고치고 컴포넌트는 건드리지 않는다.
 */

/** 값이 아직 없는 지표는 null 대신 status로 구분한다. */
export type DataStatus = 'ready' | 'pending'

/** 서버가 등급·색상·문구까지 만들어 내려준다. 프론트는 판정하지 않는다. */
export interface Graded {
  grade: string
  color: string
  message: string
}

export interface CoverComponent {
  percent: number | null
  /** '10곳 중 8곳' */
  text: string | null
  /** '콘크리트·아스팔트' */
  label: string
}

export interface Microclimate extends Partial<Graded> {
  status: DataStatus
  /** 도시열 지수 0~100. MCI(-100~+100)를 서버가 변환한 값 */
  heat_index: number | null
  components: {
    paved: CoverComponent
    green: CoverComponent
    water: CoverComponent
    bare: CoverComponent
    wetland: CoverComponent
  }
  area_km2?: number
  basis?: {
    tag: string
    method: string
    source: string
    clipped_to_dong: boolean
    note: string
    caveat: string
  }
  /** 값의 출처 단서. 화면 하단에 그대로 출력한다 */
  note?: string | null
  /** 나지·습지 때문에 비율 합이 100%가 아니라는 단서 */
  caveat?: string | null
}

export interface DongSummary {
  code: string
  name: string
  microclimate: Microclimate
  demand: {
    extra_usage_percent: number | null
    extra_usage_text: string | null
    night_percent: number | null
    day_percent: number | null
    pattern: string | null
  }
  cooling: {
    switch_on_temp: number | null
    switch_on_text: string | null
    /** %p/℃ — 기온 1℃당 사용량 증가율 */
    sensitivity: number | null
    sensitivity_text: string | null
  }
  peak: {
    threshold_kwh: number | null
    threshold_text: string | null
    risk_days: number | null
    total_days: number | null
    risk_days_text: string | null
  }
}

export interface ForecastPoint extends Graded {
  /** ISO 8601, KST 고정 */
  time: string
  hour: number
  usage_kwh: number
  baseline_kwh: number
  extra_percent: number
  temperature: number
  /** 실측 ÷ 위험선 */
  risk_ratio: number
}

export interface DayWeather {
  t_max: number | null
  t_min: number | null
  /** 원자료가 없으면 null — 프론트는 해당 칩을 숨긴다 */
  humidity: number | null
  wind: number | null
  heatwave: boolean
}

export interface ForecastResponse {
  code: string
  name: string
  date: string
  threshold_kwh: number
  weather: DayWeather
  points: ForecastPoint[]
}

/** 지도 폴리곤. 스타일까지 서버가 지정한다 — 프론트는 색을 계산하지 않는다. */
export interface DongFeatureProperties extends Graded {
  code: string
  name: string
  status: DataStatus
  heat_index: number | null
  extra_usage_percent: number | null
  risk_days: number | null
  lat: number
  lng: number
  tooltip: string
  fill_color: string
  fill_opacity: number
  stroke_color: string
  stroke_width: number
  stroke_opacity: number
}

export interface DongsGeoJson {
  type: 'FeatureCollection'
  status: DataStatus
  /** [서, 남, 동, 북] */
  bbox: [number, number, number, number]
  source: string
  note: string | null
  features: GeoJSON.Feature<
    GeoJSON.Polygon | GeoJSON.MultiPolygon,
    DongFeatureProperties
  >[]
}

export interface DongPin extends Graded {
  code: string
  name: string
  lat: number
  lng: number
  heat_index: number | null
  risk_days: number | null
}

export interface DongsResponse {
  dongs: DongPin[]
}

export interface CompareRow {
  label: string
  unit: string
  /** 동 이름을 키로 하는 값 */
  values: Record<string, number | null>
}

export interface CompareResponse {
  dongs: string[]
  rows: CompareRow[]
}

export interface MetaResponse {
  mode?: string
  pending?: string[]
  note?: string | null
}

/** 법정동코드는 10자리. 이름으로 조회하지 않는다. */
export const DONG_CODE = {
  jingwan: '1138011400',
  guro: '1153010200',
} as const
