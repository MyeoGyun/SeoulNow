import { EventCarousel } from "@/components/event-carousel";
import type { Event } from "@/lib/api-client";

type HeroSectionProps = {
  events: Event[];
};

export function HeroSection({ events }: HeroSectionProps) {
  const eventCount = events.length;
  const districtCount = new Set(
    events
      .map((event) => event.guname)
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
  ).size;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/70">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              다가오는 행사
            </h2>
            <p className="text-sm text-muted-foreground">앞으로 2주간의 다가오는 행사를 확인하세요</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-primary font-medium">
            {eventCount.toLocaleString()}개 행사
          </span>
          <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-primary font-medium">
            {districtCount.toLocaleString()}개 자치구
          </span>
        </div>
      </div>
      
      <EventCarousel events={events} />
    </section>
  );
}
