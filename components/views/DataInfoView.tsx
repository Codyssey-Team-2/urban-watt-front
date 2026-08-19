'use client'

import { Panel } from '@/components/layout/Panel'
import { DISTRICTS, DEMO_DATE } from '@/lib/mock'

const SOURCES = [
  {
    name: 'S-DoT 도시데이터 센서',
    org: '서울 열린데이터광장',
    detail: '법정동 단위 기온·습도·풍속 실측. 이 프로젝트의 미기후 입력.',
  },
  {
    name: 'ASOS 종관기상관측',
    org: '기상청',
    detail: '서울 대표 관측소 기온. 비교군(기상만) 모델의 입력.',
  },
  {
    name: '시간대별 전력사용량',
    org: '한국전력공사',
    detail: '법정동 단위 시간대별 수요. 학습·검증 대상.',
  },
  {
    name: '토지피복지도',
    org: '환경부',
    detail: '식생피복률·불투수피복률. 도시공간 변수로 사용.',
  },
  {
    name: '서울시 행정경계',
    org: 'southkorea/seoul-maps',
    detail:
      '자치구 25개와 법정동 경계(2015년, 도로명주소 기반). 단순화해 앱에 포함.',
  },
  {
    name: '한강 수역',
    org: 'OpenStreetMap 기여자 · ODbL',
    detail:
      '지도 배경의 한강 형상. 서울 경계로 잘라 단순화했습니다. © OpenStreetMap contributors.',
  },
]

/** 화면 상단 토글이 오가는 두 가지. 존재하지 않는 모델은 표에 싣지 않는다. */
const MODELS = [
  {
    name: '기상만',
    input: '달력 · 과거 부하 패턴 + 서울 대표 기상(ASOS)',
    note: '두 지역에 같은 관측값이 적용됩니다.',
  },
  {
    name: '미기후 반영',
    input: '위 항목 + S-DoT 실측 기온 · 토지피복 기반 도시공간 변수',
    note: '지역별 실측 미기후가 반영됩니다.',
  },
]

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <Panel className="px-6 py-5">
      <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
      <div className="mt-4">{children}</div>
    </Panel>
  )
}

/** 데이터 출처와 모델 정의, 그리고 한계를 밝히는 화면. */
export function DataInfoView() {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-y-auto pr-1">
      {/* 데모 데이터라는 사실을 화면에서 숨기지 않는다. */}
      <Panel tone="danger" className="px-6 py-4">
        <div className="text-[15px] font-semibold text-danger-text-dark">
          현재 화면의 수치는 목데이터입니다
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">
          아래 출처는 실제 연동 예정 데이터셋이며, 지금 표시되는 값은 시연용으로
          구성한 것입니다. 법정동 경계도 실제 경계가 아닌 근사 도형입니다.
        </p>
      </Panel>

      <Section title="데이터 출처">
        <ul className="flex flex-col gap-3">
          {SOURCES.map((s) => (
            <li
              key={s.name}
              className="flex gap-4 border-b border-hair pb-3 last:border-0 last:pb-0"
            >
              <div className="w-[200px] flex-none">
                <div className="text-[15px] text-ink">{s.name}</div>
                <div className="text-[13px] text-faint">{s.org}</div>
              </div>
              <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-muted">
                {s.detail}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="예측 구성">
        <ul className="flex flex-col gap-3">
          {MODELS.map((m) => (
            <li
              key={m.name}
              className="flex gap-4 border-b border-hair pb-3 last:border-0 last:pb-0"
            >
              <div className="w-[120px] flex-none text-[15px] text-ink">
                {m.name}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] leading-relaxed text-muted">
                  {m.input}
                </p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-faint">
                  {m.note}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="대상 지역">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-hair text-[13px] text-faint">
              <th className="pb-2 font-normal">법정동</th>
              <th className="pb-2 text-right font-normal">식생피복률</th>
              <th className="pb-2 text-right font-normal">불투수피복률</th>
              <th className="pb-2 text-right font-normal">냉방 균형점</th>
              <th className="pb-2 text-right font-normal">수요 기울기</th>
            </tr>
          </thead>
          <tbody>
            {DISTRICTS.map((d) => {
              const m = d.microclimate
              const urban = d.variant === 'urban'
              return (
                <tr key={d.code} className="border-b border-hair last:border-0">
                  <td className="py-2.5">
                    <span className="flex items-center gap-2 text-[15px] text-ink">
                      <span
                        aria-hidden
                        className={`inline-block size-2 rounded-full ${urban ? 'bg-urban' : 'bg-cool'}`}
                      />
                      {d.name}
                    </span>
                    <span className="tnum text-[13px] text-faint">{d.code}</span>
                  </td>
                  <td className="tnum py-2.5 text-right text-[15px]">
                    {m.vegetationRate}%
                  </td>
                  <td className="tnum py-2.5 text-right text-[15px]">
                    {m.imperviousRate}%
                  </td>
                  <td className="tnum py-2.5 text-right text-[15px]">
                    {m.balancePoint.toFixed(1)}°C
                  </td>
                  <td
                    className={`tnum py-2.5 text-right text-[15px] ${urban ? 'font-semibold text-urban-text' : ''}`}
                  >
                    {m.coolingSlope.toFixed(1)}×
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Section>

      <Section title="해석상 한계">
        <ul className="flex flex-col gap-2 text-[13px] leading-relaxed text-muted">
          <li>
            · 기준일이 {DEMO_DATE} 단일 폭염일입니다. 계절 전체로 일반화하기에는
            표본이 부족합니다.
          </li>
          <li>
            · 두 개 법정동만 비교했습니다. 지역 특성이 다른 동에서 같은 크기의
            개선이 나온다고 보장할 수 없습니다.
          </li>
          <li>
            · 냉방 균형점과 기울기는 관측 기간 내 회귀 결과이며, 건물 용도 구성이
            바뀌면 함께 변합니다.
          </li>
          <li>
            · 지도 채색은 절대 전력량이 아니라 평시 대비 초과율입니다. 수요가 큰
            지역이 곧 위험한 지역은 아닙니다.
          </li>
          <li>
            · 원본 데이터는 정시 단위입니다. 시간대 재생 중 정시 사이에 표시되는
            값은 앞뒤 정시를 선형 보간한 것으로, 실측된 값이 아닙니다.
          </li>
        </ul>
      </Section>
    </div>
  )
}
