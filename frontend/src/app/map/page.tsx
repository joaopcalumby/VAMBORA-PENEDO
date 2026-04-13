"use client";

import dynamic from "next/dynamic";

const MapVisualizer = dynamic(() => import("@/components/map/MapVisualizer"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[#0B0E14] animate-pulse" />,
});

export default function MapPage() {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

  return (
    <main className="h-screen w-full bg-[#0B0E14]">
      <MapVisualizer selectedRoute={null} token={mapboxToken} />
    </main>
  );
}