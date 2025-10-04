import { Suspense } from "react";
import Link from "next/link";
import { EventFilters } from "@/components/event-filters";
import { EventCard } from "@/components/event-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Event, Weather } from "@/lib/api-client";
import { formatDateRange } from "@/lib/utils";

type EventsSectionProps = {
  enrichedEvents: Array<{ event: Event; weather: Weather | null }>;
  searchValue?: string;
  selectedDistrict?: string;
  selectedFee?: string;
  selectedCategory?: string;
  availableDistricts: string[];
  availableFeeOptions: string[];
  availableCategories: string[];
  preservedFilterParams: Record<string, string[]>;
  hasActiveFilters: boolean;
  pagination: {
    page: number;
    totalPages: number;
    hasPrev: boolean;
    hasNext: boolean;
    buildPageLink: (targetPage: number) => { pathname: string; query: Record<string, string | string[]> };
  };
};

export function EventsSection({
  enrichedEvents,
  searchValue,
  selectedDistrict,
  selectedFee,
  selectedCategory,
  availableDistricts,
  availableFeeOptions,
  availableCategories,
  preservedFilterParams,
  hasActiveFilters,
  pagination,
}: EventsSectionProps) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3 mt-8 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/70">
          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            서울의 전체 행사
          </h2>
          <p className="text-sm text-muted-foreground">검색과 필터로 원하는 문화 행사를 찾아보세요</p>
        </div>
      </div>
      
      <Suspense fallback={<div className="h-20 bg-muted/20 rounded-2xl animate-pulse" />}>
        <EventFilters
          initialSearch={searchValue}
          initialDistrict={selectedDistrict}
          initialFee={selectedFee}
          initialCategory={selectedCategory}
          districts={availableDistricts}
          feeOptions={availableFeeOptions}
          categories={availableCategories}
          preservedParams={preservedFilterParams}
        />
      </Suspense>

      {enrichedEvents.length === 0 ? (
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
            {enrichedEvents.map(({ event, weather }) => (
              <EventCard 
                key={event.id} 
                event={event} 
                weather={weather} 
                dateRange={formatDateRange(event)} 
              />
            ))}
          </div>
          {(pagination.hasPrev || pagination.hasNext) && (
            <nav className="flex items-center justify-between pt-6" aria-label="이벤트 페이지 네비게이션">
              {pagination.hasPrev ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={pagination.buildPageLink(pagination.page - 1)}>이전</Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  이전
                </Button>
              )}
              <span className="text-sm text-muted-foreground">
                {pagination.page} / {pagination.totalPages} 페이지
              </span>
              {pagination.hasNext ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={pagination.buildPageLink(pagination.page + 1)}>다음</Link>
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
  );
}