"use client"

import { Construction, Sparkles, Rocket } from "lucide-react"

import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Button } from "@/components/ui/button"

export default function ItemPage() {
  return (
    <ContentLayout title="Item">
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] p-6 sm:p-10">
        <div className="max-w-2xl w-full text-center space-y-10">
          
          <div className="flex justify-center">
             <div className="relative">
                <div className="h-24 w-24 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary animate-pulse">
                   <Construction className="h-12 w-12" />
                </div>
                <div className="absolute -top-4 -right-4 h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shadow-lg border-2 border-white">
                   <Sparkles className="h-6 w-6" />
                </div>
             </div>
          </div>

          <div className="space-y-4">
             <h1 className="text-5xl font-black text-zinc-900 tracking-tighter">Inventory Module</h1>
             <div className="flex items-center justify-center gap-3">
                <div className="h-px w-8 bg-primary" />
                <span className="text-xs font-black text-primary uppercase tracking-[0.3em]">Coming Soon</span>
                <div className="h-px w-8 bg-primary" />
             </div>
          </div>

          <div className="p-10 rounded-[3rem] bg-white border border-zinc-100 shadow-2xl shadow-zinc-200/50 space-y-6">
             <p className="text-lg text-zinc-500 font-medium leading-relaxed">
                We are currently engineering a high-fidelity inventory and stock management engine. This module will feature real-time stock tracking, automated procurement workflows, and advanced asset analytics.
             </p>
             
             <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button className="h-12 px-8 rounded-2xl bg-zinc-900 font-black shadow-xl shadow-zinc-900/20 gap-2 w-full sm:w-auto">
                   <Rocket className="h-4 w-4" /> Notify Me
                </Button>
                <Button variant="ghost" className="h-12 px-8 rounded-2xl font-bold text-zinc-400 w-full sm:w-auto">
                   View Roadmap
                </Button>
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 opacity-40 grayscale">
             {[
               { label: "Real-time Tracking", icon: "📦" },
               { label: "Stock Alerts", icon: "🔔" },
               { label: "Vendor Connect", icon: "🤝" }
             ].map((feature, i) => (
                <div key={i} className="p-6 rounded-3xl bg-zinc-50 border border-zinc-100 space-y-2">
                   <div className="text-2xl">{feature.icon}</div>
                   <div className="text-[10px] font-black uppercase tracking-widest">{feature.label}</div>
                </div>
             ))}
          </div>
        </div>
      </div>
    </ContentLayout>
  )
}