"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import type { Event } from "@/lib/api-client";

type EventCarouselProps = {
  events: Event[];
};

function calculateDDay(dateString: string | null | undefined): string {
  if (!dateString) return "";
  
  const eventDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);
  
  const diffTime = eventDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "D-DAY";
  if (diffDays < 0) return `D+${Math.abs(diffDays)}`;
  return `D-${diffDays}`;
}

export function EventCarousel({ events }: EventCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  
  // 오늘부터 +13일(총 14일) 행사 필터링
  const getUpcomingEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 13); // 당일 포함하여 +13일
    endDate.setHours(23, 59, 59, 999);
    
    return events.filter(event => {
      if (!event.start_date) return false;
      
      const eventDate = new Date(event.start_date);
      return eventDate >= today && eventDate <= endDate;
    });
  };
  
  const upcomingEvents = getUpcomingEvents();

  // 특정 인덱스로 스크롤하는 함수
  const scrollToIndex = (index: number) => {
    if (!scrollRef.current) return;
    
    const child = scrollRef.current.children[index] as HTMLElement;
    if (child) {
      const scrollPosition = child.offsetLeft;
      
      scrollRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
    
    setCurrentIndex(index);
  };


  // 스크롤 위치 감지하여 currentIndex 업데이트
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || upcomingEvents.length <= 1) return;

    const handleScroll = () => {
      const scrollLeft = scrollContainer.scrollLeft;
      const containerWidth = scrollContainer.clientWidth;
      const scrollWidth = scrollContainer.scrollWidth;
      
      // 현재 화면에서 가장 중앙에 가까운 카드 찾기
      let newIndex = 0;
      let minDistance = Infinity;
      
      for (let i = 0; i < upcomingEvents.length; i++) {
        const child = scrollContainer.children[i] as HTMLElement;
        if (child) {
          const cardLeft = child.offsetLeft;
          const cardCenter = cardLeft + (child.clientWidth / 2);
          const containerCenter = scrollLeft + (containerWidth / 2);
          const distance = Math.abs(cardCenter - containerCenter);
          
          if (distance < minDistance) {
            minDistance = distance;
            newIndex = i;
          }
        }
      }
      
      // 마지막까지 스크롤된 경우 처리
      if (scrollLeft + containerWidth >= scrollWidth - 10) {
        newIndex = upcomingEvents.length - 1;
      }
      
      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
      }
    };

    // throttle을 위한 래퍼
    let timeoutId: NodeJS.Timeout;
    const throttledHandleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 50);
    };

    scrollContainer.addEventListener('scroll', throttledHandleScroll, { passive: true });
    return () => {
      scrollContainer.removeEventListener('scroll', throttledHandleScroll);
      clearTimeout(timeoutId);
    };
  }, [upcomingEvents.length, currentIndex]);

  // 자동 스크롤 기능
  useEffect(() => {
    if (upcomingEvents.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        const nextIndex = (prev + 1) % upcomingEvents.length;
        scrollToIndex(nextIndex);
        return nextIndex;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [upcomingEvents.length, isHovered]);

  if (upcomingEvents.length === 0) {
    return null;
  }

  return (
    <div className="relative">

      <div
        ref={scrollRef}
        className="flex gap-3 md:gap-4 lg:gap-6 overflow-x-auto scrollbar-hide pb-4"
        style={{ scrollSnapType: "x mandatory" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {upcomingEvents.map((event) => {
          const dDay = calculateDDay(event.start_date);
          const eventUrl = event.hmpg_addr ?? event.org_link ?? "#";
          const isExternal = eventUrl.startsWith("http");

          return (
            <div
              key={event.id}
              className="group cursor-pointer flex-shrink-0 w-36 sm:w-40 md:w-44 lg:w-48"
              style={{ scrollSnapAlign: "start" }}
            >
              <a
                href={eventUrl}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noreferrer" : undefined}
                className="block"
              >
                <div className="relative mb-2 md:mb-4">
                  {event.main_img ? (
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md md:rounded-lg bg-muted/10 shadow-sm md:shadow-md">
                      <Image
                        src={event.main_img}
                        alt={event.title}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        loading="lazy"
                        className="object-cover transition duration-300 group-hover:scale-105"
                      />
                      
                      {dDay && (
                        <div className="absolute top-2 right-2 md:top-3 md:right-3">
                          <span className={`inline-flex items-center rounded px-1.5 py-0.5 md:px-2 md:py-1 text-xs font-bold shadow-lg backdrop-blur-sm ${
                            dDay === "D-DAY" 
                              ? "bg-red-500/90 text-white" 
                              : dDay.startsWith("D-")
                              ? "bg-[#12314c]/90 text-white"
                              : "bg-gray-500/90 text-white"
                          }`}>
                            {dDay}
                          </span>
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  ) : (
                    <div className="flex aspect-[3/4] w-full items-center justify-center rounded-md md:rounded-lg bg-muted/10 text-xs text-muted-foreground shadow-sm md:shadow-md">
                      포스터 준비 중
                    </div>
                  )}
                </div>

                <div className="space-y-1 md:space-y-2">
                  {event.codename && (
                    <span className="inline-block rounded px-1.5 py-0.5 md:px-2 md:py-1 text-xs text-[#12314c] font-medium bg-[#12314c]/10">
                      {event.codename}
                    </span>
                  )}
                  
                  <h3 className="line-clamp-2 text-xs md:text-sm font-bold leading-tight text-foreground group-hover:text-[#12314c] transition-colors">
                    {event.title}
                  </h3>
                  
                  <div className="space-y-0.5 md:space-y-1 text-xs text-muted-foreground">
                    {event.place && (
                      <p className="line-clamp-1 font-medium">{event.place}</p>
                    )}
                    {(event.start_date || event.date) && (
                      <p className="line-clamp-1">
                        {event.start_date ? new Date(event.start_date).toLocaleDateString('ko-KR') : event.date}
                      </p>
                    )}
                  </div>
                </div>
              </a>
            </div>
          );
        })}
      </div>
      
    </div>
  );
}