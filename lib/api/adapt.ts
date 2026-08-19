import type {
  DataStatus,
  DongSummary,
  ForecastResponse,
  Microclimate,
  ModelBasis,
  ScenarioName,
} from './types'

/**
 * 화면이 쓰는 형태. API 응답과 목데이터가 모두 이 모양으로 들어온다.
 *
 * 등급·색상·문구는 서버가 만든 것을 그대로 담는다 (계약 규칙 #1).
 * 프론트는 판정하지 않으므로, 등급 기준이 바뀌어도 이 파일은 안 바뀐다.
 */
export interface CoverView {
  percent: number | null
  /** '10곳 중 8곳' */
  text: string | null
  label: string
}

export interface DistrictView {
  code: string
  name: string
  /**
   * 지역 고정 색. 차트 계열 색으로 쓴다.
   * 등급 색은 시각에 따라 바뀌는데, 선 색이 같이 바뀌면 어느 선이 어느 동인지
   * 추적할 수 없다. 그래서 정체성 색과 등급 색을 분리해 둔다.
   */
  identityColor: string
  heat: {
    status: DataStatus
    index: number | null
    grade: string
    color: string
    message: string
    note: string | null
    caveat: string | null
  }
  cover: {
    paved: CoverView
    green: CoverView
    water: CoverView
    bare: CoverView
    wetland: CoverView
  }
  demand: {
    extraPercent: number | null
    extraText: string | null
    nightPercent: number | null
    dayPercent: number | null
    pattern: string | null
  }
  cooling: {
    switchOnTemp: number | null
    switchOnText: string | null
    /** %p/℃ */
    sensitivity: number | null
    sensitivityText: string | null
  }
  peak: {
    thresholdKwh: number | null
    thresholdText: string | null
    riskDays: number | null
    totalDays: number | null
    riskDaysText: string | null
  }
}

export interface HourView {
  hour: number
  usageKwh: number
  baselineKwh: number
  /** 평시 기저수요 대비 추가 사용률. 위험도가 아니다. */
  extraPercent: number
  temperature: number
  humidity: number | null
  wind: number | null
  /** 위험선 대비 비율. 등급은 이 값으로만 판정된다. */
  riskRatio: number
  riskPercent: number
  /** '위험선의 100.6%' */
  riskText: string
  grade: string
  color: string
  message: string
}

export interface DayView {
  code: string
  name: string
  date: string
  scenario: ScenarioName
  thresholdKwh: number | null
  weather: {
    tMax: number | null
    tMin: number | null
    /** null이면 해당 칩을 숨긴다 */
    humidity: number | null
    wind: number | null
    heatwave: boolean
  }
  hours: HourView[]
  /** 예측 모델의 학습 근거. 실측에는 없다. */
  modelBasis: ModelBasis | null
}

const cover = (c: Microclimate['components'][keyof Microclimate['components']]) => ({
  percent: c.percent,
  text: c.text,
  label: c.label,
})

/** 서버 응답 → 화면 모델 */
export function adaptDong(
  dto: DongSummary,
  identityColor: string,
): DistrictView {
  const m = dto.microclimate
  return {
    code: dto.code,
    name: dto.name,
    identityColor,
    heat: {
      status: m.status,
      index: m.heat_index,
      grade: m.grade ?? '',
      color: m.color ?? identityColor,
      message: m.message ?? '',
      // basis 쪽 문구가 더 구체적이면 그걸 우선한다
      note: m.basis?.note ?? m.note ?? null,
      caveat: m.basis?.caveat ?? m.caveat ?? null,
    },
    cover: {
      paved: cover(m.components.paved),
      green: cover(m.components.green),
      water: cover(m.components.water),
      bare: cover(m.components.bare),
      wetland: cover(m.components.wetland),
    },
    demand: {
      extraPercent: dto.demand.extra_usage_percent,
      extraText: dto.demand.extra_usage_text,
      nightPercent: dto.demand.night_percent,
      dayPercent: dto.demand.day_percent,
      pattern: dto.demand.pattern,
    },
    cooling: {
      switchOnTemp: dto.cooling.switch_on_temp,
      switchOnText: dto.cooling.switch_on_text,
      sensitivity: dto.cooling.sensitivity,
      sensitivityText: dto.cooling.sensitivity_text,
    },
    peak: {
      thresholdKwh: dto.peak.threshold_kwh,
      thresholdText: dto.peak.threshold_text,
      riskDays: dto.peak.risk_days,
      totalDays: dto.peak.total_days,
      riskDaysText: dto.peak.risk_days_text,
    },
  }
}

