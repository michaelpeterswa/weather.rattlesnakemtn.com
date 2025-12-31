#!/bin/bash
# Generate recent weather data for InfluxDB
# This script generates 24 hours of data with timestamps relative to NOW

set -e

# Configuration
INFLUXDB_URL="${INFLUXDB_URL:-http://localhost:8086}"
INFLUXDB_TOKEN="${INFLUXDB_TOKEN:-dev-token-weather-rattlesnake}"
INFLUXDB_ORG="${INFLUXDB_ORG:-weather-org}"
INFLUXDB_BUCKET="${INFLUXDB_BUCKET:-weather}"
STATION="ST-00190461"

# Generate 24 hours of data at 15-minute intervals (96 data points)
# Plus some extra recent data at 1-minute intervals for the last hour

echo "Generating recent weather data..."

# Get current time in nanoseconds
now_ns=$(date +%s)000000000

# Function to generate a data point
generate_point() {
    local timestamp_ns=$1
    local hour_of_day=$2

    # Base temperature varies with time of day (colder at night, warmer during day)
    # Hour 0-6: cold (around 2-5°C), Hour 12-15: warm (around 8-12°C)
    local base_temp=$(echo "scale=2; 5 + 5 * s(($hour_of_day - 6) * 3.14159 / 12)" | bc -l)
    local temp=$(echo "scale=2; $base_temp + ($RANDOM % 200 - 100) / 100" | bc)

    # Humidity inversely related to temperature (higher at night)
    local base_humidity=$(echo "scale=2; 85 - 10 * s(($hour_of_day - 6) * 3.14159 / 12)" | bc -l)
    local humidity=$(echo "scale=2; $base_humidity + ($RANDOM % 500 - 250) / 100" | bc)

    # Pressure varies slowly
    local pressure=$(echo "scale=2; 1013 + ($RANDOM % 400 - 200) / 100" | bc)

    # Wind speed
    local wind_avg=$(echo "scale=2; 3 + ($RANDOM % 500) / 100" | bc)
    local wind_gust=$(echo "scale=2; $wind_avg + 2 + ($RANDOM % 200) / 100" | bc)
    local wind_lull=$(echo "scale=2; $wind_avg - 1.5" | bc)
    local wind_dir=$((250 + RANDOM % 40))

    # Dew point (rough calculation)
    local dew_point=$(echo "scale=2; $temp - (100 - $humidity) / 5" | bc)

    echo "weather,station=$STATION battery=2.55,dew_point=$dew_point,humidity=$humidity,illuminance=0i,p=$pressure,precipitation=0.00,precipitation_type=0i,solar_radiation=0i,strike_count=0i,strike_distance=0i,temp=$temp,uv=0.00,wind_avg=$wind_avg,wind_direction=${wind_dir}i,wind_gust=$wind_gust,wind_lull=$wind_lull $timestamp_ns"
}

# Create temporary file for line protocol data
tmpfile=$(mktemp)

# Generate 24 hours of data at 15-minute intervals
echo "Generating 24 hours of historical data..."
for i in $(seq 96 -1 1); do
    # Calculate timestamp (15 minutes = 900 seconds = 900000000000 nanoseconds)
    offset_ns=$((i * 900 * 1000000000))
    timestamp_ns=$((now_ns - offset_ns))

    # Calculate hour of day for this timestamp
    timestamp_sec=$((timestamp_ns / 1000000000))
    hour_of_day=$(date -r $timestamp_sec +%H 2>/dev/null || date -d "@$timestamp_sec" +%H)
    hour_of_day=$((10#$hour_of_day))  # Remove leading zeros

    generate_point $timestamp_ns $hour_of_day >> "$tmpfile"
done

# Generate last hour at 1-minute intervals for more recent data
echo "Generating recent data (last hour at 1-minute intervals)..."
current_hour=$(date +%H)
current_hour=$((10#$current_hour))
for i in $(seq 60 -1 0); do
    # Calculate timestamp (1 minute = 60 seconds)
    offset_ns=$((i * 60 * 1000000000))
    timestamp_ns=$((now_ns - offset_ns))

    generate_point $timestamp_ns $current_hour >> "$tmpfile"
done

echo "Generated $(wc -l < "$tmpfile") data points"

# Write to InfluxDB
echo "Writing data to InfluxDB at $INFLUXDB_URL..."
curl -s -XPOST "$INFLUXDB_URL/api/v2/write?org=$INFLUXDB_ORG&bucket=$INFLUXDB_BUCKET&precision=ns" \
    -H "Authorization: Token $INFLUXDB_TOKEN" \
    -H "Content-Type: text/plain" \
    --data-binary @"$tmpfile"

# Cleanup
rm "$tmpfile"

echo "Successfully generated and loaded recent weather data!"
