"use server";

import { queryApi } from "@/lib/influxdb";

export interface HumidityDataPoint {
  time: string;
  humidity: number;
}

export interface HumidityStats {
  current: number;
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

  const data: HumidityDataPoint[] = [];

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
  } catch (error) {
    console.error("Error querying InfluxDB:", error);
    throw new Error("Failed to fetch humidity data");
  }

  if (data.length === 0) {
    return {
      current: 0,
      high: 0,
      low: 0,
      data: [],
    };
  }

  const humidities = data.map((d) => d.humidity);
  const current = humidities[humidities.length - 1];
  const high = Math.max(...humidities);
  const low = Math.min(...humidities);

  return {
    current,
    high,
    low,
    data,
  };
}
