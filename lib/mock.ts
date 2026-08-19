import type {
  Briefing,
  District,
  Forecast,
  HourlyPoint,
  Metrics,
  ScenarioKey,
  WeatherSnapshot,
} from './types'

/** 데모 기준일: 2023-08-05 폭염일, 기준 시각 15:00 KST */
export const DEMO_DATE = '2023-08-05'
export const PEAK_HOUR = 15
export const CURRENT_HOUR = 15

export const JINGWAN_CODE = '1138010600'
export const CHANGSIN_CODE = '1111017200'

// ── 지역 ────────────────────────────────────────────────────────────────

export const DISTRICTS: District[] = [
  {
    code: JINGWAN_CODE,
    name: '진관동',
    variant: 'cool',
    center: [126.9352, 37.6372],
    microclimate: {
      vegetationRate: 58,
      imperviousRate: 35,
      balancePoint: 25.1,
      coolingSlope: 1.0,
    },
  },
  {
    code: CHANGSIN_CODE,
    name: '창신동',
    variant: 'warm',
    center: [127.0104, 37.5745],
    microclimate: {
      vegetationRate: 13,
      imperviousRate: 83,
      balancePoint: 22.3,
      coolingSlope: 1.8,
    },
  },
]

export const getDistrict = (code: string): District =>
  DISTRICTS.find((d) => d.code === code) ?? DISTRICTS[0]

// ── 기상 ────────────────────────────────────────────────────────────────

export const WEATHER: WeatherSnapshot = {
  date: DEMO_DATE,
  asosTemp: 35.4,
  sdotGap: 2.4,
  humidity: 68,
  windSpeed: 1.2,
  isHeatwave: true,
}

// ── 시간대별 수요 곡선 ──────────────────────────────────────────────────
//
// 새벽 저점 → 15시 피크 → 야간 하강.
// 창신동은 오전엔 완만하다가 11~15시에 급격히 꺾인다 (불투수 83%, 기울기 1.8x).

const COOL_SHAPE = [
  0.30, 0.27, 0.25, 0.24, 0.24, 0.26, 0.31, 0.38, 0.46, 0.55, 0.64, 0.72,
  0.80, 0.88, 0.95, 1.0, 0.97, 0.9, 0.82, 0.75, 0.66, 0.55, 0.44, 0.36,
]

const WARM_SHAPE = [
  0.24, 0.22, 0.2, 0.19, 0.19, 0.21, 0.25, 0.31, 0.37, 0.44, 0.53, 0.65,
  0.78, 0.9, 0.97, 1.0, 0.95, 0.86, 0.76, 0.68, 0.58, 0.46, 0.36, 0.29,
]

/** 실측이 모델 곡선과 완전히 겹치면 그래프가 거짓말처럼 보인다. 고정 잔차. */
const RESIDUAL = [
  0.4, -0.3, 0.2, -0.2, 0.3, -0.4, 0.5, 0.6, -0.5, 0.4, 0.7, -0.6,
  0.8, -0.7, 0.9, 0.5, -0.8, 0.6, -0.4, 0.3, -0.5, 0.4, -0.3, 0.2,
]

interface CurveSpec {
  shape: number[]
  /** 평시(비폭염일) 피크 수요 MW */
  normalPeak: number
  /** 심야 저점 MW */
  trough: number
  /** 시나리오별 평시 대비 초과율 % */
  excess: Record<ScenarioKey, number>
}

const CURVES: Record<string, CurveSpec> = {
  [JINGWAN_CODE]: {
    shape: COOL_SHAPE,
    normalPeak: 38.0,
    trough: 21.0,
    // 녹지가 많아 미기후를 넣어도 예측이 거의 안 변한다 — 이게 대조군이다.
    excess: { b: 14, c: 15 },
  },
  [CHANGSIN_CODE]: {
    shape: WARM_SHAPE,
    normalPeak: 52.0,
    trough: 26.0,
    // 토글의 핵심: 기상만 쓰면 +28%로 과소추정, 미기후를 넣으면 +47%.
    excess: { b: 28, c: 47 },
  },
}

const round1 = (n: number) => Math.round(n * 10) / 10

function buildCurve(spec: CurveSpec, scenario: ScenarioKey): number[] {
  const peak = spec.normalPeak * (1 + spec.excess[scenario] / 100)
  const min = Math.min(...spec.shape)
  return spec.shape.map((s) => {
    const t = (s - min) / (1 - min)
    return round1(spec.trough + (peak - spec.trough) * t)
  })
}

function buildHourly(code: string): HourlyPoint[] {
  const spec = CURVES[code]
  const b = buildCurve(spec, 'b')
  const c = buildCurve(spec, 'c')
  return spec.shape.map((_, hour) => ({
    hour,
    // 기준 시각(15시) 이후는 아직 관측되지 않았다.
    actual: hour <= CURRENT_HOUR ? round1(c[hour] + RESIDUAL[hour]) : null,
    modelB: b[hour],
    modelC: c[hour],
  }))
}

// ── 예측 ────────────────────────────────────────────────────────────────

const RISK: Record<string, Record<ScenarioKey, Forecast['riskLevel']>> = {
  [JINGWAN_CODE]: { b: 'stable', c: 'stable' },
  [CHANGSIN_CODE]: { b: 'caution', c: 'danger' },
}

