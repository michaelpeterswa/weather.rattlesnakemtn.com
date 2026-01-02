"use server";

import { cacheLife } from "next/cache";
import { queryApi } from "@/lib/influxdb";

export interface LightningDataPoint {
  time: string;
  strikes: number;
}

export interface LightningStats {
  currentDistance: number | null;
  lastUpdated: string | null;
  totalStrikes: number;
  lastStrikeDistance: number | null;
  data: LightningDataPoint[];
}

// Convert km to miles
function kmToMiles(km: number): number {
  return Math.round(km * 0.621371);
}

export async function getLightningData(): Promise<LightningStats> {
  "use cache";
  cacheLife({ revalidate: 300 }); // 5 minutes

  const bucket = process.env.INFLUXDB_BUCKET || "weather";
  const station = process.env.INFLUXDB_STATION || "ST-00190461";

  // Get hourly strike counts
  const strikeQuery = `
    from(bucket: "${bucket}")
      |> range(start: -24h)
      |> filter(fn: (r) => r["_measurement"] == "weather")
      |> filter(fn: (r) => r["station"] == "${station}")
      |> filter(fn: (r) => r["_field"] == "strike_count")
      |> aggregateWindow(every: 1h, fn: sum, createEmpty: false)
      |> yield(name: "sum")
  `;

  // Get the most recent strike distance
  const distanceQuery = `
    from(bucket: "${bucket}")
      |> range(start: -24h)
      |> filter(fn: (r) => r["_measurement"] == "weather")
      |> filter(fn: (r) => r["station"] == "${station}")
      |> filter(fn: (r) => r["_field"] == "strike_distance")
      |> filter(fn: (r) => r["_value"] > 0)
      |> last()
      |> yield(name: "last")
  `;

  const data: LightningDataPoint[] = [];
  let lastStrikeDistance: number | null = null;
  let lastUpdated: string | null = null;

  try {
    const strikeRows = queryApi.iterateRows(strikeQuery);

    for await (const { values, tableMeta } of strikeRows) {
      const row = tableMeta.toObject(values);
      const date = new Date(row._time as string);
      const hours = date.getHours();
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;

      data.push({
        time: `${displayHours}:00 ${ampm}`,
        strikes: row._value as number,
      });
    }

    const distanceRows = queryApi.iterateRows(distanceQuery);
    for await (const { values, tableMeta } of distanceRows) {
      const row = tableMeta.toObject(values);
      lastStrikeDistance = kmToMiles(row._value as number);
      lastUpdated = row._time as string;
    }
  } catch (error) {
    console.error("Error querying InfluxDB:", error);
    throw new Error("Failed to fetch lightning data");
  }

  const totalStrikes = data.reduce((sum, d) => sum + d.strikes, 0);

  return {
    currentDistance: lastStrikeDistance,
    lastUpdated,
    totalStrikes,
    lastStrikeDistance,
    data,
  };
}
