"use client";

import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/useFavorites";
import type { Event } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export type FavoriteButtonProps = {
  event: Event;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "ghost" | "outline";
  className?: string;
  showText?: boolean;
};

export function FavoriteButton({ 
  event, 
  size = "sm", 
  variant = "ghost",
  className,
  showText = false 
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite, isLoading } = useFavorites();
  
  const isEventFavorite = isFavorite(event.id);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault(); // 이벤트 카드 링크 클릭 방지
    e.stopPropagation();
    toggleFavorite(event);
  };

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10", 
    lg: "h-12 w-12"
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  };

  if (isLoading) {
    return (
      <div className={cn(sizeClasses[size], "animate-pulse bg-muted rounded", className)} />
    );
  }

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={handleClick}
      className={cn(
        sizeClasses[size],
        "transition-colors hover:bg-red-50 hover:text-red-600",
        isEventFavorite && "text-red-500 hover:text-red-600",
        className
      )}
      aria-label={isEventFavorite ? "즐겨찾기에서 제거" : "즐겨찾기에 추가"}
      title={isEventFavorite ? "즐겨찾기에서 제거" : "즐겨찾기에 추가"}
    >
      <Heart 
        className={cn(
          iconSizes[size],
          "transition-all duration-200",
          isEventFavorite && "fill-current"
        )} 
      />
      {showText && (
        <span className="ml-2 text-sm">
          {isEventFavorite ? "즐겨찾기 해제" : "즐겨찾기"}
        </span>
      )}
    </Button>
  );
}