import { HeroSection } from "@/components/hero-section";
import { EventsSection } from "@/components/events-section";
import { StatsSection } from "@/components/stats-section";
import { Card, CardContent } from "@/components/ui/card";
import {
  parseSearchParams,
  buildPaginationData,
  fetchEventData,
} from "@/lib/server-utils";

export const revalidate = 300; // Revalidate data every 5 minutes while keeping ISR benefits

const PAGE_SIZE = 12;



export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const today = new Date().toISOString().split("T")[0];
  
  // 검색 파라미터 파싱
  const filters = parseSearchParams(resolvedSearchParams);
  
  const resolvePageParam = (params?: Record<string, string | string[] | undefined>): number => {
    const value = params?.page;
    const raw = Array.isArray(value) ? value[0] : value;
    if (typeof raw !== "string") {
      return 1;
    }
    const parsed = Number.parseInt(raw.trim(), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  };

  const currentPage = resolvePageParam(resolvedSearchParams ?? {});
  const preferUpcoming = currentPage === 1;

  const eventData = await fetchEventData(
    filters.baseFilters,
    PAGE_SIZE,
    currentPage,
    today,
    preferUpcoming
  );

  const pagination = buildPaginationData(PAGE_SIZE, eventData.filteredTotal, resolvedSearchParams);







  return (
    <div className="pt-8 pb-16">
      {(() => {
        const viewParam = resolvedSearchParams?.view;
        if (viewParam === "stats") {
          return (
            <div className="container max-w-6xl space-y-8 px-6">
              <StatsSection analytics={eventData.analytics} />
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
            <HeroSection events={eventData.upcomingEvents} />
            <EventsSection
              enrichedEvents={eventData.enrichedEvents}
              searchValue={filters.searchValue}
              selectedDistrict={filters.selectedDistrict}
              selectedFee={filters.selectedFee}
              selectedCategory={filters.selectedCategory}
              availableDistricts={eventData.availableDistricts}
              availableFeeOptions={eventData.availableFeeOptions}
              availableCategories={eventData.availableCategories}
              preservedFilterParams={filters.preservedFilterParams}
              hasActiveFilters={filters.hasActiveFilters}
              pagination={pagination}
            />
          </div>
        );
      })()}
    </div>
  );
}
