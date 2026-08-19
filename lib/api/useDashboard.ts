'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ApiError, api, isApiEnabled } from './client'
import { adaptDong, adaptForecast, type DayView, type DistrictView } from './adapt'
import { DEMO_DATE, DONG_CODE } from './types'
import type {
  BriefingResponse,
  CompareResponse,
  DongsGeoJson,
  MetaDong,
  MetaResponse,
  ScenarioName,
} from './types'

/** 지역 고정 색. 서버 등급 색과 달리 시각에 따라 바뀌지 않는다. */
const IDENTITY_COLOR: Record<string, string> = {
  [DONG_CODE.jingwan]: '#2E9E6B',
  [DONG_CODE.guro]: '#2D6FD1',
}

const CODES = [DONG_CODE.jingwan, DONG_CODE.guro]

export interface DashboardData {
  meta: MetaResponse
  districts: DistrictView[]
  /** 시계열이 준비된 동만 들어 있다 */
  days: Record<string, DayView>
  compare: CompareResponse
  /** 서버가 준 폴리곤. 없으면 null이고 지도는 경계를 그리지 않는다. */
  geojson: DongsGeoJson | null
}

export type Loadable<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string; pending: boolean }
  | { status: 'ready'; data: T }

/** meta.dongs에서 해당 동의 시계열 가용 정보를 꺼낸다. */
export function forecastInfo(
  meta: MetaResponse | null,
  code: string,
): MetaDong | null {
  return meta?.dongs.find((d) => d.code === code) ?? null
}

/**
 * 두 동이 모두 준비됐을 때만 비교 차트를 그린다.
 * 한쪽만 그리면 없는 쪽이 0인 것처럼 읽힌다.
 */
export function canCompare(meta: MetaResponse | null): boolean {
  return CODES.every((c) => forecastInfo(meta, c)?.forecast_status === 'ready')
}

function describe(err: unknown): { message: string; pending: boolean } {
  if (err instanceof ApiError) return { message: err.message, pending: err.pending }
  // fetch 자체가 실패하면 브라우저가 'Failed to fetch'만 준다.
  // 서버가 꺼져 있거나 터널이 내려간 경우라 그대로 보여줄 문구가 아니다.
  if (err instanceof TypeError)
    return { message: '분석 서버에 연결하지 못했습니다.', pending: false }
  if (err instanceof Error) return { message: err.message, pending: false }
  return { message: '데이터를 불러오지 못했습니다.', pending: false }
}

/** API 주소는 빌드 시점에 정해지므로 초기 상태에서 한 번만 판단한다. */
const NO_API: Loadable<never> = {
  status: 'error',
  message: 'API 주소가 설정되지 않았습니다.',
  pending: true,
}

/** 지도 폴리곤은 아직 없을 수 있다. 없다고 화면 전체가 실패하면 안 된다. */
async function geojsonOrNull(signal?: AbortSignal) {
  try {
    return await api.geojson(signal)
  } catch {
    return null
  }
}

export function useDashboard(scenario: ScenarioName) {
  const [state, setState] = useState<Loadable<DashboardData>>(() =>
    isApiEnabled() ? { status: 'loading' } : NO_API,
  )

  useEffect(() => {
    if (!isApiEnabled()) return
    const ac = new AbortController()

    void (async () => {
      try {
        const [meta, compare, geojson, ...summaries] = await Promise.all([
          api.meta(ac.signal),
          api.compare(CODES, ac.signal),
          geojsonOrNull(ac.signal),
          ...CODES.map((c) => api.dong(c, ac.signal)),
        ])

        // 시계열은 준비된 동만 부른다. 없는 걸 부르면 503이 섞여 처리가 지저분해진다.
        const ready = CODES.filter(
          (c) => forecastInfo(meta, c)?.forecast_status === 'ready',
        )
        const forecasts = await Promise.all(
          ready.map((c) => api.forecast(c, DEMO_DATE, scenario, ac.signal)),
        )

        if (ac.signal.aborted) return
        setState({
          status: 'ready',
          data: {
            meta,
            compare,
            geojson,
            districts: summaries.map((dto) =>
              adaptDong(dto, IDENTITY_COLOR[dto.code] ?? '#5C6E64'),
            ),
            days: Object.fromEntries(
              forecasts.map((f) => [f.code, adaptForecast(f)]),
            ),
          },
        })
      } catch (err) {
        if (ac.signal.aborted) return
        setState({ status: 'error', ...describe(err) })
      }
    })()

    return () => ac.abort()
    // 토글이 바뀌면 시나리오별 예측을 다시 받는다.
  }, [scenario])

  return state
}

/**
 * 브리핑은 실패해도 다른 지표에 영향이 없어야 해서 따로 부른다.
 * 한 Promise.all에 묶으면 브리핑 하나 때문에 화면 전체가 로딩에 갇힌다.
 */
export function useBriefing(date = DEMO_DATE) {
  const [state, setState] = useState<Loadable<BriefingResponse>>(() =>
    isApiEnabled() ? { status: 'loading' } : NO_API,
  )
  const nonce = useRef(0)

  /** 상태 전환 없이 요청만 건다. 로딩 표시는 호출부가 결정한다. */
  const fetchBriefing = useCallback(
    (refresh: boolean, signal?: AbortSignal) => {
      const id = ++nonce.current
      api
        .briefing(CODES, { date, refresh }, signal)
        .then((data) => {
          if (id === nonce.current) setState({ status: 'ready', data })
        })
        .catch((err) => {
          if (signal?.aborted || id !== nonce.current) return
          setState({ status: 'error', ...describe(err) })
        })
    },
    [date],
  )

  useEffect(() => {
    if (!isApiEnabled()) return
    const ac = new AbortController()
    fetchBriefing(false, ac.signal)
    return () => ac.abort()
  }, [fetchBriefing])

  // 재시도는 이벤트 핸들러라 로딩 표시를 여기서 켜도 된다.
  const retry = useCallback(() => {
    if (!isApiEnabled()) return
    setState({ status: 'loading' })
    fetchBriefing(true)
  }, [fetchBriefing])

  return useMemo(() => ({ state, retry }), [state, retry])
}
