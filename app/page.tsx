'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Panel } from '@/components/layout/Panel'
import { DistrictCard } from '@/components/panels/DistrictCard'
import { ModelPerfCard } from '@/components/panels/ModelPerfCard'
import {
  BriefingCard,
  type BriefingState,
} from '@/components/panels/BriefingCard'
import { ZoomControls } from '@/components/map/ZoomControls'
import { cn } from '@/lib/cn'
import {
  BRIEFINGS,
  CURRENT_HOUR,
  DISTRICTS,
  OVERALL_MAPE,
  getForecast,
} from '@/lib/mock'
import type { ScenarioKey } from '@/lib/types'

/** Phase 2 골격 확인용 자리표시자. 각 Phase에서 실제 컴포넌트로 교체된다. */
function Slot({
  label,
  phase,
  className,
}: {
  label: string
  phase: string
  className?: string
}) {
  return (
    <Panel
      className={cn(
        'flex items-center justify-center border-dashed p-4 text-center',
        className,
      )}
    >
      <div>
        <div className="text-[15px] font-semibold text-muted">{label}</div>
        <div className="tnum mt-0.5 text-[13px] text-faint">{phase}</div>
      </div>
    </Panel>
  )
}

export default function Page() {
  // 화면 전체가 공유하는 상태는 이 셋뿐이다. 여기서 아래로 내려보낸다.
  const [scenario, setScenario] = useState<ScenarioKey>('c')
  const [hour, setHour] = useState(CURRENT_HOUR)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Phase 3 검수용 — 백엔드 연동 시 실제 fetch 상태로 대체된다.
  const [briefingStatus, setBriefingStatus] =
    useState<BriefingState['status']>('success')
  const briefingState: BriefingState =
    briefingStatus === 'success'
      ? { status: 'success', briefing: BRIEFINGS[scenario] }
      : briefingStatus === 'error'
        ? { status: 'error' }
        : { status: 'loading' }

  return (
    <div className="relative size-full">
      {/* 지도는 화면을 꽉 채우는 배경. Phase 5에서 MapView로 교체된다. */}
      <div className="absolute inset-0 bg-mapbase" />

      {/* 패널은 지도 위에 떠 있다. 폭이 줄면 겹치므로 절대위치가 아니라 flex로 짠다. */}
      <div className="absolute inset-0 flex gap-5 p-6">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((v) => !v)}
        />

        {/* 중앙 컬럼 — min-w-0 이 없으면 자식이 넘칠 때 레일을 밀어낸다 */}
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="flex flex-wrap items-start gap-5">
            <Slot label="제목 · 날짜 · 폭염 배지" phase="HeaderCard · Phase 4" />
            <Slot label="S-DoT 격차 · 습도 · 풍속" phase="WeatherChips · Phase 4" />
            <Slot
              label="기상만 ↔ 미기후 반영"
              phase="MicroclimateToggle · Phase 4"
            />
          </div>

          <div className="flex-1" />

          <div className="flex min-w-0 gap-5">
            {/* 1280px 미만에서는 미니맵을 숨긴다 */}
            <Slot
              label="미니맵"
              phase="MiniMap · Phase 5"
              className="hidden h-[218px] w-[240px] flex-none xl:flex"
            />
            <Slot
              label="시간대별 전력수요 차트 + 시간 스크러버"
              phase="DemandChart · TimeScrubber · Phase 4"
              className="h-[218px] min-w-0 flex-1"
            />
          </div>
        </div>

        {/* 우측 레일 400px 고정 */}
        <aside className="flex w-[400px] flex-none flex-col gap-5">
          {DISTRICTS.map((district) => {
            const forecast = getForecast(district.code, scenario)
            const point = forecast.hourly[hour]
            return (
              <DistrictCard
                key={district.code}
                district={district}
                forecast={forecast}
                demand={scenario === 'c' ? point.modelC : point.modelB}
              />
            )
          })}

          <BriefingCard
            state={briefingState}
            onRetry={() => setBriefingStatus('success')}
          />

          <ModelPerfCard mape={OVERALL_MAPE} />

          <div className="flex-1" />

          <ZoomControls
            onZoomIn={() => {}}
            onZoomOut={() => {}}
            onReset={() => {}}
          />
        </aside>
      </div>

      {/* 상태 배선 확인용 — Phase 4에서 실제 컨트롤로 대체된다 */}
      <div className="tnum absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-ink/70 px-3 py-1 text-[13px] text-white">
        scenario={scenario} · hour={hour} · sidebar=
        {sidebarCollapsed ? 'collapsed' : 'expanded'}
        <button
          type="button"
          onClick={() => setScenario((s) => (s === 'c' ? 'b' : 'c'))}
          className="ml-2 underline"
        >
          토글
        </button>
        <button
          type="button"
          onClick={() => setHour((h) => (h + 1) % 24)}
          className="ml-2 underline"
        >
          시간+
        </button>
        <button
          type="button"
          onClick={() =>
            setBriefingStatus((s) =>
              s === 'success' ? 'loading' : s === 'loading' ? 'error' : 'success',
            )
          }
          className="ml-2 underline"
        >
          브리핑={briefingStatus}
        </button>
      </div>
    </div>
  )
}
