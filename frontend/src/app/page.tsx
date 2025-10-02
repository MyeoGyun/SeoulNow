import Link from "next/link";

import { EventFilters } from "@/components/event-filters";
import { InfoTabs } from "@/components/info-tabs";
import { EventCard } from "@/components/event-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  fetchEventLocations,
  fetchEventWithWeather,
  fetchEvents,
  type EventQueryParams,
  type Event,
} from "@/lib/api-client";

export const revalidate = 300; // Revalidate data every 5 minutes while keeping ISR benefits

const PAGE_SIZE = 12;

const formatter = new Intl.DateTimeFormat("ko", {
  month: "short",
  day: "numeric",
});

function formatDateRange(event: Event) {
  const start = event.start_date ? new Date(event.start_date) : null;
  const end = event.end_date ? new Date(event.end_date) : null;

  if (!start && !end) {
    return event.date ?? "일정 정보 없음";
  }

  if (start && end) {
    if (start.toDateString() === end.toDateString()) {
      return formatter.format(start);
    }
    return `${formatter.format(start)} - ${formatter.format(end)}`;
  }

  if (start) {
    return `${formatter.format(start)} 이후`;
  }

  return `${formatter.format(end!)} 까지`;
}



export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const today = new Date().toISOString().split("T")[0];
  const getParam = (key: string) => {
    const value = resolvedSearchParams?.[key];
    if (Array.isArray(value)) {
      const first = value[0];
      if (typeof first !== "string") {
        return undefined;
      }
      const trimmed = first.trim();
      return trimmed === "" ? undefined : trimmed;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed === "" ? undefined : trimmed;
    }
    return undefined;
  };

  const pageParam = getParam("page");

  let page = Number.parseInt(pageParam ?? "1", 10);
  if (!Number.isFinite(page) || page < 1) {
    page = 1;
  }

  let offset = (page - 1) * PAGE_SIZE;
  let useUpcomingFilter = true;

  let summaryEventsResponse = await fetchEvents({ limit: 1, start_after: today });
  if (summaryEventsResponse.items.length === 0) {
    summaryEventsResponse = await fetchEvents({ limit: 1 });
  }

  let summaryLocations = await fetchEventLocations({ limit: 2000, start_after: today });
  if (summaryLocations.length === 0) {
    summaryLocations = await fetchEventLocations({ limit: 2000 });
  }

  const availableDistricts = Array.from(
    new Set(
      summaryLocations
        .map((event) => event.guname)
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b, "ko"));

  const availableFeeOptions = Array.from(
    new Set(
      summaryLocations
        .map((event) => event.is_free)
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b, "ko"));

  const summaryTotal = summaryEventsResponse.total;

  const searchValue = getParam("search");
  const selectedDistrict = getParam("guname");
  const selectedFee = getParam("is_free");

  const baseFilters: EventQueryParams = {};
  if (searchValue) {
    baseFilters.search = searchValue;
  }
  if (selectedDistrict) {
    baseFilters.guname = selectedDistrict;
  }
  if (selectedFee) {
    baseFilters.is_free = selectedFee;
  }

  let eventsResponse = await fetchEvents({
    ...baseFilters,
    limit: PAGE_SIZE,
    offset,
    start_after: today,
  });

  if (page === 1 && eventsResponse.items.length === 0) {
    useUpcomingFilter = false;
    eventsResponse = await fetchEvents({
      ...baseFilters,
      limit: PAGE_SIZE,
      offset,
    });
  }

  if (eventsResponse.items.length === 0 && eventsResponse.total > 0 && offset >= eventsResponse.total) {
    const lastPage = Math.max(1, Math.ceil(eventsResponse.total / PAGE_SIZE));
    page = lastPage;
    offset = (page - 1) * PAGE_SIZE;
    const params: EventQueryParams = { ...baseFilters, limit: PAGE_SIZE, offset };
    if (useUpcomingFilter) {
      params.start_after = today;
    }
    eventsResponse = await fetchEvents(params);
  }

  const events = eventsResponse.items;
  const filteredTotal = eventsResponse.total;
  const totalPages = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const locationBaseFilters: EventQueryParams = { ...baseFilters, limit: 2000 };
  const locationParams = useUpcomingFilter
    ? { ...locationBaseFilters, start_after: today }
    : locationBaseFilters;
  let locations = await fetchEventLocations(locationParams);
  if (locations.length === 0 && useUpcomingFilter) {
    locations = await fetchEventLocations(locationBaseFilters);
  }

  const freeEventsCount = summaryLocations.filter((item) => {
    if (!item.is_free) {
      return false;
    }
    const normalized = item.is_free.trim().toLowerCase();
    if (normalized.length === 0) {
      return false;
    }
    return normalized.includes("무료") || normalized.includes("free") || normalized === "y";
  }).length;
  const paidOrUnknownCount = Math.max(summaryLocations.length - freeEventsCount, 0);
  const districtCount = availableDistricts.length;
  const popularDistricts = availableDistricts.slice(0, 6);

  const enriched = await Promise.all(
    events.map(async (event) => {
      const result = await fetchEventWithWeather(event.id, event.guname ?? undefined);
      return { event, weather: result?.weather ?? null };
    })
  );
  const hasActiveFilters = Boolean(searchValue || selectedDistrict || selectedFee);
  const preservedFilterParams = Object.entries(resolvedSearchParams ?? {}).reduce(
    (acc, [key, value]) => {
      if (["search", "guname", "is_free", "page"].includes(key)) {
        return acc;
      }
      const values: string[] = Array.isArray(value)
        ? value.filter((val): val is string => typeof val === "string" && val.length > 0)
        : typeof value === "string" && value.length > 0
        ? [value]
        : [];
      if (values.length > 0) {
        acc[key] = values;
      }
      return acc;
    },
    {} as Record<string, string[]>,
  );
  const baseQuery: Record<string, string | string[]> = {};

  Object.entries(resolvedSearchParams ?? {}).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }
    baseQuery[key] = Array.isArray(value) ? [...value] : value;
  });

  const buildPageLink = (targetPage: number) => {
    const query: Record<string, string | string[]> = {};
    Object.entries(baseQuery).forEach(([key, value]) => {
      query[key] = Array.isArray(value) ? [...value] : value;
    });

    if (targetPage <= 1) {
      delete query.page;
    } else {
      query.page = targetPage.toString();
    }

    return { pathname: "/", query } as const;
  };

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
          value: `${locations.length.toLocaleString()}건`,
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

  const exploreTabContent = (
    <>
      <section className="space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-2xl font-semibold text-foreground">다가오는 행사</h2>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-secondary px-3 py-1">
              {filteredTotal.toLocaleString()}개의 최신 데이터
            </span>
            <span className="rounded-full bg-secondary px-3 py-1">{districtCount}개 자치구</span>
          </div>
        </div>
        <EventFilters
          initialSearch={searchValue}
          initialDistrict={selectedDistrict}
          initialFee={selectedFee}
          districts={availableDistricts}
          feeOptions={availableFeeOptions}
          preservedParams={preservedFilterParams}
        />
        {enriched.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              {hasActiveFilters
                ? "조건에 맞는 행사가 없습니다. 검색어나 필터를 조정해 보세요."
                : "곧 있을 행사가 없습니다. 데이터 동기화를 다시 시도하거나 다른 날짜로 검색해 보세요."}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {enriched.map(({ event, weather }) => (
                <EventCard key={event.id} event={event} weather={weather} dateRange={formatDateRange(event)} />
              ))}
            </div>
            {(hasPrev || hasNext) && (
              <nav className="flex items-center justify-between pt-6" aria-label="이벤트 페이지 네비게이션">
                {hasPrev ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={buildPageLink(page - 1)}>이전</Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    이전
                  </Button>
                )}
                <span className="text-sm text-muted-foreground">
                  {page} / {totalPages} 페이지
                </span>
                {hasNext ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={buildPageLink(page + 1)}>다음</Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    다음
                  </Button>
                )}
              </nav>
            )}
          </>
        )}
      </section>
    </>
  );

  const statsTabContent = (
    <section className="space-y-6">
      {summaryHighlights}
      <InfoTabs tabs={statsTabs} />
    </section>
  );



  return (
    <div className="pt-8 pb-16">
      {(() => {
        const viewParam = resolvedSearchParams?.view;
        if (viewParam === "stats") {
          return (
            <div className="container max-w-6xl space-y-8 px-6">
              {statsTabContent}
            </div>
          );
        }
        if (viewParam === "calendar") {
          return (
            <div className="container max-w-6xl space-y-8 px-6">
              <section className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-foreground">일정 캘린더</h2>
                  <p className="text-sm text-muted-foreground mt-2">캘린더 뷰는 곧 업데이트될 예정입니다.</p>
                </div>
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    캘린더 기능을 준비 중입니다.
                  </CardContent>
                </Card>
              </section>
            </div>
          );
        }
        return (
          <div className="container max-w-6xl space-y-8 px-6">
            {exploreTabContent}
          </div>
        );
      })()}
    </div>
  );
}
