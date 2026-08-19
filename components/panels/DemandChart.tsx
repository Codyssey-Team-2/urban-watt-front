'use client'

import { useMemo } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { cn } from '@/lib/cn'
import { GURO_CODE, JINGWAN_CODE, PEAK_HOUR, getForecast } from '@/lib/mock'
import type { ScenarioKey } from '@/lib/types'
import type { ChartTab } from '@/lib/nav'

type TabKey = ChartTab

const TABS: { key: TabKey; label: string; unit: string }[] = [
  { key: 'demand', label: '전력수요', unit: 'MW' },
  { key: 'temp', label: '기온', unit: '°C' },
  { key: 'error', label: '오차', unit: 'MW' },
]

/** 자동 눈금은 0/30/90처럼 간격이 불규칙해진다. 탭별로 직접 고정한다. */
const Y_AXIS: Record<TabKey, { domain: [number, number]; ticks: number[] } | null> =
  {
    demand: { domain: [0, 90], ticks: [0, 30, 60, 90] },
    temp: { domain: [24, 40], ticks: [24, 28, 32, 36, 40] },
    // 오차는 시나리오에 따라 범위가 크게 달라져 자동에 맡긴다.
    error: null,
  }

const COOL = 'var(--color-cool)'
const WARM = 'var(--color-warm)'
const BASE = 'var(--color-neutral-line)'

type MarkerShape = 'circle' | 'diamond' | 'none'

interface Series {
  key: string
  name: string
  color: string
  dashed?: boolean
  shape: MarkerShape
}

/**
 * 세 탭 모두 진관동=초록 / 구로동=코랄로 고정한다. 회색 파선은 지역이 아니라
 * "미기후를 반영하지 않은 기준선"만을 뜻한다.
 *
 * 초록↔코랄은 적록색각에서 구분 여유가 크지 않아(deutan ΔE 6.5) 색만으로
 * 식별하게 두지 않는다 — 진관동은 원, 구로동은 마름모 마커를 4시간마다 찍어
 * 모양으로도 구분되게 한다. 선 끝 라벨은 곡선이 수렴하는 구간에서 서로 겹쳐
 * 쓰지 않는다.
 */
const SERIES: Record<TabKey, Series[]> = {
  demand: [
    { key: 'jingwan', name: '진관동', color: COOL, shape: 'circle' },
    { key: 'guro', name: '구로동', color: WARM, shape: 'diamond' },
    {
      key: 'guroBase',
      name: '구로동 · 기상만',
      color: BASE,
      dashed: true,
      shape: 'none',
    },
  ],
  temp: [
    { key: 'jingwanTemp', name: '진관동', color: COOL, shape: 'circle' },
    { key: 'guroTemp', name: '구로동', color: WARM, shape: 'diamond' },
    { key: 'asos', name: '대표기상', color: BASE, dashed: true, shape: 'none' },
  ],
  error: [
    { key: 'jingwanErr', name: '진관동', color: COOL, shape: 'circle' },
    { key: 'guroErr', name: '구로동', color: WARM, shape: 'diamond' },
  ],
}

interface DemandChartProps {
  scenario: ScenarioKey
  hour: number
  /** 탭은 뷰를 옮겨 다녀도 유지되어야 해서 바깥에서 들고 있는다. */
  tab: TabKey
  onTabChange: (tab: TabKey) => void
  /** 마커 간격(시간). 설정에서 바꾼다. */
  markerInterval?: number
}

