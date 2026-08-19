import type {
  BriefingResponse,
  CompareResponse,
  DongSummary,
  DongsGeoJson,
  DongsResponse,
  ForecastResponse,
  MetaResponse,
  ModelPerformanceResponse,
} from './types'

/**
 * API 주소가 비어 있으면 목데이터로 동작한다.
 * 백엔드가 늦어져도 화면은 항상 뜬다 — 발표 도중 서버가 죽어도 마찬가지다.
 */
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? ''
export const isApiEnabled = () => API_BASE.length > 0

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    /** 서버가 아직 준비 중이라고 답한 경우 (503 + status: pending) */
    readonly pending = false,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * ngrok 무료 도메인은 브라우저 User-Agent로 오는 요청에 JSON 대신 경고 HTML을
 * 돌려준다. 이 헤더가 있어야 통과한다. 정식 도메인으로 옮기면 자동으로 빠진다.
 */
function headers(): HeadersInit {
  const base: Record<string, string> = { Accept: 'application/json' }
  if (API_BASE.includes('ngrok')) base['ngrok-skip-browser-warning'] = 'true'
  return base
}

async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    signal,
    headers: headers(),
    // 발표 중 값이 갱신될 일이 없다. 매번 새로 받을 이유도 없다.
    cache: 'no-store',
  })

  if (!res.ok) {
    // 경계 파일 미확보 등은 503 + status:pending 으로 온다.
    // 이건 장애가 아니라 '아직 없음'이므로 화면에서 다르게 다룬다.
    let note = res.statusText
    let pending = res.status === 503
    try {
      const body = await res.json()
      if (typeof body?.note === 'string') note = body.note
      if (body?.status === 'pending') pending = true
    } catch {
      // 본문이 JSON이 아니면 상태 텍스트를 그대로 쓴다
    }
    throw new ApiError(note, res.status, pending)
  }

  return res.json() as Promise<T>
}

export const api = {
  dongs: (signal?: AbortSignal) => get<DongsResponse>('/api/dongs', signal),

  geojson: (signal?: AbortSignal) =>
    get<DongsGeoJson>('/api/dongs/geojson', signal),

  dong: (code: string, signal?: AbortSignal) =>
    get<DongSummary>(`/api/dong/${code}`, signal),

  forecast: (code: string, date?: string, signal?: AbortSignal) =>
    get<ForecastResponse>(
      `/api/dong/${code}/forecast${date ? `?date=${date}` : ''}`,
      signal,
    ),

  compare: (codes: string[], signal?: AbortSignal) =>
    get<CompareResponse>(`/api/compare?codes=${codes.join(',')}`, signal),

  meta: (signal?: AbortSignal) => get<MetaResponse>('/api/meta', signal),

  /**
   * 브리핑은 실패해도 다른 지표에 영향이 없어야 한다.
   * 호출부에서 상태를 분리해 다루도록 에러를 그대로 던진다.
   */
  briefing: (
    codes: string[],
    options: { date?: string; refresh?: boolean } = {},
    signal?: AbortSignal,
  ) => {
    const params = new URLSearchParams({ codes: codes.join(',') })
    if (options.date) params.set('date', options.date)
    if (options.refresh) params.set('refresh', 'true')
    return get<BriefingResponse>(`/api/briefing?${params}`, signal)
  },

  /** 화면에서는 기능 제외했지만 계약이 존재해 남겨 둔다. */
  modelPerformance: (signal?: AbortSignal) =>
    get<ModelPerformanceResponse>('/api/model-performance', signal),
}