export function adaptForecast(dto: ForecastResponse): DayView {
  return {
    code: dto.code,
    name: dto.name,
    date: dto.date,
    scenario: dto.scenario,
    thresholdKwh: dto.threshold_kwh,
    weather: {
      tMax: dto.weather?.t_max ?? null,
      tMin: dto.weather?.t_min ?? null,
      humidity: dto.weather?.humidity ?? null,
      wind: dto.weather?.wind ?? null,
      heatwave: dto.weather?.heatwave ?? false,
    },
    modelBasis: dto.model_basis,
    hours: dto.points
      .map((p) => ({
        hour: p.hour,
        usageKwh: p.usage_kwh,
        baselineKwh: p.baseline_kwh,
        extraPercent: p.extra_percent,
        temperature: p.temperature,
        humidity: p.humidity,
        wind: p.wind,
        riskRatio: p.risk_ratio,
        riskPercent: p.risk_percent,
        riskText: p.risk_text,
        grade: p.grade,
        color: p.color,
        message: p.message,
      }))
      // 서버가 시각 순서를 보장한다는 언급이 없다. 차트가 뒤엉키지 않게 정렬한다.
      .sort((a, b) => a.hour - b.hour),
  }
}

/**
 * 보간된 위험 비율에 맞는 등급을 고른다.
 *
 * 프론트가 경계값을 정하지 않는다. 서버가 보낸 24개 포인트의
 * (위험비율 → 등급) 대응을 그대로 참조해, 보간값 이하에서 가장 가까운
 * 포인트의 판정을 가져온다. 등급 기준이 서버에서 바뀌면 여기도 따라간다.
 *
 * 이게 없으면 20:36에 96.4%인데 20시 등급 '위험'이 남아 숫자와 배지가 어긋난다.
 */
function gradeFor(hours: HourView[], riskPercent: number): HourView {
  const sorted = [...hours].sort((a, b) => a.riskPercent - b.riskPercent)

  // 등급이 바뀌는 지점의 중간을 경계로 본다. 서버가 어떤 값을 기준으로
  // 나눴는지 모르더라도, 관측된 전환점 사이 어딘가라는 것은 확실하다.
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const lo = sorted[i]
    const hi = sorted[i + 1]
    if (lo.grade === hi.grade) continue
    const boundary = (lo.riskPercent + hi.riskPercent) / 2
    if (riskPercent < boundary) return lo
  }
  return sorted[sorted.length - 1]
}

/**
 * 정시 사이 값을 선형 보간한다. 재생 중 값이 한 시간씩 끊기면 계단처럼 튄다.
 * 보간 값은 실측이 아니므로 데이터 정보 화면에 그 사실을 밝혀 둔다.
 */
export function interpolateHour(hours: HourView[], time: number): HourView | null {
  if (hours.length === 0) return null
  const t = ((time % 24) + 24) % 24
  const i = Math.floor(t)
  const cur = hours.find((h) => h.hour === i)
  if (!cur) return null
  const next = hours.find((h) => h.hour === (i + 1) % 24) ?? cur
  const f = t - i
  const lerp = (a: number, b: number) => Math.round((a + (b - a) * f) * 10) / 10
  const riskPercent = lerp(cur.riskPercent, next.riskPercent)
  const judged = gradeFor(hours, riskPercent)

  return {
    ...cur,
    usageKwh: Math.round(cur.usageKwh + (next.usageKwh - cur.usageKwh) * f),
    baselineKwh: Math.round(
      cur.baselineKwh + (next.baselineKwh - cur.baselineKwh) * f,
    ),
    extraPercent: lerp(cur.extraPercent, next.extraPercent),
    temperature: lerp(cur.temperature, next.temperature),
    riskRatio:
      Math.round((cur.riskRatio + (next.riskRatio - cur.riskRatio) * f) * 1000) /
      1000,
    riskPercent,
    // 등급·색·문구는 보간하지 않는다. 보간된 비율에 해당하는 서버 판정을 고른다.
    grade: judged.grade,
    color: judged.color,
    message: judged.message,
    riskText: judged.riskText,
  }
}
