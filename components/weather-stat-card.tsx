"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { Area, AreaChart, XAxis } from "recharts";

export interface WeatherDataPoint {
  time: string;
  value: number;
}

export interface WeatherStatCardProps {
  name: string;
  unit: string;
  color: string;
  currentValue: number | null;
  highValue?: number;
  lowValue?: number;
  description?: string;
  data: WeatherDataPoint[];
  loading?: boolean;
  error?: string | null;
}

function sanitizeName(name: string) {
  return name
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "_")
    .toLowerCase();
}

export function WeatherStatCard({
  name,
  unit,
  color,
  currentValue,
  highValue,
  lowValue,
  description,
  data,
  loading = false,
  error = null,
}: WeatherStatCardProps) {
  const sanitizedName = sanitizeName(name);
  const gradientId = `gradient-${sanitizedName}`;

  if (loading) {
    return (
      <Card className="p-0">
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-5 bg-muted rounded w-28 mb-1"></div>
            <div className="h-7 bg-muted rounded w-20"></div>
          </div>
          <div className="mt-2 h-16 bg-muted rounded animate-pulse"></div>
          <div className="flex items-center justify-between mt-2 animate-pulse">
            <div className="h-4 bg-muted rounded w-14"></div>
            <div className="h-4 bg-muted rounded w-14"></div>
            <div className="h-4 bg-muted rounded w-10"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-0">
        <CardContent className="p-4 pb-0 h-full flex flex-col">
          <dt className="text-sm font-medium text-foreground">
            {name}{" "}
            <span className="font-normal text-muted-foreground">({unit})</span>
          </dt>
          <dd className="text-sm text-destructive mt-2 flex-1 flex items-center">
            {error}
          </dd>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    time: d.time,
    [name]: d.value,
  }));

  const delta =
    highValue !== undefined && lowValue !== undefined
      ? Math.round((highValue - lowValue) * 10) / 10
      : null;

  return (
    <Card className="p-0">
      <CardContent className="p-4">
        <div>
          <dt className="text-sm font-medium text-foreground">
            {name}{" "}
            <span className="font-normal text-muted-foreground">({unit})</span>
          </dt>
          <dd className="text-lg font-semibold" style={{ color }}>
            {currentValue !== null ? `${currentValue}${unit}` : "--"}
          </dd>
        </div>

        <div className="mt-2 h-16 overflow-hidden">
          <ChartContainer
            className="w-full h-full"
            config={{
              [name]: {
                label: name,
                color,
              },
            }}
          >
            <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" hide={true} />
              <Area
                dataKey={name}
                stroke={color}
                fill={`url(#${gradientId})`}
                fillOpacity={0.4}
                strokeWidth={1.5}
                type="monotone"
              />
            </AreaChart>
          </ChartContainer>
        </div>

        {(highValue !== undefined || lowValue !== undefined || description) && (
          <dd className="flex items-center justify-between text-xs mt-2">
            {highValue !== undefined && (
              <span className="font-medium text-foreground">H: {highValue}{unit}</span>
            )}
            {lowValue !== undefined && (
              <span className="font-medium text-foreground">L: {lowValue}{unit}</span>
            )}
            {delta !== null && (
              <span className="text-muted-foreground">Δ{delta}{unit}</span>
            )}
            {description && !highValue && !lowValue && (
              <span className="text-muted-foreground">{description}</span>
            )}
          </dd>
        )}
      </CardContent>
    </Card>
  );
}