export function getForecast(code: string, scenario: ScenarioKey): Forecast {
  return {
    districtCode: code,
    date: DEMO_DATE,
    hourly: buildHourly(code),
    peakHour: PEAK_HOUR,
    excessRate: CURVES[code].excess[scenario],
    riskLevel: RISK[code][scenario],
  }
}

export const getForecasts = (scenario: ScenarioKey): Forecast[] =>
  DISTRICTS.map((d) => getForecast(d.code, scenario))

// ── 모델 성능 ───────────────────────────────────────────────────────────
//
// A = 달력/부하 패턴만, B = + 서울 대표 기상(ASOS), C = + 미기후(S-DoT)·도시공간

export const METRICS: Metrics[] = [
  {
    districtCode: JINGWAN_CODE,
    mape: { a: 12.4, b: 8.9, c: 7.8 },
    rmse: { a: 4.1, b: 2.9, c: 2.6 },
  },
  {
    districtCode: CHANGSIN_CODE,
    mape: { a: 17.2, b: 11.7, c: 6.4 },
    rmse: { a: 8.3, b: 5.6, c: 3.1 },
  },
]

/** 두 동 종합 — 우측 레일 모델 성능 카드가 쓰는 값 */
export const OVERALL_MAPE = { a: 14.8, b: 10.3, c: 7.1 }

export const getMetrics = (code: string): Metrics =>
  METRICS.find((m) => m.districtCode === code) ?? METRICS[0]

// ── AI 브리핑 ───────────────────────────────────────────────────────────

export const BRIEFINGS: Record<ScenarioKey, Briefing> = {
  b: {
    summary:
      '서울 대표 기상(ASOS)만으로는 두 지역이 같은 35.4°C를 겪은 것으로 계산됩니다. 창신동 피크는 평시 대비 +28%로 예측됩니다.',
    evidence: [
      '두 지역에 동일한 관측값이 적용됨',
      '지역 간 예측 격차는 건물 용도 구성에서만 발생',
    ],
    caveat: '실측 미기후가 반영되지 않아 도심 밀집지의 피크가 과소추정될 수 있습니다.',
  },
  c: {
    summary:
      '창신동은 진관동보다 2.8°C 낮은 기온에서 냉방이 시작되며, 동일 기온에서 수요 증가 기울기가 1.8배로 관측됩니다. 피크는 평시 대비 +47%까지 올라갑니다.',
    evidence: [
      'S-DoT 실측이 ASOS 대비 +2.4°C 높음',
      '불투수피복률 83% vs 35%, 식생피복률 13% vs 58%',
      '냉방 균형점 22.3°C vs 25.1°C',
    ],
    caveat: '단일 폭염일(2023-08-05) 기준이며, 계절 전체로 일반화하기에는 표본이 부족합니다.',
  },
}

// ── 법정동 경계 (근사) ──────────────────────────────────────────────────
//
// 실제 법정동 경계 GeoJSON이 아니라 데모용 근사 폴리곤이다.
// 실 데이터로 교체할 때 이 상수만 바꾸면 MapView는 그대로 동작한다.
// (실 데이터는 EPSG:5179 -> 4326 변환 후 mapshaper로 단순화 필요)

function polygon(
  [lng, lat]: [number, number],
  rx: number,
  ry: number,
  wobble: number[],
): [number, number][] {
  const ring = wobble.map((w, i) => {
    const a = (i / wobble.length) * Math.PI * 2
    return [
      round5(lng + Math.cos(a) * rx * w),
      round5(lat + Math.sin(a) * ry * w),
    ] as [number, number]
  })
  return [...ring, ring[0]]
}

const round5 = (n: number) => Math.round(n * 1e5) / 1e5

/** 진관동: 북한산 자락을 낀 넓고 완만한 형태 */
const JINGWAN_RING = polygon(
  [126.9352, 37.6372],
  0.0235,
  0.0205,
  [1.0, 0.92, 1.08, 0.95, 1.12, 0.88, 1.0, 1.05, 0.9, 1.06],
)

/** 창신동: 좁고 세로로 긴 저층 밀집지 */
const CHANGSIN_RING = polygon(
  [127.0104, 37.5745],
  0.0072,
  0.0092,
  [1.0, 0.86, 1.1, 0.82, 1.14, 0.9, 1.02, 0.84, 1.12, 0.88],
)

export const DISTRICT_GEOJSON: GeoJSON.FeatureCollection<
  GeoJSON.Polygon,
  { code: string; name: string; variant: District['variant'] }
> = {
  type: 'FeatureCollection',
  features: DISTRICTS.map((d) => ({
    type: 'Feature',
    id: d.code,
    properties: { code: d.code, name: d.name, variant: d.variant },
    geometry: {
      type: 'Polygon',
      coordinates: [d.code === JINGWAN_CODE ? JINGWAN_RING : CHANGSIN_RING],
    },
  })),
}

/** 두 동이 모두 보이는 초기 뷰포트 */
export const INITIAL_VIEW = {
  center: [126.9728, 37.6058] as [number, number],
  zoom: 11.4,
}
