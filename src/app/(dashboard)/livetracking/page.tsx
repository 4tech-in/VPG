"use client"

// Force recompile: 2026-05-12T02:04:00
import { useState } from "react"
import { RefreshCw, User, MoreVertical, Navigation, MapPin, Plus, Minus } from "lucide-react"
import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

type ActiveUser = {
  id: string
  name: string
  initials: string
  color: string
  status: "Active" | "Pending" | "Away"
  location: string
  avatar?: string
}

const activeUsers: ActiveUser[] = [
  { id: "1", name: "Assa Singh", initials: "AS", color: "bg-rose-500", status: "Active", location: "Marbella Twin Towers" },
  { id: "6", name: "Rajwalia", initials: "RA", color: "bg-cyan-500", status: "Pending", location: "Marbella Royce" },
]

export default function LiveTrackingPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>("1")

  return (
    <ContentLayout title="Live Tracker">
      <div className="flex h-[calc(100vh-140px)] m-4 overflow-hidden rounded-[2.5rem] bg-zinc-50/50 shadow-2xl border border-white/20 backdrop-blur-sm">
        {/* Sidebar */}
        <div className="w-[380px] flex flex-col bg-white/80 backdrop-blur-md border-r border-zinc-100">
          <div className="p-8 pb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Active Users</h2>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-zinc-100 transition-transform active:rotate-180 duration-500">
                <RefreshCw className="h-5 w-5 text-zinc-400" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                2 Team Members Online
              </p>
            </div>
          </div>

          <ScrollArea className="flex-1 px-4">
            <div className="p-4 space-y-4">
              {activeUsers.map((user) => (
                <div 
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className={cn(
                    "group relative flex items-center gap-5 p-5 rounded-[2rem] cursor-pointer transition-all duration-300",
                    selectedUserId === user.id 
                      ? "bg-white shadow-xl shadow-primary/5 border border-primary/10 scale-[1.02]" 
                      : "bg-transparent border border-transparent hover:bg-white/50 hover:border-zinc-100"
                  )}
                >
                  <div className="relative">
                    <Avatar className={cn("h-14 w-14 rounded-2xl shadow-inner", user.color)}>
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="text-white font-black text-lg">{user.initials}</AvatarFallback>
                    </Avatar>
                    <div className={cn(
                      "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-4 border-white shadow-sm",
                      user.status === "Active" ? "bg-emerald-500" : user.status === "Pending" ? "bg-amber-500" : "bg-zinc-300"
                    )} />
                  </div>
                  
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className="font-bold text-zinc-900 truncate">{user.name}</h3>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <Navigation className="h-3 w-3" />
                      <p className="text-[10px] font-medium truncate uppercase tracking-tight">{user.location}</p>
                    </div>
                  </div>

                  {selectedUserId === user.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative bg-zinc-100 overflow-hidden">
          {/* Real Google Map Embed using your API Key */}
          <iframe 
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            loading="lazy" 
            allowFullScreen 
            referrerPolicy="no-referrer-when-downgrade"
            src="https://www.google.com/maps/embed/v1/view?key=AIzaSyCuk4slyXMzBAh1XocahaRnpkp_2sueWas&center=30.7333,76.7794&zoom=13&maptype=roadmap"
            className="absolute inset-0 grayscale-[0.2] brightness-[1.05]"
            title="Live Tracker Map"
          />

          <div className="absolute inset-0 pointer-events-none bg-primary/5" />
          
          {/* Floating Action Bar */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl px-6 py-3 rounded-3xl shadow-2xl border border-white flex items-center gap-6 z-10">
             <div className="flex items-center gap-3 pr-6 border-r border-zinc-100">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="text-sm font-bold text-zinc-900">En route to Site B</span>
             </div>
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">ETA</span>
                <span className="text-sm font-black text-primary">12 MINS</span>
             </div>
          </div>

          {/* User Markers */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer group">
             <div className="relative">
                <div className="absolute -inset-6 bg-blue-500/20 rounded-full animate-ping duration-[3000ms]" />
                <div className="absolute -inset-4 bg-blue-500/10 rounded-full animate-pulse" />
                <Avatar className="h-12 w-12 border-4 border-white shadow-2xl bg-blue-500 transform transition-transform group-hover:scale-110">
                  <AvatarFallback className="text-white font-black text-xs">VS</AvatarFallback>
                </Avatar>
                {/* Marker Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-zinc-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">
                  Vishal Sharma
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-zinc-900" />
                </div>
             </div>
          </div>

          {/* Map Controls */}
          <div className="absolute bottom-10 left-10 flex flex-col gap-3">
            <Button size="icon" className="h-12 w-12 rounded-2xl bg-white text-zinc-900 hover:bg-zinc-50 shadow-2xl border border-white">
              <Plus className="h-5 w-5" />
            </Button>
            <Button size="icon" className="h-12 w-12 rounded-2xl bg-white text-zinc-900 hover:bg-zinc-50 shadow-2xl border border-white">
              <Minus className="h-5 w-5" />
            </Button>
          </div>

          <div className="absolute bottom-10 right-10 flex items-center gap-4">
             <Button className="h-12 px-6 rounded-2xl bg-primary font-black shadow-xl shadow-primary/20 text-xs tracking-wider uppercase">
                Focus Tracking
             </Button>
          </div>

          {/* Leaflet Attribution Mock */}
          <div className="absolute bottom-2 right-4 bg-white/60 backdrop-blur-sm px-3 py-1 rounded-full text-[9px] text-zinc-500 font-bold border border-white/50">
            © LEAFLET | © OPENSTREETMAP
          </div>
        </div>
      </div>
    </ContentLayout>
  )
}