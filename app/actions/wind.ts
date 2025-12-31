"use server";

import { queryApi } from "@/lib/influxdb";

export interface WindDataPoint {
  time: string;
  speed: number;
}

export interface WindStats {
  current: number | null;
  lastUpdated: string | null;
  high: number;
  low: number;
  gust: number;
  data: WindDataPoint[];
}

// Convert m/s to mph
function msToMph(ms: number): number {
  return Math.round((ms * 2.237) * 10) / 10;
}

export async function getWindData(): Promise<WindStats> {
  const bucket = process.env.INFLUXDB_BUCKET || "weather";
  const station = process.env.INFLUXDB_STATION || "ST-00190461";

  // Query for average wind speed
  const avgQuery = `
    from(bucket: "${bucket}")
      |> range(start: -24h)
      |> filter(fn: (r) => r["_measurement"] == "weather")
      |> filter(fn: (r) => r["station"] == "${station}")
      |> filter(fn: (r) => r["_field"] == "wind_avg")
      |> aggregateWindow(every: 1h, fn: mean, createEmpty: false)
      |> yield(name: "mean")
  `;

  // Query for the most recent wind reading (within 1 hour)
  const lastQuery = `
    from(bucket: "${bucket}")
      |> range(start: -1h)
      |> filter(fn: (r) => r["_measurement"] == "weather")
      |> filter(fn: (r) => r["station"] == "${station}")
      |> filter(fn: (r) => r["_field"] == "wind_avg")
      |> last()
      |> yield(name: "last")
  `;

  // Query for max gust in the period
  const gustQuery = `
    from(bucket: "${bucket}")
      |> range(start: -24h)
      |> filter(fn: (r) => r["_measurement"] == "weather")
      |> filter(fn: (r) => r["station"] == "${station}")
      |> filter(fn: (r) => r["_field"] == "wind_gust")
      |> max()
      |> yield(name: "max")
  `;

  const data: WindDataPoint[] = [];
  let maxGust = 0;
  let currentWind: number | null = null;
  let lastUpdated: string | null = null;

  try {
    // Get average wind data
    const avgRows = queryApi.iterateRows(avgQuery);
    for await (const { values, tableMeta } of avgRows) {
      const row = tableMeta.toObject(values);
      const date = new Date(row._time as string);
      const hours = date.getHours();
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;

      data.push({
        time: `${displayHours}:00 ${ampm}`,
        speed: msToMph(row._value as number),
      });
    }

    // Get the most recent reading
    const lastRows = queryApi.iterateRows(lastQuery);
    for await (const { values, tableMeta } of lastRows) {
      const row = tableMeta.toObject(values);
      currentWind = msToMph(row._value as number);
      lastUpdated = row._time as string;
    }

    // Get max gust
    const gustRows = queryApi.iterateRows(gustQuery);
    for await (const { values, tableMeta } of gustRows) {
      const row = tableMeta.toObject(values);
      maxGust = msToMph(row._value as number);
    }
  } catch (error) {
    console.error("Error querying InfluxDB:", error);
    throw new Error("Failed to fetch wind data");
  }

  if (data.length === 0) {
    return {
      current: null,
      lastUpdated: null,
      high: 0,
      low: 0,
      gust: 0,
      data: [],
    };
  }

  const speeds = data.map((d) => d.speed);
  const high = Math.max(...speeds);
  const low = Math.min(...speeds);

  return {
    current: currentWind,
    lastUpdated,
    high,
    low,
    gust: maxGust,
    data,
  };
}
