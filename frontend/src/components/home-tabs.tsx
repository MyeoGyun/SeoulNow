"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type HomeTab = {
  id: string;
  label: string;
  content: ReactNode;
};

type HomeTabsProps = {
  tabs: HomeTab[];
  defaultTabId?: string;
  className?: string;
};

export function HomeTabs({ tabs, defaultTabId, className }: HomeTabsProps) {
  const availableTabs = tabs.length > 0 ? tabs : [{ id: "default", label: "탭", content: null }];
  const defaultTab = availableTabs.find((tab) => tab.id === defaultTabId) ?? availableTabs[0];
  const [activeTabId, setActiveTabId] = useState(defaultTab.id);

  const activeTab = availableTabs.find((tab) => tab.id === activeTabId) ?? defaultTab;

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-wrap gap-2 rounded-full border border-border/60 bg-card/80 p-1 text-sm text-muted-foreground">
        {availableTabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTabId(tab.id)}
              className={cn(
                "flex-1 rounded-full px-4 py-2 font-medium transition",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-primary/10 hover:text-primary",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="space-y-6">{activeTab.content}</div>
    </div>
  );
}
