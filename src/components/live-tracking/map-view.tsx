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
  const [address, setAddress] = useState("Loading address...")
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

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        setAddress("Loading address...")
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${center[0]}&lon=${center[1]}`
        )
        const data = await response.json()
        if (data && data.display_name) {
          setAddress(data.display_name)
        } else {
          setAddress("Address not found")
        }
      } catch (error) {
        setAddress("Failed to retrieve address details")
      }
    }

    if (center && center[0] && center[1]) {
      fetchAddress()
    }
  }, [center])

  // Force re-render with a unique key if the coordinates or layer changes significantly
  const mapKey = useMemo(() => `map-${center[0].toFixed(4)}-${center[1].toFixed(4)}-${mapType}-${showTraffic}`, [center, mapType, showTraffic])

  const tileUrl = useMemo(() => {
    const layerType = mapType === "satellite" ? "y" : "m"
    const trafficSuffix = showTraffic ? ",traffic" : ""
    return `https://mt1.google.com/vt/lyrs=${layerType}${trafficSuffix}&x={x}&y={y}&z={z}`
  }, [mapType, showTraffic])

  const personIcon = useMemo(() => {
    return L.divIcon({
      className: "custom-div-icon",
      html: `
        <div style="
          width: 50px; 
          height: 50px; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          background-color: #ffffff;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          border: 2.5px solid #3b82f6;
          overflow: hidden;
        ">
          <img src="/icons8-man-96.png" style="width: 38px; height: 38px; object-fit: contain;" />
        </div>
      `,
      iconSize: [50, 50],
      iconAnchor: [25, 25],
      popupAnchor: [0, -25]
    })
  }, [])

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

        <Marker position={center} icon={personIcon}>
          <Popup>
            <div className="flex flex-col gap-1 p-1 max-w-[220px]">
              <span className="font-bold text-zinc-900 text-xs">Live Position</span>
              <span className="text-[10px] text-zinc-500 font-semibold leading-relaxed">{address}</span>
            </div>
          </Popup>
        </Marker>

        <ChangeView center={center} zoom={zoom} />
      </MapContainer>
    </div>
  )
}
