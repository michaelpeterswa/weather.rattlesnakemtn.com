"use server";

import { queryApi } from "@/lib/influxdb";

export interface TemperatureDataPoint {
  time: string;
  temperature: number;
}

export interface TemperatureStats {
  current: number | null;
  lastUpdated: string | null;
  high: number;
  low: number;
  data: TemperatureDataPoint[];
}

export async function getTemperatureData(): Promise<TemperatureStats> {
  const bucket = process.env.INFLUXDB_BUCKET || "weather";
  const station = process.env.INFLUXDB_STATION || "ST-00190461";

  // Query for today's temperature data (hourly aggregates)
  const fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: -24h)
      |> filter(fn: (r) => r["_measurement"] == "weather")
      |> filter(fn: (r) => r["station"] == "${station}")
      |> filter(fn: (r) => r["_field"] == "temp")
      |> aggregateWindow(every: 1h, fn: mean, createEmpty: false)
      |> map(fn: (r) => ({ r with _value: r._value * 9.0 / 5.0 + 32.0 }))
      |> yield(name: "mean")
  `;

  // Query for the most recent temperature reading
  const lastQuery = `
    from(bucket: "${bucket}")
      |> range(start: -1h)
      |> filter(fn: (r) => r["_measurement"] == "weather")
      |> filter(fn: (r) => r["station"] == "${station}")
      |> filter(fn: (r) => r["_field"] == "temp")
      |> last()
      |> map(fn: (r) => ({ r with _value: r._value * 9.0 / 5.0 + 32.0 }))
      |> yield(name: "last")
  `;

  const data: TemperatureDataPoint[] = [];
  let currentTemp: number | null = null;
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
        temperature: Math.round((row._value as number) * 10) / 10,
      });
    }

    // Get the most recent reading
    const lastRows = queryApi.iterateRows(lastQuery);
    for await (const { values, tableMeta } of lastRows) {
      const row = tableMeta.toObject(values);
      currentTemp = Math.round((row._value as number) * 10) / 10;
      lastUpdated = row._time as string;
    }
  } catch (error) {
    console.error("Error querying InfluxDB:", error);
    throw new Error("Failed to fetch temperature data");
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

  const temperatures = data.map((d) => d.temperature);
  const high = Math.max(...temperatures);
  const low = Math.min(...temperatures);

  return {
    current: currentTemp,
    lastUpdated,
    high,
    low,
    data,
  };
}