export function DemandChart({
  scenario,
  hour,
  tab,
  onTabChange,
  markerInterval = 4,
}: DemandChartProps) {

  const data = useMemo(() => {
    const j = getForecast(JINGWAN_CODE, scenario).hourly
    const c = getForecast(GURO_CODE, scenario).hourly
    const pick = (p: (typeof j)[number]) =>
      scenario === 'c' ? p.modelC : p.modelB
    return j.map((point, h) => ({
      hour: h,
      jingwan: pick(point),
      guro: pick(c[h]),
      // 미기후 반영 상태일 때만, 기상만 썼다면 어땠을지를 유령선으로 겹쳐 보여준다.
      guroBase: scenario === 'c' ? c[h].modelB : null,
      jingwanTemp: point.sdot,
      guroTemp: c[h].sdot,
      asos: point.asos,
      // 실측이 없는 시각(기준 시각 이후)은 선을 끊는다.
      jingwanErr:
        point.actual === null ? null : round1(point.actual - pick(point)),
      guroErr:
        c[h].actual === null ? null : round1(c[h].actual - pick(c[h])),
    }))
  }, [scenario])

  // 기상만 상태에서는 실선 자체가 기상만 예측이라 유령 기준선이 중복이다.
  // 그릴 선이 없는데 범례만 남으면 읽는 사람이 선을 찾게 된다.
  const active = useMemo(
    () =>
      SERIES[tab].filter((s) => !(s.key === 'guroBase' && scenario === 'b')),
    [tab, scenario],
  )
  const unit = TABS.find((t) => t.key === tab)!.unit
  const axis = Y_AXIS[tab]

  return (
    <div className="flex h-full min-w-0 flex-col">
      {/* 탭 + 범례 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="차트 종류"
          className="flex gap-1 rounded-[10px] bg-[#EFF5F0] p-1"
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => onTabChange(t.key)}
              className={cn(
                'rounded-lg px-3 py-1 text-[13px] transition-colors duration-200',
                tab === t.key
                  ? 'bg-ink font-semibold text-white'
                  : 'text-muted hover:text-ink',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[13px] text-muted">
          {active.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <LegendMark series={s} />
              {s.name}
            </span>
          ))}
        </div>
      </div>

      {/* 차트 */}
      <div className="mt-2 min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 18, right: 12, bottom: 0, left: 0 }}
          >
            <CartesianGrid stroke="var(--color-hair)" vertical={false} />
            <XAxis
              dataKey="hour"
              // 재생 중 현재 시각선이 정시 사이에도 놓이려면 수치 축이어야 한다.
              type="number"
              domain={[0, 23]}
              ticks={[0, 6, 12, 18, 23]}
              tickFormatter={(h: number) => String(h).padStart(2, '0')}
              tick={{ fill: 'var(--color-faint)', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--color-hair)' }}
            />
            <YAxis
              width={38}
              tick={{ fill: 'var(--color-faint)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              domain={axis?.domain ?? ['auto', 'auto']}
              ticks={axis?.ticks}
              tickCount={axis ? undefined : 4}
            />
            {tab === 'error' && (
              <ReferenceLine y={0} stroke="var(--color-faint)" strokeWidth={1} />
            )}
            <ReferenceLine
              x={PEAK_HOUR}
              stroke="var(--color-warm-fill)"
              strokeDasharray="3 3"
              label={{
                value: '피크',
                position: 'top',
                fill: 'var(--color-warm-text)',
                fontSize: 12,
              }}
            />
            <ReferenceLine
              x={Math.min(hour, 23)}
              stroke="var(--color-brand)"
              strokeWidth={1.5}
            />
            <Tooltip
              cursor={{ stroke: 'var(--color-faint)', strokeDasharray: '3 3' }}
              content={<ChartTooltip series={active} unit={unit} />}
            />
            {active.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={s.dashed ? 1.5 : 2}
                strokeDasharray={s.dashed ? '5 4' : undefined}
                activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
                connectNulls={false}
                // 곡선 애니메이션은 끈다. 시간대 재생 중 매 프레임 다시 그려지면
                // 선이 끊긴 것처럼 보인다. 토글 전환은 지도와 카드가 표현한다.
                isAnimationActive={false}
                dot={
                  <SeriesMarker
                    shape={s.shape}
                    color={s.color}
                    interval={markerInterval}
                  />
                }
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

const round1 = (n: number) => Math.round(n * 10) / 10

/**
 * 4시간마다 마커를 찍어 색 외에 모양으로도 계열을 구분하게 한다.
 * 24개 전부 찍으면 선이 지저분해지므로 간격을 둔다.
 */
function SeriesMarker(props: {
  shape: MarkerShape
  color: string
  interval: number
  cx?: number
  cy?: number
  index?: number
  value?: number | null
}) {
  const { shape, color, interval, cx, cy, index, value } = props
  if (shape === 'none' || cx == null || cy == null || value == null) return null
  if (index == null || index % interval !== 0) return null

  if (shape === 'circle') {
    return (
      <circle cx={cx} cy={cy} r={3.5} fill={color} stroke="#fff" strokeWidth={1.5} />
    )
  }
  return (
    <rect
      x={cx - 3.4}
      y={cy - 3.4}
      width={6.8}
      height={6.8}
      fill={color}
      stroke="#fff"
      strokeWidth={1.5}
      transform={`rotate(45 ${cx} ${cy})`}
    />
  )
}

/** 범례 표식도 차트와 같은 모양을 쓴다 — 색만으로 대응시키지 않는다. */
function LegendMark({ series }: { series: Series }) {
  return (
    <span aria-hidden className="relative inline-flex h-2 w-4 items-center">
      <span
        className="absolute inset-x-0 h-0.5 rounded-full"
        style={{
          background: series.dashed
            ? `repeating-linear-gradient(90deg, ${series.color} 0 4px, transparent 4px 7px)`
            : series.color,
        }}
      />
      {series.shape !== 'none' && (
        <span
          className="absolute left-1/2 size-2 -translate-x-1/2 border-[1.5px] border-white"
          style={{
            background: series.color,
            borderRadius: series.shape === 'circle' ? '9999px' : '1px',
            transform:
              series.shape === 'diamond'
                ? 'translateX(-50%) rotate(45deg)'
                : 'translateX(-50%)',
          }}
        />
      )}
    </span>
  )
}

function ChartTooltip({
  active,
  payload,
  label,
  series,
  unit,
}: {
  active?: boolean
  payload?: { dataKey?: string | number; value?: number | null }[]
  label?: number
  series: Series[]
  unit: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-[rgba(22,60,42,0.10)] bg-white/96 px-3 py-2 shadow-panel backdrop-blur-[14px]">
      <div className="tnum text-[13px] font-semibold text-ink">
        {String(label).padStart(2, '0')}:00
      </div>
      <div className="mt-1 flex flex-col gap-0.5">
        {series.map((s) => {
          const row = payload.find((p) => p.dataKey === s.key)
          if (row?.value == null) return null
          return (
            <div key={s.key} className="flex items-center gap-2 text-[13px]">
              <span
                aria-hidden
                className="inline-block size-2 flex-none rounded-full"
                style={{ background: s.color }}
              />
              <span className="text-muted">{s.name}</span>
              <span className="tnum ml-auto font-semibold text-ink">
                {row.value.toFixed(1)}
                {unit}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
