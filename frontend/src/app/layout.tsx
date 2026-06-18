import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "mapbox-gl/dist/mapbox-gl.css";
import "./globals.css";

import { SessionProvider } from "@/components/auth/SessionProvider";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vambora Penedo",
  description:
    "Linhas, horários, rotas e pontos do transporte público de Penedo–AL num só lugar.",
  applicationName: "Vambora Penedo",
};

export const viewport: Viewport = {
  themeColor: "#f99006",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import { GlobalSplash } from "@/components/GlobalSplash";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-dvh flex flex-col font-sans bg-background text-foreground">
        <GlobalSplash />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}