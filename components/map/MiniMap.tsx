'use client'

import { Panel } from '@/components/layout/Panel'
import {
  DISTRICTS,
  HAN_RIVER,
  SEOUL_BBOX,
  SEOUL_OUTLINE,
} from '@/lib/mock'
import type { Viewport } from './MapView'

const W = 208
const H = 118

/** 경위도를 미니맵 SVG 좌표로. 위도는 위로 갈수록 커지므로 y를 뒤집는다. */
function project([lng, lat]: [number, number]): [number, number] {
  const { minLng, maxLng, minLat, maxLat } = SEOUL_BBOX
  return [
    ((lng - minLng) / (maxLng - minLng)) * W,
    H - ((lat - minLat) / (maxLat - minLat)) * H,
  ]
}

const toPath = (coords: number[][]) =>
  coords
    .map((c, i) => {
      const [x, y] = project(c as [number, number])
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max)

interface MiniMapProps {
  viewport: Viewport | null
  className?: string
}

export function MiniMap({ viewport, className }: MiniMapProps) {
  const seoulPath = `${toPath(SEOUL_OUTLINE.geometry.coordinates[0])} Z`
  const hanPath = toPath(HAN_RIVER.geometry.coordinates)

  // 현재 지도 범위 상자. 서울 밖으로 벗어나면 미니맵 안에서 잘라 보여준다.
  let box: { x: number; y: number; w: number; h: number } | null = null
  if (viewport) {
    const [x1, y1] = project([viewport.west, viewport.north])
    const [x2, y2] = project([viewport.east, viewport.south])
    const left = clamp(Math.min(x1, x2), 0, W)
    const right = clamp(Math.max(x1, x2), 0, W)
    const top = clamp(Math.min(y1, y2), 0, H)
    const bottom = clamp(Math.max(y1, y2), 0, H)
    if (right - left > 2 && bottom - top > 2) {
      box = { x: left, y: top, w: right - left, h: bottom - top }
    }
  }

  return (
    <Panel className={className}>
      <div className="flex items-center justify-between px-4 pb-1 pt-3">
        <span className="text-[13px] font-semibold text-muted">서울시</span>
        <span className="text-[13px] text-faint">현재 범위</span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full px-2"
        role="img"
        aria-label="서울시 안에서 진관동과 창신동의 위치, 그리고 현재 지도 범위"
      >
        <path d={seoulPath} fill="#E1EBDF" stroke="#C4D3C3" strokeWidth={1} />
        <path d={hanPath} fill="none" stroke="#DCEAF2" strokeWidth={3} />
        {box && (
          <rect
            x={box.x}
            y={box.y}
            width={box.w}
            height={box.h}
            rx={2}
            fill="var(--color-brand)"
            fillOpacity={0.07}
            stroke="var(--color-brand)"
            strokeWidth={1.2}
            strokeDasharray="3 2"
          />
        )}
        {DISTRICTS.map((d) => {
          const [x, y] = project(d.center)
          const warm = d.variant === 'warm'
          return (
            <circle
              key={d.code}
              cx={x}
              cy={y}
              r={4.5}
              fill={warm ? 'var(--color-warm)' : 'var(--color-cool)'}
              stroke="#fff"
              strokeWidth={1.5}
            />
          )
        })}
      </svg>

      <div className="flex gap-3 px-4 pb-3 pt-1">
        {DISTRICTS.map((d) => (
          <span
            key={d.code}
            className="flex items-center gap-1.5 text-[13px] text-muted"
          >
            <span
              aria-hidden
              className={`inline-block size-2 rounded-full ${
                d.variant === 'warm' ? 'bg-warm' : 'bg-cool'
              }`}
            />
            {d.name}
          </span>
        ))}
      </div>
    </Panel>
  )
}
