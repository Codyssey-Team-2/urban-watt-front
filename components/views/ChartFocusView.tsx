'use client'

import { Panel } from '@/components/layout/Panel'
import { HeaderCard } from '@/components/controls/HeaderCard'
import { WeatherChips } from '@/components/controls/WeatherChips'
import { MicroclimateToggle } from '@/components/controls/MicroclimateToggle'
import { TimeScrubber } from '@/components/controls/TimeScrubber'
import { DemandChart } from '@/components/panels/DemandChart'
import { ForecastChart } from '@/components/panels/ForecastChart'
import { cn } from '@/lib/cn'
import { GURO_CODE, getTempAt } from '@/lib/mock'
import { PLAYBACK_SPEED } from '@/lib/nav'
import type { ViewProps } from './shared'

/** 차트를 전체 폭으로 크게 보는 화면. 시간대별 수치를 자세히 읽는 용도. */
export function ChartFocusView({
  scenario,
  onScenarioChange,
  scenarioNote,
  header,
  cards,
  hour,
  onHourChange,
  playing,
  onPlayingChange,
  chart,
  chartTab,
  onChartTabChange,
  settings,
}: ViewProps) {
  const guroTemp = getTempAt(GURO_CODE, hour)

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-5">
      <div className="flex flex-wrap items-start gap-5">
        <HeaderCard hour={hour} header={header} />
        <WeatherChips chips={header.chips} />
        <MicroclimateToggle
          scenario={scenario}
          onChange={onScenarioChange}
          disabledNote={scenarioNote}
        />
      </div>

      <Panel className="flex min-h-0 flex-1 flex-col px-6 pb-4 pt-5">
        <div className="min-h-0 flex-1">
          {chart.mode === 'forecast' ? (
            <ForecastChart
              day={chart.day}
              districtName={chart.districtName}
              identityColor={chart.identityColor}
              hour={hour}
              tab={chartTab}
              onTabChange={onChartTabChange}
              missingNote={chart.missingNote}
            />
          ) : (
            <DemandChart
              scenario={scenario}
              hour={hour}
              tab={chartTab}
              onTabChange={onChartTabChange}
              markerInterval={settings.markerInterval}
            />
          )}
        </div>
        <TimeScrubber
          hour={hour}
          onHourChange={onHourChange}
          playing={playing}
          onPlayingChange={onPlayingChange}
          stepMs={PLAYBACK_SPEED[settings.playbackSpeed]}
          source={header.source}
        />
      </Panel>

      <div className="flex flex-wrap items-start gap-5">
        {cards.map((card) => (
          <Panel
            key={card.code}
            accent={card.variant}
            className="min-w-[280px] flex-1"
          >
            <div className="flex items-center gap-6 px-5 py-4">
              <div className="min-w-0">
                <div className="text-[13px] text-faint">{card.name}</div>
                <div
                  className={cn(
                    'tnum text-[24px] font-semibold leading-tight',
                    card.risk === 'danger' ? 'text-danger-text' : 'text-ink',
                  )}
                >
                  {card.headline}
                </div>
                <div className="text-[13px] text-faint">{card.headlineLabel}</div>
              </div>
              <div className="flex min-w-0 flex-1 gap-5 border-l border-hair pl-6">
                {card.stats.slice(0, 3).map((st) => (
                  <div key={st.label} className="min-w-0">
                    <div className="truncate text-[13px] text-faint">
                      {st.label}
                    </div>
                    <div className="tnum truncate text-[15px] text-ink">
                      {st.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        ))}
      </div>

      <div className="text-[13px] text-faint">
        {String(Math.floor(hour)).padStart(2, '0')}시 기준 · 구로동 S-DoT 실측은 대표기상보다{' '}
        {(guroTemp.sdot - guroTemp.asos).toFixed(1)}°C 높습니다.
      </div>
    </div>
  )
}
