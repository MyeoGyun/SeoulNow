import { InfoTabs } from "@/components/info-tabs";

type StatsSectionProps = {
  summaryTotal: number;
  districtCount: number;
  useUpcomingFilter: boolean;
  freeEventsCount: number;
  paidOrUnknownCount: number;
  availableDistricts: string[];
  popularDistricts: string[];
  locationsCount: number;
};

export function StatsSection({
  summaryTotal,
  districtCount,
  useUpcomingFilter,
  freeEventsCount,
  paidOrUnknownCount,
  availableDistricts,
  popularDistricts,
  locationsCount,
}: StatsSectionProps) {
  const summaryHighlights = (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">총 행사</p>
        <p className="mt-2 text-3xl font-semibold text-foreground">{summaryTotal.toLocaleString()}건</p>
        <p className="mt-2 text-xs text-muted-foreground">
          서울 열린데이터 광장 기준, {useUpcomingFilter ? "오늘 이후" : "전체"} 일정 기준입니다.
        </p>
      </div>
      <div className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">참여 자치구</p>
        <p className="mt-2 text-3xl font-semibold text-foreground">{districtCount}곳</p>
        <p className="mt-2 text-xs text-muted-foreground">지도와 필터에서 확인할 수 있는 자치구 정보를 요약했어요.</p>
      </div>
    </div>
  );

  const statsTabs = [
    {
      id: "summary",
      label: "데이터 요약",
      description: `서울 열린데이터 광장에서 수집한 최신 행사 정보를 ${
        useUpcomingFilter ? "오늘 이후 일정 중심" : "전체 일정 기준"
      }으로 정리했어요.`,
      metrics: [
        {
          label: "총 행사",
          value: `${summaryTotal.toLocaleString()}건`,
          hint: useUpcomingFilter ? "오늘 이후 일정 기준" : "전체 일정 기준",
        },
        {
          label: "지도에 표시된 일정",
          value: `${locationsCount.toLocaleString()}건`,
          hint: "위치 좌표를 포함한 데이터",
        },
      ],
      footnote: undefined,
    },
    {
      id: "type",
      label: "요금 유형",
      description: "행사 요금 정보를 기준으로 무료/유료 비중을 살펴볼 수 있어요.",
      metrics: [
        {
          label: "무료",
          value: `${freeEventsCount.toLocaleString()}건`,
          hint: "데이터에 '무료'로 표기된 행사",
        },
        {
          label: "유료/기타",
          value: `${paidOrUnknownCount.toLocaleString()}건`,
          hint: "입장료 정보가 있거나 미확인 행사",
        },
      ],
    },
    {
      id: "area",
      label: "지역 통계",
      description: "어느 자치구에서 문화 행사가 활발한지 확인해 보세요.",
      metrics: [
        {
          label: "참여 자치구",
          value: `${districtCount}곳`,
          hint: "현재 데이터 기준",
        },
        {
          label: "필터 가능 지역",
          value: `${availableDistricts.length}곳`,
          hint: "검색 드롭다운에 표시되는 자치구",
        },
      ],
      items:
        popularDistricts.length > 0
          ? [`주요 지역: ${popularDistricts.join(" · ")}`, `필터 기준: ${useUpcomingFilter ? "오늘 이후 일정" : "전체 일정"}`]
          : [`필터 기준: ${useUpcomingFilter ? "오늘 이후 일정" : "전체 일정"}`],
    },
  ];

  return (
    <section className="space-y-6">
      {summaryHighlights}
      <InfoTabs tabs={statsTabs} />
    </section>
  );
}