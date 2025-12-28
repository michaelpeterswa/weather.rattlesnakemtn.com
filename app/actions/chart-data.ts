"use server";

import { queryApi } from "@/lib/influxdb";

export type MetricType = "temperature" | "humidity" | "pressure" | "wind";

export interface ChartDataPoint {
  date: string;
  high: number;
  low: number;
  avg?: number;
}

export interface ChartDataStats {
  data: ChartDataPoint[];
  unit: string;
  label: string;
}

// Conversion functions
function celsiusToFahrenheit(c: number): number {
  return Math.round((c * 9 / 5 + 32) * 10) / 10;
}

function hPaToInHg(hPa: number): number {
  return Math.round((hPa * 0.02953) * 100) / 100;
}

function msToMph(ms: number): number {
  return Math.round((ms * 2.237) * 10) / 10;
}

const METRIC_CONFIG: Record<MetricType, {
  field: string;
  unit: string;
  label: string;
  convert: (v: number) => number;
}> = {
  temperature: {
    field: "temp",
    unit: "°F",
    label: "Temperature",
    convert: celsiusToFahrenheit,
  },
  humidity: {
    field: "humidity",
    unit: "%",
    label: "Humidity",
    convert: (v) => Math.round(v),
  },
  pressure: {
    field: "p",
    unit: "inHg",
    label: "Pressure",
    convert: hPaToInHg,
  },
  wind: {
    field: "wind_avg",
    unit: "mph",
    label: "Wind Speed",
    convert: msToMph,
  },
};

export async function getChartData(
  metric: MetricType,
  days: number = 7
): Promise<ChartDataStats> {
  const bucket = process.env.INFLUXDB_BUCKET || "weather";
  const station = process.env.INFLUXDB_STATION || "ST-00190461";
  const config = METRIC_CONFIG[metric];

  // Determine aggregation window based on time range
  // 24h -> 15 minutes (96 points)
  // 7d -> 2 hours (84 points)
  // 30d -> 6 hours (120 points)
  // 90d -> 1 day (90 points)
  let aggregateWindow: string;
  let includeTime = false;

  if (days === 1) {
    aggregateWindow = "15m";
    includeTime = true;
  } else if (days <= 7) {
    aggregateWindow = "2h";
    includeTime = true;
  } else if (days <= 30) {
    aggregateWindow = "6h";
    includeTime = true;
  } else {
    aggregateWindow = "1d";
    includeTime = false;
  }

  const fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: -${days}d)
      |> filter(fn: (r) => r["_measurement"] == "weather")
      |> filter(fn: (r) => r["station"] == "${station}")
      |> filter(fn: (r) => r["_field"] == "${config.field}")
      |> aggregateWindow(every: ${aggregateWindow}, fn: mean, createEmpty: false)
      |> yield(name: "mean")
  `;

  const highQuery = `
    from(bucket: "${bucket}")
      |> range(start: -${days}d)
      |> filter(fn: (r) => r["_measurement"] == "weather")
      |> filter(fn: (r) => r["station"] == "${station}")
      |> filter(fn: (r) => r["_field"] == "${config.field}")
      |> aggregateWindow(every: ${aggregateWindow}, fn: max, createEmpty: false)
      |> yield(name: "max")
  `;

  const lowQuery = `
    from(bucket: "${bucket}")
      |> range(start: -${days}d)
      |> filter(fn: (r) => r["_measurement"] == "weather")
      |> filter(fn: (r) => r["station"] == "${station}")
      |> filter(fn: (r) => r["_field"] == "${config.field}")
      |> aggregateWindow(every: ${aggregateWindow}, fn: min, createEmpty: false)
      |> yield(name: "min")
  `;

  const avgByKey: Record<string, number> = {};
  const highByKey: Record<string, number> = {};
  const lowByKey: Record<string, number> = {};

  // Format the date key based on aggregation type
  const formatKey = (timeStr: string): string => {
    const date = new Date(timeStr);
    if (includeTime) {
      // For sub-daily data, include the time
      return date.toISOString().slice(0, 16); // "2025-12-28T14:00"
    }
    return date.toISOString().split("T")[0]; // "2025-12-28"
  };

  try {
    // Get average values
    const avgRows = queryApi.iterateRows(fluxQuery);
    for await (const { values, tableMeta } of avgRows) {
      const row = tableMeta.toObject(values);
      const key = formatKey(row._time as string);
      avgByKey[key] = config.convert(row._value as number);
    }

    // Get high values
    const highRows = queryApi.iterateRows(highQuery);
    for await (const { values, tableMeta } of highRows) {
      const row = tableMeta.toObject(values);
      const key = formatKey(row._time as string);
      highByKey[key] = config.convert(row._value as number);
    }

    // Get low values
    const lowRows = queryApi.iterateRows(lowQuery);
    for await (const { values, tableMeta } of lowRows) {
      const row = tableMeta.toObject(values);
      const key = formatKey(row._time as string);
      lowByKey[key] = config.convert(row._value as number);
    }
  } catch (error) {
    console.error("Error querying InfluxDB:", error);
    throw new Error(`Failed to fetch ${config.label.toLowerCase()} chart data`);
  }

  // Combine all keys and create data points
  const allKeys = new Set([
    ...Object.keys(avgByKey),
    ...Object.keys(highByKey),
    ...Object.keys(lowByKey),
  ]);

  const data: ChartDataPoint[] = Array.from(allKeys)
    .sort()
    .map((key) => ({
      date: key,
      high: highByKey[key] ?? avgByKey[key] ?? 0,
      low: lowByKey[key] ?? avgByKey[key] ?? 0,
      avg: avgByKey[key],
    }));

  return {
    data,
    unit: config.unit,
    label: config.label,
  };
}
