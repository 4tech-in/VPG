"use client"

import { useState, useEffect } from "react"
import { Target, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import dynamic from "next/dynamic"

const GeofenceMap = dynamic(() => import("./geofence-map"), {
  ssr: false,
  loading: () => (
    <div className="h-72 w-full rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center font-bold text-xs text-zinc-400 uppercase tracking-wider animate-pulse">
      Loading Command Map...
    </div>
  ),
})

interface GeofenceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialValues?: any
  onSubmit: (values: any) => Promise<void>
}

export function GeofenceDialog({
  open,
  onOpenChange,
  initialValues,
  onSubmit: onSubmitProp,
}: GeofenceDialogProps) {
  const [name, setName] = useState("")
  const [latitude, setLatitude] = useState("30.7333")
  const [longitude, setLongitude] = useState("76.7794")
  const [radius, setRadius] = useState("100")
  const [address, setAddress] = useState("")
  const [isFetchingLocation, setIsFetchingLocation] = useState(false)
  const [isSearchingAddress, setIsSearchingAddress] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      if (initialValues) {
        setName(initialValues.name || "")
        setLatitude(String(initialValues.latitude ?? "30.7333"))
        setLongitude(String(initialValues.longitude ?? "76.7794"))
        setRadius(String(initialValues.radius ?? "100"))
        setAddress(initialValues.address || "")
      } else {
        setName("")
        setLatitude("30.7333")
        setLongitude("76.7794")
        setRadius("100")
        setAddress("")
      }
    }
  }, [initialValues, open])

  const getCurrentLocation = () => {
    setIsFetchingLocation(true)
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser")
      setIsFetchingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toString())
        setLongitude(position.coords.longitude.toString())
        toast.success("Location retrieved successfully")
        setIsFetchingLocation(false)
      },
      (error) => {
        toast.error("Unable to retrieve your location")
        setIsFetchingLocation(false)
      }
    )
  }

  const geocodeAddress = async () => {
    if (!address) return
    setIsSearchingAddress(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      )
      const data = await response.json()
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0]
        setLatitude(Number(lat).toFixed(7))
        setLongitude(Number(lon).toFixed(7))
        if (display_name) {
          setAddress(display_name)
        }
        toast.success("Location pinned successfully")
      } else {
        toast.error("Address not found. Please try a different search.")
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to connect to search service.")
    } finally {
      setIsSearchingAddress(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !latitude || !longitude || !radius) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmitProp({
        name,
        latitude: Number(latitude),
        longitude: Number(longitude),
        radiusInMeters: Number(radius),
        address: address || undefined,
      })
      onOpenChange(false)
    } catch (err: any) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] w-[95vw] max-h-[92vh] overflow-y-auto p-0 border-none shadow-2xl rounded-3xl bg-white custom-scrollbar">
        <DialogHeader className="p-8 pb-0 shrink-0">
          <DialogTitle className="text-2xl font-black text-zinc-900 tracking-tight">
            {initialValues ? "Modify Geofence" : "Create Geofence"}
          </DialogTitle>
          <DialogDescription className="text-zinc-500 font-medium">
            {initialValues ? "Update geofence configuration details." : "Add a new geofence for attendance tracking."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-8 space-y-6 flex-1">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Geofence Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Main Office"
                className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 focus-visible:ring-primary font-bold text-zinc-900"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Geofence Address</Label>
              <div className="relative">
                <Input
                  placeholder="Enter location address..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      geocodeAddress()
                    }
                  }}
                  className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 pr-24 focus-visible:ring-primary font-medium text-zinc-800"
                />
                {/* Compact Floating Actions */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-20">
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={geocodeAddress}
                    disabled={isSearchingAddress || !address}
                    className="h-10 w-10 p-0 rounded-xl hover:bg-zinc-100/80 flex items-center justify-center text-zinc-500 shrink-0"
                    title="Search Address"
                  >
                    <Search className={cn("h-4 w-4", isSearchingAddress && "animate-spin")} />
                  </Button>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={isFetchingLocation}
                    className="h-10 w-10 p-0 rounded-xl hover:bg-zinc-100/80 flex items-center justify-center text-primary shrink-0"
                    title="Use Current Location"
                  >
                    <Target className={cn("h-4 w-4", isFetchingLocation && "animate-spin")} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Interactive Map */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                Interactive Map Bounds <span className="text-zinc-400 font-medium">(Click anywhere on map to set position)</span>
              </Label>
              {open && (
                <GeofenceMap
                  key={initialValues?.id || "new-geofence"}
                  latitude={Number(latitude) || 30.7333}
                  longitude={Number(longitude) || 76.7794}
                  radius={Number(radius) || 100}
                  onChange={(lat, lng) => {
                    setLatitude(lat.toFixed(7))
                    setLongitude(lng.toFixed(7))
                  }}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Latitude <span className="text-rose-500">*</span>
                </Label>
                <Input
                  placeholder="20.5937"
                  className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 focus-visible:ring-primary font-bold text-zinc-900"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Longitude <span className="text-rose-500">*</span>
                </Label>
                <Input
                  placeholder="78.9629"
                  className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 focus-visible:ring-primary font-bold text-zinc-900"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Premium slider radius */}
            <div className="space-y-3 p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Radius Bounds <span className="text-rose-500">*</span>
                </Label>
                <span className="text-xs font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-100">
                  {radius} Meters
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="2000"
                step="25"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-teal-600 focus:outline-none"
              />
            </div>
          </div>

          <DialogFooter className="p-8 bg-zinc-50/50 border-t border-zinc-100 gap-3 shrink-0">
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-12 px-8 rounded-xl border-zinc-200 font-bold hover:bg-white text-zinc-700"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-12 px-10 rounded-xl font-bold shadow-lg shadow-primary/20 bg-teal-600 hover:bg-teal-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : initialValues ? "Save Changes" : "Create Geofence"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
