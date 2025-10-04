import "server-only";

const DEFAULT_API_BASE_URL = "http://localhost:8000/api";

const readEnv = (key: string): string | undefined => {
  if (typeof process === "undefined" || typeof process.env === "undefined") {
    return undefined;
  }

  // Access with bracket notation to keep runtime resolution even after bundling.
  const value = process.env[key];
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return undefined;
};

let cachedApiBaseUrl: string | null = null;

const resolveApiBaseUrl = (): string => {
  if (cachedApiBaseUrl) {
    return cachedApiBaseUrl;
  }

  const envValue =
    readEnv("NEXT_PUBLIC_API_BASE_URL") ?? readEnv("NEXT_PUBLIC_API_URL") ?? readEnv("API_BASE_URL");

  const rawBase = envValue ?? DEFAULT_API_BASE_URL;

  if (rawBase.startsWith("http://") || rawBase.startsWith("https://")) {
    cachedApiBaseUrl = rawBase.replace(/\/$/, "");
    return cachedApiBaseUrl;
  }

  const normalized = rawBase.startsWith("/") ? rawBase : `/${rawBase}`;
  cachedApiBaseUrl = normalized.replace(/\/$/, "");
  return cachedApiBaseUrl;
};

export type Event = {
  id: number;
  title: string;
  codename?: string | null;
  guname?: string | null;
  date?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  place?: string | null;
  org_name?: string | null;
  org_link?: string | null;
  hmpg_addr?: string | null;
  theme_code?: string | null;
  main_img?: string | null;
  use_fee?: string | null;
  ticket?: string | null;
  is_free?: string | null;
  lat?: number | null;
  lot?: number | null;
  created_at: string;
  updated_at: string;
};

export type Weather = {
  id: number;
  date: string;
  location: string;
  temp?: number | null;
  rain_prob?: number | null;
  pm10?: number | null;
};

export type EventWithWeather = {
  event: Event;
  weather?: Weather | null;
};

export type EventLocation = {
  id: number;
  title: string;
  lat: number;
  lot: number;
  guname?: string | null;
  codename?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_free?: string | null;
};

export type EventQueryParams = {
  guname?: string;
  codename?: string;
  is_free?: string;
  search?: string;
  start_after?: string;
  end_before?: string;
  limit?: number;
  offset?: number;
};

export type EventListResponse = {
  items: Event[];
  total: number;
  limit: number;
  offset: number;
};

async function request<T>(endpoint: string, init?: RequestInit, { revalidate = 300 }: { revalidate?: number } = {}): Promise<T> {
  const baseUrl = resolveApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    next: { revalidate },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

const toSearchParams = (params: Record<string, unknown> = {}): string => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    query.append(key, String(value));
  });

  const search = query.toString();
  return search ? `?${search}` : "";
};

export async function fetchEvents(params: EventQueryParams = {}): Promise<EventListResponse> {
  try {
    const search = toSearchParams(params);
    return await request<EventListResponse>(`/events/${search}`, undefined, { revalidate: 180 });
  } catch (error) {
    console.error("Failed to fetch events", error);
    const limit = typeof params.limit === "number" ? params.limit : 20;
    const offset = typeof params.offset === "number" ? params.offset : 0;
    return { items: [], total: 0, limit, offset };
  }
}

export async function fetchEventWithWeather(eventId: number, location?: string): Promise<EventWithWeather | null> {
  try {
    const search = toSearchParams(location ? { location } : {});
    return await request<EventWithWeather>(`/events/${eventId}/with-weather${search}`, undefined, {
      revalidate: 600,
    });
  } catch (error) {
    console.error(`Failed to fetch event with weather (id=${eventId})`, error);
    return null;
  }
}

export async function fetchEventLocations(params: EventQueryParams = {}): Promise<EventLocation[]> {
  try {
    const search = toSearchParams(params);
    return await request<EventLocation[]>(`/events/locations${search}`, undefined, { revalidate: 300 });
  } catch (error) {
    console.error("Failed to fetch event locations", error);
    return [];
  }
}
