"use client";

import { useState, useEffect, useCallback } from "react";
import type { Event } from "@/lib/api-client";

const FAVORITES_STORAGE_KEY = "seoul-now-favorites";

export type FavoriteEvent = {
  id: number;
  title: string;
  guname?: string | null;
  date?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  place?: string | null;
  main_img?: string | null;
  addedAt: string; // 즐겨찾기에 추가된 시간
};

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 로컬 스토리지에서 즐겨찾기 데이터 로드
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as FavoriteEvent[];
        setFavorites(parsed);
      }
    } catch (error) {
      console.error("즐겨찾기 데이터를 불러오는 중 오류가 발생했습니다:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 로컬 스토리지에 즐겨찾기 데이터 저장
  const saveFavorites = useCallback((newFavorites: FavoriteEvent[]) => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (error) {
      console.error("즐겨찾기 데이터를 저장하는 중 오류가 발생했습니다:", error);
    }
  }, []);

  // 이벤트가 즐겨찾기에 있는지 확인
  const isFavorite = useCallback((eventId: number): boolean => {
    return favorites.some(fav => fav.id === eventId);
  }, [favorites]);

  // 즐겨찾기에 추가
  const addToFavorites = useCallback((event: Event) => {
    if (isFavorite(event.id)) {
      return; // 이미 즐겨찾기에 있음
    }

    const favoriteEvent: FavoriteEvent = {
      id: event.id,
      title: event.title,
      guname: event.guname,
      date: event.date,
      start_date: event.start_date,
      end_date: event.end_date,
      place: event.place,
      main_img: event.main_img,
      addedAt: new Date().toISOString(),
    };

    const newFavorites = [favoriteEvent, ...favorites];
    saveFavorites(newFavorites);
  }, [favorites, isFavorite, saveFavorites]);

  // 즐겨찾기에서 제거
  const removeFromFavorites = useCallback((eventId: number) => {
    const newFavorites = favorites.filter(fav => fav.id !== eventId);
    saveFavorites(newFavorites);
  }, [favorites, saveFavorites]);

  // 즐겨찾기 토글
  const toggleFavorite = useCallback((event: Event) => {
    if (isFavorite(event.id)) {
      removeFromFavorites(event.id);
    } else {
      addToFavorites(event);
    }
  }, [addToFavorites, removeFromFavorites, isFavorite]);

  // 모든 즐겨찾기 삭제
  const clearAllFavorites = useCallback(() => {
    saveFavorites([]);
  }, [saveFavorites]);

  // 즐겨찾기 개수
  const favoritesCount = favorites.length;

  return {
    favorites,
    isLoading,
    isFavorite,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    clearAllFavorites,
    favoritesCount,
  };
}