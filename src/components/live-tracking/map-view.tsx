"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface MapViewProps {
  center: [number, number]
  zoom: number
  mapType?: "roadmap" | "satellite"
  showTraffic?: boolean
}

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    if (map) {
      map.setView(center, zoom)
    }
  }, [center, zoom, map])
  return null
}

export default function MapView({ center, zoom, mapType = "roadmap", showTraffic = false }: MapViewProps) {
  const [isMounted, setIsMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsMounted(true)
    
    // Fix for default marker icons
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    })

    return () => {
      setIsMounted(false)
    }
  }, [])

  // Force re-render with a unique key if the coordinates or layer changes significantly
  const mapKey = useMemo(() => `map-${center[0].toFixed(4)}-${center[1].toFixed(4)}-${mapType}-${showTraffic}`, [center, mapType, showTraffic])

  const tileUrl = useMemo(() => {
    const layerType = mapType === "satellite" ? "y" : "m"
    const trafficSuffix = showTraffic ? ",traffic" : ""
    return `https://mt1.google.com/vt/lyrs=${layerType}${trafficSuffix}&x={x}&y={y}&z={z}`
  }, [mapType, showTraffic])

  if (!isMounted) {
    return (
      <div className="h-full w-full bg-zinc-50 animate-pulse flex items-center justify-center font-bold text-zinc-300 uppercase tracking-widest text-[10px]">
        Syncing Map...
      </div>
    )
  }

  return (
    <div ref={containerRef} className="h-full w-full relative">
      <MapContainer 
        key={mapKey}
        center={center} 
        zoom={zoom} 
        className="h-full w-full z-0"
        zoomControl={false}
        scrollWheelZoom={true}
        attributionControl={false}
      >
        <TileLayer
          url={tileUrl}
          attribution='&copy; Google Maps'
        />
        
        <Marker position={center}>
          <Popup>
            <span className="font-bold">Live Position</span>
          </Popup>
        </Marker>

        <ChangeView center={center} zoom={zoom} />
      </MapContainer>
    </div>
  )
}
