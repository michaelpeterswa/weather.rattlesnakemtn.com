"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useTheme } from "next-themes";
import {
  getChartData,
  MetricType,
  ChartDataStats,
} from "@/app/actions/chart-data";

const METRIC_OPTIONS: { value: MetricType; label: string; color: string }[] = [
  { value: "temperature", label: "Temperature", color: "hsl(24 95% 53%)" },
  { value: "humidity", label: "Humidity", color: "hsl(199 89% 48%)" },
  { value: "pressure", label: "Pressure", color: "hsl(142 76% 36%)" },
  { value: "wind", label: "Wind", color: "hsl(262 83% 58%)" },
];

const TIME_RANGE_DAYS: Record<string, number> = {
  "24h": 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

function getChartConfig(metric: MetricType): ChartConfig {
  const option = METRIC_OPTIONS.find((o) => o.value === metric);
  const color = option?.color ?? "hsl(24 95% 53%)";

  return {
    value: {
      label: option?.label ?? "Value",
    },
    high: {
      label: "High",
      color: color,
    },
    low: {
      label: "Low",
      color: `${color.replace(")", " / 0.6)")}`,
    },
  };
}

export function ChartAreaInteractive() {
  const isMobile = useIsMobile();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [timeRange, setTimeRange] = React.useState("7d");
  const [metric, setMetric] = React.useState<MetricType>("temperature");
  const [chartStats, setChartStats] = React.useState<ChartDataStats | null>(
    null
  );
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("24h");
    }
  }, [isMobile]);

  React.useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const days = TIME_RANGE_DAYS[timeRange] ?? 7;
        const data = await getChartData(metric, days);
        setChartStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [metric, timeRange]);

  const chartConfig = getChartConfig(metric);
  const metricOption = METRIC_OPTIONS.find((o) => o.value === metric);
  const metricColor = metricOption?.color ?? "hsl(24 95% 53%)";

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>
          {chartStats?.label ?? metricOption?.label ?? "Weather"}
        </CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Daily high and low {chartStats?.label?.toLowerCase() ?? "values"} (
            {chartStats?.unit ?? ""})
          </span>
          <span className="@[540px]/card:hidden">
            High/Low ({chartStats?.unit ?? ""})
          </span>
        </CardDescription>
        <CardAction>
          <div className="flex flex-wrap items-center gap-2">
            {/* Metric selector */}
            <Select
              value={metric}
              onValueChange={(v) => setMetric(v as MetricType)}
            >
              <SelectTrigger
                className="w-36"
                size="sm"
                aria-label="Select metric"
              >
                <SelectValue placeholder="Temperature" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {METRIC_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="rounded-lg"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Time range toggle - desktop */}
            <ToggleGroup
              type="single"
              value={timeRange}
              onValueChange={(v) => v && setTimeRange(v)}
              variant="outline"
              className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
            >
              <ToggleGroupItem value="24h">24 Hours</ToggleGroupItem>
              <ToggleGroupItem value="7d">7 Days</ToggleGroupItem>
              <ToggleGroupItem value="30d">30 Days</ToggleGroupItem>
              <ToggleGroupItem value="90d">90 Days</ToggleGroupItem>
            </ToggleGroup>

            {/* Time range select - mobile */}
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger
                className="flex w-28 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
                size="sm"
                aria-label="Select time range"
              >
                <SelectValue placeholder="7 Days" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="24h" className="rounded-lg">
                  24 Hours
                </SelectItem>
                <SelectItem value="7d" className="rounded-lg">
                  7 Days
                </SelectItem>
                <SelectItem value="30d" className="rounded-lg">
                  30 Days
                </SelectItem>
                <SelectItem value="90d" className="rounded-lg">
                  90 Days
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading ? (
          <div className="h-62.5 w-full animate-pulse">
            <div className="h-full w-full bg-muted rounded"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-62.5 text-destructive">
            {error}
          </div>
        ) : chartStats && chartStats.data.length > 0 ? (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-62.5 w-full"
          >
            <AreaChart data={chartStats.data}>
              <defs>
                <linearGradient id="fillHigh" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={metricColor} stopOpacity={0.3} />
                  <stop
                    offset="95%"
                    stopColor={metricColor}
                    stopOpacity={0.02}
                  />
                </linearGradient>
                <linearGradient id="fillLow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={metricColor} stopOpacity={0.15} />
                  <stop
                    offset="95%"
                    stopColor={metricColor}
                    stopOpacity={0.01}
                  />
                </linearGradient>
                {/* Glow filter for chart lines */}
                <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid vertical={false} />
              <YAxis
                domain={["auto", "auto"]}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={75}
                tickFormatter={(value) => {
                  const rounded = Number(value).toFixed(2);
                  const unit = chartStats?.unit ?? "";
                  const space = unit === "inHg" ? " " : "";
                  return `${rounded}${space}${unit}`;
                }}
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  // For sub-daily data, show date + time; for daily show just date
                  if (timeRange === "24h") {
                    return date.toLocaleTimeString("en-US", {
                      hour: "numeric",
                      hour12: true,
                      timeZone: "America/Los_Angeles",
                    });
                  }
                  if (timeRange === "7d" || timeRange === "30d") {
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      timeZone: "America/Los_Angeles",
                    });
                  }
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    timeZone: "America/Los_Angeles",
                  });
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      if (timeRange === "24h") {
                        return date.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                          timeZone: "America/Los_Angeles",
                        });
                      }
                      if (timeRange === "7d" || timeRange === "30d") {
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          hour12: true,
                          timeZone: "America/Los_Angeles",
                        });
                      }
                      return date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        timeZone: "America/Los_Angeles",
                      });
                    }}
                    formatter={(value, name) => (
                      <span>
                        {name === "high" ? "High" : "Low"}: {value}
                        {chartStats.unit}
                      </span>
                    )}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="low"
                type="natural"
                fill="url(#fillLow)"
                stroke={metricColor}
                strokeOpacity={0.6}
                filter={isDark ? "url(#lineGlow)" : undefined}
              />
              <Area
                dataKey="high"
                type="natural"
                fill="url(#fillHigh)"
                stroke={metricColor}
                filter={isDark ? "url(#lineGlow)" : undefined}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-62.5 text-muted-foreground">
            No data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
