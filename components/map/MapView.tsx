'use client'

import { useEffect, useRef, useState } from 'react'
import {
  GeoJSONSource,
  Map as MapLibreMap,
  Marker,
  setWorkerUrl,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  DISTRICTS,
  DISTRICT_BOUNDS,
  DISTRICT_GEOJSON,
  HAN_RIVER,
  MAP_PADDING,
  SEOUL_MUNICIPALITIES,
  SEOUL_OUTLINE,
} from '@/lib/mock'
import type { MapDistrict } from '@/components/views/shared'

/**
 * 경계는 서버 것을 우선하고, 없으면 앱에 포함된 경계로 떨어진다.
 *
 * 색은 시각별 위험 등급을 따른다. 서버 폴리곤의 fill_color 는 도시열 등급이라
 * 하루 내내 고정인데, 이 화면은 시간과 토글에 따라 지도가 바뀌는 게 핵심이다.
 * 두 색 모두 서버가 만든 값이고, 그 중 시각에 반응하는 쪽을 쓴다.
 */
function styled(
  districts: MapDistrict[],
  boundaries: GeoJSON.FeatureCollection | null,
) {
  const source = boundaries ?? DISTRICT_GEOJSON
  return {
    type: 'FeatureCollection' as const,
    features: source.features.map((f) => {
      const code = (f.properties as { code?: string } | null)?.code
      const d = districts.find((x) => x.code === code)
      return {
        type: 'Feature' as const,
        geometry: f.geometry,
        properties: {
          code: code ?? '',
          fillColor: d?.fillColor ?? '#CCCCCC',
          fillOpacity: d?.fillOpacity ?? 0.3,
          strokeColor: d?.strokeColor ?? '#999999',
          danger: d?.danger ?? false,
        },
      }
    }),
  }
}

export interface Viewport {
  west: number
  south: number
  east: number
  north: number
}

export interface MapController {
  zoomIn: () => void
  zoomOut: () => void
  reset: () => void
}

interface MapViewProps {
  /** 폴리곤 채색과 마커 내용. 색은 서버 등급 색을 그대로 받는다. */
  districts: MapDistrict[]
  /** 서버가 준 경계. 없으면 앱에 포함된 경계로 떨어진다. */
  boundaries?: GeoJSON.FeatureCollection | null
  /** 뷰마다 패널이 가리는 영역이 달라 여백도 달라진다. */
  padding?: { top: number; bottom: number; left: number; right: number }
  showLabels?: boolean
  onReady?: (controller: MapController) => void
  onViewChange?: (viewport: Viewport) => void
}

const SRC = 'districts'

// Turbopack이 MapLibre의 모듈 워커를 번들에 넣지 못해 요청이 404 -> HTML로
// 떨어지고 MIME 오류로 지도가 죽는다. prebuild가 public/maplibre로 복사해둔
// 워커를 직접 가리킨다. (scripts/copy-maplibre-worker.mjs)
setWorkerUrl('/maplibre/maplibre-gl-worker.mjs')

/**
 * 타일 서버를 쓰지 않는다. 발표 중 네트워크가 끊겨도 지도가 반드시 떠야 하고,
 * 회색 계열 기본 타일은 초록 테마와 톤이 섞여 초과율 채색을 읽기 어렵게 만든다.
 */
const BLANK_STYLE = {
  version: 8 as const,
  sources: {},
  layers: [
    {
      id: 'background',
      type: 'background' as const,
      paint: { 'background-color': '#EDF4EC' },
    },
  ],
}

