"use server";

import { cacheLife } from "next/cache";
import { queryApi } from "@/lib/influxdb";

export interface IlluminanceDataPoint {
  time: string;
  illuminance: number;
}

export interface IlluminanceStats {
  current: number | null;
  lastUpdated: string | null;
  high: number;
  low: number;
  data: IlluminanceDataPoint[];
}

// Format large lux values for display (e.g., 50000 -> "50k")
// Note: This is a pure utility function, moved to lib/utils or inlined in components
// since "use server" files can only export async functions

export async function getIlluminanceData(): Promise<IlluminanceStats> {
  "use cache";
  cacheLife({ revalidate: 300 }); // 5 minutes

  const bucket = process.env.INFLUXDB_BUCKET || "weather";
  const station = process.env.INFLUXDB_STATION || "ST-00190461";

  const fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: -24h)
      |> filter(fn: (r) => r["_measurement"] == "weather")
      |> filter(fn: (r) => r["station"] == "${station}")
      |> filter(fn: (r) => r["_field"] == "illuminance")
      |> aggregateWindow(every: 1h, fn: mean, createEmpty: false)
      |> yield(name: "mean")
  `;

  const lastQuery = `
    from(bucket: "${bucket}")
      |> range(start: -1h)
      |> filter(fn: (r) => r["_measurement"] == "weather")
      |> filter(fn: (r) => r["station"] == "${station}")
      |> filter(fn: (r) => r["_field"] == "illuminance")
      |> last()
      |> yield(name: "last")
  `;

  const data: IlluminanceDataPoint[] = [];
  let currentIlluminance: number | null = null;
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
        illuminance: Math.round(row._value as number),
      });
    }

    const lastRows = queryApi.iterateRows(lastQuery);
    for await (const { values, tableMeta } of lastRows) {
      const row = tableMeta.toObject(values);
      currentIlluminance = Math.round(row._value as number);
      lastUpdated = row._time as string;
    }
  } catch (error) {
    console.error("Error querying InfluxDB:", error);
    throw new Error("Failed to fetch illuminance data");
  }

  if (data.length === 0) {
    return {
      current: null,
      lastUpdated: null,
      high: 0,
      low: 0,
      data: [],
    };
  }

  const illuminanceValues = data.map((d) => d.illuminance);
  const high = Math.max(...illuminanceValues);
  const low = Math.min(...illuminanceValues);

  return {
    current: currentIlluminance,
    lastUpdated,
    high,
    low,
    data,
  };
}
