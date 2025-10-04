type SummaryAnalytics = {
  total: number;
  upcoming: number;
  ongoing: number;
  past: number;
  freeCount: number;
  paidCount: number;
  freeRatio: number;
};

type DistributionEntry = {
  label: string;
  count: number;
};

type TimelinePoint = {
  period: string;
  count: number;
};

type PriceInsight = {
  count: number;
  averagePrice: number | null;
  averageReservationWindow: number | null;
};

type StatsSectionProps = {
  analytics: {
    summary: SummaryAnalytics;
    districts: {
      distribution: DistributionEntry[];
      top: DistributionEntry[];
      bottom: DistributionEntry[];
    };
    timeline: TimelinePoint[];
    categories: DistributionEntry[];
    weekdays: DistributionEntry[];
    price: {
      free: PriceInsight;
      paid: PriceInsight;
    };
  };
};

const formatNumber = (value: number): string => value.toLocaleString();

const formatPercent = (value: number): string => {
  const percentage = Number.isFinite(value) ? Math.max(0, value) * 100 : 0;
  return `${percentage.toFixed(1)}%`;
};

const formatDays = (value: number | null): string => {
  if (value === null || Number.isNaN(value)) {
    return "데이터 부족";
  }
  if (value < 1) {
    return "1일 미만";
  }
  return `${value.toFixed(1)}일`;
};

const formatCurrency = (value: number | null): string => {
  if (value === null || Number.isNaN(value)) {
    return "데이터 부족";
  }
  if (value === 0) {
    return "무료";
  }
  return `${Math.round(value).toLocaleString()}원`;
};

const renderBarList = (data: DistributionEntry[], accentClass = "bg-primary") => {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">표시할 데이터가 없습니다.</p>;
  }

  const max = data.reduce((acc, item) => Math.max(acc, item.count), 0) || 1;

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={`${item.label}-${item.count}`} className="space-y-1">
          <div className="flex items-center justify-between text-sm font-medium text-foreground">
            <span className="truncate pr-2">{item.label}</span>
            <span className="text-muted-foreground">{formatNumber(item.count)}건</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className={`h-2 rounded-full ${accentClass}`}
              style={{ width: `${Math.max(8, (item.count / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export function StatsSection({ analytics }: StatsSectionProps) {
  const { summary, districts, timeline, categories, weekdays, price } = analytics;
  const timelineMax = timeline.reduce((max, point) => Math.max(max, point.count), 0) || 1;

  const summaryCards = [
    {
      label: "총 행사",
      value: formatNumber(summary.total),
      hint: "서울 열린데이터 기반",
    },
    {
      label: "예정",
      value: formatNumber(summary.upcoming),
      hint: "오늘 이후 일정",
    },
    {
      label: "진행 중",
      value: formatNumber(summary.ongoing),
      hint: "현재 진행 중인 행사",
    },
    {
      label: "종료",
      value: formatNumber(summary.past),
      hint: "이미 종료된 일정",
    },
    {
      label: "무료 비중",
      value: formatPercent(summary.freeRatio),
      hint: `${formatNumber(summary.freeCount)}건 / ${formatNumber(summary.paidCount)}건`,
    },
  ];

  const priceRows = [
    {
      label: "무료 행사",
      count: summary.freeCount,
      price: formatCurrency(price.free.averagePrice),
      window: formatDays(price.free.averageReservationWindow),
    },
    {
      label: "유료/기타",
      count: summary.paidCount,
      price: formatCurrency(price.paid.averagePrice),
      window: formatDays(price.paid.averageReservationWindow),
    },
  ];

  return (
    <section className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">{card.value}</p>
            <p className="mt-2 text-xs text-muted-foreground">{card.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">지역 분포</h3>
              <p className="text-sm text-muted-foreground">행사가 많이 열리는 자치구를 확인하세요.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">상위 지역</p>
              <div className="mt-3">
                {renderBarList(districts.top)}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">하위 지역</p>
              <div className="mt-3">
                {renderBarList(districts.bottom, "bg-primary/50")}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-foreground">기간 트렌드</h3>
            <p className="text-sm text-muted-foreground">최근 월별 행사 추이를 통해 시즌 변화를 살펴보세요.</p>
          </div>
          <div className="mt-5">
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">표시할 데이터가 없습니다.</p>
            ) : (
             <div className="space-y-3">
                {timeline.map((point) => (
                  <div key={point.period} className="space-y-1">
                    <div className="flex items-center justify-between text-sm font-medium text-foreground">
                      <span>{point.period}</span>
                      <span className="text-muted-foreground">{formatNumber(point.count)}건</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{
                          width: `${Math.max(8, (point.count / timelineMax) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-foreground">카테고리 비중</h3>
            <p className="text-sm text-muted-foreground">어떤 장르가 많은지 한눈에 파악해보세요.</p>
          </div>
          <div className="mt-5">
            {renderBarList(categories, "bg-primary/70")}
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-foreground">요일별 피크</h3>
            <p className="text-sm text-muted-foreground">관람하기 좋은 요일을 미리 계획해보세요.</p>
          </div>
          <div className="mt-5">
            {renderBarList(weekdays, "bg-primary/60")}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm">
        <div>
          <h3 className="text-lg font-semibold text-foreground">무료 vs 유료 세부 정보</h3>
          <p className="text-sm text-muted-foreground">
            평균 관람료와 예약 준비 기간을 비교해 관람 계획에 참고하세요.
          </p>
        </div>
        <div className="mt-5 overflow-hidden rounded-xl border border-border/60 bg-background/80">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">구분</th>
                <th className="px-4 py-3 text-left font-medium">행사 수</th>
                <th className="px-4 py-3 text-left font-medium">평균 관람료</th>
                <th className="px-4 py-3 text-left font-medium">평균 예약 준비 기간</th>
              </tr>
            </thead>
            <tbody>
              {priceRows.map((row) => (
                <tr key={row.label} className="border-t border-border/40">
                  <td className="px-4 py-3 font-medium text-foreground">{row.label}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatNumber(row.count)}건</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.price}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.window}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
