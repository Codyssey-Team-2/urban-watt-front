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
  /** 평시 기저수요 대비 추가 사용률. 위험도가 아니다. */
  extra_percent: number
  temperature: number
  /** 원자료가 없으면 null */
  humidity: number | null
  wind: number | null
  /** 실측 ÷ 위험선. 위험 등급은 이 값으로만 판정된다. */
  risk_ratio: number
  /** risk_ratio를 백분율로. 헤드라인은 이 값을 쓴다. */
  risk_percent: number
  /** '위험선의 100.6%' */
  risk_text: string
}

export interface DayWeather {
  t_max: number | null
  t_min: number | null
  /** 원자료가 없으면 null — 프론트는 해당 칩을 숨긴다 */
  humidity: number | null
  wind: number | null
  heatwave: boolean
}

/** 예측 모델의 학습 근거. observed 에는 없다. */
export interface ModelBasis {
  scenario: 'weather' | 'microclimate'
  train_end: string
  train_days: number
  features: string[]
  target: string
  note: string
}

export interface ForecastResponse {
  code: string
  name: string
  date: string
  /** 어떤 시나리오로 답한 것인지 서버가 되돌려 준다 */
  scenario: ScenarioName
  threshold_kwh: number | null
  weather: DayWeather | null
  points: ForecastPoint[]
  model_basis: ModelBasis | null
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
  /** 좌표를 어디서 뽑았는지 (경계 centroid 등) */
  latlng_source?: string
}

export interface CompareRow {
  label: string
  unit: string
  /** 10자리 법정동코드를 키로 하는 값 */
  values: Record<string, number | null>
}

export interface CompareResponse {
  dongs: { code: string; name: string }[]
  rows: CompareRow[]
}

/**
 * 지금 이 서버가 무엇으로 답하고 있는지와 아직 못 만드는 항목.
 * 시연 중 '이 부분은 데이터 확보 중'을 화면이 스스로 말하게 하기 위한 것.
 */
export interface MetaResponse {
  service: string
  version: string
  mode: 'live' | 'snapshot'
  mode_text: string
  period: Record<string, string>
  llm: Record<string, unknown>
  dongs: MetaDong[]
  /** 토글 활성화 판단용 */
  forecast_scenarios: Record<ScenarioName, ScenarioStatus>
  /** 데이터 출처. 항목별로 아직 못 채운 이유까지 함께 온다. */
  sources: Record<string, MetaSource>
  pending: string[]
  caveats: string[]
}

/**
 * AI 브리핑. 모델은 분석하지 않고 이미 끝난 분석을 문장으로 옮긴다.
 *
 * `unverified_numbers` 가 비어 있지 않으면 사실표에 없는 숫자가 섞인 것이다.
 * 화면에 그대로 내보내기 전에 확인이 필요하다는 신호로 쓴다.
 */
export interface BriefingResponse {
  codes: string[]
  date: string | null
  status: DataStatus
  text: string
  provider: string | null
  model: string | null
  usage: Record<string, unknown> | null
  unverified_numbers: string[]
  note: string | null
  facts: Record<string, unknown>
  prompt: { system: string; user: string } | null
}

/** 예측 시나리오. 실측만 준비돼 있고 기상만/미기후는 아직 없다. */
export type ScenarioName = 'observed' | 'weather' | 'microclimate'

export interface ScenarioStatus {
  status: DataStatus
  note: string | null
}

/**
 * 출처 한 건. `status`/`note` 는 그 출처에서 아직 못 얻은 값이 있을 때 온다.
 * 예: ASOS 원자료가 없어 습도·풍속이 null, S-DoT 매핑 미확보로 ΔT 산출 불가.
 */
export interface MetaSource {
  label: string
  provider: string
  dataset?: string
  status?: DataStatus
  note?: string
  detail_status?: DataStatus
  detail_note?: string
}

/** 동별 시계열 가용 여부. 요청 전에 여기서 확인한다. */
export interface MetaDong {
  code: string
  name: string
  loaded: boolean
  forecast_status: DataStatus
  forecast_dates: string[]
  forecast_note: string | null
}

/** 법정동코드는 10자리. 이름으로 조회하지 않는다. */
export const DONG_CODE = {
  jingwan: '1138011400',
  guro: '1153010200',
} as const

/** 시연 기준일. date를 생략해도 서버가 이 날짜로 답한다. */
export const DEMO_DATE = '2022-07-10'
