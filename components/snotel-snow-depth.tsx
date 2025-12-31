"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
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
  getSnotelSnowDepth,
  SnotelResponse,
  SnotelStationData,
} from "@/app/actions/snotel";
import { useTheme } from "next-themes";

// Colors for each station
const STATION_COLORS = [
  "hsl(199 89% 48%)", // Blue
  "hsl(142 76% 36%)", // Green
  "hsl(262 83% 58%)", // Purple
];

interface ChartDataPoint {
  date: string;
  [key: string]: string | number;
}

function buildChartConfig(stations: SnotelStationData[]): ChartConfig {
  const config: ChartConfig = {};
  stations.forEach((station, index) => {
    config[station.stationTriplet] = {
      label: station.stationName,
      color: STATION_COLORS[index % STATION_COLORS.length],
    };
  });
  return config;
}

function buildChartData(stations: SnotelStationData[]): ChartDataPoint[] {
  // Collect all unique dates
  const dateMap = new Map<string, ChartDataPoint>();

  stations.forEach((station) => {
    station.data.forEach((point) => {
      if (!dateMap.has(point.date)) {
        dateMap.set(point.date, { date: point.date });
      }
      const entry = dateMap.get(point.date)!;
      entry[station.stationTriplet] = point.value;
    });
  });

  // Sort by date
  return Array.from(dateMap.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

export function SnotelSnowDepth() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [snotelData, setSnotelData] = React.useState<SnotelResponse | null>(
    null
  );
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const data = await getSnotelSnowDepth();
        setSnotelData(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch SNOTEL data"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const chartConfig = snotelData ? buildChartConfig(snotelData.stations) : {};
  const chartData = snotelData ? buildChartData(snotelData.stations) : [];

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>SNOTEL Snow Depth</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Hourly snow depth from nearby SNOTEL stations (last 3 days)
          </span>
          <span className="@[540px]/card:hidden">
            Snow depth from SNOTEL stations
          </span>
        </CardDescription>
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
        ) : snotelData && chartData.length > 0 ? (
          <>
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-62.5 w-full"
            >
              <AreaChart data={chartData}>
                <defs>
                  {snotelData.stations.map((station, index) => (
                    <linearGradient
                      key={station.stationTriplet}
                      id={`fill-${station.stationTriplet.replace(/:/g, "-")}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={STATION_COLORS[index % STATION_COLORS.length]}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={STATION_COLORS[index % STATION_COLORS.length]}
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  ))}
                  {/* Glow filter for chart lines */}
                  <filter id="snotelLineGlow" x="-20%" y="-20%" width="140%" height="140%">
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
                  width={50}
                  tickFormatter={(value) => `${value} in`}
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      hour12: true,
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
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                          timeZone: "America/Los_Angeles",
                        });
                      }}
                      formatter={(value, name) => {
                        const stationName =
                          snotelData.stations.find(
                            (s) => s.stationTriplet === name
                          )?.stationName || name;
                        return (
                          <span>
                            {stationName}: {value} {snotelData.unit}
                          </span>
                        );
                      }}
                      indicator="dot"
                    />
                  }
                />
                {snotelData.stations.map((station, index) => (
                  <Area
                    key={station.stationTriplet}
                    dataKey={station.stationTriplet}
                    type="natural"
                    fill={`url(#fill-${station.stationTriplet.replace(/:/g, "-")})`}
                    stroke={STATION_COLORS[index % STATION_COLORS.length]}
                    fillOpacity={0.3}
                    filter={isDark ? "url(#snotelLineGlow)" : undefined}
                  />
                ))}
              </AreaChart>
            </ChartContainer>
            {/* Station legend */}
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {snotelData.stations.map((station, index) => (
                <div
                  key={station.stationTriplet}
                  className="flex items-center gap-2 text-sm"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor:
                        STATION_COLORS[index % STATION_COLORS.length],
                    }}
                  />
                  <span className="text-muted-foreground">
                    {station.stationName}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-62.5 text-muted-foreground">
            No SNOTEL data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
