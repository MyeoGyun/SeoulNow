"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { id: "events", label: "문화행사 모아보기" },
  { id: "calendar", label: "일정 캘린더" },
  { id: "stats", label: "통계 현황" },
] as const;

type NavItemId = (typeof NAV_ITEMS)[number]["id"];

export function TopNavigator({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeId = (() => {
    const viewParam = searchParams?.get("view");
    if (viewParam === "calendar" || viewParam === "stats") {
      return viewParam as NavItemId;
    }
    return "events" as NavItemId;
  })();

  const handleNavigate = (targetId: NavItemId) => {
    const params = new URLSearchParams(searchParams?.toString());

    if (targetId === "events") {
      params.delete("view");
    } else {
      params.set("view", targetId);
      params.delete("page");
    }

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  return (
    <nav
      className={cn(
        "flex items-center gap-1 text-sm text-muted-foreground",
        className,
      )}
      aria-label="주요 섹션 이동"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleNavigate(item.id)}
            className={cn(
              "px-6 py-2 font-medium transition-colors",
              isActive
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-primary",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
