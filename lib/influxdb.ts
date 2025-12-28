import { InfluxDB } from "@influxdata/influxdb-client";

const url = process.env.INFLUXDB_URL || "http://localhost:8086";
const token = process.env.INFLUXDB_TOKEN || "";
const org = process.env.INFLUXDB_ORG || "";
const bucket = process.env.INFLUXDB_BUCKET || "";

export const influxDB = new InfluxDB({ url, token });

export const queryApi = influxDB.getQueryApi(org);

export const getInfluxConfig = () => ({
  url,
  org,
  bucket,
});
