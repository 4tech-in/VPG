"use client"

import { useState } from "react"
import { MapPin, Target, X } from "lucide-react"
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

interface GeofenceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GeofenceDialog({ open, onOpenChange }: GeofenceDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    latitude: "",
    longitude: "",
    radius: "100",
  })
  const [isLoading, setIsLoading] = useState(false)

  const getCurrentLocation = () => {
    setIsLoading(true)
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser")
      setIsLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
        }))
        toast.success("Location updated successfully")
        setIsLoading(false)
      },
      (error) => {
        toast.error("Unable to retrieve your location")
        setIsLoading(false)
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl bg-white">
        <DialogHeader className="p-8 pb-0">
          <DialogTitle className="text-2xl font-black text-zinc-900 tracking-tight">Create Geofence</DialogTitle>
          <DialogDescription className="text-zinc-500 font-medium">
            Add a new geofence for attendance tracking.
          </DialogDescription>
        </DialogHeader>

        <div className="p-8 space-y-8">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Geofence Name</Label>
            <Input 
              placeholder="e.g. Main Office" 
              className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 focus-visible:ring-primary font-medium"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Search Location</Label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Input 
                  placeholder="Enter address..." 
                  className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 focus-visible:ring-primary font-medium"
                />
              </div>
              <Button 
                variant="outline" 
                type="button"
                onClick={getCurrentLocation}
                disabled={isLoading}
                className="h-14 px-6 rounded-2xl border-zinc-100 font-bold hover:bg-zinc-50 gap-2 transition-all active:scale-95"
              >
                <Target className={cn("h-4 w-4 text-primary", isLoading && "animate-spin")} /> 
                {isLoading ? "Fetching..." : "Current"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Latitude</Label>
              <Input 
                placeholder="20.5937" 
                className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 focus-visible:ring-primary font-medium"
                value={formData.latitude}
                onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Longitude</Label>
              <Input 
                placeholder="78.9629" 
                className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 focus-visible:ring-primary font-medium"
                value={formData.longitude}
                onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Radius (meters)</Label>
            <Input 
              placeholder="e.g. 500" 
              className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 focus-visible:ring-primary font-medium"
              value={formData.radius}
              onChange={(e) => setFormData(prev => ({ ...prev, radius: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter className="p-8 bg-zinc-50/50 border-t border-zinc-100 gap-3">
          <Button 
            variant="outline" 
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-12 px-8 rounded-xl border-zinc-200 font-bold hover:bg-white"
          >
            Cancel
          </Button>
          <Button className="h-12 px-10 rounded-xl font-bold shadow-lg shadow-primary/20">
            Create Geofence
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
