#!/usr/bin/env bun
/**
 * Generate recent weather data for InfluxDB
 * Run with: bun scripts/generate-recent-data.ts
 */

const INFLUXDB_URL = process.env.INFLUXDB_URL || "http://localhost:8086";
const INFLUXDB_TOKEN = process.env.INFLUXDB_TOKEN || "dev-token-weather-rattlesnake";
const INFLUXDB_ORG = process.env.INFLUXDB_ORG || "weather-org";
const INFLUXDB_BUCKET = process.env.INFLUXDB_BUCKET || "weather";
const STATION = "ST-00190461";

function generateDataPoint(timestampNs: bigint, hourOfDay: number): string {
  // Base temperature varies with time of day (colder at night, warmer during day)
  const baseTemp = 5 + 5 * Math.sin(((hourOfDay - 6) * Math.PI) / 12);
  const temp = (baseTemp + (Math.random() * 2 - 1)).toFixed(2);

  // Humidity inversely related to temperature
  const baseHumidity = 85 - 10 * Math.sin(((hourOfDay - 6) * Math.PI) / 12);
  const humidity = (baseHumidity + (Math.random() * 5 - 2.5)).toFixed(2);

  // Pressure varies slowly
  const pressure = (1013 + (Math.random() * 4 - 2)).toFixed(2);

  // Wind speed
  const windAvg = (3 + Math.random() * 5).toFixed(2);
  const windGust = (parseFloat(windAvg) + 2 + Math.random() * 2).toFixed(2);
  const windLull = (parseFloat(windAvg) - 1.5).toFixed(2);
  const windDir = Math.floor(250 + Math.random() * 40);

  // Dew point (rough calculation)
  const dewPoint = (parseFloat(temp) - (100 - parseFloat(humidity)) / 5).toFixed(2);

  return `weather,station=${STATION} battery=2.55,dew_point=${dewPoint},humidity=${humidity},illuminance=0i,p=${pressure},precipitation=0.00,precipitation_type=0i,solar_radiation=0i,strike_count=0i,strike_distance=0i,temp=${temp},uv=0.00,wind_avg=${windAvg},wind_direction=${windDir}i,wind_gust=${windGust},wind_lull=${windLull} ${timestampNs}`;
}

async function main() {
  console.log("Generating recent weather data...");

  const now = Date.now();
  const nowNs = BigInt(now) * BigInt(1_000_000);
  const lines: string[] = [];

  // Generate 24 hours of data at 15-minute intervals (96 data points)
  console.log("Generating 24 hours of historical data (15-min intervals)...");
  for (let i = 96; i >= 1; i--) {
    const offsetMs = i * 15 * 60 * 1000; // 15 minutes in ms
    const timestampMs = now - offsetMs;
    const timestampNs = BigInt(timestampMs) * BigInt(1_000_000);
    const hourOfDay = new Date(timestampMs).getHours();
    lines.push(generateDataPoint(timestampNs, hourOfDay));
  }

  // Generate last hour at 1-minute intervals for more recent data
  console.log("Generating recent data (last hour at 1-min intervals)...");
  const currentHour = new Date().getHours();
  for (let i = 60; i >= 0; i--) {
    const offsetMs = i * 60 * 1000; // 1 minute in ms
    const timestampMs = now - offsetMs;
    const timestampNs = BigInt(timestampMs) * BigInt(1_000_000);
    lines.push(generateDataPoint(timestampNs, currentHour));
  }

  console.log(`Generated ${lines.length} data points`);

  // Write to InfluxDB
  const lineProtocol = lines.join("\n");
  const url = `${INFLUXDB_URL}/api/v2/write?org=${INFLUXDB_ORG}&bucket=${INFLUXDB_BUCKET}&precision=ns`;

  console.log(`Writing data to InfluxDB at ${INFLUXDB_URL}...`);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Token ${INFLUXDB_TOKEN}`,
        "Content-Type": "text/plain",
      },
      body: lineProtocol,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    console.log("Successfully generated and loaded recent weather data!");
  } catch (error) {
    console.error("Error writing to InfluxDB:", error);
    process.exit(1);
  }
}

main();
