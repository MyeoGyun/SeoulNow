"use client";

import type { Weather } from "@/lib/api-client";

export function WeatherSummary({ weather }: { weather: Weather | null }) {
  if (!weather) {
    return null;
  }

  const tempText =
    weather.temp !== null && weather.temp !== undefined ? `${weather.temp.toFixed(1)}℃` : "데이터 없음";
  const rainText =
    weather.rain_prob !== null && weather.rain_prob !== undefined ? `${weather.rain_prob}%` : "데이터 없음";
  const pm10Text =
    weather.pm10 !== null && weather.pm10 !== undefined ? `${weather.pm10}` : "데이터 없음";

  const hasAnyMetric = [tempText, rainText, pm10Text].some((value) => value !== "데이터 없음");

  if (!hasAnyMetric) {
    return null;
  }

  const metrics = [
    { label: "기온", value: tempText },
    { label: "강수 확률", value: rainText },
    { label: "미세먼지", value: pm10Text },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-xl border border-border/60 bg-background/70 px-3 py-3 text-center shadow-sm"
        >
          <span className="block text-sm font-semibold text-primary">{metric.value}</span>
          <span className="text-xs text-muted-foreground">{metric.label}</span>
        </div>
      ))}
    </div>
  );
}
