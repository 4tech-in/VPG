"use client"

import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import dynamic from "next/dynamic"
import { RefreshCw, Navigation, MapPin, Plus, Minus, Battery, Search, Globe, Car } from "lucide-react"
import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { liveTrackService, LiveTrackData } from "@/service/liveTrackService"
import { toast } from "sonner"

// Dynamically import MapView to avoid window is not defined error
const MapView = dynamic(() => import("@/components/live-tracking/map-view"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-zinc-100 animate-pulse flex items-center justify-center font-bold text-zinc-400">Loading Map Engine...</div>
})

type ActiveUser = {
  id: string
  name: string
  initials: string
  color: string
  status: "Active" | "Away"
  location: string
  lat: number
  lng: number
  avatar?: string
  battery?: number | null
  speed?: number | null
  lastUpdated: string
}

const mapTrackToActiveUser = (track: LiveTrackData): ActiveUser => {
  const name = track.user?.name || "Unknown User"
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
  
  const colors = ["bg-rose-500", "bg-cyan-500", "bg-emerald-500", "bg-amber-500", "bg-violet-500", "bg-blue-500"]
  const colorIndex = (name.charCodeAt(0) + name.length) % colors.length
  const color = colors[colorIndex]

  const isRecent = new Date().getTime() - new Date(track.lastUpdatedAt).getTime() < 10 * 60 * 1000 // 10 mins

  return {
    id: track.userId,
    name,
    initials,
    color,
    status: track.isOnline && isRecent ? "Active" : "Away",
    location: track.node?.name || "No Unit Assigned",
    lat: track.latitude,
    lng: track.longitude,
    battery: track.battery,
    speed: track.speed,
    lastUpdated: new Date(track.lastUpdatedAt).toLocaleTimeString()
  }
}

