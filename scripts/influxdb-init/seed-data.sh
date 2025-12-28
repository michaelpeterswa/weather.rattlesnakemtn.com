#!/bin/bash
set -e

# Seed InfluxDB with demo weather data
# This script runs automatically on first container startup

echo "Seeding InfluxDB with demo weather data..."

influx write \
  -b "${DOCKER_INFLUXDB_INIT_BUCKET}" \
  -o "${DOCKER_INFLUXDB_INIT_ORG}" \
  -f /docker-entrypoint-initdb.d/seed-data.lp

echo "Successfully seeded InfluxDB with 24 hours of demo data!"
