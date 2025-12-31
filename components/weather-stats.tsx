"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  WeatherStatCard,
  WeatherDataPoint,
} from "@/components/weather-stat-card";
import {
  getTemperatureData,
  TemperatureStats,
} from "@/app/actions/temperature";
import { getHumidityData, HumidityStats } from "@/app/actions/humidity";
import { getPressureData, PressureStats } from "@/app/actions/pressure";
import { getWindData, WindStats } from "@/app/actions/wind";
import {
  getWindDirectionData,
  WindDirectionStats,
} from "@/app/actions/wind-direction";

interface WeatherState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export default function WeatherStats() {
  const [temperature, setTemperature] = useState<WeatherState<TemperatureStats>>({
    data: null,
    loading: true,
    error: null,
  });
  const [humidity, setHumidity] = useState<WeatherState<HumidityStats>>({
    data: null,
    loading: true,
    error: null,
  });
  const [pressure, setPressure] = useState<WeatherState<PressureStats>>({
    data: null,
    loading: true,
    error: null,
  });
  const [wind, setWind] = useState<WeatherState<WindStats>>({
    data: null,
    loading: true,
    error: null,
  });
  const [windDirection, setWindDirection] = useState<WeatherState<WindDirectionStats>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchTemperature() {
      try {
        const data = await getTemperatureData();
        setTemperature({ data, loading: false, error: null });
      } catch (err) {
        setTemperature({
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : "Failed to fetch data",
        });
      }
    }

    async function fetchHumidity() {
      try {
        const data = await getHumidityData();
        setHumidity({ data, loading: false, error: null });
      } catch (err) {
        setHumidity({
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : "Failed to fetch data",
        });
      }
    }

    async function fetchPressure() {
      try {
        const data = await getPressureData();
        setPressure({ data, loading: false, error: null });
      } catch (err) {
        setPressure({
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : "Failed to fetch data",
        });
      }
    }

    async function fetchWind() {
      try {
        const data = await getWindData();
        setWind({ data, loading: false, error: null });
      } catch (err) {
        setWind({
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : "Failed to fetch data",
        });
      }
    }

    async function fetchWindDirection() {
      try {
        const data = await getWindDirectionData();
        setWindDirection({ data, loading: false, error: null });
      } catch (err) {
        setWindDirection({
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : "Failed to fetch data",
        });
      }
    }

    fetchTemperature();
    fetchHumidity();
    fetchPressure();
    fetchWind();
    fetchWindDirection();
  }, []);

  const temperatureData: WeatherDataPoint[] =
    temperature.data?.data.map((d) => ({
      time: d.time,
      value: d.temperature,
    })) ?? [];

  const humidityData: WeatherDataPoint[] =
    humidity.data?.data.map((d) => ({
      time: d.time,
      value: d.humidity,
    })) ?? [];

  const pressureData: WeatherDataPoint[] =
    pressure.data?.data.map((d) => ({
      time: d.time,
      value: d.pressure,
    })) ?? [];

  const windData: WeatherDataPoint[] =
    wind.data?.data.map((d) => ({
      time: d.time,
      value: d.speed,
    })) ?? [];

  return (
    <div className="flex items-center justify-center px-4 lg:px-6 w-full">
      <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 w-full">
        <WeatherStatCard
          name="Temperature"
          unit="°F"
          color="hsl(24 95% 53%)"
          currentValue={temperature.data?.current ?? null}
          lastUpdated={temperature.data?.lastUpdated}
          highValue={temperature.data?.high}
          lowValue={temperature.data?.low}
          data={temperatureData}
          loading={temperature.loading}
          error={temperature.error}
        />

        <WeatherStatCard
          name="Humidity"
          unit="%"
          color="hsl(199 89% 48%)"
          currentValue={humidity.data?.current ?? null}
          lastUpdated={humidity.data?.lastUpdated}
          highValue={humidity.data?.high}
          lowValue={humidity.data?.low}
          data={humidityData}
          loading={humidity.loading}
          error={humidity.error}
        />

        <WeatherStatCard
          name="Pressure"
          unit=" inHg"
          color="hsl(142 76% 36%)"
          currentValue={pressure.data?.current ?? null}
          lastUpdated={pressure.data?.lastUpdated}
          highValue={pressure.data?.high}
          lowValue={pressure.data?.low}
          description={pressure.data?.trend ? `${pressure.data.trend.charAt(0).toUpperCase()}${pressure.data.trend.slice(1)}` : undefined}
          data={pressureData}
          loading={pressure.loading}
          error={pressure.error}
        />

        <WeatherStatCard
          name="Wind"
          unit=" mph"
          color="hsl(262 83% 58%)"
          currentValue={wind.data?.current ?? null}
          lastUpdated={wind.data?.lastUpdated}
          highValue={wind.data?.high}
          lowValue={wind.data?.low}
          description={wind.data?.gust ? `Gust: ${wind.data.gust} mph` : undefined}
          data={windData}
          loading={wind.loading}
          error={wind.error}
        />

        {/* Wind Direction */}
        <Card className="p-0">
          <CardContent className="p-4 h-full flex flex-col">
            <dt className="text-sm font-medium text-foreground">
              {windDirection.loading ? (
                <div className="h-5 bg-muted rounded w-28 animate-pulse"></div>
              ) : (
                "Wind Direction"
              )}
            </dt>
            {windDirection.loading ? (
              <>
                <div className="flex-1 flex items-center">
                  <div className="h-9 bg-muted rounded w-16 animate-pulse"></div>
                </div>
                <div className="h-5 bg-muted rounded w-32 animate-pulse"></div>
              </>
            ) : windDirection.error ? (
              <dd className="text-sm text-destructive mt-2 flex-1 flex items-center">
                {windDirection.error}
              </dd>
            ) : (
              <>
                <dd
                  className="text-6xl font-bold flex-1 flex items-center"
                  style={{ color: "hsl(262 83% 58%)" }}
                >
                  {windDirection.data?.cardinal ?? "--"}
                </dd>
                <dd className="text-sm text-muted-foreground">
                  {windDirection.data?.cardinalFull ?? "Unknown"}
                </dd>
              </>
            )}
          </CardContent>
        </Card>
      </dl>
    </div>
  );
}
