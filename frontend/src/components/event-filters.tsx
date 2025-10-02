"use client";

import type { KeyboardEvent } from "react";
import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type EventFiltersProps = {
  initialSearch?: string;
  initialDistrict?: string;
  initialFee?: string;
  districts: string[];
  feeOptions: string[];
  preservedParams: Record<string, string[]>;
};

export function EventFilters({
  initialSearch,
  initialDistrict,
  initialFee,
  districts,
  feeOptions,
  preservedParams,
}: EventFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch ?? "");
  const [district, setDistrict] = useState(initialDistrict ?? "");
  const [fee, setFee] = useState(initialFee ?? "");
  const [, startTransition] = useTransition();
  const [isMounted, setIsMounted] = useState(false);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearch(initialSearch ?? "");
  }, [initialSearch]);

  useEffect(() => {
    setDistrict(initialDistrict ?? "");
  }, [initialDistrict]);

  useEffect(() => {
    setFee(initialFee ?? "");
  }, [initialFee]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const applyFilters = (nextSearch = search, nextDistrict = district, nextFee = fee) => {
    if (!isMounted) {
      return;
    }

    const params = new URLSearchParams();

    Object.entries(preservedParams).forEach(([key, values]) => {
      values.forEach((value) => {
        params.append(key, value);
      });
    });

    const trimmedSearch = nextSearch.trim();
    if (trimmedSearch.length > 0) {
      params.set("search", trimmedSearch);
    }

    if (nextDistrict) {
      params.set("guname", nextDistrict);
    }

    if (nextFee) {
      params.set("is_free", nextFee);
    }

    const queryString = params.toString();

    if (queryString === searchParams.toString()) {
      return;
    }

    startTransition(() => {
      if (queryString.length > 0) {
        router.replace(`${pathname}?${queryString}`, { scroll: false });
      } else {
        router.replace(pathname, { scroll: false });
      }
    });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handleDistrictChange = (value: string) => {
    setDistrict(value);
    applyFilters(search, value, fee);
  };

  const handleFeeChange = (value: string) => {
    setFee(value);
    applyFilters(search, district, value);
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyFilters(search.trim(), district, fee);
    }
  };

  const handleInputFocus = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
  };

  const handleInputBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      blurTimeoutRef.current = null;
    }, 120);
  };

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-4 rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur">
      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
        <div className="space-y-2">
          <label htmlFor="search" className="text-sm font-medium text-muted-foreground">
            검색
          </label>
          <Input
            id="search"
            name="search"
            value={search}
            placeholder="행사 및 지역으로 검색하세요"
            autoComplete="off"
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onChange={(event) => handleSearchChange(event.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="guname" className="text-sm font-medium text-muted-foreground">
            지역
          </label>
          <select
            id="guname"
            name="guname"
            value={district}
            onChange={(event) => handleDistrictChange(event.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">전체 지역</option>
            {districts.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="is_free" className="text-sm font-medium text-muted-foreground">
            요금
          </label>
          <select
            id="is_free"
            name="is_free"
            value={fee}
            onChange={(event) => handleFeeChange(event.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">전체</option>
            {feeOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <Button type="button" size="sm" variant="ghost" asChild>
            <Link href="/">초기화</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

