"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

type Metric = {
  label: string;
  value: string;
  hint?: string;
};

type InfoTab = {
  id: string;
  label: string;
  description?: string;
  metrics?: Metric[];
  items?: string[];
  footnote?: string;
};

type InfoTabsProps = {
  tabs: InfoTab[];
  defaultTabId?: string;
  className?: string;
};

export function InfoTabs({ tabs, defaultTabId, className }: InfoTabsProps) {
  const safeTabs = tabs.length > 0 ? tabs : [{ id: "default", label: "정보", description: "표시할 데이터가 없습니다." }];
  const [active, setActive] = useState(defaultTabId && safeTabs.some((tab) => tab.id === defaultTabId) ? defaultTabId : safeTabs[0].id);

  const current = safeTabs.find((tab) => tab.id === active) ?? safeTabs[0];

  return (
    <div className={cn("w-full", className)}>
      <div className="flex gap-2 rounded-full border border-border/60 bg-background/80 p-1 text-sm text-muted-foreground">
        {safeTabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={cn(
                "flex-1 rounded-full px-3 py-2 font-medium transition",
                isActive ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-primary/10 hover:text-primary",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="mt-4 space-y-4 rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm">
        {current.description && <p className="text-sm text-muted-foreground">{current.description}</p>}
        {current.metrics && current.metrics.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {current.metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-xl border border-border/80 bg-background/90 px-4 py-3"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{metric.label}</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{metric.value}</p>
                {metric.hint && <p className="mt-1 text-xs text-muted-foreground">{metric.hint}</p>}
              </div>
            ))}
          </div>
        )}
        {current.items && current.items.length > 0 && (
          <ul className="space-y-2 text-sm text-muted-foreground">
            {current.items.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
        {current.footnote && <p className="text-xs text-muted-foreground">{current.footnote}</p>}
      </div>
    </div>
  );
}

