"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FavoriteButton } from "@/components/favorite-button";
import { ProxyImage } from "@/components/proxy-image";
import type { Event, Weather } from "@/lib/api-client";
import { CalendarDays, MapPin, Ticket } from "lucide-react";
import { parsePriceInfo, getSimplePriceDisplay } from "@/lib/price-utils";

import { WeatherSummary } from "@/components/weather-summary";

export type EventCardProps = {
  event: Event;
  weather: Weather | null;
  dateRange: string;
};

export function EventCard({ event, weather, dateRange }: EventCardProps) {
  // URL 처리 및 보안 개선
  let eventUrl = event.hmpg_addr ?? event.org_link ?? "#";
  const isExternal = eventUrl.startsWith("http");
  
  // SSL 문제가 있는 도메인들을 HTTP로 강제 변경
  const problematicDomains = ['culture.seoul.go.kr', 'data.seoul.go.kr'];
  if (isExternal) {
    try {
      const urlObj = new URL(eventUrl);
      if (problematicDomains.includes(urlObj.hostname) && urlObj.protocol === 'https:') {
        eventUrl = eventUrl.replace('https://', 'http://');
      }
    } catch (error) {
      // URL 파싱 실패 시 원본 URL 유지
      console.warn('Invalid URL:', eventUrl, error);
    }
  }
  
  // 가격 정보 파싱
  const priceInfo = parsePriceInfo(event.use_fee, event.ticket, event.is_free);
  const priceDisplay = getSimplePriceDisplay(priceInfo);
  
  // 디버깅 로그 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development' && Math.random() < 0.1) {
    console.log('EventCard price debug:', {
      title: event.title,
      use_fee: event.use_fee,
      ticket: event.ticket,
      is_free: event.is_free,
      priceInfo,
      priceDisplay
    });
  }

  const hasWeatherData =
    weather !== null && [weather.temp, weather.rain_prob, weather.pm10].some((value) => value !== null && value !== undefined);

  return (
    <Card className="group flex h-full flex-col overflow-hidden border-border bg-card/80 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl">
      <a href={eventUrl} target={isExternal ? "_blank" : undefined} rel={isExternal ? "noreferrer" : undefined} className="flex h-full flex-col">
        {event.main_img ? (
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/10">
            <ProxyImage
              src={event.main_img}
              alt={event.title}
              fill
              sizes="(max-width: 48rem) 100vw, 25rem"
              loading="lazy"
              className="object-contain p-4 transition duration-500 group-hover:scale-[1.02]"
            />
            {/* 즐겨찾기 버튼 */}
            <div className="absolute top-2 right-2">
              <FavoriteButton event={event} />
            </div>
          </div>
        ) : (
          <div className="relative flex aspect-[4/3] w-full items-center justify-center bg-muted/10 text-xs text-muted-foreground">
            이미지 준비 중
            {/* 즐겨찾기 버튼 */}
            <div className="absolute top-2 right-2">
              <FavoriteButton event={event} />
            </div>
          </div>
        )}
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {event.codename && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {event.codename}
                </Badge>
              )}
              <Badge 
                variant={priceInfo.isFree ? "outline" : "secondary"} 
                className={priceInfo.isFree 
                  ? "border-green-500/30 text-green-600 bg-green-50" 
                  : "border-blue-500/30 text-blue-600 bg-blue-50"
                }
              >
                {priceInfo.isFree ? "무료" : "유료"}
              </Badge>
            </div>
            {event.guname && (
              <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                {event.guname}
              </Badge>
            )}
          </div>
          <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
            {event.title}
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex max-w-full items-center gap-1 rounded-lg border border-border/60 bg-background/80 px-2 py-1">
              <CalendarDays className="h-4 w-4 min-w-[1rem] text-primary" />
              <span className="line-clamp-1 max-w-[12rem] sm:max-w-[9rem] lg:max-w-[10rem] xl:max-w-[12rem]">{dateRange}</span>
            </span>
            {event.place && (
              <span className="inline-flex max-w-full items-center gap-1 rounded-lg border border-border/60 bg-background/80 px-2 py-1">
                <MapPin className="h-4 w-4 min-w-[1rem] text-primary" />
                <span className="line-clamp-1 max-w-[12rem] sm:max-w-[9rem] lg:max-w-[10rem] xl:max-w-[12rem]">
                  {event.place}
                </span>
              </span>
            )}
            {priceDisplay && priceDisplay !== '가격 문의' && (
              <span className="inline-flex max-w-full items-center gap-1 rounded-lg border border-border/60 bg-background/80 px-2 py-1">
                <Ticket className="h-4 w-4 min-w-[1rem] text-primary" />
                <span className="line-clamp-1 max-w-[12rem] sm:max-w-[9rem] lg:max-w-[10rem] xl:max-w-[12rem]">
                  {priceDisplay}
                </span>
              </span>
            )}
          </div>
          {hasWeatherData && (
            <div className="mt-auto rounded-2xl border border-border/80 bg-card px-3 py-3">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">날씨 브리핑</p>
              <WeatherSummary weather={weather} />
            </div>
          )}
        </div>
      </a>
    </Card>
  );
}
