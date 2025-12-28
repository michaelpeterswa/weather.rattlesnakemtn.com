"use server";

export interface ForecastPeriod {
  number: number;
  name: string;
  startTime: string;
  endTime: string;
  isDaytime: boolean;
  temperature: number;
  temperatureUnit: string;
  temperatureTrend: string | null;
  probabilityOfPrecipitation: {
    unitCode: string;
    value: number | null;
  };
  windSpeed: string;
  windDirection: string;
  icon: string;
  shortForecast: string;
  detailedForecast: string;
}

export interface NWSForecast {
  generatedAt: string;
  updateTime: string;
  periods: ForecastPeriod[];
}

const NWS_FORECAST_URL =
  "https://api.weather.gov/gridpoints/SEW/139,58/forecast";

export async function getNWSForecast(): Promise<NWSForecast> {
  const response = await fetch(NWS_FORECAST_URL, {
    headers: {
      "User-Agent": "weather.rattlesnakemtn.com",
      Accept: "application/geo+json",
    },
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch NWS forecast: ${response.status}`);
  }

  const data = await response.json();

  return {
    generatedAt: data.properties.generatedAt,
    updateTime: data.properties.updateTime,
    periods: data.properties.periods,
  };
}
