"use server";

import { cacheLife } from "next/cache";
import { queryApi } from "@/lib/influxdb";

export interface PressureDataPoint {
  time: string;
  pressure: number;
}

export interface PressureStats {
  current: number | null;
  lastUpdated: string | null;
  high: number;
  low: number;
  trend: "rising" | "falling" | "steady";
  data: PressureDataPoint[];
}

// Convert hPa/mbar to inHg
function hPaToInHg(hPa: number): number {
  return Math.round((hPa * 0.02953) * 100) / 100;
}

export async function getPressureData(): Promise<PressureStats> {
  "use cache";
  cacheLife({ revalidate: 300 }); // 5 minutes

  const bucket = process.env.INFLUXDB_BUCKET || "weather";
  const station = process.env.INFLUXDB_STATION || "ST-00190461";

  const fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: -24h)
      |> filter(fn: (r) => r["_measurement"] == "weather")
      |> filter(fn: (r) => r["station"] == "${station}")
      |> filter(fn: (r) => r["_field"] == "p")
      |> aggregateWindow(every: 1h, fn: mean, createEmpty: false)
      |> yield(name: "mean")
  `;

  // Query for the most recent pressure reading (within 1 hour)
  const lastQuery = `
    from(bucket: "${bucket}")
      |> range(start: -1h)
      |> filter(fn: (r) => r["_measurement"] == "weather")
      |> filter(fn: (r) => r["station"] == "${station}")
      |> filter(fn: (r) => r["_field"] == "p")
      |> last()
      |> yield(name: "last")
  `;

  const data: PressureDataPoint[] = [];
  let currentPressure: number | null = null;
  let lastUpdated: string | null = null;

  try {
    const rows = queryApi.iterateRows(fluxQuery);

    for await (const { values, tableMeta } of rows) {
      const row = tableMeta.toObject(values);
      const date = new Date(row._time as string);
      const hours = date.getHours();
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;

      data.push({
        time: `${displayHours}:00 ${ampm}`,
        pressure: hPaToInHg(row._value as number),
      });
    }

    // Get the most recent reading
    const lastRows = queryApi.iterateRows(lastQuery);
    for await (const { values, tableMeta } of lastRows) {
      const row = tableMeta.toObject(values);
      currentPressure = hPaToInHg(row._value as number);
      lastUpdated = row._time as string;
    }
  } catch (error) {
    console.error("Error querying InfluxDB:", error);
    throw new Error("Failed to fetch pressure data");
  }

  if (data.length === 0) {
    return {
      current: null,
      lastUpdated: null,
      high: 0,
      low: 0,
      trend: "steady",
      data: [],
    };
  }

  const pressures = data.map((d) => d.pressure);
  const high = Math.max(...pressures);
  const low = Math.min(...pressures);

  // Calculate trend based on last 3 hours
  let trend: "rising" | "falling" | "steady" = "steady";
  if (data.length >= 3) {
    const recent = pressures.slice(-3);
    const diff = recent[recent.length - 1] - recent[0];
    if (diff > 0.02) {
      trend = "rising";
    } else if (diff < -0.02) {
      trend = "falling";
    }
  }

  return {
    current: currentPressure,
    lastUpdated,
    high,
    low,
    trend,
    data,
  };
}
