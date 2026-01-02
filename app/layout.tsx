import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rattlesnake Mountain Weather",
  description:
    "Real-time weather conditions from Rattlesnake Mountain, featuring current temperature, humidity, wind, pressure, and 7-day forecasts from a WeatherFlow Tempest station.",
  metadataBase: new URL("https://weather.rattlesnakemtn.com"),
  openGraph: {
    title: "Rattlesnake Mountain Weather",
    description:
      "Live weather dashboard with interactive charts, NWS forecasts, and SNOTEL snow depth data from Rattlesnake Mountain.",
    type: "website",
    url: "https://weather.rattlesnakemtn.com",
    siteName: "Rattlesnake Mountain Weather",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rattlesnake Mountain Weather",
    description:
      "Live weather dashboard with interactive charts, NWS forecasts, and SNOTEL snow depth data.",
  },
  appleWebApp: {
    capable: true,
    title: "RSM Weather",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased vhs-chromatic`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <div className="vhs-overlay" />
        </ThemeProvider>
      </body>
    </html>
  );
}
