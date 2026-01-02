# Rattlesnake Mountain Weather Dashboard

A real-time weather dashboard for Rattlesnake Mountain, featuring interactive charts, current conditions, and 7-day forecasts from the National Weather Service.

## Features

- **Current Conditions** - Real-time weather metrics with sparkline visualizations:
  - Temperature, Humidity, Pressure
  - Wind Speed and Direction
  - Dew Point, UV Index
  - Precipitation, Lightning Detection
  - Solar Radiation, Illuminance
- **Interactive Charts** - Historical weather data across configurable time ranges (24h, 7d, 30d, 90d) with vibrant neon color coding
- **7-Day Forecast** - NWS forecast with temperature, wind, and precipitation data
- **SNOTEL Snow Depth** - Real-time snow depth data from nearby SNOTEL stations
- **Dark/Light Mode** - Theme toggle with system preference support and glow effects on charts
- **Responsive Design** - Optimized for desktop and mobile devices

## Data Sources

### Weather Station

Current conditions are collected from a [WeatherFlow Tempest](https://tempest.earth/) station located on Rattlesnake Mountain. The station reports the following metrics to InfluxDB:

- Temperature, Humidity, Pressure
- Wind Speed and Direction
- Dew Point, UV Index
- Precipitation and Lightning Detection
- Solar Radiation and Illuminance

### NWS Forecast

The 7-day forecast is sourced from the [National Weather Service API](https://www.weather.gov/documentation/services-web-api) using grid point SEW/139,58. Note that the NWS grid point is approximately 200 ft lower in elevation than the station, so forecast temperatures may differ slightly from observed conditions.

### SNOTEL Snow Depth

Snow depth data is sourced from the [USDA NRCS SNOTEL](https://www.nrcs.usda.gov/wps/portal/wcc/home/aboutUs/monitoringPrograms/automatedSnowMonitoring/) network via the [AWDB REST API](https://wcc.sc.egov.usda.gov/awdbRestApi/swagger-ui/index.html). The dashboard displays hourly snow depth readings from nearby SNOTEL stations, with each station showing its distance and direction from Rattlesnake Mountain along with elevation. Default stations include Mount Gardner, Tinkham Creek, and Skookum Creek.

## Tech Stack

- **Framework**: Next.js 16 with React 19 and TypeScript
- **UI**: Tailwind CSS, Radix UI, shadcn/ui components
- **Charts**: Recharts
- **Database**: InfluxDB (time-series weather data)
- **APIs**: National Weather Service, USDA SNOTEL
- **Runtime**: Bun

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 20+
- Docker (for InfluxDB)

### Installation

```bash
# Install dependencies
bun install

# Copy environment template
cp .env.example .env.local

# Start InfluxDB
docker-compose up -d

# Run development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `INFLUXDB_URL` | InfluxDB server URL |
| `INFLUXDB_TOKEN` | InfluxDB authentication token |
| `INFLUXDB_ORG` | InfluxDB organization |
| `INFLUXDB_BUCKET` | InfluxDB bucket name |
| `INFLUXDB_STATION` | Weather station identifier |
| `SNOTEL_STATION_TRIPLETS` | Comma-separated SNOTEL station IDs (e.g., `898:WA:SNTL,899:WA:SNTL`) |

## Project Structure

```
├── app/
│   ├── actions/          # Server actions for data fetching
│   │   ├── temperature.ts, humidity.ts, pressure.ts
│   │   ├── wind.ts, wind-direction.ts
│   │   ├── dew-point.ts, uv.ts
│   │   ├── precipitation.ts, lightning.ts
│   │   ├── solar-radiation.ts, illuminance.ts
│   │   ├── chart-data.ts # Combined chart data fetching
│   │   └── snotel.ts     # SNOTEL API integration
│   ├── layout.tsx        # Root layout with theme provider
│   └── page.tsx          # Dashboard home page
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── weather-stats.tsx # Weather stats cards with sparklines
│   ├── weather-stat-card.tsx # Individual stat card component
│   ├── chart-area-interactive.tsx # Main interactive chart
│   ├── snotel-snow-depth.tsx # SNOTEL snow depth chart
│   └── nws-forecast.tsx  # NWS forecast display
├── lib/
│   └── influxdb.ts       # InfluxDB client configuration
└── scripts/
    └── influxdb-init/    # Database initialization
```

## Deployment

### Docker

```bash
# Build image
docker build -t weather.rattlesnakemtn.com .

# Run container
docker run -p 3000:3000 \
  -e INFLUXDB_URL=http://influxdb:8086 \
  -e INFLUXDB_TOKEN=your-token \
  -e INFLUXDB_ORG=weather-org \
  -e INFLUXDB_BUCKET=weather \
  -e INFLUXDB_STATION=ST-00190461 \
  weather.rattlesnakemtn.com
```

### CI/CD

The project includes GitHub Actions workflows for:

- **Pull Requests**: Commitlint, yamllint, hadolint
- **Releases**: Semantic versioning with conventional commits
- **Docker**: Multi-platform image builds (amd64, arm64) published to GHCR

## License

MIT
