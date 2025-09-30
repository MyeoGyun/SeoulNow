'use client';

import dynamic from 'next/dynamic';
import type { EventLocation } from '@/lib/api-client';

const LeafletMap = dynamic(() => import('./event-map').then((mod) => mod.EventMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-[360px] items-center justify-center rounded-2xl border border-dashed border-border bg-card text-sm text-muted-foreground">
      지도를 불러오는 중...
    </div>
  ),
});

interface EventMapClientProps {
  events: EventLocation[];
  preservedParams: Record<string, string[]>;
  searchValue?: string | null;
  selectedFee?: string | null;
  selectedDistrict?: string | null;
}

export function EventMapClient({
  events,
  preservedParams,
  searchValue,
  selectedFee,
  selectedDistrict,
}: EventMapClientProps) {
  return (
    <LeafletMap
      events={events}
      preservedParams={preservedParams}
      searchValue={searchValue}
      selectedFee={selectedFee}
      selectedDistrict={selectedDistrict}
    />
  );
}
