"use server";

export interface SnotelDataPoint {
  date: string;
  value: number;
}

export interface SnotelStationData {
  stationTriplet: string;
  stationName: string;
  data: SnotelDataPoint[];
}

export interface SnotelResponse {
  stations: SnotelStationData[];
  unit: string;
}

interface SnotelApiStationElement {
  elementCode: string;
  ordinal: number;
  heightDepth: {
    value: number;
    unitCode: string;
  } | null;
  durationName: string;
  storedUnitCode: string;
  originalUnitCode: string;
  beginDate: string;
  endDate: string;
}

interface SnotelApiDataValue {
  date: string;
  value: number | null;
}

interface SnotelApiStationDataEntry {
  stationElement: SnotelApiStationElement;
  values: SnotelApiDataValue[];
}

interface SnotelApiStation {
  stationTriplet: string;
  data: SnotelApiStationDataEntry[];
}

interface SnotelApiStationMetadata {
  stationTriplet: string;
  name: string;
  elevation: number;
  latitude: number;
  longitude: number;
}

interface StationInfo {
  name: string;
  elevation: number;
  latitude: number;
  longitude: number;
}

// Reference location (Rattlesnake Mountain)
const REFERENCE_LAT = 47.470597;
const REFERENCE_LON = -121.825356;

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Haversine formula - returns distance in miles
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLon = toRadians(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRadians(lat2));
  const x =
    Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) -
    Math.sin(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(dLon);
  const bearing = toDegrees(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

function bearingToDirection(bearing: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

async function fetchStationMetadata(
  stationTriplets: string
): Promise<Record<string, StationInfo>> {
  const params = new URLSearchParams({
    stationTriplets: stationTriplets,
    returnForecastPointMetadata: "false",
    returnReservoirMetadata: "false",
    returnStationElements: "false",
    activeOnly: "true",
  });

  const url = `https://wcc.sc.egov.usda.gov/awdbRestApi/services/v1/stations?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "weather.rattlesnakemtn.com",
    },
    next: {
      revalidate: 86400, // Cache for 24 hours (station metadata rarely changes)
    },
  });

  if (!response.ok) {
    return {};
  }

  const stations: SnotelApiStationMetadata[] = await response.json();
  const metadataMap: Record<string, StationInfo> = {};
  stations.forEach((station) => {
    metadataMap[station.stationTriplet] = {
      name: station.name,
      elevation: station.elevation,
      latitude: station.latitude,
      longitude: station.longitude,
    };
  });
  return metadataMap;
}

function formatDateForApi(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function getSnotelSnowDepth(): Promise<SnotelResponse> {
  // Default stations - can be overridden by environment variable
  const stationTriplets =
    process.env.SNOTEL_STATION_TRIPLETS ||
    "898:WA:SNTL,899:WA:SNTL,912:WA:SNTL";

  // Calculate begin date (3 days ago)
  const now = new Date();
  const beginDate = new Date(now);
  beginDate.setDate(beginDate.getDate() - 3);

  const params = new URLSearchParams({
    stationTriplets: stationTriplets,
    elements: "SNWD",
    duration: "HOURLY",
    beginDate: formatDateForApi(beginDate),
    endDate: "0", // 0 means current date
    returnFlags: "false",
    returnOriginalValues: "false",
    returnSuspectData: "false",
  });

  const url = `https://wcc.sc.egov.usda.gov/awdbRestApi/services/v1/data?${params.toString()}`;

  try {
    // Fetch station metadata and data in parallel
    const [stationMetadata, response] = await Promise.all([
      fetchStationMetadata(stationTriplets),
      fetch(url, {
        headers: {
          "User-Agent": "weather.rattlesnakemtn.com",
        },
        next: {
          revalidate: 3600, // Cache for 1 hour
        },
      }),
    ]);

    if (!response.ok) {
      throw new Error(`SNOTEL API returned ${response.status}`);
    }

    const apiData: SnotelApiStation[] = await response.json();

    const stations: SnotelStationData[] = apiData
      .filter(
        (station) =>
          station.data &&
          station.data.length > 0 &&
          station.data[0].values &&
          Array.isArray(station.data[0].values)
      )
      .map((station) => {
        const metadata = stationMetadata[station.stationTriplet];
        const name = metadata?.name || station.stationTriplet;
        const elevation = metadata?.elevation;

        let stationName = name;
        if (metadata?.latitude && metadata?.longitude) {
          const distance = calculateDistance(
            REFERENCE_LAT,
            REFERENCE_LON,
            metadata.latitude,
            metadata.longitude
          );
          const bearing = calculateBearing(
            REFERENCE_LAT,
            REFERENCE_LON,
            metadata.latitude,
            metadata.longitude
          );
          const direction = bearingToDirection(bearing);
          stationName = `${name} (${Math.round(distance)} mi ${direction}`;
          if (elevation) {
            stationName += `, ${elevation.toLocaleString()} ft)`;
          } else {
            stationName += ")";
          }
        } else if (elevation) {
          stationName = `${name} (${elevation.toLocaleString()} ft)`;
        }

        return {
          stationTriplet: station.stationTriplet,
          stationName,
          data: station.data[0].values
            .filter((v: SnotelApiDataValue) => v.value !== null)
            .map((v: SnotelApiDataValue) => ({
              date: v.date,
              value: v.value as number,
            })),
        };
      });

    return {
      stations,
      unit: "in",
    };
  } catch (error) {
    console.error("Error fetching SNOTEL data:", error);
    throw new Error("Failed to fetch SNOTEL snow depth data");
  }
}
