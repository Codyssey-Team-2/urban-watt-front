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
import type { DayView } from '@/lib/api/adapt'
import type { ChartTab } from '@/lib/nav'

const TABS: { key: ChartTab; label: string }[] = [
  { key: 'demand', label: '전력수요' },
  { key: 'error', label: '위험도' },
  { key: 'temp', label: '기온' },
]

export interface ChartSeries {
  code: string
  name: string
  color: string
  day: DayView
}

interface ForecastChartProps {
  series: ChartSeries[]
  hour: number
  tab: ChartTab
  onTabChange: (tab: ChartTab) => void
  /** '기상만' · '미기후 반영' — 지금 보고 있는 예측이 무엇인지 밝힌다 */
  scenarioLabel?: string
}

/**
 * 두 동을 함께 그리는 시계열 차트.
 *
 * 위험도 탭이 기본 비교축이다 — 동마다 위험선(threshold)이 달라서 kWh를
 * 그대로 겹치면 어느 쪽이 더 위험한지 알 수 없다. 위험선 대비 비율로 보면
 * 100% 하나로 두 동을 같은 자에 놓을 수 있다.
 */
export function ForecastChart({
  series,
  hour,
  tab,
  onTabChange,
  scenarioLabel,
}: ForecastChartProps) {
  const rows = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, h) => h)
    return hours.map((h) => {
      const row: Record<string, number | string | null> = { hour: h }
      series.forEach((s) => {
        const p = s.day.hours.find((x) => x.hour === h)
        row[`${s.code}_usage`] = p?.usageKwh ?? null
        row[`${s.code}_risk`] = p?.riskPercent ?? null
        row[`${s.code}_color`] = p?.color ?? s.color
        row[`${s.code}_grade`] = p?.grade ?? ''
        if (p) row.temperature = p.temperature
      })
      return row
    })
  }, [series])

  const axis = useMemo(() => {
    if (tab === 'demand') {
      const values = series.flatMap((s) => [
        ...s.day.hours.map((h) => h.usageKwh),
        s.day.thresholdKwh ?? 0,
      ])
      const max = Math.ceil(Math.max(...values) / 10000) * 10000
      return {
        domain: [0, max] as [number, number],
        ticks: Array.from({ length: max / 10000 + 1 }, (_, i) => i * 10000),
      }
    }
    if (tab === 'temp') {
      const temps = series[0]?.day.hours.map((h) => h.temperature) ?? [20, 35]
      return {
        domain: [
          Math.floor(Math.min(...temps) / 2) * 2,
          Math.ceil(Math.max(...temps) / 2) * 2,
        ] as [number, number],
        ticks: undefined,
      }
    }
    const max =
      Math.ceil(
        Math.max(100, ...series.flatMap((s) => s.day.hours.map((h) => h.riskPercent))) /
          20,
      ) * 20
    return {
      domain: [0, max] as [number, number],
      ticks: Array.from({ length: max / 20 + 1 }, (_, i) => i * 20),
    }
  }, [series, tab])

  return (
    <div className="flex h-full min-w-0 flex-col">
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
          {tab === 'temp' ? (
            <span>서울 대표기상 (두 동 공통)</span>
          ) : (
            series.map((s) => (
              <span key={s.code} className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="inline-block h-0.5 w-3 rounded-full"
                  style={{ background: s.color }}
                />
                {s.name}
              </span>
            ))
          )}
          {tab !== 'temp' && (
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="inline-block h-0.5 w-3 rounded-full"
                style={{
                  // 전력수요 탭의 위험선은 동별 색이라 범례도 같은 색을 쓴다.
                  background:
                    tab === 'demand'
                      ? `repeating-linear-gradient(90deg, ${series[0]?.color ?? 'var(--color-danger)'} 0 4px, transparent 4px 7px)`
                      : 'repeating-linear-gradient(90deg, var(--color-danger) 0 4px, transparent 4px 7px)',
                }}
              />
              위험선
            </span>
          )}
          {scenarioLabel && (
            <span className="rounded-full bg-brand-light px-2 py-0.5 text-[13px] font-semibold text-brand-dark">
              {scenarioLabel}
            </span>
          )}
        </div>
      </div>

      <div className="mt-2 min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 18, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--color-hair)" vertical={false} />
            <XAxis
              dataKey="hour"
              type="number"
              domain={[0, 23]}
              ticks={[0, 6, 12, 18, 23]}
              tickFormatter={(h: number) => String(h).padStart(2, '0')}
              tick={{ fill: 'var(--color-faint)', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--color-hair)' }}
            />
            <YAxis
              width={54}
              tick={{ fill: 'var(--color-faint)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              domain={axis.domain}
              ticks={axis.ticks}
              tickFormatter={(v: number) =>
                tab === 'demand' ? `${Math.round(v / 1000)}k` : String(v)
              }
            />

            {/* 위험선. kWh 탭에서는 동마다 값이 달라 각각 그린다. */}
            {tab === 'demand' &&
              series.map(
                (s) =>
                  s.day.thresholdKwh != null && (
                    <ReferenceLine
                      key={s.code}
                      y={s.day.thresholdKwh}
                      stroke={s.color}
                      strokeDasharray="5 4"
                      strokeOpacity={0.7}
                    />
                  ),
              )}
            {tab === 'error' && (
              <ReferenceLine y={100} stroke="var(--color-danger)" strokeDasharray="5 4" />
            )}

            <ReferenceLine
              x={Math.min(hour, 23)}
              stroke="var(--color-brand)"
              strokeWidth={1.5}
            />
            <Tooltip
              cursor={{ stroke: 'var(--color-faint)', strokeDasharray: '3 3' }}
              content={<ChartTooltip series={series} tab={tab} />}
            />

            {tab === 'temp' ? (
              <Line
                type="monotone"
                dataKey="temperature"
                stroke="var(--color-neutral-line)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            ) : (
              series.map((s) => (
                <Line
                  key={s.code}
                  type="monotone"
                  dataKey={`${s.code}_${tab === 'demand' ? 'usage' : 'risk'}`}
                  stroke={s.color}
                  strokeWidth={2}
                  // 점 색은 서버 등급 색. 경계에서 위험으로 넘어가는 순간이 보인다.
                  dot={<GradeDot code={s.code} />}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              ))
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function GradeDot(props: {
  code: string
  cx?: number
  cy?: number
  payload?: Record<string, unknown>
}) {
  const { code, cx, cy, payload } = props
  if (cx == null || cy == null) return null
  return (
    <circle
      cx={cx}
      cy={cy}
      r={3.5}
      fill={(payload?.[`${code}_color`] as string) ?? 'var(--color-faint)'}
      stroke="#fff"
      strokeWidth={1.5}
    />
  )
}

function ChartTooltip({
  active,
  payload,
  label,
  series,
  tab,
}: {
  active?: boolean
  payload?: { payload?: Record<string, unknown> }[]
  label?: number
  series: ChartSeries[]
  tab: ChartTab
}) {
  const row = payload?.[0]?.payload
  if (!active || !row) return null

  return (
    <div className="rounded-xl border border-[rgba(22,60,42,0.10)] bg-white/96 px-3 py-2 shadow-panel backdrop-blur-[14px]">
      <div className="tnum text-[13px] font-semibold text-ink">
        {String(label).padStart(2, '0')}:00
      </div>
      {tab === 'temp' ? (
        <div className="tnum mt-1 text-[15px] font-semibold text-ink">
          {Number(row.temperature).toFixed(1)}°C
        </div>
      ) : (
        <div className="mt-1 flex flex-col gap-1">
          {series.map((s) => {
            const value = row[`${s.code}_${tab === 'demand' ? 'usage' : 'risk'}`]
            if (value == null) return null
            return (
              <div key={s.code} className="flex items-center gap-2 text-[13px]">
                <span
                  aria-hidden
                  className="inline-block size-2 flex-none rounded-full"
                  style={{ background: row[`${s.code}_color`] as string }}
                />
                <span className="text-muted">{s.name}</span>
                <span className="tnum ml-auto font-semibold text-ink">
                  {tab === 'demand'
                    ? `${Math.round(Number(value)).toLocaleString()} kWh`
                    : `${Number(value).toFixed(1)}%`}
                </span>
                <span className="text-faint">{row[`${s.code}_grade`] as string}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