export default function LiveTrackingPage() {
  const [tracks, setTracks] = useState<LiveTrackData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(13)
  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap")
  const [showTraffic, setShowTraffic] = useState(false)

  const initialFetched = useRef(false)

  const fetchLiveTracks = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    try {
      const response = await liveTrackService.getLiveTracks({
        limit: 10,
      })
      setTracks(response.data)
    } catch (err: any) {
      if (!silent) {
        toast.error("Failed to load live tracking locations")
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Poll for updates every 15 seconds
  useEffect(() => {
    if (!initialFetched.current) {
      initialFetched.current = true
      fetchLiveTracks()
    }
    const interval = setInterval(() => {
      fetchLiveTracks(true)
    }, 15000)
    return () => clearInterval(interval)
  }, [fetchLiveTracks])

  const activeUsers = useMemo(() => {
    return tracks.map(mapTrackToActiveUser)
  }, [tracks])

  const filteredUsers = useMemo(() => {
    if (!search) return activeUsers
    const query = search.toLowerCase()
    return activeUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        u.location.toLowerCase().includes(query)
    )
  }, [activeUsers, search])

  const selectedUser = useMemo(() => {
    if (selectedUserId) {
      return activeUsers.find((u) => u.id === selectedUserId) || activeUsers[0]
    }
    return activeUsers[0]
  }, [activeUsers, selectedUserId])

  // Automatically select the first user when tracks are fetched if none is selected
  useEffect(() => {
    if (activeUsers.length > 0 && !selectedUserId) {
      setSelectedUserId(activeUsers[0].id)
    }
  }, [activeUsers, selectedUserId])

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 1, 18))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 1, 3))
  }

  const handleFocus = () => {
    if (selectedUser) {
      setZoom(15)
    }
  }

  return (
    <ContentLayout title="Live Tracker">
      <div className="flex h-[calc(100vh-140px)] m-4 overflow-hidden rounded-[2.5rem] bg-zinc-50/50 shadow-2xl border border-white/20 backdrop-blur-sm">
        {/* Sidebar */}
        <div className="w-[320px] flex flex-col bg-white/95 backdrop-blur-md border-r border-zinc-100 shadow-xl z-20">
          <div className="p-6 pb-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h2 className="text-xl font-black text-zinc-900 tracking-tight uppercase">Team Live</h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                    {activeUsers.filter(u => u.status === "Active").length} Online
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-lg hover:bg-zinc-100 transition-colors group"
                onClick={() => fetchLiveTracks()}
              >
                <RefreshCw className="h-4 w-4 text-zinc-400 group-active:rotate-180 transition-transform duration-500" />
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search staff or unit..."
                className="pl-9 h-10 bg-zinc-50 border-none shadow-inner rounded-xl text-xs focus-visible:ring-primary"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {isLoading && activeUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-zinc-400 font-bold text-xs gap-2">
                <RefreshCw className="h-5 w-5 animate-spin" />
                Loading Tracker Locations...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 font-bold text-xs uppercase tracking-wider">
                No users tracked
              </div>
            ) : (
              <div className="px-3 py-2 space-y-1">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className={cn(
                      "group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border",
                      selectedUserId === user.id
                        ? "bg-zinc-900 border-zinc-900 shadow-lg shadow-zinc-200"
                        : "bg-transparent border-transparent hover:bg-zinc-50 hover:border-zinc-100"
                    )}
                  >
                    <div className="relative">
                      <Avatar className={cn("h-10 w-10 rounded-lg shadow-md border border-white/20", user.color)}>
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="font-bold text-xs shadow-sm text-white">{user.initials}</AvatarFallback>
                      </Avatar>
                      <div className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white shadow-sm",
                        user.status === "Active" ? "bg-emerald-500" : "bg-amber-500"
                      )} />
                    </div>

                    <div className="flex-1 overflow-hidden">
                      <h3 className={cn(
                        "font-bold text-sm truncate tracking-tight transition-colors",
                        selectedUserId === user.id ? "text-white" : "text-zinc-900"
                      )}>{user.name}</h3>
                      <div className="flex items-center gap-1 text-zinc-400">
                        <Navigation className="h-2.5 w-2.5" />
                        <p className={cn(
                          "text-[9px] font-medium truncate uppercase tracking-tighter",
                          selectedUserId === user.id ? "text-zinc-400" : "text-zinc-400"
                        )}>{user.location}</p>
                      </div>
                    </div>

                    {selectedUserId === user.id && (
                      <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative bg-zinc-100 overflow-hidden">
          <MapView 
            center={selectedUser ? [selectedUser.lat, selectedUser.lng] : [30.7333, 76.7794]} 
            zoom={zoom} 
            mapType={mapType}
            showTraffic={showTraffic}
          />

          <div className="absolute inset-0 pointer-events-none bg-primary/5" />

          {selectedUser && (
            /* Floating Action Bar */
            <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl px-6 py-3 rounded-3xl shadow-2xl border border-white flex items-center gap-6 z-[5000] pointer-events-auto">
              <div className="flex items-center gap-3 pr-6 border-r border-zinc-100">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="text-sm font-bold text-zinc-900">{selectedUser.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">SIGNAL</span>
                <span className={cn(
                  "text-sm font-black uppercase",
                  selectedUser.status === "Active" ? "text-emerald-500" : "text-amber-500"
                )}>
                  {selectedUser.status === "Active" ? "Strong" : "Weak"}
                </span>
              </div>
              {selectedUser.battery !== undefined && selectedUser.battery !== null && (
                <div className="flex items-center gap-1.5 pl-6 border-l border-zinc-100">
                  <Battery className="h-4 w-4 text-zinc-500" />
                  <span className="text-sm font-bold text-zinc-600">{selectedUser.battery}%</span>
                </div>
              )}
            </div>
          )}

          {/* Map Controls */}
          <div className="absolute bottom-10 left-10 flex flex-col gap-3 z-[5000]">
            <Button 
              size="icon" 
              className={cn(
                "h-12 w-12 rounded-2xl shadow-2xl border border-white transition-all duration-200",
                mapType === "satellite" ? "bg-zinc-900 text-white hover:bg-zinc-800" : "bg-white text-zinc-900 hover:bg-zinc-50"
              )}
              onClick={() => setMapType(prev => prev === "roadmap" ? "satellite" : "roadmap")}
              title="Toggle Satellite View"
            >
              <Globe className="h-5 w-5" />
            </Button>
            <Button 
              size="icon" 
              className={cn(
                "h-12 w-12 rounded-2xl shadow-2xl border border-white transition-all duration-200",
                showTraffic ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-white text-zinc-900 hover:bg-zinc-50"
              )}
              onClick={() => setShowTraffic(prev => !prev)}
              title="Toggle Traffic View"
            >
              <Car className="h-5 w-5" />
            </Button>
            <div className="h-px bg-zinc-200 my-1 w-8 mx-auto" />
            <Button 
              size="icon" 
              className="h-12 w-12 rounded-2xl bg-white text-zinc-900 hover:bg-zinc-50 shadow-2xl border border-white"
              onClick={handleZoomIn}
            >
              <Plus className="h-5 w-5" />
            </Button>
            <Button 
              size="icon" 
              className="h-12 w-12 rounded-2xl bg-white text-zinc-900 hover:bg-zinc-50 shadow-2xl border border-white"
              onClick={handleZoomOut}
            >
              <Minus className="h-5 w-5" />
            </Button>
          </div>

          {selectedUser && (
            <div className="absolute bottom-10 right-10 flex items-center gap-4 z-[5000]">
              <Button 
                onClick={handleFocus}
                className="h-12 px-6 rounded-2xl bg-primary font-black shadow-xl shadow-primary/20 text-xs tracking-wider uppercase text-white"
              >
                Focus Tracking
              </Button>
            </div>
          )}
        </div>
      </div>
    </ContentLayout>
  )
}