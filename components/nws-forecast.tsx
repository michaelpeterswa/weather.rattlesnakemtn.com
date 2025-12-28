"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getNWSForecast, ForecastPeriod } from "@/app/actions/nws-forecast";

function ForecastCard({ period }: { period: ForecastPeriod }) {
  const precipChance = period.probabilityOfPrecipitation?.value;

  return (
    <div
      className={`flex flex-col rounded-lg border p-4 ${
        period.isDaytime ? "bg-card" : "bg-muted/50"
      }`}
    >
      <div className="font-semibold text-sm">{period.name}</div>
      <div className="flex items-center gap-3 mt-2">
        <div className="text-3xl font-bold">
          {period.temperature}°{period.temperatureUnit}
        </div>
        {precipChance !== null && precipChance > 0 && (
          <div className="text-sm text-muted-foreground">
            {precipChance}% precip
          </div>
        )}
      </div>
      <div className="text-sm text-muted-foreground mt-1">
        {period.windSpeed} {period.windDirection}
      </div>
      <div className="text-sm mt-2">{period.shortForecast}</div>
    </div>
  );
}

export function NWSForecast() {
  const [periods, setPeriods] = React.useState<ForecastPeriod[]>([]);
  const [updateTime, setUpdateTime] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchForecast() {
      setLoading(true);
      setError(null);
      try {
        const forecast = await getNWSForecast();
        setPeriods(forecast.periods);
        setUpdateTime(forecast.updateTime);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch forecast"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchForecast();
  }, []);

  const formatUpdateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>NWS Forecast</CardTitle>
        <CardDescription>
          {updateTime
            ? `Updated ${formatUpdateTime(updateTime)}`
            : "7-day forecast from the National Weather Service"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-32 w-full animate-pulse rounded-lg bg-muted"
              />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32 text-destructive">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {periods.map((period) => (
              <ForecastCard key={period.number} period={period} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
