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
import { getDewPointData, DewPointStats } from "@/app/actions/dew-point";
import { getUVData, UVStats } from "@/app/actions/uv";
import {
  getPrecipitationData,
  PrecipitationStats,
} from "@/app/actions/precipitation";
import { getLightningData, LightningStats } from "@/app/actions/lightning";
import {
  getSolarRadiationData,
  SolarRadiationStats,
} from "@/app/actions/solar-radiation";
import {
  getIlluminanceData,
  IlluminanceStats,
} from "@/app/actions/illuminance";

// Format large lux values for display (e.g., 50000 -> "50k")
function formatLux(lux: number): string {
  if (lux >= 1000) {
    return `${Math.round(lux / 100) / 10}k`;
  }
  return String(Math.round(lux));
}

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
  const [dewPoint, setDewPoint] = useState<WeatherState<DewPointStats>>({
    data: null,
    loading: true,
    error: null,
  });
  const [uv, setUV] = useState<WeatherState<UVStats>>({
    data: null,
    loading: true,
    error: null,
  });
  const [precipitation, setPrecipitation] = useState<WeatherState<PrecipitationStats>>({
    data: null,
    loading: true,
    error: null,
  });
  const [lightning, setLightning] = useState<WeatherState<LightningStats>>({
    data: null,
    loading: true,
    error: null,
  });
  const [solarRadiation, setSolarRadiation] = useState<WeatherState<SolarRadiationStats>>({
    data: null,
    loading: true,
    error: null,
  });
  const [illuminance, setIlluminance] = useState<WeatherState<IlluminanceStats>>({
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

    async function fetchDewPoint() {
      try {
        const data = await getDewPointData();
        setDewPoint({ data, loading: false, error: null });
      } catch (err) {
        setDewPoint({
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : "Failed to fetch data",
        });
      }
    }

    async function fetchUV() {
      try {
        const data = await getUVData();
        setUV({ data, loading: false, error: null });
      } catch (err) {
        setUV({
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : "Failed to fetch data",
        });
      }
    }

    async function fetchPrecipitation() {
      try {
        const data = await getPrecipitationData();
        setPrecipitation({ data, loading: false, error: null });
      } catch (err) {
        setPrecipitation({
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : "Failed to fetch data",
        });
      }
    }

    async function fetchLightning() {
      try {
        const data = await getLightningData();
        setLightning({ data, loading: false, error: null });
      } catch (err) {
        setLightning({
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : "Failed to fetch data",
        });
      }
    }

    async function fetchSolarRadiation() {
      try {
        const data = await getSolarRadiationData();
        setSolarRadiation({ data, loading: false, error: null });
      } catch (err) {
        setSolarRadiation({
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : "Failed to fetch data",
        });
      }
    }

    async function fetchIlluminance() {
      try {
        const data = await getIlluminanceData();
        setIlluminance({ data, loading: false, error: null });
      } catch (err) {
        setIlluminance({
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
    fetchDewPoint();
    fetchUV();
    fetchPrecipitation();
    fetchLightning();
    fetchSolarRadiation();
    fetchIlluminance();
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

  const dewPointData: WeatherDataPoint[] =
    dewPoint.data?.data.map((d) => ({
      time: d.time,
      value: d.dewPoint,
    })) ?? [];

  const uvData: WeatherDataPoint[] =
    uv.data?.data.map((d) => ({
      time: d.time,
      value: d.uv,
    })) ?? [];

  const precipitationData: WeatherDataPoint[] =
    precipitation.data?.data.map((d) => ({
      time: d.time,
      value: d.precipitation,
    })) ?? [];

  const lightningData: WeatherDataPoint[] =
    lightning.data?.data.map((d) => ({
      time: d.time,
      value: d.strikes,
    })) ?? [];

  const solarRadiationData: WeatherDataPoint[] =
    solarRadiation.data?.data.map((d) => ({
      time: d.time,
      value: d.radiation,
    })) ?? [];

  const illuminanceData: WeatherDataPoint[] =
    illuminance.data?.data.map((d) => ({
      time: d.time,
      value: d.illuminance,
    })) ?? [];

  return (
    <div className="flex items-center justify-center px-4 lg:px-6 w-full">
      <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 w-full">
        <WeatherStatCard
          name="Temperature"
          unit="°F"
          color="#FF3366"
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
          color="#00FFFF"
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
          unit="inHg"
          color="#39FF14"
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
          unit="mph"
          color="#FF6B00"
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
                  style={{ color: "#FF6B00" }}
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

        <WeatherStatCard
          name="Dew Point"
          unit="°F"
          color="#BF00FF"
          currentValue={dewPoint.data?.current ?? null}
          lastUpdated={dewPoint.data?.lastUpdated}
          highValue={dewPoint.data?.high}
          lowValue={dewPoint.data?.low}
          data={dewPointData}
          loading={dewPoint.loading}
          error={dewPoint.error}
        />

        <WeatherStatCard
          name="UV Index"
          unit="UVI"
          color="#FFFF00"
          currentValue={uv.data?.current ?? null}
          lastUpdated={uv.data?.lastUpdated}
          highValue={uv.data?.high}
          lowValue={uv.data?.low}
          data={uvData}
          loading={uv.loading}
          error={uv.error}
        />

        <WeatherStatCard
          name="Precipitation"
          unit="in"
          color="#00BFFF"
          currentValue={precipitation.data?.current ?? null}
          lastUpdated={precipitation.data?.lastUpdated}
          description={`24h Total: ${precipitation.data?.total ?? 0} in`}
          data={precipitationData}
          loading={precipitation.loading}
          error={precipitation.error}
        />

        {/* Lightning */}
        <Card className="p-0">
          <CardContent className="p-4 h-full flex flex-col">
            <dt className="text-sm font-medium text-foreground">
              {lightning.loading ? (
                <div className="h-5 bg-muted rounded w-28 animate-pulse"></div>
              ) : (
                "Lightning"
              )}
            </dt>
            {lightning.loading ? (
              <>
                <div className="flex-1 flex items-center">
                  <div className="h-9 bg-muted rounded w-20 animate-pulse"></div>
                </div>
                <div className="h-5 bg-muted rounded w-32 animate-pulse"></div>
              </>
            ) : lightning.error ? (
              <dd className="text-sm text-destructive mt-2 flex-1 flex items-center">
                {lightning.error}
              </dd>
            ) : (
              <>
                <dd
                  className="text-4xl font-bold flex-1 flex items-center"
                  style={{ color: "#FF00FF" }}
                >
                  {lightning.data?.totalStrikes ?? 0} strikes
                </dd>
                <dd className="text-sm text-muted-foreground">
                  {lightning.data?.lastStrikeDistance
                    ? `Last: ${lightning.data.lastStrikeDistance} mi away`
                    : "No recent strikes"}
                </dd>
              </>
            )}
          </CardContent>
        </Card>

        <WeatherStatCard
          name="Solar Radiation"
          unit="W/m²"
          color="#FF1493"
          currentValue={solarRadiation.data?.current ?? null}
          lastUpdated={solarRadiation.data?.lastUpdated}
          highValue={solarRadiation.data?.high}
          lowValue={solarRadiation.data?.low}
          data={solarRadiationData}
          loading={solarRadiation.loading}
          error={solarRadiation.error}
        />

        <WeatherStatCard
          name="Illuminance"
          unit="lux"
          color="#00FF7F"
          currentValue={illuminance.data?.current ?? null}
          lastUpdated={illuminance.data?.lastUpdated}
          highValue={illuminance.data?.high}
          lowValue={illuminance.data?.low}
          description={illuminance.data?.current ? formatLux(illuminance.data.current) : undefined}
          data={illuminanceData}
          loading={illuminance.loading}
          error={illuminance.error}
        />
      </dl>
    </div>
  );
}
