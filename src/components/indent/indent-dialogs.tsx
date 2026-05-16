"use client"

import { useState } from "react"
import {
   Building2,
   Clock,
   CheckCircle2,
   XCircle,
   Calendar,
   User,
   MapPin,
   Layers,
   MessageSquare,
   ChevronRight,
   Plus,
   Trash2,
   Zap
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
} from "@/components/ui/dialog"
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// --- VIEW INDENT DIALOG ---

export function ViewIndentDialog({ trigger }: { trigger: React.ReactNode }) {
   const [open, setOpen] = useState(false)
   const [activeStep, setActiveStep] = useState(1)

   const steps = [
      { id: 1, label: "Pending Manager" },
      { id: 2, label: "Pending Admin" },
      { id: 3, label: "Store Check (Jr)" },
      { id: 4, label: "Store Check (Sr)" },
   ]

   const handleApprove = () => {
      if (activeStep < 4) {
         setActiveStep(prev => prev + 1)
      } else {
         setOpen(false) // Final approval closes dialog or marks complete
      }
   }

   const currentLabel = steps.find(s => s.id === activeStep)?.label || "PENDING MANAGER"

   return (
      <Dialog open={open} onOpenChange={setOpen}>
         <DialogTrigger asChild>{trigger}</DialogTrigger>
         <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[90vh] p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] flex flex-col mx-4">

            {/* Header Block */}
            <div className="p-8 pb-4 bg-white shrink-0">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex flex-col gap-1">
                     <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none">Indent Request</span>
                     <h2 className="text-3xl font-black text-zinc-900 tracking-tighter leading-none">#IND-001</h2>
                  </div>
                  <Badge className={cn(
                     "px-5 py-1.5 rounded-full font-black text-[10px] gap-2 border-none shadow-sm",
                     activeStep === 1 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                  )}>
                     <Clock className="h-3.5 w-3.5" /> {currentLabel.toUpperCase()}
                  </Badge>
               </div>

               {/* Approval Stepper: More Compact */}
               <div className="relative flex justify-between px-2 mb-4">
                  <div className="absolute top-4 left-6 right-6 h-[2.5px] bg-zinc-50 -z-10" />
                  <div
                     className="absolute top-4 left-6 h-[2.5px] bg-emerald-500 transition-all duration-500 -z-10"
                     style={{ width: `${((activeStep - 1) / (steps.length - 1)) * 100}%`, maxWidth: "calc(100% - 48px)" }}
                  />
                  {steps.map((step) => {
                     const isCompleted = step.id < activeStep
                     const isActive = step.id === activeStep
                     return (
                        <div key={step.id} className="flex flex-col items-center gap-2">
                           <div className={cn(
                              "h-8 w-8 rounded-full flex items-center justify-center font-black text-[10px] border-2 transition-all duration-300",
                              isCompleted ? "bg-emerald-500 border-emerald-500 text-white" :
                                 isActive ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-110" :
                                    "bg-white border-zinc-100 text-zinc-300"
                           )}>
                              {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : step.id}
                           </div>
                           <span className={cn(
                              "text-[7px] font-black uppercase tracking-widest text-center max-w-[60px] leading-tight",
                              isActive ? "text-emerald-600" : isCompleted ? "text-emerald-500" : "text-zinc-300"
                           )}>
                              {step.label}
                           </span>
                        </div>
                     )
                  })}
               </div>
            </div>

            {/* Content Area: Focused Height */}
            <div className="flex-1 overflow-y-auto p-8 pt-2 space-y-6 bg-zinc-50/20 custom-scrollbar">

               {/* Requester Card: Compact */}
               <div className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                        <User className="h-6 w-6" />
                     </div>
                     <div className="flex flex-col">
                        <h3 className="text-lg font-black text-zinc-900 leading-tight">Ravi Kumar</h3>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Worker</span>
                     </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                     <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black text-zinc-300 uppercase tracking-widest">Submitted</span>
                        <span className="text-xs font-black text-zinc-900 tracking-tight">2024-05-01</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black text-zinc-300 uppercase tracking-widest">Expected</span>
                        <span className="text-xs font-black text-emerald-500 tracking-tight">2024-05-10</span>
                     </div>
                  </div>
               </div>

               {/* Project Details: Optimized Grid */}
               <div className="grid grid-cols-2 gap-y-6 gap-x-10 px-2">
                  {[
                     { label: "Project", val: "Marbella Grande", icon: Building2 },
                     { label: "Tower", val: "Tower A", icon: Layers },
                     { label: "Floor / Flat", val: "Floor 4 · 402", icon: MapPin },
                     { label: "Store Room", val: "Ground Floor", icon: Layers },
                  ].map((item, i) => (
                     <div key={i} className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 shrink-0">
                           <item.icon className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">{item.label}</span>
                           <span className="text-[13px] font-black text-zinc-900 tracking-tight">{item.val}</span>
                        </div>
                     </div>
                  ))}
               </div>

               {/* Explanation: Leaner */}
               <div className="p-5 bg-zinc-100/50 rounded-2xl border border-zinc-100 border-dashed">
                  <p className="text-[11px] font-bold text-zinc-500 italic leading-relaxed">&quot;Required for plastering work on 4th floor&quot;</p>
               </div>

               {/* Requested Items */}
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                     <div className="h-1 w-4 rounded-full bg-emerald-500" />
                     <h4 className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Requested Items</h4>
                  </div>

                  {[
                     { name: "Cement Bag", qty: "50", unit: "Bags", badges: ["Civil", "Cement"] },
                     { name: "Sand", qty: "10", unit: "Tons", badges: ["Civil", "Sand"] },
                  ].map((item, i) => (
                     <div key={i} className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all">
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-10 rounded-xl bg-zinc-50 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                              <Layers className="h-5 w-5" />
                           </div>
                           <div className="flex flex-col gap-1">
                              <h5 className="text-sm font-black text-zinc-900 tracking-tight">{item.name}</h5>
                              <div className="flex items-center gap-1.5">
                                 {item.badges.map((b, idx) => (
                                    <Badge key={idx} variant="outline" className="text-[7px] font-black uppercase px-2 py-0 border-zinc-100 rounded-md text-zinc-400">
                                       {b}
                                    </Badge>
                                 ))}
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-1.5 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-100">
                           <span className="text-sm font-black text-zinc-900">{item.qty}</span>
                           <span className="text-[8px] font-black text-zinc-400 uppercase">{item.unit}</span>
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            {/* Action Section: pinned to bottom */}
            <div className="p-8 bg-emerald-50/20 border-t border-emerald-100 shrink-0 space-y-5">
               <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-emerald-500 fill-emerald-500" />
                  <h4 className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">Take Action</h4>
               </div>
               <Textarea
                  placeholder="Add a remark (optional)..."
                  className="min-h-[80px] rounded-2xl bg-white border-emerald-100 focus:ring-primary font-bold shadow-inner p-4 text-xs"
               />
               <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-12 rounded-xl border-rose-100 text-rose-500 font-black text-xs gap-2 hover:bg-rose-50 transition-all">
                     <XCircle className="h-4 w-4" /> Reject
                  </Button>
                  <Button
                     onClick={handleApprove}
                     className="h-12 rounded-xl bg-emerald-500 text-white font-black text-xs gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
                  >
                     <CheckCircle2 className="h-4 w-4" /> {activeStep < 4 ? "Approve & Forward" : "Finalize Approval"}
                  </Button>
               </div>
            </div>
         </DialogContent>
      </Dialog>
   )
}


// --- CREATE INDENT DIALOG ---

export function CreateIndentDialog({ trigger }: { trigger: React.ReactNode }) {
   const [open, setOpen] = useState(false)
   const [activeToggle, setActiveToggle] = useState<"tower" | "project">("tower")
   const [items, setItems] = useState([{ id: 1 }])

   const addItem = () => setItems([...items, { id: Date.now() }])
   const removeItem = (id: number) => setItems(items.filter(i => i.id !== id))

   return (
      <Dialog open={open} onOpenChange={setOpen}>
         <DialogTrigger asChild>{trigger}</DialogTrigger>
         <DialogContent className="sm:max-w-[750px] p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] flex flex-col max-h-[95vh] mx-4">

            {/* Header Block */}
            <div className="p-10 pb-6 bg-white shrink-0 border-b border-zinc-50">
               <DialogHeader>
                  <DialogTitle className="text-3xl font-black text-zinc-900 tracking-tight">Create Indent</DialogTitle>
                  <p className="text-zinc-400 text-xs font-bold mt-1 uppercase tracking-widest">Request construction material</p>
               </DialogHeader>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-zinc-50/10">

               {/* Primary Fields */}
               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                     <Label className="text-[11px] font-black text-zinc-900 uppercase tracking-tight">Project</Label>
                     <Select>
                        <SelectTrigger className="h-14 rounded-2xl bg-white border-zinc-100 font-bold shadow-sm">
                           <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                           <SelectItem value="marbella">Marbella Grande</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="space-y-3">
                     <Label className="text-[11px] font-black text-zinc-900 uppercase tracking-tight">Engineer Name</Label>
                     <Select>
                        <SelectTrigger className="h-14 rounded-2xl bg-white border-zinc-100 font-bold shadow-sm">
                           <SelectValue placeholder="Select engineer" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                           <SelectItem value="eng1">Engr. Rajesh</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="space-y-3">
                     <Label className="text-[11px] font-black text-zinc-900 uppercase tracking-tight">Priority</Label>
                     <Select defaultValue="medium">
                        <SelectTrigger className="h-14 rounded-2xl bg-white border-zinc-100 font-bold shadow-sm">
                           <div className="flex items-center gap-3">
                              <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                              <SelectValue />
                           </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                           <SelectItem value="high">High</SelectItem>
                           <SelectItem value="medium">Medium</SelectItem>
                           <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="space-y-3">
                     <Label className="text-[11px] font-black text-zinc-900 uppercase tracking-tight">Estimate Delivery Date</Label>
                     <Input
                        type="date"
                        defaultValue="2026-05-27"
                        className="h-14 rounded-2xl bg-white border-zinc-100 font-bold shadow-sm px-4 appearance-none"
                     />
                  </div>
               </div>

               {/* Toggle Switcher */}
               <div className="bg-zinc-100/80 p-1.5 rounded-[1.25rem] flex items-center w-fit mx-auto gap-1 border border-zinc-200/50">
                  <button
                     onClick={() => setActiveToggle("tower")}
                     className={cn(
                        "h-11 px-10 rounded-[1rem] text-[11px] font-black uppercase tracking-widest transition-all duration-300",
                        activeToggle === "tower" ? "bg-white text-zinc-900 shadow-xl shadow-zinc-200 border border-zinc-100" : "text-zinc-400 hover:text-zinc-600"
                     )}
                  >
                     Tower
                  </button>
                  <button
                     onClick={() => setActiveToggle("project")}
                     className={cn(
                        "h-11 px-10 rounded-[1rem] text-[11px] font-black uppercase tracking-widest transition-all duration-300",
                        activeToggle === "project" ? "bg-white text-zinc-900 shadow-xl shadow-zinc-200 border border-zinc-100" : "text-zinc-400 hover:text-zinc-600"
                     )}
                  >
                     Project
                  </button>
               </div>

               {/* Conditional Location Selectors */}
               <AnimatePresence mode="wait">
                  {activeToggle === "tower" && (
                     <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-3 gap-6"
                     >
                        <div className="space-y-3">
                           <Label className="text-[11px] font-black text-zinc-900 uppercase tracking-tight">Tower</Label>
                           <Select>
                              <SelectTrigger className="h-14 rounded-2xl bg-white border-zinc-100 font-bold shadow-sm">
                                 <SelectValue placeholder="Select tower" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                 <SelectItem value="t1">Tower A</SelectItem>
                              </SelectContent>
                           </Select>
                        </div>
                        <div className="space-y-3">
                           <Label className="text-[11px] font-black text-zinc-900 uppercase tracking-tight">Floor</Label>
                           <Select>
                              <SelectTrigger className="h-14 rounded-2xl bg-white border-zinc-100 font-bold shadow-sm">
                                 <SelectValue placeholder="Floor" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                 <SelectItem value="f4">Floor 4</SelectItem>
                              </SelectContent>
                           </Select>
                        </div>
                        <div className="space-y-3">
                           <Label className="text-[11px] font-black text-zinc-900 uppercase tracking-tight">Flat</Label>
                           <Select>
                              <SelectTrigger className="h-14 rounded-2xl bg-white border-zinc-100 font-bold shadow-sm">
                                 <SelectValue placeholder="Flat" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                 <SelectItem value="fl402">402</SelectItem>
                              </SelectContent>
                           </Select>
                        </div>
                     </motion.div>
                  )}
               </AnimatePresence>

               {/* Dynamic Items Section */}
               <div className="space-y-6 bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-2 w-32 bg-primary/10 rounded-bl-full" />

                  <div className="flex items-center justify-between relative">
                     <div className="flex items-center gap-3">
                        <div className="h-1.5 w-6 rounded-full bg-primary" />
                        <h4 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Requested Items</h4>
                     </div>
                     <Button onClick={addItem} variant="outline" className="h-10 px-6 rounded-xl border-zinc-200 font-black text-[10px] uppercase tracking-widest gap-2 hover:bg-zinc-50 shadow-sm">
                        <Plus className="h-4 w-4" /> Add Item
                     </Button>
                  </div>

                  <div className="space-y-6">
                     {items.map((item, idx) => (
                        <motion.div
                           initial={{ opacity: 0, x: -10 }}
                           animate={{ opacity: 1, x: 0 }}
                           key={item.id}
                           className="grid grid-cols-[1fr,120px,120px,50px] gap-5 items-end"
                        >
                           <div className="space-y-2.5">
                              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Select Item</Label>
                              <Select>
                                 <SelectTrigger className="h-14 rounded-2xl bg-zinc-50/50 border-zinc-100 font-bold">
                                    <SelectValue placeholder="Select item" />
                                 </SelectTrigger>
                                 <SelectContent className="rounded-xl">
                                    <SelectItem value="cement">Cement Bag</SelectItem>
                                    <SelectItem value="sand">Sand</SelectItem>
                                 </SelectContent>
                              </Select>
                           </div>
                           <div className="space-y-2.5">
                              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center block w-full">Qty</Label>
                              <Input placeholder="0" className="h-14 rounded-2xl bg-zinc-50/50 border-zinc-100 font-bold text-center focus:bg-white transition-all" />
                           </div>
                           <div className="space-y-2.5">
                              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Unit</Label>
                              <Select>
                                 <SelectTrigger className="h-14 rounded-2xl bg-zinc-50/50 border-zinc-100 font-bold">
                                    <SelectValue placeholder="Unit" />
                                 </SelectTrigger>
                                 <SelectContent className="rounded-xl">
                                    <SelectItem value="bags">Bags</SelectItem>
                                    <SelectItem value="tons">Tons</SelectItem>
                                 </SelectContent>
                              </Select>
                           </div>
                           {items.length > 1 && (
                              <Button
                                 variant="ghost"
                                 size="icon"
                                 onClick={() => removeItem(item.id)}
                                 className="h-14 w-14 rounded-2xl text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                 <Trash2 className="h-5 w-5" />
                              </Button>
                           )}
                        </motion.div>
                     ))}
                  </div>
               </div>

               {/* Storage Location */}
               <div className="space-y-4">
                  <Label className="text-[11px] font-black text-zinc-900 uppercase tracking-tight">Storage Location Remark</Label>
                  <Textarea
                     placeholder="Where should the items be stored?"
                     className="min-h-[120px] rounded-[2rem] bg-white border-zinc-100 font-bold p-8 focus:ring-primary shadow-sm"
                  />
               </div>
            </div>

            {/* Submit Section */}
            <div className="p-10 pt-4 bg-white shrink-0">
               <Button className="w-full h-16 rounded-2xl bg-emerald-500 text-white font-black text-lg shadow-2xl shadow-emerald-500/20 hover:bg-emerald-600 hover:scale-[1.01] transition-all transform active:scale-95">
                  Submit Request
               </Button>
            </div>
         </DialogContent>
      </Dialog>
   )
}

