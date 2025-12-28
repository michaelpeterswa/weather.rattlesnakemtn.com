# Rattlesnake Mountain Weather Dashboard

A real-time weather dashboard for Rattlesnake Mountain, featuring interactive charts, current conditions, and 7-day forecasts from the National Weather Service.

## Features

- **Current Conditions** - Temperature, humidity, pressure, wind speed, and wind direction with sparkline visualizations
- **Interactive Charts** - Historical weather data across configurable time ranges (24h, 7d, 30d, 90d)
- **7-Day Forecast** - NWS forecast with temperature, wind, and precipitation data
- **Dark/Light Mode** - Theme toggle with system preference support
- **Responsive Design** - Optimized for desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 16 with React 19 and TypeScript
- **UI**: Tailwind CSS, Radix UI, shadcn/ui components
- **Charts**: Recharts
- **Database**: InfluxDB (time-series weather data)
- **API**: National Weather Service API
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

## Project Structure

```
├── app/
│   ├── actions/          # Server actions for data fetching
│   ├── layout.tsx        # Root layout with theme provider
│   └── page.tsx          # Dashboard home page
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── weather-stats.tsx # Weather stats cards
│   ├── chart-area-interactive.tsx
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
