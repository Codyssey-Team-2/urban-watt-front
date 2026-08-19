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
  HAN_RIVER,
  MAP_PADDING,
  SEOUL_OUTLINE,
  districtFeatures,
  getForecast,
} from '@/lib/mock'
import type { ScenarioKey } from '@/lib/types'

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
  scenario: ScenarioKey
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
  scenario,
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
  useEffect(() => {
    paddingRef.current = padding
  }, [padding])

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

      map.addSource('han', { type: 'geojson', data: HAN_RIVER })
      map.addLayer({
        id: 'han-line',
        type: 'line',
        source: 'han',
        layout: { 'line-cap': 'round' },
        paint: { 'line-color': '#DCEAF2', 'line-width': 9 },
      })

      map.addSource(SRC, { type: 'geojson', data: districtFeatures(scenario) })
      map.addLayer({
        id: 'district-fill',
        type: 'fill',
        source: SRC,
        paint: {
          // 색상(hue)은 지역 정체성, 진하기는 초과율. 두 축이 섞이지 않는다.
          'fill-color': [
            'match',
            ['get', 'variant'],
            'cool',
            '#6FC49A',
            'warm',
            '#E8785C',
            '#CCCCCC',
          ],
          'fill-opacity': [
            'interpolate',
            ['linear'],
            ['get', 'excess'],
            10,
            0.2,
            50,
            0.66,
          ],
          'fill-opacity-transition': { duration: 200 },
        },
      })
      map.addLayer({
        id: 'district-line',
        type: 'line',
        source: SRC,
        paint: {
          'line-color': [
            'match',
            ['get', 'variant'],
            'cool',
            '#2E9E6B',
            'warm',
            '#D2543A',
            '#999999',
          ],
          'line-width': [
            'interpolate',
            ['linear'],
            ['get', 'excess'],
            10,
            2,
            50,
            4,
          ],
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

  // 토글이 바뀌면 지도 색이 즉시 따라간다 — 데모의 핵심 전환.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const apply = () => {
      const source = map.getSource<GeoJSONSource>(SRC)
      source?.setData(districtFeatures(scenario))
    }
    if (map.isStyleLoaded() && map.getSource(SRC)) apply()
    else map.once('idle', apply)
  }, [scenario])

  return (
    <>
      {/* MapLibre가 컨테이너에 .maplibregl-map 클래스를 붙이는데, 그 CSS의
          position:relative가 absolute를 덮어써서 inset-0이 높이를 만들지 못한다.
          위치가 아니라 크기로 채운다. */}
      <div ref={containerRef} className="size-full" />
      {showLabels && <MapLabels scenario={scenario} map={readyMap} />}
    </>
  )
}

/**
 * 라벨은 symbol 레이어가 아니라 HTML 마커로 붙인다.
 * symbol 레이어의 텍스트는 glyph 서버를 필요로 해서, 타일 없는 구성과 맞지 않는다.
 */
function MapLabels({
  scenario,
  map,
}: {
  scenario: ScenarioKey
  map: MapLibreMap | null
}) {
  const markersRef = useRef<Marker[]>([])

  useEffect(() => {
    if (!map) return

    markersRef.current = DISTRICTS.map((district) => {
      const forecast = getForecast(district.code, scenario)
      const warm = district.variant === 'warm'

      const el = document.createElement('div')
      el.className = 'flex flex-col items-center gap-1'
      el.innerHTML = `
          <div class="rounded-full border border-[rgba(22,60,42,0.10)] bg-white/96 px-3 py-1.5 shadow-panel backdrop-blur-[14px]">
            <div class="flex items-center gap-2 whitespace-nowrap">
              <span class="text-[15px] font-semibold ${warm ? 'text-warm-deep' : 'text-cool-deep'}">${district.name}</span>
              <span class="tnum text-[15px] font-semibold ${warm ? 'text-warm-text' : 'text-cool'}">+${forecast.excessRate}%</span>
            </div>
          </div>
          <div class="size-2.5 rotate-45 rounded-[2px] border-2 border-white" style="background:${warm ? '#D2543A' : '#2E9E6B'}"></div>
        `
      return new Marker({ element: el, anchor: 'bottom' })
        .setLngLat(district.center)
        .addTo(map)
    })

    return () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
    }
  }, [scenario, map])

  return null
}
