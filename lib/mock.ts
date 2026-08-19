import hanRiver from './geo/han-river.json'
import seoulOutline from './geo/seoul-outline.json'
import seoulMunicipalities from './geo/seoul-municipalities.json'
import targetDistricts from './geo/target-districts.json'
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

export const JINGWAN_CODE = '1138011400'
export const GURO_CODE = '1153010200'

// ── 지역 ────────────────────────────────────────────────────────────────

export const DISTRICTS: District[] = [
  {
    code: JINGWAN_CODE,
    name: '진관동',
    variant: 'cool',
    center: [126.9379, 37.6397],
    microclimate: {
      vegetationRate: 58,
      imperviousRate: 35,
      balancePoint: 25.1,
      coolingSlope: 1.0,
    },
  },
  {
    code: GURO_CODE,
    name: '구로동',
    variant: 'warm',
    center: [126.8847, 37.4942],
    microclimate: {
      // 준공업지역과 아파트 단지가 섞여 있고 안양천을 끼고 있어,
      // 저층 고밀 주거지보다는 녹지 비율이 조금 높다.
      vegetationRate: 20,
      imperviousRate: 76,
      balancePoint: 23.1,
      coolingSlope: 1.6,
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
// 구로동은 오전엔 완만하다가 11~15시에 급격히 꺾인다 (불투수 76%, 기울기 1.6x).

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

// 2023-08-05 기온 곡선. 새벽 5시 최저 26.8°C, 15시 최고 35.4°C.
const TEMP_SHAPE = [
  0.22, 0.14, 0.08, 0.03, 0.0, 0.02, 0.12, 0.27, 0.44, 0.6, 0.73, 0.83,
  0.9, 0.96, 0.99, 1.0, 0.97, 0.91, 0.82, 0.71, 0.59, 0.47, 0.37, 0.29,
]
const ASOS_MIN = 26.8
const ASOS_MAX = 35.4

/**
 * S-DoT 실측과 대표 기상의 격차. 낮 동안 벌어지고 새벽엔 좁혀진다.
 * 구로동은 불투수면 축열로 더 뜨겁고, 진관동은 녹지 증발산으로 더 시원하다.
 */
const SDOT_OFFSET: Record<string, { day: number; night: number }> = {
  [JINGWAN_CODE]: { day: -1.1, night: -0.3 },
  [GURO_CODE]: { day: 2.4, night: 0.7 },
}

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
  [GURO_CODE]: {
    shape: WARM_SHAPE,
    normalPeak: 52.0,
    trough: 26.0,
      // 토글의 핵심: 기상만 쓰면 +28%로 과소추정, 미기후를 넣으면 +47%.
    excess: { b: 28, c: 47 },
  },
}

const round1 = (n: number) => Math.round(n * 10) / 10

/**
 * 곡선 형태를 0~1로 정규화한 값. 0이면 심야 저점, 1이면 피크.
 *
 * 원본 데이터는 정시 단위지만 재생할 때 값이 한 시간씩 뚝뚝 끊기면
 * 지도 색과 숫자가 계단처럼 튄다. 정시 사이는 선형 보간해 이어 준다.
 */
function shapeAt(spec: CurveSpec, hour: number): number {
  const min = Math.min(...spec.shape)
  const t = clampHour(hour)
  const i = Math.floor(t)
  const next = spec.shape[(i + 1) % 24]
  const value = spec.shape[i] + (next - spec.shape[i]) * (t - i)
  return (value - min) / (1 - min)
}

/** 0 이상 24 미만으로 감아 준다. 재생이 23시를 넘어가면 0시로 이어진다. */
export const clampHour = (hour: number) => ((hour % 24) + 24) % 24

const curveValue = (spec: CurveSpec, peak: number, hour: number) =>
  spec.trough + (peak - spec.trough) * shapeAt(spec, hour)

const peakOf = (spec: CurveSpec, scenario: ScenarioKey) =>
  spec.normalPeak * (1 + spec.excess[scenario] / 100)

function buildCurve(spec: CurveSpec, scenario: ScenarioKey): number[] {
  const peak = peakOf(spec, scenario)
  return spec.shape.map((_, hour) => round1(curveValue(spec, peak, hour)))
}

/**
 * 선택 시각의 평시 대비 초과율.
 *
 * 심야에는 냉방 부하가 없어 폭염일과 평시가 거의 같고, 낮이 될수록 벌어져
 * 피크(15시)에서 최대가 된다. 지도 채색이 시간에 따라 살아 움직여야 하므로
 * 하루 단위 고정값이 아니라 시각별로 계산한다.
 */
export function getExcessAt(
  code: string,
  scenario: ScenarioKey,
  hour: number,
): number {
  const spec = CURVES[code]
  const predicted = curveValue(spec, peakOf(spec, scenario), hour)
  const normal = curveValue(spec, spec.normalPeak, hour)
  return round1((predicted / normal - 1) * 100)
}

/** 선택 시각의 예측 수요 MW. 정시 사이는 보간된다. */
export function getDemandAt(
  code: string,
  scenario: ScenarioKey,
  hour: number,
): number {
  const spec = CURVES[code]
  return round1(curveValue(spec, peakOf(spec, scenario), hour))
}

/** 선택 시각의 기온. 대표기상과 해당 지역 S-DoT 실측. */
export function getTempAt(code: string, hour: number) {
  const t = clampHour(hour)
  const i = Math.floor(t)
  const f = t - i
  const lerp = (a: number, b: number) => round1(a + (b - a) * f)
  const series = getForecast(code, 'c').hourly
  const cur = series[i]
  const next = series[(i + 1) % 24]
  return { asos: lerp(cur.asos, next.asos), sdot: lerp(cur.sdot, next.sdot) }
}

/**
 * 초과율 구간으로 위험도를 정한다. 피크 시각에서 진관동 +15% = 안정,
 * 구로동 +28%(기상만) = 주의, +47%(미기후) = 위험이 되도록 잡았다.
 */
export function getRiskLevel(excess: number): Forecast['riskLevel'] {
  if (excess >= 40) return 'danger'
  if (excess >= 20) return 'caution'
  return 'stable'
}

function buildHourly(code: string): HourlyPoint[] {
  const spec = CURVES[code]
  const b = buildCurve(spec, 'b')
  const c = buildCurve(spec, 'c')
  const offset = SDOT_OFFSET[code]
  return spec.shape.map((_, hour) => {
    const t = TEMP_SHAPE[hour]
    const asos = round1(ASOS_MIN + (ASOS_MAX - ASOS_MIN) * t)
    const gap = offset.night + (offset.day - offset.night) * t
    return {
      hour,
      // 기준 시각(15시) 이후는 아직 관측되지 않았다.
      actual: hour <= CURRENT_HOUR ? round1(c[hour] + RESIDUAL[hour]) : null,
      modelB: b[hour],
      modelC: c[hour],
      asos,
      sdot: round1(asos + gap),
    }
  })
}

// ── 예측 ────────────────────────────────────────────────────────────────

export function getForecast(code: string, scenario: ScenarioKey): Forecast {
  return {
    districtCode: code,
    date: DEMO_DATE,
    hourly: buildHourly(code),
    peakHour: PEAK_HOUR,
    excessRate: CURVES[code].excess[scenario],
    riskLevel: getRiskLevel(CURVES[code].excess[scenario]),
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
    districtCode: GURO_CODE,
    mape: { a: 17.2, b: 11.7, c: 6.4 },
    rmse: { a: 8.3, b: 5.6, c: 3.1 },
  },
]

/** 두 동 종합 — 우측 레일 모델 성능 카드가 쓰는 값 */
export const OVERALL_MAPE = { a: 14.8, b: 10.3, c: 7.1 }

export const getMetrics = (code: string): Metrics =>
  METRICS.find((m) => m.districtCode === code) ?? METRICS[0]

// ── AI 브리핑 ───────────────────────────────────────────────────────────

/**
 * 브리핑 문구는 지표에서 계산한다. 하드코딩하면 목데이터를 손볼 때마다
 * 화면의 설명과 숫자가 조용히 어긋난다.
 */
function buildBriefings(): Record<ScenarioKey, Briefing> {
  const cool = getDistrict(JINGWAN_CODE)
  const warm = getDistrict(GURO_CODE)
  const balanceGap = round1(
    cool.microclimate.balancePoint - warm.microclimate.balancePoint,
  )
  const { excess } = CURVES[warm.code]

  return {
    b: {
      summary: `서울 대표 기상(ASOS)만으로는 두 지역이 같은 ${WEATHER.asosTemp}°C를 겪은 것으로 계산됩니다. ${warm.name} 피크는 평시 대비 +${excess.b}%로 예측됩니다.`,
      evidence: [
        '두 지역에 동일한 관측값이 적용됨',
        '지역 간 예측 격차는 건물 용도 구성에서만 발생',
      ],
      caveat:
        '실측 미기후가 반영되지 않아 도심 밀집지의 피크가 과소추정될 수 있습니다.',
    },
    c: {
      summary: `${warm.name}은 ${cool.name}보다 ${balanceGap.toFixed(1)}°C 낮은 기온에서 냉방이 시작되며, 동일 기온에서 수요 증가 기울기가 ${warm.microclimate.coolingSlope.toFixed(1)}배로 관측됩니다. 피크는 평시 대비 +${excess.c}%까지 올라갑니다.`,
      evidence: [
        `S-DoT 실측이 ASOS 대비 +${WEATHER.sdotGap}°C 높음`,
        `불투수피복률 ${warm.microclimate.imperviousRate}% vs ${cool.microclimate.imperviousRate}%, 식생피복률 ${warm.microclimate.vegetationRate}% vs ${cool.microclimate.vegetationRate}%`,
        `냉방 균형점 ${warm.microclimate.balancePoint.toFixed(1)}°C vs ${cool.microclimate.balancePoint.toFixed(1)}°C`,
      ],
      caveat: `단일 폭염일(${DEMO_DATE}) 기준이며, 계절 전체로 일반화하기에는 표본이 부족합니다.`,
    },
  }
}

export const BRIEFINGS = buildBriefings()

// ── 서울 실제 경계 ──────────────────────────────────────────────────────
//
// 출처: southkorea/seoul-maps (도로명주소 기반 2015년 경계).
// EPSG:4326으로 이미 변환되어 있고, mapshaper로 단순화해 lib/geo에 넣어 두었다.
// 네트워크에 의존하지 않도록 레포에 포함한다.

export const SEOUL_OUTLINE = seoulOutline as GeoJSON.Feature<
  GeoJSON.Polygon | GeoJSON.MultiPolygon
>

/**
 * 한강 수역. OpenStreetMap 기여자들의 데이터(ODbL)를 서울 경계로 잘라
 * 단순화한 것이다. 출처 표기는 데이터 정보 화면에 있다.
 */
export const HAN_RIVER = hanRiver as GeoJSON.Feature<
  GeoJSON.Polygon | GeoJSON.MultiPolygon
>

/** 자치구 25개. 실제 지도처럼 보이게 하는 배경 격자 역할. */
export const SEOUL_MUNICIPALITIES = seoulMunicipalities as GeoJSON.FeatureCollection<
  GeoJSON.Polygon | GeoJSON.MultiPolygon,
  { code: string; name: string }
>

/** 대상 법정동 실제 경계 */
export const DISTRICT_GEOJSON = targetDistricts as GeoJSON.FeatureCollection<
  GeoJSON.Polygon | GeoJSON.MultiPolygon,
  { code: string; name: string; variant: District['variant'] }
>

/** 서울 전체가 들어가는 경위도 범위 — 미니맵 좌표 변환에 쓴다. */
export const SEOUL_BBOX = {
  minLng: 126.7674,
  maxLng: 127.1828,
  minLat: 37.4283,
  maxLat: 37.7013,
}

/**
 * 두 동을 모두 감싸는 경위도 범위.
 * 고정 center/zoom을 쓰면 창 비율에 따라 한쪽이 화면 밖으로 나가므로,
 * 지도는 이 범위에 맞춰 자동으로 잡는다.
 */
export const DISTRICT_BOUNDS: [[number, number], [number, number]] = (() => {
  const coords = DISTRICT_GEOJSON.features.flatMap((f) =>
    f.geometry.type === 'Polygon'
      ? f.geometry.coordinates.flat()
      : f.geometry.coordinates.flat(2),
  )
  const lngs = coords.map((c) => c[0])
  const lats = coords.map((c) => c[1])
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ]
})()

/**
 * 지도를 채우는 패널들 때문에 실제로 비어 있는 영역은 화면 가운데뿐이다.
 * 사이드바·우측 레일·상단 카드·하단 차트를 피해 여백을 준다.
 */
export const MAP_PADDING = { top: 110, bottom: 340, left: 330, right: 460 }

/**
 * 지도 채색은 절대 전력량이 아니라 평시 대비 초과율을 따른다.
 * 절대량으로 칠하면 수요가 큰 지역이 무조건 붉게 나와 미기후 주장이 사라진다.
 */
export function districtFeatures(scenario: ScenarioKey, hour: number) {
  return {
    type: 'FeatureCollection' as const,
    features: DISTRICTS.map((d) => {
      const excess = getExcessAt(d.code, scenario, hour)
      const source = DISTRICT_GEOJSON.features.find(
        (f) => f.properties.code === d.code,
      )!
      return {
        type: 'Feature' as const,
        properties: {
          code: d.code,
          name: d.name,
          variant: d.variant,
          excess,
          risk: getRiskLevel(excess),
        },
        geometry: source.geometry,
      }
    }),
  }
}
