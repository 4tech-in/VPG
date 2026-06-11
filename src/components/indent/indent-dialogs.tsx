"use client"

import { useState, useEffect } from "react"
import { projectService } from "@/service/projectService"
import { towerService } from "@/service/towerService"
import { floorService } from "@/service/floorService"
import { flatService } from "@/service/flatService"
import { itemService } from "@/service/itemService"
import { unitService } from "@/service/unitService"
import { indentService } from "@/service/indents.api"
import { outsideService } from "@/service/outsideService"
import { toast } from "sonner"
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

export function ViewIndentDialog({
  trigger,
  indent,
  onStatusChange,
}: {
  trigger: React.ReactNode
  indent: any
  onStatusChange?: (id: string, newStatus: string, reason?: string) => void
}) {
   const [open, setOpen] = useState(false)
   const [remark, setRemark] = useState("")

   if (!indent) return null

   const currentLabel = indent.status === "Pending" ? "PENDING MANAGER" :
                        indent.status === "Approved" ? "APPROVED / PENDING PO" :
                        indent.status === "ConvertedToPO" ? "PO CREATED" : "REJECTED"

   const handleApprove = () => {
      if (onStatusChange) {
         onStatusChange(indent._id, "Approved", remark)
      }
      setOpen(false)
   }

   const handleReject = () => {
      if (onStatusChange) {
         onStatusChange(indent._id, "Rejected", remark)
      }
      setOpen(false)
   }

   const formattedCreated = indent.createdAt ? new Date(indent.createdAt).toLocaleDateString("en-IN") : "N/A"
   const formattedDelivery = indent.estimateDeliveryDate ? new Date(indent.estimateDeliveryDate).toLocaleDateString("en-IN") : "N/A"

   return (
      <Dialog open={open} onOpenChange={setOpen}>
         <DialogTrigger asChild>{trigger}</DialogTrigger>
         <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[90vh] p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] flex flex-col mx-4 bg-white">

            {/* Header Block */}
            <div className="p-8 pb-4 bg-white shrink-0">
               <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                     <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none">Indent Request</span>
                     <h2 className="text-3xl font-black text-zinc-900 tracking-tighter leading-none">#{indent.indentId}</h2>
                  </div>
                  <Badge className={cn(
                     "px-5 py-1.5 rounded-full font-black text-[10px] gap-2 border-none shadow-sm",
                     indent.status === "Pending" ? "bg-amber-100 text-amber-700" :
                     indent.status === "Approved" ? "bg-blue-100 text-blue-700" :
                     indent.status === "ConvertedToPO" ? "bg-emerald-100 text-emerald-700" :
                     "bg-rose-100 text-rose-700"
                  )}>
                     <Clock className="h-3.5 w-3.5" /> {currentLabel}
                  </Badge>
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
                        <h3 className="text-lg font-black text-zinc-900 leading-tight">{indent.requestedBy?.name || "Unknown"}</h3>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{indent.requestedBy?.email || "Requester"}</span>
                     </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                     <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black text-zinc-300 uppercase tracking-widest">Submitted</span>
                        <span className="text-xs font-black text-zinc-900 tracking-tight">{formattedCreated}</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black text-zinc-300 uppercase tracking-widest">Expected</span>
                        <span className="text-xs font-black text-emerald-500 tracking-tight">{formattedDelivery}</span>
                     </div>
                  </div>
               </div>

               {/* Project Details: Optimized Grid */}
               <div className="grid grid-cols-2 gap-y-6 gap-x-10 px-2">
                  {[
                     { label: "Project", val: indent.projectId?.projectName || indent.projectId?.name || "N/A", icon: Building2 },
                     indent.outsideId ? { label: "Outside Area", val: indent.outsideId?.outsideName || indent.outsideId?.name || "N/A", icon: MapPin } :
                     { label: "Tower", val: indent.towerId?.towerName || indent.towerId?.name || "N/A", icon: Layers },
                     !indent.outsideId && { label: "Floor / Flat", val: [indent.floorId?.floorName || indent.floorId?.name, indent.flatId?.flatName || indent.flatId?.name].filter(Boolean).join(" · ") || "N/A", icon: MapPin },
                     { label: "Store Room / Loc", val: indent.storageLocation || "N/A", icon: Layers },
                  ].filter(Boolean).map((item: any, i) => (
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
               {indent.rejectionReason && (
                  <div className="p-5 bg-rose-50 rounded-2xl border border-rose-100 border-dashed">
                     <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest block mb-1">Rejection Reason</span>
                     <p className="text-[11px] font-bold text-rose-600 italic leading-relaxed">&quot;{indent.rejectionReason}&quot;</p>
                  </div>
               )}

               {/* Requested Items */}
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                     <div className="h-1 w-4 rounded-full bg-emerald-500" />
                     <h4 className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Requested Items</h4>
                  </div>

                  {indent.items?.map((item: any, i: number) => (
                     <div key={i} className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all">
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-10 rounded-xl bg-zinc-50 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                              <Layers className="h-5 w-5" />
                           </div>
                           <div className="flex flex-col gap-1">
                              <h5 className="text-sm font-black text-zinc-900 tracking-tight">{item.itemId?.itemName || item.itemId?.name || "Unknown Item"}</h5>
                              <div className="flex items-center gap-1.5">
                                 <Badge variant="outline" className="text-[7px] font-black uppercase px-2 py-0 border-zinc-100 rounded-md text-zinc-400">
                                    {indent.priority || "low"}
                                 </Badge>
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-1.5 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-100">
                           <span className="text-sm font-black text-zinc-900">{item.quantity}</span>
                           <span className="text-[8px] font-black text-zinc-400 uppercase">{item.unitId?.unitName || item.unitId?.name || "Units"}</span>
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            {/* Action Section: pinned to bottom */}
            {indent.status === "Pending" && (
               <div className="p-8 bg-emerald-50/20 border-t border-emerald-100 shrink-0 space-y-5">
                  <div className="flex items-center gap-2">
                     <Zap className="h-4 w-4 text-emerald-500 fill-emerald-500" />
                     <h4 className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">Take Action</h4>
                  </div>
                  <Textarea
                     placeholder="Add a remark / rejection reason (optional)..."
                     value={remark}
                     onChange={(e) => setRemark(e.target.value)}
                     className="min-h-[80px] rounded-2xl bg-white border-emerald-100 focus:ring-primary font-bold shadow-inner p-4 text-xs"
                  />
                  <div className="grid grid-cols-2 gap-4">
                     <Button 
                        variant="outline" 
                        onClick={handleReject}
                        className="h-12 rounded-xl border-rose-100 text-rose-500 font-black text-xs gap-2 hover:bg-rose-50 transition-all"
                     >
                        <XCircle className="h-4 w-4" /> Reject
                     </Button>
                     <Button
                        onClick={handleApprove}
                        className="h-12 rounded-xl bg-emerald-500 text-white font-black text-xs gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
                     >
                        <CheckCircle2 className="h-4 w-4" /> Approve
                     </Button>
                  </div>
               </div>
            )}
         </DialogContent>
      </Dialog>
   )
}


// --- CREATE INDENT DIALOG ---

export function CreateIndentDialog({ trigger, onSuccess }: { trigger: React.ReactNode; onSuccess?: () => void }) {
   const [open, setOpen] = useState(false)
   
   const [projects, setProjects] = useState<any[]>([])
   const [availableItems, setAvailableItems] = useState<any[]>([])
   const [units, setUnits] = useState<any[]>([])
   
   const [projectId, setProjectId] = useState("")
   const [towerId, setTowerId] = useState("")
   const [floorId, setFloorId] = useState("")
   const [flatId, setFlatId] = useState("")
   const [outsideId, setOutsideId] = useState("")
   const [priority, setPriority] = useState("medium")
   const [estimateDeliveryDate, setEstimateDeliveryDate] = useState("")
   const [storageLocation, setStorageLocation] = useState("")
   
   const [towers, setTowers] = useState<any[]>([])
   const [floors, setFloors] = useState<any[]>([])
   const [flats, setFlats] = useState<any[]>([])
   const [outsideAreas, setOutsideAreas] = useState<any[]>([])

   const [items, setItems] = useState<any[]>([{ id: Date.now(), itemId: "", quantity: 1, unitId: "" }])

   const addItem = () => setItems([...items, { id: Date.now(), itemId: "", quantity: 1, unitId: "" }])
   const removeItem = (id: number) => setItems(items.filter(i => i.id !== id))

   useEffect(() => {
      const loadInitial = async () => {
         try {
            const [projRes, itemRes, unitRes] = await Promise.all([
               projectService.getProjects({ limit: 100 }),
               itemService.getItems({ limit: 200 }),
               unitService.getUnits({ limit: 100 })
            ])
            setProjects(projRes.projects || [])
            setAvailableItems(itemRes.items || [])
            setUnits(unitRes.units || [])
         } catch (err: any) {
            console.error(err)
         }
      }
      if (open) {
         loadInitial()
      }
   }, [open])

    // Fetch towers and outsides when project changes
    useEffect(() => {
       if (!projectId) {
          setTowers([])
          setTowerId("")
          setOutsideAreas([])
          setOutsideId("")
          return
       }
       const fetchTowers = async () => {
          try {
             const res = await towerService.getTowers({ projectId })
             setTowers(res.data || [])
             setTowerId("")
          } catch (err) {
             console.error(err)
          }
       }
       const fetchOutsides = async () => {
          try {
             const res = await outsideService.getOutsides({ projectId, limit: 100 })
             setOutsideAreas(res.data || [])
             setOutsideId("")
          } catch (err) {
             console.error(err)
          }
       }
       fetchTowers()
       fetchOutsides()
    }, [projectId])

   // Fetch floors when tower changes
   useEffect(() => {
      if (!towerId || towerId === "none") {
         setFloors([])
         setFloorId("")
         return
      }
      const fetchFloors = async () => {
         try {
            const res = await floorService.getFloors({ towerId })
            setFloors(res.data || [])
            setFloorId("")
         } catch (err) {
            console.error(err)
         }
      }
      fetchFloors()
   }, [towerId])

   // Fetch flats when floor changes
   useEffect(() => {
      if (!floorId || floorId === "none") {
         setFlats([])
         setFlatId("")
         return
      }
      const fetchFlats = async () => {
         try {
            const res = await flatService.getFlats({ floorId })
            setFlats(res.data || [])
            setFlatId("")
         } catch (err) {
            console.error(err)
         }
      }
      fetchFlats()
   }, [floorId])

   const handleItemSelect = (index: number, itemId: string) => {
      const selectedItemObj = availableItems.find(i => i._id === itemId)
      const defaultUnitId = selectedItemObj?.unitId?._id || selectedItemObj?.unitId || ""
      
      setItems(prev => prev.map((item, idx) => idx === index ? {
         ...item,
         itemId,
         unitId: defaultUnitId
      } : item))
   }

   const handleQtyChange = (index: number, quantity: string) => {
      setItems(prev => prev.map((item, idx) => idx === index ? {
         ...item,
         quantity: quantity ? Number(quantity) : 0
      } : item))
   }

   const handleUnitSelect = (index: number, unitId: string) => {
      setItems(prev => prev.map((item, idx) => idx === index ? {
         ...item,
         unitId
      } : item))
   }

   const handleSubmit = async () => {
      if (!projectId) {
         toast.error("Please select a project")
         return
      }
      if (items.some(i => !i.itemId || !i.quantity || !i.unitId)) {
         toast.error("Please select an item, quantity, and unit for all request items")
         return
      }

      let indentFor = "project"
      if (outsideId && outsideId !== "none") {
         indentFor = "outside"
      } else if (flatId && flatId !== "none") {
         indentFor = "flat"
      } else if (floorId && floorId !== "none") {
         indentFor = "floor"
      } else if (towerId && towerId !== "none") {
         indentFor = "tower"
      }

      const payload = {
         projectId,
         priority,
         estimateDeliveryDate: estimateDeliveryDate ? new Date(estimateDeliveryDate).toISOString() : null,
         indentFor,
         towerId: towerId && towerId !== "none" ? towerId : null,
         floorId: floorId && floorId !== "none" ? floorId : null,
         flatId: flatId && flatId !== "none" ? flatId : null,
         outsideId: outsideId && outsideId !== "none" ? outsideId : null,
         storageLocation,
         items: items.map(i => ({
            itemId: i.itemId,
            quantity: Number(i.quantity),
            unitId: i.unitId
         }))
      }

      try {
         await indentService.createIndent(payload)
         toast.success("Indent request created successfully")
         setOpen(false)
         // Reset fields
         setProjectId("")
         setTowerId("")
         setFloorId("")
         setFlatId("")
         setOutsideId("")
         setPriority("medium")
         setEstimateDeliveryDate("")
         setStorageLocation("")
         setItems([{ id: Date.now(), itemId: "", quantity: 1, unitId: "" }])
         if (onSuccess) onSuccess()
      } catch (err: any) {
         toast.error(err.message || "Failed to create indent request")
      }
   }

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
                     <Select value={projectId} onValueChange={setProjectId}>
                        <SelectTrigger className="h-14 rounded-2xl bg-white border-zinc-100 font-bold shadow-sm">
                           <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl bg-white shadow-xl border border-zinc-100">
                           {projects.map(p => (
                              <SelectItem key={p._id} value={p._id}>{p.projectName || p.name}</SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="space-y-3">
                     <Label className="text-[11px] font-black text-zinc-900 uppercase tracking-tight">Priority</Label>
                     <Select value={priority} onValueChange={setPriority}>
                        <SelectTrigger className="h-14 rounded-2xl bg-white border-zinc-100 font-bold shadow-sm">
                           <div className="flex items-center gap-3">
                              <div className={cn(
                                 "h-2 w-2 rounded-full",
                                 priority === "high" || priority === "urgent" ? "bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" :
                                 priority === "medium" ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" :
                                 "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                              )} />
                              <SelectValue placeholder="Select priority" />
                           </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl bg-white shadow-xl border border-zinc-100">
                           <SelectItem value="low">Low</SelectItem>
                           <SelectItem value="medium">Medium</SelectItem>
                           <SelectItem value="high">High</SelectItem>
                           <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="space-y-3 col-span-2">
                     <Label className="text-[11px] font-black text-zinc-900 uppercase tracking-tight">Estimate Delivery Date</Label>
                     <Input
                        type="date"
                        value={estimateDeliveryDate}
                        onChange={(e) => setEstimateDeliveryDate(e.target.value)}
                        className="h-14 rounded-2xl bg-white border-zinc-100 font-bold shadow-sm px-4 appearance-none"
                     />
                  </div>
               </div>

                {/* Cascading Location Selectors */}
                {projectId && (
                  <div className="space-y-6">
                     <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <div className="flex items-center justify-between">
                              <Label className="text-[11px] font-black text-zinc-900 uppercase tracking-tight">Tower (Optional)</Label>
                              {towerId && towerId !== "none" && (
                                 <button
                                    type="button"
                                    onClick={() => {
                                       setTowerId("none")
                                       setFloorId("none")
                                       setFlatId("none")
                                    }}
                                    className="text-[10px] font-bold text-rose-500 hover:underline"
                                 >
                                    Clear
                                 </button>
                              )}
                           </div>
                           <Select
                              value={towerId || "none"}
                              onValueChange={(val) => {
                                 setTowerId(val)
                                 if (val && val !== "none") {
                                    setOutsideId("none")
                                 }
                              }}
                              disabled={!!outsideId && outsideId !== "none"}
                           >
                              <SelectTrigger className="h-14 rounded-2xl bg-white border-zinc-100 font-bold shadow-sm">
                                 <SelectValue placeholder="Select tower" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl bg-white shadow-xl border border-zinc-100">
                                 <SelectItem value="none">Project Level (No Tower)</SelectItem>
                                 {towers.map(t => (
                                    <SelectItem key={t._id} value={t._id}>{t.towerName}</SelectItem>
                                 ))}
                              </SelectContent>
                           </Select>
                        </div>
                        <div className="space-y-3">
                           <div className="flex items-center justify-between">
                              <Label className="text-[11px] font-black text-zinc-900 uppercase tracking-tight">Outside Area (Optional)</Label>
                              {outsideId && outsideId !== "none" && (
                                 <button
                                    type="button"
                                    onClick={() => {
                                       setOutsideId("none")
                                    }}
                                    className="text-[10px] font-bold text-rose-500 hover:underline"
                                 >
                                    Clear
                                 </button>
                              )}
                           </div>
                           <Select
                              value={outsideId || "none"}
                              onValueChange={(val) => {
                                 setOutsideId(val)
                                 if (val && val !== "none") {
                                    setTowerId("none")
                                    setFloorId("none")
                                    setFlatId("none")
                                 }
                              }}
                              disabled={!!towerId && towerId !== "none"}
                           >
                              <SelectTrigger className="h-14 rounded-2xl bg-white border-zinc-100 font-bold shadow-sm">
                                 <SelectValue placeholder="Select outside area" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl bg-white shadow-xl border border-zinc-100">
                                 <SelectItem value="none">No Outside Area</SelectItem>
                                 {outsideAreas.map(o => (
                                    <SelectItem key={o._id} value={o._id}>{o.outsideName}</SelectItem>
                                 ))}
                              </SelectContent>
                           </Select>
                        </div>
                     </div>

                     {towerId && towerId !== "none" && (
                        <div className="grid grid-cols-2 gap-8">
                           <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                 <Label className="text-[11px] font-black text-zinc-900 uppercase tracking-tight">Floor (Optional)</Label>
                                 {floorId && floorId !== "none" && (
                                    <button
                                       type="button"
                                       onClick={() => {
                                          setFloorId("none")
                                          setFlatId("none")
                                       }}
                                       className="text-[10px] font-bold text-rose-500 hover:underline"
                                    >
                                       Clear
                                    </button>
                                 )}
                              </div>
                              <Select value={floorId || "none"} onValueChange={setFloorId}>
                                 <SelectTrigger className="h-14 rounded-2xl bg-white border-zinc-100 font-bold shadow-sm">
                                    <SelectValue placeholder="Select floor" />
                                 </SelectTrigger>
                                 <SelectContent className="rounded-xl bg-white shadow-xl border border-zinc-100">
                                    <SelectItem value="none">Tower Level (No Floor)</SelectItem>
                                    {floors.map(f => (
                                       <SelectItem key={f._id} value={f._id}>{f.floorName}</SelectItem>
                                    ))}
                                 </SelectContent>
                              </Select>
                           </div>
                           <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                 <Label className="text-[11px] font-black text-zinc-900 uppercase tracking-tight">Flat (Optional)</Label>
                                 {flatId && flatId !== "none" && (
                                    <button
                                       type="button"
                                       onClick={() => {
                                          setFlatId("none")
                                       }}
                                       className="text-[10px] font-bold text-rose-500 hover:underline"
                                    >
                                       Clear
                                    </button>
                                 )}
                              </div>
                              <Select value={flatId || "none"} onValueChange={setFlatId} disabled={!floorId || floorId === "none"}>
                                 <SelectTrigger className="h-14 rounded-2xl bg-white border-zinc-100 font-bold shadow-sm">
                                    <SelectValue placeholder="Select flat" />
                                 </SelectTrigger>
                                 <SelectContent className="rounded-xl bg-white shadow-xl border border-zinc-100">
                                    <SelectItem value="none">Floor Level (No Flat)</SelectItem>
                                    {flats.map(fl => (
                                       <SelectItem key={fl._id} value={fl._id}>{fl.flatName}</SelectItem>
                                    ))}
                                 </SelectContent>
                              </Select>
                           </div>
                        </div>
                     )}
                  </div>
                )}

               {/* Dynamic Items Section */}
               <div className="space-y-6 bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-2 w-32 bg-primary/10 rounded-bl-full" />

                  <div className="flex items-center justify-between relative">
                     <div className="flex items-center gap-3">
                        <div className="h-1.5 w-6 rounded-full bg-primary" />
                        <h4 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Requested Items</h4>
                     </div>
                     <Button type="button" onClick={addItem} variant="outline" className="h-10 px-6 rounded-xl border-zinc-200 font-black text-[10px] uppercase tracking-widest gap-2 hover:bg-zinc-50 shadow-sm">
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
                              <Select value={item.itemId} onValueChange={(val) => handleItemSelect(idx, val)}>
                                 <SelectTrigger className="h-14 rounded-2xl bg-zinc-50/50 border-zinc-100 font-bold">
                                    <SelectValue placeholder="Select item" />
                                 </SelectTrigger>
                                 <SelectContent className="rounded-xl bg-white shadow-xl border border-zinc-100">
                                    {availableItems.map(i => (
                                       <SelectItem key={i._id} value={i._id}>{i.itemName}</SelectItem>
                                    ))}
                                 </SelectContent>
                              </Select>
                           </div>
                           <div className="space-y-2.5">
                              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center block w-full">Qty</Label>
                              <Input
                                 type="number"
                                 value={item.quantity || ""}
                                 onChange={(e) => handleQtyChange(idx, e.target.value)}
                                 placeholder="0"
                                 className="h-14 rounded-2xl bg-zinc-50/50 border-zinc-100 font-bold text-center focus:bg-white transition-all"
                              />
                           </div>
                           <div className="space-y-2.5">
                              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Unit</Label>
                              <Select value={item.unitId} onValueChange={(val) => handleUnitSelect(idx, val)}>
                                 <SelectTrigger className="h-14 rounded-2xl bg-zinc-50/50 border-zinc-100 font-bold">
                                    <SelectValue placeholder="Unit" />
                                 </SelectTrigger>
                                 <SelectContent className="rounded-xl bg-white shadow-xl border border-zinc-100">
                                    {units.map(u => (
                                       <SelectItem key={u._id} value={u._id}>{u.label || u.value}</SelectItem>
                                    ))}
                                 </SelectContent>
                              </Select>
                           </div>
                           {items.length > 1 && (
                              <Button
                                 type="button"
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
                     value={storageLocation}
                     onChange={(e) => setStorageLocation(e.target.value)}
                     className="min-h-[120px] rounded-[2rem] bg-white border-zinc-100 font-bold p-8 focus:ring-primary shadow-sm"
                  />
               </div>
            </div>

            {/* Submit Section */}
            <div className="p-10 pt-4 bg-white shrink-0">
               <Button onClick={handleSubmit} className="w-full h-16 rounded-2xl bg-emerald-500 text-white font-black text-lg shadow-2xl shadow-emerald-500/20 hover:bg-emerald-600 hover:scale-[1.01] transition-all transform active:scale-95">
                  Submit Request
               </Button>
            </div>
         </DialogContent>
      </Dialog>
   )
}

