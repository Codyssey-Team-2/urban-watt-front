'use client'

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
  { key: 'temp', label: '기온' },
  { key: 'error', label: '위험도' },
]

interface ForecastChartProps {
  day: DayView
  districtName: string
  identityColor: string
  hour: number
  tab: ChartTab
  onTabChange: (tab: ChartTab) => void
  /** 비교 대상 동의 시계열이 없을 때의 안내 */
  missingNote?: string | null
}

/**
 * 실측 시계열 차트.
 *
 * 계약대로 usage 실선 · baseline 점선 · threshold 가로 기준선을 그린다.
 * 점 색은 서버가 준 등급 색을 그대로 쓴다 — 경계에서 위험으로 넘어가는
 * 순간이 색으로 보이는 게 이 화면의 핵심이다.
 */
export function ForecastChart({
  day,
  districtName,
  identityColor,
  hour,
  tab,
  onTabChange,
  missingNote,
}: ForecastChartProps) {
  const unit = tab === 'demand' ? 'kWh' : tab === 'temp' ? '°C' : '%'

  // 자동 눈금은 19k·29k처럼 어중간하게 잡힌다. 탭별로 깔끔한 간격을 만든다.
  const axis = (() => {
    if (tab === 'demand') {
      const top = Math.max(day.thresholdKwh, ...day.hours.map((h) => h.usageKwh))
      const max = Math.ceil(top / 10000) * 10000
      return {
        domain: [0, max] as [number, number],
        ticks: Array.from({ length: max / 10000 + 1 }, (_, i) => i * 10000),
      }
    }
    if (tab === 'temp') {
      const temps = day.hours.map((h) => h.temperature)
      const lo = Math.floor(Math.min(...temps) / 2) * 2
      const hi = Math.ceil(Math.max(...temps) / 2) * 2
      return { domain: [lo, hi] as [number, number], ticks: undefined }
    }
    const max = Math.ceil(Math.max(100, ...day.hours.map((h) => h.riskPercent)) / 20) * 20
    return {
      domain: [0, max] as [number, number],
      ticks: Array.from({ length: max / 20 + 1 }, (_, i) => i * 20),
    }
  })()

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
          <span className="font-semibold text-ink">{districtName}</span>
          {tab === 'demand' && (
            <>
              <Mark color={identityColor} /> 실측
              <Mark color="var(--color-neutral-line)" dashed /> 평소 수준
              <Mark color="var(--color-danger)" dashed /> 위험선
            </>
          )}
          {tab === 'error' && (
            <>
              <Mark color={identityColor} /> 위험선 대비
              <Mark color="var(--color-danger)" dashed /> 100%
            </>
          )}
        </div>
      </div>

      <div className="mt-2 min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={day.hours}
            margin={{ top: 18, right: 12, bottom: 0, left: 0 }}
          >
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

            {tab === 'demand' && (
              <ReferenceLine
                y={day.thresholdKwh}
                stroke="var(--color-danger)"
                strokeDasharray="5 4"
                // 오른쪽에 두면 저녁 시간대 곡선과 겹친다. 새벽 쪽이 비어 있다.
                label={{
                  value: '위험선',
                  position: 'insideTopLeft',
                  fill: 'var(--color-danger-text)',
                  fontSize: 12,
                }}
              />
            )}
            {tab === 'error' && (
              <ReferenceLine
                y={100}
                stroke="var(--color-danger)"
                strokeDasharray="5 4"
              />
            )}

            <ReferenceLine
              x={Math.min(hour, 23)}
              stroke="var(--color-brand)"
              strokeWidth={1.5}
            />
            <Tooltip
              cursor={{ stroke: 'var(--color-faint)', strokeDasharray: '3 3' }}
              content={<ForecastTooltip unit={unit} tab={tab} />}
            />

            {tab === 'demand' && (
              <Line
                type="monotone"
                dataKey="baselineKwh"
                stroke="var(--color-neutral-line)"
                strokeWidth={1.5}
                strokeDasharray="5 4"
                dot={false}
                isAnimationActive={false}
              />
            )}
            <Line
              type="monotone"
              dataKey={
                tab === 'demand'
                  ? 'usageKwh'
                  : tab === 'temp'
                    ? 'temperature'
                    : 'riskPercent'
              }
              stroke={identityColor}
              strokeWidth={2}
              // 점 색은 서버 등급 색. 경계에서 위험으로 넘어가는 순간이 보인다.
              dot={<GradeDot />}
              activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {missingNote && (
        <p className="mt-1 text-[13px] text-faint">{missingNote}</p>
      )}
    </div>
  )
}

function Mark({ color, dashed }: { color: string; dashed?: boolean }) {
  return (
    <span
      aria-hidden
      className="ml-1 inline-block h-0.5 w-3 rounded-full"
      style={{
        background: dashed
          ? `repeating-linear-gradient(90deg, ${color} 0 4px, transparent 4px 7px)`
          : color,
      }}
    />
  )
}

function GradeDot(props: {
  cx?: number
  cy?: number
  payload?: { color?: string }
}) {
  const { cx, cy, payload } = props
  if (cx == null || cy == null) return null
  return (
    <circle
      cx={cx}
      cy={cy}
      r={3.5}
      fill={payload?.color ?? 'var(--color-faint)'}
      stroke="#fff"
      strokeWidth={1.5}
    />
  )
}

function ForecastTooltip({
  active,
  payload,
  label,
  unit,
  tab,
}: {
  active?: boolean
  payload?: { payload?: Record<string, unknown> }[]
  label?: number
  unit: string
  tab: ChartTab
}) {
  const p = payload?.[0]?.payload as
    | {
        usageKwh: number
        baselineKwh: number
        temperature: number
        riskPercent: number
        riskText: string
        grade: string
        color: string
        message: string
      }
    | undefined
  if (!active || !p) return null

  const value =
    tab === 'demand'
      ? `${Math.round(p.usageKwh).toLocaleString()} ${unit}`
      : tab === 'temp'
        ? `${p.temperature.toFixed(1)}${unit}`
        : `${p.riskPercent.toFixed(1)}${unit}`

  return (
    <div className="rounded-xl border border-[rgba(22,60,42,0.10)] bg-white/96 px-3 py-2 shadow-panel backdrop-blur-[14px]">
      <div className="tnum text-[13px] font-semibold text-ink">
        {String(label).padStart(2, '0')}:00
      </div>
      <div className="tnum mt-1 text-[15px] font-semibold text-ink">{value}</div>
      {tab === 'demand' && (
        <div className="tnum text-[13px] text-muted">
          평소 {Math.round(p.baselineKwh).toLocaleString()} kWh
        </div>
      )}
      <div className="mt-1.5 flex items-center gap-1.5 border-t border-hair pt-1.5 text-[13px]">
        <span
          aria-hidden
          className="inline-block size-2 rounded-full"
          style={{ background: p.color }}
        />
        <span className="font-semibold text-ink">{p.grade}</span>
        <span className="text-muted">· {p.riskText}</span>
      </div>
    </div>
  )
}
