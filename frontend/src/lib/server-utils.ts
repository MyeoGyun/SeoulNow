import "server-only";

import {
  fetchEventLocations,
  fetchEventWithWeather,
  fetchEvents,
  type EventQueryParams,
} from "@/lib/api-client";
import { calculateStatistics } from "@/lib/utils";

type SearchParams = Record<string, string | string[] | undefined>;

// 검색 파라미터 파싱 유틸리티
export function parseSearchParams(searchParams?: SearchParams) {
  const getParam = (key: string): string | undefined => {
    const value = searchParams?.[key];
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

  const searchValue = getParam("search");
  const selectedDistrict = getParam("guname");
  const selectedFee = getParam("is_free");
  const selectedCategory = getParam("codename");

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
  if (selectedCategory) {
    baseFilters.codename = selectedCategory;
  }

  const hasActiveFilters = Boolean(
    searchValue || selectedDistrict || selectedFee || selectedCategory
  );

  const preservedFilterParams = Object.entries(searchParams ?? {}).reduce(
    (acc, [key, value]) => {
      if (["search", "guname", "is_free", "codename", "page"].includes(key)) {
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
    {} as Record<string, string[]>
  );

  return {
    searchValue,
    selectedDistrict,
    selectedFee,
    selectedCategory,
    baseFilters,
    hasActiveFilters,
    preservedFilterParams,
  };
}

// 페이지네이션 데이터 생성 유틸리티
export function buildPaginationData(
  pageSize: number,
  filteredTotal: number,
  searchParams?: SearchParams
) {
  const getParam = (key: string): string | undefined => {
    const value = searchParams?.[key];
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

  const totalPages = Math.max(1, Math.ceil(filteredTotal / pageSize));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const baseQuery: Record<string, string | string[]> = {};
  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
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

  return {
    page,
    totalPages,
    hasPrev,
    hasNext,
    buildPageLink,
  };
}

// 이벤트 데이터 페칭 및 처리
export async function fetchEventData(
  baseFilters: EventQueryParams,
  pageSize: number,
  page: number,
  today: string,
  preferUpcoming: boolean
) {
  let useUpcomingFilter = preferUpcoming;
  const offset = (page - 1) * pageSize;

  // 캐러셀용: 더 넓은 범위로 행사 가져오기
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 13);
  const endDateString = endDate.toISOString().split('T')[0];
  
  let summaryEventsResponse = await fetchEvents({
    start_after: today,
    end_before: endDateString,
  });
  if (summaryEventsResponse.items.length === 0) {
    summaryEventsResponse = await fetchEvents({});
  }

  let summaryLocations = await fetchEventLocations({ limit: 2000, start_after: today });
  if (summaryLocations.length === 0) {
    summaryLocations = await fetchEventLocations({ limit: 2000 });
  }

  // 사용 가능한 옵션들 계산
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

  const availableCategories = Array.from(
    new Set(
      summaryLocations
        .map((event) => event.codename)
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b, "ko"));

  const toUtcStartOfDay = (value: string | null | undefined): number | null => {
    if (!value) {
      return null;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  };

  const todayDate = new Date(today);
  const todayUtc = Date.UTC(
    todayDate.getUTCFullYear(),
    todayDate.getUTCMonth(),
    todayDate.getUTCDate()
  );
  const endUtc = Date.UTC(
    endDate.getUTCFullYear(),
    endDate.getUTCMonth(),
    endDate.getUTCDate()
  );

  const upcomingEvents = summaryEventsResponse.items.filter((event) => {
    const eventUtc = toUtcStartOfDay(event.start_date);
    if (eventUtc === null) {
      return false;
    }
    return eventUtc >= todayUtc && eventUtc <= endUtc;
  });

  // 필터링된 이벤트 가져오기
  const initialParams: EventQueryParams = {
    ...baseFilters,
    limit: pageSize,
    offset,
  };
  if (useUpcomingFilter) {
    initialParams.start_after = today;
  }

  let eventsResponse = await fetchEvents(initialParams);

  if (eventsResponse.items.length === 0) {
    useUpcomingFilter = false;
    eventsResponse = await fetchEvents({
      ...baseFilters,
      limit: pageSize,
      offset,
    });
  }

  // 페이지가 범위를 벗어난 경우 처리
  if (eventsResponse.items.length === 0 && eventsResponse.total > 0 && offset >= eventsResponse.total) {
    const lastPage = Math.max(1, Math.ceil(eventsResponse.total / pageSize));
    const newOffset = (lastPage - 1) * pageSize;
    const params: EventQueryParams = { ...baseFilters, limit: pageSize, offset: newOffset };
    if (useUpcomingFilter) {
      params.start_after = today;
    }
    eventsResponse = await fetchEvents(params);
  }

  const events = eventsResponse.items;
  const filteredTotal = eventsResponse.total;

  // 위치 정보가 있는 이벤트들 가져오기
  const locationBaseFilters: EventQueryParams = { ...baseFilters, limit: 2000 };
  const locationParams = useUpcomingFilter
    ? { ...locationBaseFilters, start_after: today }
    : locationBaseFilters;
  let locations = await fetchEventLocations(locationParams);
  if (locations.length === 0 && useUpcomingFilter) {
    locations = await fetchEventLocations(locationBaseFilters);
  }

  // 통계 계산
  const statistics = calculateStatistics(summaryLocations);

  // 날씨 정보와 함께 이벤트 enrichment
  const enrichedEvents = await Promise.all(
    events.map(async (event) => {
      const result = await fetchEventWithWeather(event.id, event.guname ?? undefined);
      return { event, weather: result?.weather ?? null };
    })
  );

  return {
    summaryEventsResponse,
    summaryLocations,
    events,
    enrichedEvents,
    locations,
    statistics,
    upcomingEvents,
    availableDistricts,
    availableFeeOptions,
    availableCategories,
    filteredTotal,
    useUpcomingFilter,
  };
}