export function MapView({
  districts,
  boundaries = null,
  padding = MAP_PADDING,
  showLabels = true,
  onReady,
  onViewChange,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  // 라벨 마커는 지도가 준비된 뒤에 붙어야 한다. ref로 넘기면 React가 자식 effect를
  // 부모보다 먼저 실행해 항상 null을 보고, ref 변경은 재실행을 트리거하지 않는다.
  const [readyMap, setReadyMap] = useState<MapLibreMap | null>(null)
  // 여백은 뷰 전환마다 바뀌지만 지도는 다시 만들지 않는다.
  // 생성 effect가 최신 값을 읽도록 ref로만 흘려보낸다.
  const paddingRef = useRef(padding)
  // 생성 effect가 최신 스타일을 읽도록 ref로 흘려보낸다.
  const districtsRef = useRef(districts)
  const boundariesRef = useRef(boundaries)
  useEffect(() => {
    paddingRef.current = padding
    districtsRef.current = districts
    boundariesRef.current = boundaries
  }, [padding, districts, boundaries])

  // 지도 인스턴스는 한 번만 만든다. scenario는 아래 별도 effect에서 데이터만 갈아끼운다.
  useEffect(() => {
    if (!containerRef.current) return

    const map = new MapLibreMap({
      container: containerRef.current,
      style: BLANK_STYLE,
      bounds: DISTRICT_BOUNDS,
      fitBoundsOptions: { padding: paddingRef.current },
      attributionControl: false,
      // 발표용이라 회전/기울기는 사고만 유발한다.
      pitchWithRotate: false,
      dragRotate: false,
      touchZoomRotate: false,
    })
    mapRef.current = map
    map.on('load', () => {
      map.addSource('seoul', { type: 'geojson', data: SEOUL_OUTLINE })
      map.addLayer({
        id: 'seoul-fill',
        type: 'fill',
        source: 'seoul',
        paint: { 'fill-color': '#FFFFFF', 'fill-opacity': 0.55 },
      })
      map.addLayer({
        id: 'seoul-line',
        type: 'line',
        source: 'seoul',
        paint: { 'line-color': '#D4E2D3', 'line-width': 1.5 },
      })

      // 한강은 서울 지도에서 가장 강한 지형 단서라 자치구 경계보다 먼저 깐다.
      map.addSource('han', { type: 'geojson', data: HAN_RIVER })
      map.addLayer({
        id: 'han-fill',
        type: 'fill',
        source: 'han',
        paint: { 'fill-color': '#D6E8F2', 'fill-opacity': 0.9 },
      })

      // 자치구 경계선이 있어야 지도가 '서울'로 읽힌다. 대상 법정동보다
      // 훨씬 옅게 깔아서 초과율 채색을 방해하지 않는다.
      map.addSource('gu', { type: 'geojson', data: SEOUL_MUNICIPALITIES })
      map.addLayer({
        id: 'gu-line',
        type: 'line',
        source: 'gu',
        paint: { 'line-color': '#D2E0D1', 'line-width': 1 },
      })

      map.addSource(SRC, {
        type: 'geojson',
        data: styled(districtsRef.current, boundariesRef.current),
      })
      map.addLayer({
        id: 'district-fill',
        type: 'fill',
        source: SRC,
        paint: {
          // 색과 투명도는 서버가 정한 등급을 그대로 받아 쓴다.
          'fill-color': ['get', 'fillColor'],
          'fill-color-transition': { duration: 200 },
          'fill-opacity': ['get', 'fillOpacity'],
          'fill-opacity-transition': { duration: 200 },
        },
      })
      map.addLayer({
        id: 'district-line',
        type: 'line',
        source: SRC,
        paint: {
          'line-color': ['get', 'strokeColor'],
          'line-color-transition': { duration: 200 },
          'line-width': ['case', ['get', 'danger'], 4, 2.5],
          'line-width-transition': { duration: 200 },
        },
      })

      onReady?.({
        zoomIn: () => map.zoomIn({ duration: 200 }),
        zoomOut: () => map.zoomOut({ duration: 200 }),
        reset: () =>
          map.fitBounds(DISTRICT_BOUNDS, {
            padding: paddingRef.current,
            duration: 300,
          }),
      })
      emitViewport()
      setReadyMap(map)
    })

    function emitViewport() {
      const b = map.getBounds()
      onViewChange?.({
        west: b.getWest(),
        south: b.getSouth(),
        east: b.getEast(),
        north: b.getNorth(),
      })
    }
    map.on('move', emitViewport)

    return () => {
      setReadyMap(null)
      map.remove()
      mapRef.current = null
    }
    // 의도적으로 마운트 1회만. scenario 변경은 아래 effect가 처리한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 값이 바뀌면 지도를 다시 만들지 않고 소스 데이터만 갈아끼운다.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const apply = () => {
      const source = map.getSource<GeoJSONSource>(SRC)
      source?.setData(styled(districts, boundaries))
    }
    if (map.isStyleLoaded() && map.getSource(SRC)) apply()
    else map.once('idle', apply)
  }, [districts, boundaries])

  return (
    <>
      {/* MapLibre가 컨테이너에 .maplibregl-map 클래스를 붙이는데, 그 CSS의
          position:relative가 absolute를 덮어써서 inset-0이 높이를 만들지 못한다.
          위치가 아니라 크기로 채운다. */}
      <div ref={containerRef} className="size-full" />
      {showLabels && <MapLabels districts={districts} map={readyMap} />}
    </>
  )
}

/**
 * 라벨은 symbol 레이어가 아니라 HTML 마커로 붙인다.
 * symbol 레이어의 텍스트는 glyph 서버를 필요로 해서, 타일 없는 구성과 맞지 않는다.
 */
function MapLabels({
  districts,
  map,
}: {
  districts: MapDistrict[]
  map: MapLibreMap | null
}) {
  const markersRef = useRef<
    { marker: Marker; name: HTMLElement; value: HTMLElement }[]
  >([])

  // 마커는 지도당 한 번만 만든다. 재생 중 매 시각마다 DOM을 새로 만들면
  // 지도 위에서 라벨이 깜빡인다.
  useEffect(() => {
    if (!map) return
    markersRef.current = DISTRICTS.map((district) => {
      const el = document.createElement('div')
      el.className = 'flex flex-col items-center gap-1'
      el.innerHTML = `
        <div class="rounded-full border border-[rgba(22,60,42,0.10)] bg-white/96 px-3 py-1.5 shadow-panel backdrop-blur-[14px]">
          <div class="flex items-center gap-2 whitespace-nowrap">
            <span data-name class="text-[15px] font-semibold"></span>
            <span data-value class="tnum text-[15px] font-semibold"></span>
          </div>
        </div>
        <div data-pin class="size-2.5 rotate-45 rounded-[2px] border-2 border-white"></div>
      `
      const marker = new Marker({ element: el, anchor: 'bottom' })
        .setLngLat(district.center)
        .addTo(map)
      return {
        marker,
        name: el.querySelector('[data-name]') as HTMLElement,
        value: el.querySelector('[data-value]') as HTMLElement,
      }
    })
    return () => {
      markersRef.current.forEach(({ marker }) => marker.remove())
      markersRef.current = []
    }
  }, [map])

  // 내용만 갱신한다.
  useEffect(() => {
    markersRef.current.forEach((m, i) => {
      const d = districts[i]
      if (!d) return
      m.name.textContent = d.name
      m.name.style.color =
        d.variant === 'cool' ? 'var(--color-cool-deep)' : 'var(--color-urban-deep)'
      m.value.textContent = d.headline
      // 카드와 같은 규칙 — 평소엔 검정, 위험일 때만 빨강
      m.value.style.color = d.danger
        ? 'var(--color-danger-text)'
        : 'var(--color-ink)'
      const pin = m.marker.getElement().querySelector('[data-pin]') as HTMLElement
      if (pin) pin.style.background = d.strokeColor
    })
  }, [districts, map])

  return null
}
