"use server";

import { queryApi } from "@/lib/influxdb";

export interface HumidityDataPoint {
  time: string;
  humidity: number;
}

export interface HumidityStats {
  current: number | null;
  lastUpdated: string | null;
  high: number;
  low: number;
  data: HumidityDataPoint[];
}

export async function getHumidityData(): Promise<HumidityStats> {
  const bucket = process.env.INFLUXDB_BUCKET || "weather";
  const station = process.env.INFLUXDB_STATION || "ST-00190461";

  const fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: -24h)
      |> filter(fn: (r) => r["_measurement"] == "weather")
      |> filter(fn: (r) => r["station"] == "${station}")
      |> filter(fn: (r) => r["_field"] == "humidity")
      |> aggregateWindow(every: 1h, fn: mean, createEmpty: false)
      |> yield(name: "mean")
  `;

  // Query for the most recent humidity reading (within 1 hour)
  const lastQuery = `
    from(bucket: "${bucket}")
      |> range(start: -1h)
      |> filter(fn: (r) => r["_measurement"] == "weather")
      |> filter(fn: (r) => r["station"] == "${station}")
      |> filter(fn: (r) => r["_field"] == "humidity")
      |> last()
      |> yield(name: "last")
  `;

  const data: HumidityDataPoint[] = [];
  let currentHumidity: number | null = null;
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
        humidity: Math.round(row._value as number),
      });
    }

    // Get the most recent reading
    const lastRows = queryApi.iterateRows(lastQuery);
    for await (const { values, tableMeta } of lastRows) {
      const row = tableMeta.toObject(values);
      currentHumidity = Math.round(row._value as number);
      lastUpdated = row._time as string;
    }
  } catch (error) {
    console.error("Error querying InfluxDB:", error);
    throw new Error("Failed to fetch humidity data");
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

  const humidities = data.map((d) => d.humidity);
  const high = Math.max(...humidities);
  const low = Math.min(...humidities);

  return {
    current: currentHumidity,
    lastUpdated,
    high,
    low,
    data,
  };
}
