import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";

import { EventMapClient } from "@/components/event-map.client";
import { EventFilters } from "@/components/event-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  fetchEventLocations,
  fetchEventWithWeather,
  fetchEvents,
  type EventQueryParams,
  type Event,
  type Weather,
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

function WeatherSummary({ weather }: { weather: Weather | null }) {
  if (!weather) {
    return (
      <p className="text-sm text-muted-foreground">해당 날짜의 날씨 데이터가 아직 없습니다.</p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground sm:text-sm">
      <div className="rounded-md bg-primary/5 px-2 py-1 text-center">
        <span className="block font-medium text-primary">
          {weather.temp !== null && weather.temp !== undefined
            ? `${weather.temp.toFixed(1)}℃`
            : "-"}
        </span>
        <span>기온</span>
      </div>
      <div className="rounded-md bg-primary/5 px-2 py-1 text-center">
        <span className="block font-medium text-primary">
          {weather.rain_prob !== null && weather.rain_prob !== undefined
            ? `${weather.rain_prob}%`
            : "-"}
        </span>
        <span>강수 확률</span>
      </div>
      <div className="rounded-md bg-primary/5 px-2 py-1 text-center">
        <span className="block font-medium text-primary">
          {weather.pm10 !== null && weather.pm10 !== undefined ? `${weather.pm10}` : "-"}
        </span>
        <span>미세먼지</span>
      </div>
    </div>
  );
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

  const enriched = await Promise.all(
    events.map(async (event) => {
      const result = await fetchEventWithWeather(event.id, event.guname ?? undefined);
      return { event, weather: result?.weather ?? null };
    })
  );

  const districtCount = availableDistricts.length;
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

  return (
    <div className="space-y-16 pb-16">
      <section className="relative mx-auto mt-10 w-full max-w-6xl overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-background to-background p-8 md:p-12">
        <div className="grid items-center gap-10 md:grid-cols-[1.15fr,0.85fr]">
          <div className="space-y-6">
            <Badge variant="secondary" className="w-fit border border-primary/20 bg-primary/5 text-primary">
              서울 문화 라이프 대시보드
            </Badge>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-tight text-foreground md:text-5xl">
                서울에서 즐길 수 있는 모든 순간을 한눈에
              </h1>
              <p className="max-w-xl text-base text-muted-foreground md:text-lg">
                전시, 공연, 축제부터 날씨 정보까지
                바쁜 일정 속에서도 가장 알찬 서울 라이프를 즐겨보세요.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <a href="#map" className="inline-flex items-center">
                  지도로 둘러보기
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="ghost" asChild>
                <a
                  href="https://data.seoul.go.kr/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center"
                >
                  서울 열린데이터 살펴보기
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
          <div className="relative h-[16.25rem] rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 md:h-full">
            <div className="absolute inset-0 -z-10 rounded-3xl bg-[radial-gradient(circle_at_top,_rgba(0,82,204,0.25),_transparent_70%)]" />
            <div className="flex h-full flex-col justify-center gap-6 text-foreground">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">다가오는 이벤트 지표</h2>
                <p className="text-sm text-muted-foreground">
                  오늘 기준으로 수집된 데이터를 요약했습니다.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/60 bg-card/70 p-4">
                  <p className="text-sm text-muted-foreground">총 행사</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">
                    {summaryTotal.toLocaleString()}건
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    서울 열린데이터 광장 기준, 오늘 및 이후 일정만 추려서 제공 중입니다.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-card/70 p-4">
                  <p className="text-sm text-muted-foreground">총 행사 진행 자치구</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">{districtCount}곳</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    지도에서 관심 구역을 클릭하면 상세 정보와 외부 링크를 확인할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="map" className="container max-w-6xl space-y-6 px-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">서울 문화 지도</h2>
            <p className="text-sm text-muted-foreground">
              행사 위치를 지도로 탐색하고, 관심 있는 지역을 확대해 세부 정보를 살펴보세요.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="https://culture.seoul.go.kr/" target="_blank" rel="noreferrer">
              서울문화포털 바로가기
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
        <Card className="overflow-hidden border-border bg-card/70 backdrop-blur">
          <CardContent className="p-0">
            <EventMapClient
              events={locations}
              preservedParams={preservedFilterParams}
              searchValue={searchValue ?? null}
              selectedFee={selectedFee ?? null}
              selectedDistrict={selectedDistrict ?? null}
            />
          </CardContent>
        </Card>
      </section>

      <section className="container max-w-6xl space-y-6 px-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">놓치기 아까운 오늘의 추천</h2>
            <p className="text-sm text-muted-foreground">
              지금 예약하면 좋은 전시·공연·축제를 골라봤어요. 날씨 정보까지 함께 확인해 보세요.
            </p>
          </div>
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
              {enriched.map(({ event, weather }) => {
                const eventUrl = event.hmpg_addr ?? event.org_link ?? "#";
                const isExternal = eventUrl.startsWith("http");

                return (
                  <Card
                  key={event.id}
                  className="group h-full overflow-hidden border-border bg-card/80 transition duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
                >
                  <a
                    href={eventUrl}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noreferrer" : undefined}
                    className="flex h-full flex-col"
                  >
                    <CardHeader className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {event.codename && (
                          <Badge variant="secondary" className="bg-primary/10 text-primary">
                            {event.codename}
                          </Badge>
                        )}
                        {event.is_free && (
                          <Badge variant="outline" className="border-primary/30 text-primary">
                            {event.is_free}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl leading-snug group-hover:text-primary">
                        {event.title}
                      </CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-4 w-4" />
                          {formatDateRange(event)}
                        </span>
                        {event.place && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {event.place}
                          </span>
                        )}
                      </CardDescription>
                    </CardHeader>
                    {event.main_img && (
                      <div className="relative mx-6 aspect-[4/3] overflow-hidden rounded-2xl border border-border">
                        <Image
                          src={event.main_img}
                          alt={event.title}
                          fill
                          sizes="(max-width: 48rem) 100vw, 25rem"
                          loading="lazy"
                          className="object-cover transition duration-500 group-hover:scale-[1.03]"
                        />
                      </div>
                    )}
                    <CardContent className="space-y-4">
                      {event.guname && (
                        <p className="text-sm text-muted-foreground">{event.guname}에서 열리는 행사</p>
                      )}
                      <WeatherSummary weather={weather} />
                    </CardContent>
                    <CardFooter className="mt-auto flex items-center justify-between border-t border-border/70 bg-card/80 px-6 py-4 text-sm text-muted-foreground">
                      <span>상세 페이지로 이동</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </CardFooter>
                  </a>
                </Card>
              );
              })}
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
    </div>
  );
}
