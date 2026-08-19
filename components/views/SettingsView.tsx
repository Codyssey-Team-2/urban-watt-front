'use client'

import { Panel } from '@/components/layout/Panel'
import { cn } from '@/lib/cn'
import { PLAYBACK_SPEED, type PlaybackSpeed } from '@/lib/nav'
import type { ViewProps } from './shared'

function Row({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-6 border-b border-hair py-4 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="text-[15px] text-ink">{title}</div>
        <p className="mt-0.5 text-[13px] leading-relaxed text-muted">
          {description}
        </p>
      </div>
      <div className="flex-none">{children}</div>
    </div>
  )
}

function Segmented<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { key: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div className="flex gap-1 rounded-[10px] bg-[#EFF5F0] p-1">
      {options.map((option) => (
        <button
          key={String(option.key)}
          type="button"
          aria-pressed={value === option.key}
          onClick={() => onChange(option.key)}
          className={cn(
            'rounded-lg px-3 py-1.5 text-[13px] transition-colors duration-200',
            value === option.key
              ? 'bg-white font-semibold text-ink shadow-[0_1px_3px_rgba(20,50,35,0.12)]'
              : 'text-muted hover:text-ink',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

const SPEED_OPTIONS: { key: PlaybackSpeed; label: string }[] = [
  { key: 'slow', label: '느리게' },
  { key: 'normal', label: '보통' },
  { key: 'fast', label: '빠르게' },
]

export function SettingsView({ settings, onSettingsChange }: ViewProps) {
  const set = <K extends keyof typeof settings>(
    key: K,
    value: (typeof settings)[K],
  ) => onSettingsChange({ ...settings, [key]: value })

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-y-auto pr-1">
      <Panel className="px-6 py-5">
        <h2 className="text-[15px] font-semibold text-ink">화면 설정</h2>
        <div className="mt-2">
          <Row
            title="시간대 재생 속도"
            description={`재생 버튼을 눌렀을 때 한 시간이 넘어가는 속도입니다. 현재 24시간을 약 ${Math.round((PLAYBACK_SPEED[settings.playbackSpeed] * 24) / 1000)}초에 훑습니다.`}
          >
            <Segmented
              value={settings.playbackSpeed}
              options={SPEED_OPTIONS}
              onChange={(v) => set('playbackSpeed', v)}
            />
          </Row>

          <Row
            title="차트 마커 간격"
            description="진관동은 원, 창신동은 마름모로 표시합니다. 초록과 코랄은 적록색각에서 구분 여유가 크지 않아, 색 외에 모양으로도 계열을 구분할 수 있게 한 장치입니다. 촘촘할수록 구분이 쉬워지고 선은 조금 지저분해집니다."
          >
            <Segmented
              value={settings.markerInterval}
              options={[
                { key: 2, label: '촘촘히' },
                { key: 4, label: '보통' },
                { key: 8, label: '드물게' },
              ]}
              onChange={(v) => set('markerInterval', v)}
            />
          </Row>

          <Row
            title="지도 라벨 표시"
            description="지도 위에 동 이름과 초과율을 띄웁니다. 지도 모양 자체를 보고 싶을 때 끄면 됩니다."
          >
            <Segmented
              value={settings.showMapLabels ? 'on' : 'off'}
              options={[
                { key: 'on', label: '표시' },
                { key: 'off', label: '숨김' },
              ]}
              onChange={(v) => set('showMapLabels', v === 'on')}
            />
          </Row>
        </div>
      </Panel>

      <Panel className="px-6 py-5">
        <h2 className="text-[15px] font-semibold text-ink">기준 조건</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          기준일과 대상 지역은 이번 데모에서 고정입니다. 날짜 선택과 지역 추가는
          백엔드 연동 이후에 열립니다. 데이터 출처와 한계는{' '}
          <span className="text-ink">데이터 정보</span> 화면에 정리해 두었습니다.
        </p>
      </Panel>
    </div>
  )
}
