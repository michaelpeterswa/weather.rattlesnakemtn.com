"use server";

import { queryApi } from "@/lib/influxdb";

export interface TemperatureDataPoint {
  time: string;
  temperature: number;
}

export interface TemperatureStats {
  current: number;
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

  const data: TemperatureDataPoint[] = [];

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
  } catch (error) {
    console.error("Error querying InfluxDB:", error);
    throw new Error("Failed to fetch temperature data");
  }

  if (data.length === 0) {
    return {
      current: 0,
      high: 0,
      low: 0,
      data: [],
    };
  }

  const temperatures = data.map((d) => d.temperature);
  const current = temperatures[temperatures.length - 1];
  const high = Math.max(...temperatures);
  const low = Math.min(...temperatures);

  return {
    current,
    high,
    low,
    data,
  };
}
