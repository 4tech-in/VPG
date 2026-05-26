"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { cn } from "@/lib/utils"

// Fix default marker icon issues with Next.js webpack build
const customIcon = L.icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

interface MapProps {
  latitude: number
  longitude: number
  radius: number
  onChange: (lat: number, lng: number) => void
}

function MapUpdater({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMapEvents({})
  useEffect(() => {
    if (latitude && longitude) {
      map.setView([latitude, longitude], map.getZoom())
    }
  }, [latitude, longitude, map])
  return null
}

function MapEventsHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function GeofenceMap({ latitude, longitude, radius, onChange }: MapProps) {
  const [position, setPosition] = useState<[number, number]>([latitude || 30.7333, longitude || 76.7794])
  const [isSatellite, setIsSatellite] = useState(false)

  useEffect(() => {
    if (latitude && longitude) {
      setPosition([latitude, longitude])
    }
  }, [latitude, longitude])

  return (
    <div className="h-72 w-full rounded-2xl overflow-hidden border border-zinc-100 shadow-inner relative z-10">
      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={() => setIsSatellite(!isSatellite)}
        className="absolute top-3 right-3 z-[1000] bg-white border border-zinc-200/80 px-3.5 py-2 rounded-xl shadow-lg font-bold text-[10px] text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 active:scale-95 transition-all uppercase tracking-wider select-none"
      >
        <span className={cn("h-2.5 w-2.5 rounded-full border border-white", isSatellite ? "bg-teal-500 shadow shadow-teal-500/50" : "bg-zinc-400")} />
        {isSatellite ? "Map View" : "Satellite"}
      </button>

      <MapContainer
        center={position}
        zoom={13}
        className="h-full w-full"
      >
        {/* Dynamic TileLayer based on isSatellite state */}
        <TileLayer
          key={isSatellite ? "satellite-tiles" : "roadmap-tiles"}
          attribution='&copy; <a href="https://maps.google.com">Google Maps</a>'
          url={isSatellite 
            ? "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" 
            : "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          }
        />
        <MapUpdater latitude={position[0]} longitude={position[1]} />
        <MapEventsHandler onChange={(lat, lng) => {
          setPosition([lat, lng])
          onChange(lat, lng)
        }} />
        {position[0] && position[1] && (
          <>
            <Marker position={position} icon={customIcon} />
            {radius > 0 && (
              <Circle
                center={position}
                radius={radius}
                pathOptions={{
                  fillColor: "#0f766e",
                  fillOpacity: 0.25,
                  color: "#0f766e",
                  weight: 2,
                }}
              />
            )}
          </>
        )}
      </MapContainer>
    </div>
  )
}
