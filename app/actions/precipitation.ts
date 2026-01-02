"use server";

import { cacheLife } from "next/cache";
import { queryApi } from "@/lib/influxdb";

export interface PrecipitationDataPoint {
  time: string;
  precipitation: number;
}

export interface PrecipitationStats {
  current: number | null;
  lastUpdated: string | null;
  total: number;
  data: PrecipitationDataPoint[];
}

// Convert mm to inches
function mmToInches(mm: number): number {
  return Math.round((mm * 0.03937) * 100) / 100;
}

export async function getPrecipitationData(): Promise<PrecipitationStats> {
  "use cache";
  cacheLife({ revalidate: 300 }); // 5 minutes

  const bucket = process.env.INFLUXDB_BUCKET || "weather";
  const station = process.env.INFLUXDB_STATION || "ST-00190461";

  // Get hourly precipitation totals
  const fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: -24h)
      |> filter(fn: (r) => r["_measurement"] == "weather")
      |> filter(fn: (r) => r["station"] == "${station}")
      |> filter(fn: (r) => r["_field"] == "precipitation")
      |> aggregateWindow(every: 1h, fn: sum, createEmpty: false)
      |> yield(name: "sum")
  `;

  const lastQuery = `
    from(bucket: "${bucket}")
      |> range(start: -1h)
      |> filter(fn: (r) => r["_measurement"] == "weather")
      |> filter(fn: (r) => r["station"] == "${station}")
      |> filter(fn: (r) => r["_field"] == "precipitation")
      |> last()
      |> yield(name: "last")
  `;

  const data: PrecipitationDataPoint[] = [];
  let currentPrecip: number | null = null;
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
        precipitation: mmToInches(row._value as number),
      });
    }

    const lastRows = queryApi.iterateRows(lastQuery);
    for await (const { values, tableMeta } of lastRows) {
      const row = tableMeta.toObject(values);
      currentPrecip = mmToInches(row._value as number);
      lastUpdated = row._time as string;
    }
  } catch (error) {
    console.error("Error querying InfluxDB:", error);
    throw new Error("Failed to fetch precipitation data");
  }

  // Calculate 24h total
  const total = data.reduce((sum, d) => sum + d.precipitation, 0);
  const roundedTotal = Math.round(total * 100) / 100;

  return {
    current: currentPrecip,
    lastUpdated,
    total: roundedTotal,
    data,
  };
}
