"use server";

import { cacheLife } from "next/cache";
import { queryApi } from "@/lib/influxdb";

export interface SolarRadiationDataPoint {
  time: string;
  radiation: number;
}

export interface SolarRadiationStats {
  current: number | null;
  lastUpdated: string | null;
  high: number;
  low: number;
  data: SolarRadiationDataPoint[];
}

export async function getSolarRadiationData(): Promise<SolarRadiationStats> {
  "use cache";
  cacheLife({ revalidate: 300 }); // 5 minutes

  const bucket = process.env.INFLUXDB_BUCKET || "weather";
  const station = process.env.INFLUXDB_STATION || "ST-00190461";

  const fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: -24h)
      |> filter(fn: (r) => r["_measurement"] == "weather")
      |> filter(fn: (r) => r["station"] == "${station}")
      |> filter(fn: (r) => r["_field"] == "solar_radiation")
      |> aggregateWindow(every: 1h, fn: mean, createEmpty: false)
      |> yield(name: "mean")
  `;

  const lastQuery = `
    from(bucket: "${bucket}")
      |> range(start: -1h)
      |> filter(fn: (r) => r["_measurement"] == "weather")
      |> filter(fn: (r) => r["station"] == "${station}")
      |> filter(fn: (r) => r["_field"] == "solar_radiation")
      |> last()
      |> yield(name: "last")
  `;

  const data: SolarRadiationDataPoint[] = [];
  let currentRadiation: number | null = null;
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
        radiation: Math.round(row._value as number),
      });
    }

    const lastRows = queryApi.iterateRows(lastQuery);
    for await (const { values, tableMeta } of lastRows) {
      const row = tableMeta.toObject(values);
      currentRadiation = Math.round(row._value as number);
      lastUpdated = row._time as string;
    }
  } catch (error) {
    console.error("Error querying InfluxDB:", error);
    throw new Error("Failed to fetch solar radiation data");
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

  const radiationValues = data.map((d) => d.radiation);
  const high = Math.max(...radiationValues);
  const low = Math.min(...radiationValues);

  return {
    current: currentRadiation,
    lastUpdated,
    high,
    low,
    data,
  };
}
