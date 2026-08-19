import { Panel } from '@/components/layout/Panel'
import {
  BRIEFINGS,
  DISTRICTS,
  OVERALL_MAPE,
  WEATHER,
  getForecast,
  getMetrics,
} from '@/lib/mock'
import type { ScenarioKey } from '@/lib/types'

/**
 * Phase 1 검수 화면 — 토큰/그림자/목데이터를 눈으로 확인하기 위한 임시 페이지.
 * Phase 2에서 실제 대시보드 레이아웃으로 교체된다.
 */

const SWATCHES = [
  ['brand', 'bg-brand'],
  ['brand-light', 'bg-brand-light'],
  ['brand-dark', 'bg-brand-dark'],
  ['cool', 'bg-cool'],
  ['cool-fill', 'bg-cool-fill'],
  ['cool-deep', 'bg-cool-deep'],
  ['warm', 'bg-warm'],
  ['warm-fill', 'bg-warm-fill'],
  ['warm-deep', 'bg-warm-deep'],
  ['warm-text', 'bg-warm-text'],
  ['warm-light', 'bg-warm-light'],
  ['ink', 'bg-ink'],
  ['muted', 'bg-muted'],
  ['faint', 'bg-faint'],
  ['hair', 'bg-hair'],
  ['mapbase', 'bg-mapbase'],
] as const

const RISK_LABEL = { stable: '안정', caution: '주의', danger: '위험' } as const

function DistrictPreview({ scenario }: { scenario: ScenarioKey }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-[13px] font-semibold text-muted">
        {scenario === 'b' ? '토글 OFF · 기상만' : '토글 ON · 미기후 반영'}
      </div>
      {DISTRICTS.map((d) => {
        const f = getForecast(d.code, scenario)
        const warm = d.variant === 'warm'
        const peak = f.hourly[f.peakHour]
        return (
          <Panel
            key={d.code}
            tone={warm && scenario === 'c' ? 'warm' : 'default'}
            accent={d.variant}
            className="w-[300px]"
          >
            <div className="px-4 pb-4 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-semibold">{d.name}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[13px] font-semibold ${
                    f.riskLevel === 'stable'
                      ? 'bg-brand-light text-brand-dark'
                      : 'bg-warm-light text-warm-text-dark'
                  }`}
                >
                  {RISK_LABEL[f.riskLevel]}
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span
                  className={`tnum text-[40px] font-semibold leading-none tracking-[-0.02em] ${
                    warm ? 'text-warm-text' : 'text-ink'
                  }`}
                >
                  +{f.excessRate}%
                </span>
                <span className="text-[13px] text-faint">평시 대비</span>
              </div>
              <div className="mt-3 flex gap-5 border-t border-hair pt-3">
                <Stat label="균형점" value={`${d.microclimate.balancePoint}°C`} />
                <Stat
                  label="기울기"
                  value={`${d.microclimate.coolingSlope.toFixed(1)}×`}
                  warn={warm}
                />
                <Stat label="식생" value={`${d.microclimate.vegetationRate}%`} />
                <Stat label="피크" value={`${peak.modelC.toFixed(1)}MW`} />
              </div>
            </div>
          </Panel>
        )
      })}
    </div>
  )
}

function Stat({
  label,
  value,
  warn,
}: {
  label: string
  value: string
  warn?: boolean
}) {
  return (
    <div>
      <div className="text-[13px] leading-tight text-faint">{label}</div>
      <div
        className={`tnum text-[15px] leading-tight ${warn ? 'text-warm-text' : 'text-ink'}`}
      >
        {value}
      </div>
    </div>
  )
}

export default function Page() {
  const metrics = getMetrics(DISTRICTS[1].code)
  return (
    <main className="h-full overflow-auto p-6">
      <h1 className="text-[15px] font-semibold">
        UrbanWatt · Phase 1 토큰/목데이터 검수
      </h1>
      <p className="mt-1 text-[13px] text-muted">
        {WEATHER.date} · 폭염 {WEATHER.asosTemp}°C · S-DoT 격차 +{WEATHER.sdotGap}
        °C · 습도 {WEATHER.humidity}% · 풍속 {WEATHER.windSpeed}m/s
      </p>

      <div className="mt-5 flex flex-wrap items-start gap-5">
        <DistrictPreview scenario="b" />
        <DistrictPreview scenario="c" />

        <div className="flex flex-col gap-3">
          <div className="text-[13px] font-semibold text-muted">
            브리핑 / 모델 성능
          </div>
          <Panel className="w-[340px] p-4">
            <div className="text-[13px] font-semibold text-muted">AI 브리핑</div>
            <p className="mt-2 text-[15px] leading-relaxed text-ink">
              {BRIEFINGS.c.summary}
            </p>
            <ul className="mt-3 space-y-1 border-t border-hair pt-3">
              {BRIEFINGS.c.evidence.map((e) => (
                <li key={e} className="text-[13px] text-muted">
                  · {e}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel className="w-[340px] p-4">
            <div className="text-[13px] font-semibold text-muted">
              모델 성능 · MAPE (두 동 종합)
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {(['a', 'b', 'c'] as const).map((k) => (
                <div key={k} className="flex items-center gap-2">
                  <span className="w-3 text-[13px] text-faint uppercase">{k}</span>
                  <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-track">
                    <div
                      className={`h-full ${k === 'c' ? 'bg-brand' : 'bg-neutral-line'}`}
                      style={{
                        width: `${(OVERALL_MAPE[k] / OVERALL_MAPE.a) * 100}%`,
                      }}
                    />
                  </div>
                  <span
                    className={`tnum w-10 text-right text-[15px] ${k === 'c' ? 'font-semibold text-brand-dark' : 'text-ink'}`}
                  >
                    {OVERALL_MAPE[k].toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t border-hair pt-3 text-[13px] text-muted">
              창신동 단독 MAPE — A {metrics.mape.a} / B {metrics.mape.b} / C{' '}
              {metrics.mape.c}
            </div>
          </Panel>
        </div>
      </div>

      <div className="mt-6 text-[13px] font-semibold text-muted">색 토큰</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {SWATCHES.map(([name, bg]) => (
          <div key={name} className="w-[104px]">
            <div
              className={`h-11 rounded-lg border border-[rgba(22,60,42,0.10)] ${bg}`}
            />
            <div className="mt-1 text-[13px] text-faint">{name}</div>
          </div>
        ))}
      </div>
    </main>
  )
}
