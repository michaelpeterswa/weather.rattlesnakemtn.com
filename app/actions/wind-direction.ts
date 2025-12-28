"use server";

import { queryApi } from "@/lib/influxdb";

export interface WindDirectionStats {
  degrees: number;
  cardinal: string;
  cardinalFull: string;
}

const CARDINAL_DIRECTIONS = [
  { min: 0, max: 11.25, short: "N", full: "North" },
  { min: 11.25, max: 33.75, short: "NNE", full: "North-Northeast" },
  { min: 33.75, max: 56.25, short: "NE", full: "Northeast" },
  { min: 56.25, max: 78.75, short: "ENE", full: "East-Northeast" },
  { min: 78.75, max: 101.25, short: "E", full: "East" },
  { min: 101.25, max: 123.75, short: "ESE", full: "East-Southeast" },
  { min: 123.75, max: 146.25, short: "SE", full: "Southeast" },
  { min: 146.25, max: 168.75, short: "SSE", full: "South-Southeast" },
  { min: 168.75, max: 191.25, short: "S", full: "South" },
  { min: 191.25, max: 213.75, short: "SSW", full: "South-Southwest" },
  { min: 213.75, max: 236.25, short: "SW", full: "Southwest" },
  { min: 236.25, max: 258.75, short: "WSW", full: "West-Southwest" },
  { min: 258.75, max: 281.25, short: "W", full: "West" },
  { min: 281.25, max: 303.75, short: "WNW", full: "West-Northwest" },
  { min: 303.75, max: 326.25, short: "NW", full: "Northwest" },
  { min: 326.25, max: 348.75, short: "NNW", full: "North-Northwest" },
  { min: 348.75, max: 360, short: "N", full: "North" },
];

function degreesToCardinal(degrees: number): { short: string; full: string } {
  const normalized = ((degrees % 360) + 360) % 360;
  const direction = CARDINAL_DIRECTIONS.find(
    (d) => normalized >= d.min && normalized < d.max
  );
  return direction
    ? { short: direction.short, full: direction.full }
    : { short: "N", full: "North" };
}

export async function getWindDirectionData(): Promise<WindDirectionStats> {
  const bucket = process.env.INFLUXDB_BUCKET || "weather";
  const station = process.env.INFLUXDB_STATION || "ST-00190461";

  const fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: -1h)
      |> filter(fn: (r) => r["_measurement"] == "weather")
      |> filter(fn: (r) => r["station"] == "${station}")
      |> filter(fn: (r) => r["_field"] == "wind_direction")
      |> last()
      |> yield(name: "last")
  `;

  let degrees = 0;

  try {
    const rows = queryApi.iterateRows(fluxQuery);
    for await (const { values, tableMeta } of rows) {
      const row = tableMeta.toObject(values);
      degrees = row._value as number;
    }
  } catch (error) {
    console.error("Error querying InfluxDB:", error);
    throw new Error("Failed to fetch wind direction data");
  }

  const cardinal = degreesToCardinal(degrees);

  return {
    degrees,
    cardinal: cardinal.short,
    cardinalFull: cardinal.full,
  };
}
