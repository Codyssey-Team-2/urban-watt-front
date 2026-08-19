import type {
  CompareResponse,
  DongSummary,
  DongsGeoJson,
  DongsResponse,
  ForecastResponse,
  MetaResponse,
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

async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    signal,
    headers: { Accept: 'application/json' },
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
}
