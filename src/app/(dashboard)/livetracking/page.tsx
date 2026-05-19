"use client"

import { useState, useMemo } from "react"
import dynamic from "next/dynamic"
import { RefreshCw, Navigation, MapPin, Plus, Minus } from "lucide-react"
import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

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
  status: "Active" | "Pending" | "Away"
  location: string
  lat: number
  lng: number
  avatar?: string
}

const activeUsers: ActiveUser[] = [
  {
    id: "1",
    name: "Assa Singh",
    initials: "AS",
    color: "bg-rose-500",
    status: "Active",
    location: "VPG Twin Towers",
    lat: 30.7866602,
    lng: 76.7546189
  },
  {
    id: "6",
    name: "Rajwalia",
    initials: "RA",
    color: "bg-cyan-500",
    status: "Pending",
    location: "VPG Royce",
    lat: 30.63337829999999,
    lng: 76.7264209
  },
]

export default function LiveTrackingPage() {
  const [selectedUserId, setSelectedUserId] = useState<string>("1")

  const selectedUser = useMemo(() =>
    activeUsers.find(u => u.id === selectedUserId) || activeUsers[0],
    [selectedUserId]
  )

  return (
    <ContentLayout title="Live Tracker">
      <div className="flex h-[calc(100vh-140px)] m-4 overflow-hidden rounded-[2.5rem] bg-zinc-50/50 shadow-2xl border border-white/20 backdrop-blur-sm">
        {/* Sidebar */}
        <div className="w-[320px] flex flex-col bg-white/95 backdrop-blur-md border-r border-zinc-100 shadow-xl z-20">
          <div className="p-6 pb-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-black text-zinc-900 tracking-tight uppercase">Team Live</h2>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-zinc-100 transition-colors group">
                <RefreshCw className="h-4 w-4 text-zinc-400 group-active:rotate-180 transition-transform duration-500" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                {activeUsers.length} Online
              </p>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="px-3 py-2 space-y-1">
              {activeUsers.map((user) => (
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
                      <AvatarFallback className=" font-bold text-xs shadow-sm">{user.initials}</AvatarFallback>
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
          </ScrollArea>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative bg-zinc-100 overflow-hidden">
          <MapView center={[selectedUser.lat, selectedUser.lng]} zoom={13} />

          <div className="absolute inset-0 pointer-events-none bg-primary/5" />

          {/* Floating Action Bar */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl px-6 py-3 rounded-3xl shadow-2xl border border-white flex items-center gap-6 z-[5000] pointer-events-auto">
            <div className="flex items-center gap-3 pr-6 border-r border-zinc-100">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="text-sm font-bold text-zinc-900">{selectedUser.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">SIGNAL</span>
              <span className="text-sm font-black text-emerald-500 uppercase">Strong</span>
            </div>
          </div>

          {/* Map Controls */}
          <div className="absolute bottom-10 left-10 flex flex-col gap-3 z-[5000]">
            <Button size="icon" className="h-12 w-12 rounded-2xl bg-white text-zinc-900 hover:bg-zinc-50 shadow-2xl border border-white">
              <Plus className="h-5 w-5" />
            </Button>
            <Button size="icon" className="h-12 w-12 rounded-2xl bg-white text-zinc-900 hover:bg-zinc-50 shadow-2xl border border-white">
              <Minus className="h-5 w-5" />
            </Button>
          </div>

          <div className="absolute bottom-10 right-10 flex items-center gap-4 z-[5000]">
            <Button className="h-12 px-6 rounded-2xl bg-primary font-black shadow-xl shadow-primary/20 text-xs tracking-wider uppercase text-white">
              Focus Tracking
            </Button>
          </div>
        </div>
      </div>
    </ContentLayout>
  )
}