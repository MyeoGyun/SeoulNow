import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
type BasicEventLike = {
  guname?: string | null;
  is_free?: string | null;
  codename?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  date?: string | null;
};

import type { Event } from "@/lib/api-client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatter = new Intl.DateTimeFormat("ko", {
  month: "short",
  day: "numeric",
});

export function formatDateRange(event: Event): string {
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

export function getThisWeekEvents(events: Event[]): Event[] {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // 일요일
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // 토요일
  endOfWeek.setHours(23, 59, 59, 999);
  
  return events.filter(event => {
    if (!event.start_date) return false;
    
    const eventDate = new Date(event.start_date);
    return eventDate >= startOfWeek && eventDate <= endOfWeek;
  });
}

export function calculateAvailableOptions<T extends BasicEventLike>(events: T[]) {
  const districts = Array.from(
    new Set(
      events
        .map((event) => event.guname)
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b, "ko"));

  const feeOptions = Array.from(
    new Set(
      events
        .map((event) => event.is_free)
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b, "ko"));

  const categories = Array.from(
    new Set(
      events
        .map((event) => event.codename)
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b, "ko"));

  return { districts, feeOptions, categories };
}

export function calculateStatistics<T extends BasicEventLike>(events: T[]) {
  const freeEventsCount = events.filter((item) => {
    if (!item.is_free) return false;
    const normalized = item.is_free.trim().toLowerCase();
    if (normalized.length === 0) return false;
    return normalized.includes("무료") || normalized.includes("free") || normalized === "y";
  }).length;

  const paidOrUnknownCount = Math.max(events.length - freeEventsCount, 0);
  
  const { districts } = calculateAvailableOptions(events);
  const districtCount = districts.length;
  const popularDistricts = districts.slice(0, 6);

  return {
    freeEventsCount,
    paidOrUnknownCount,
    districtCount,
    popularDistricts,
  };
}
