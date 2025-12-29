import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Cloud, Database, Globe, Mountain, Thermometer } from "lucide-react";

export default function AboutPage() {
  return (
    <SidebarProvider
      defaultOpen={false}
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-6 py-6 px-4 lg:px-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">About</h1>
                <p className="text-muted-foreground">
                  Learn more about the Rattlesnake Mountain Weather Station
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Thermometer className="size-5 text-primary" />
                      <CardTitle>Weather Station</CardTitle>
                    </div>
                    <CardDescription>
                      Real-time weather monitoring
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p>
                      This dashboard displays real-time weather data collected
                      from a personal weather station located on Rattlesnake
                      Mountain. The station monitors temperature, humidity,
                      barometric pressure, and wind conditions around the clock.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Database className="size-5 text-primary" />
                      <CardTitle>Data Collection</CardTitle>
                    </div>
                    <CardDescription>
                      Powered by InfluxDB
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p>
                      Weather observations are collected continuously and stored
                      in InfluxDB, a time-series database optimized for
                      high-volume sensor data. This allows for efficient
                      querying of historical data across various time ranges.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Globe className="size-5 text-primary" />
                      <CardTitle>Technology Stack</CardTitle>
                    </div>
                    <CardDescription>
                      Modern web technologies
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p>
                      Built with Next.js and React, this application provides a
                      responsive interface for viewing weather data on any
                      device. The frontend queries InfluxDB directly to fetch
                      and display weather observations.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Cloud className="size-5 text-primary" />
                      <CardTitle>NWS Integration</CardTitle>
                    </div>
                    <CardDescription>
                      National Weather Service forecasts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p>
                      In addition to local observations, the dashboard
                      integrates with the National Weather Service API to
                      provide official weather forecasts for the Rattlesnake
                      Mountain area.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Mountain className="size-5 text-primary" />
                      <CardTitle>SNOTEL Data</CardTitle>
                    </div>
                    <CardDescription>
                      USDA snow monitoring network
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p>
                      Snow depth data is sourced from nearby SNOTEL stations
                      operated by the USDA Natural Resources Conservation
                      Service. Each station displays its distance and direction
                      from Rattlesnake Mountain along with elevation.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
