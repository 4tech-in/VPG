"use client"

import { useState } from "react"
import { 
  ShieldCheck, 
  Clock, 
  Edit3, 
  MapPin, 
  AlertTriangle,
  Workflow
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PolicyDialogProps {
  mode?: "edit" | "create"
}

export function PolicyDialog({ mode = "create" }: PolicyDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-11 px-8 rounded-xl border-zinc-200 font-black gap-2 hover:bg-zinc-50 transition-all shadow-sm">
          <Edit3 className="h-4 w-4 text-primary" /> Edit Policy
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none shadow-2xl rounded-[2rem]">
        <DialogHeader className="p-8 border-b border-zinc-50 bg-white">
           <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                 <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                 <DialogTitle className="text-2xl font-black text-zinc-900 tracking-tight">Edit Policy</DialogTitle>
                 <DialogDescription className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Global Attendance Strategy</DialogDescription>
              </div>
           </div>
        </DialogHeader>

        <div className="p-8 space-y-8 bg-white max-h-[70vh] overflow-y-auto custom-scrollbar">
           
           {/* Simple Identity */}
           <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Policy Name</Label>
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-400">Status</span>
                    <Switch defaultChecked />
                 </div>
              </div>
              <Input placeholder="e.g., Office Policy B" className="h-14 rounded-2xl bg-zinc-50 border-none font-bold text-zinc-900" />
           </div>

           {/* Simple Schedule */}
           <div className="space-y-4 pt-4 border-t border-zinc-50">
              <div className="flex items-center gap-2 text-zinc-900">
                 <Clock className="h-4 w-4 text-primary" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Work Schedule</span>
              </div>
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">Start Time</Label>
                    <Input type="time" defaultValue="10:30" className="h-12 rounded-xl bg-zinc-50 border-none font-bold" />
                 </div>
                 <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">End Time</Label>
                    <Input type="time" defaultValue="18:30" className="h-12 rounded-xl bg-zinc-50 border-none font-bold" />
                 </div>
              </div>
           </div>

           {/* Simple Rules */}
           <div className="space-y-4 pt-4 border-t border-zinc-50">
              <div className="flex items-center gap-2 text-zinc-900">
                 <Workflow className="h-4 w-4 text-emerald-500" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Rules & Deductions</span>
              </div>
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">Late Deduction</Label>
                    <Select defaultValue="per">
                       <SelectTrigger className="h-12 rounded-xl bg-zinc-50 border-none font-bold text-xs">
                          <SelectValue />
                       </SelectTrigger>
                       <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
                          <SelectItem value="per">Per Occurrence</SelectItem>
                          <SelectItem value="daily">Daily Total</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">Geofence Check</Label>
                    <div className="h-12 rounded-xl bg-zinc-50 px-4 flex items-center justify-between">
                       <MapPin className="h-4 w-4 text-zinc-300" />
                       <Switch defaultChecked />
                    </div>
                 </div>
              </div>
           </div>

           {/* Simple Thresholds */}
           <div className="space-y-4 pt-4 border-t border-zinc-50">
              <div className="flex items-center gap-2 text-zinc-900">
                 <AlertTriangle className="h-4 w-4 text-amber-500" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Tolerance</span>
              </div>
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">Late Tolerance</Label>
                    <div className="relative">
                       <Input defaultValue="10" className="h-12 rounded-xl bg-zinc-50 border-none font-bold pr-12" />
                       <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-300 uppercase">Min</span>
                    </div>
                 </div>
                 <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">Max Late Cnt</Label>
                    <Input defaultValue="5" className="h-12 rounded-xl bg-zinc-50 border-none font-bold" />
                 </div>
              </div>
           </div>

        </div>

        <DialogFooter className="p-8 bg-zinc-50/50 border-t border-zinc-100">
           <Button variant="ghost" className="h-12 px-8 rounded-2xl font-bold text-zinc-400" onClick={() => setOpen(false)}>
              Discard
           </Button>
           <Button className="h-12 px-10 rounded-2xl bg-primary font-black shadow-xl shadow-primary/20 tracking-wide">
              Update Policy
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
