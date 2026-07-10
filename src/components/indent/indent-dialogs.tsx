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
import { assetService } from "@/service/assets.api"
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
   Zap,
   Eye,
   X
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
   DialogDescription,
   DialogFooter,
} from "@/components/ui/dialog"
import { ItemForm } from "@/components/item-form"
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const getImageUrl = (filePath: string) => {
  if (!filePath) return ""
  if (filePath.startsWith("http")) return filePath
  let cleanPath = filePath
  if (filePath.startsWith("/uploads/")) {
    cleanPath = `/api${filePath}`
  }
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:9090/api/"
  try {
    const origin = new URL(baseUrl).origin
    return `${origin}${cleanPath}`
  } catch (e) {
    return `http://localhost:9090${cleanPath}`
  }
}

// --- VIEW INDENT DIALOG ---

export function ViewIndentDialog({
  trigger,
  indent,
  onStatusChange,
  user,
}: {
  trigger: React.ReactNode
  indent: any
  onStatusChange?: (id: string, newStatus: string, reason?: string, items?: any[], storageLocation?: string) => void
  user?: any
}) {
   const [open, setOpen] = useState(false)
   const [remark, setRemark] = useState("")
   const [storageLocation, setStorageLocation] = useState("")
   const [selectedImage, setSelectedImage] = useState<string | null>(null)
   const [itemStatuses, setItemStatuses] = useState<Record<number, "Approved" | "Rejected">>({})

   useEffect(() => {
      if (open && indent?.items) {
         const initial: Record<number, "Approved" | "Rejected"> = {}
         indent.items.forEach((_: any, idx: number) => {
            initial[idx] = "Approved"
         })
         setItemStatuses(initial)
         setStorageLocation(indent.storageLocation || "")
         setRemark("")
      }
   }, [open, indent])

   if (!indent) return null

   const currentLabel = indent.status === "Pending" ? "PENDING MANAGER" :
                        indent.status === "ManagerApproved" ? "PENDING ADMIN" :
                        indent.status === "Approved" ? "APPROVED" :
                        indent.status === "ConvertedToPO" ? "PO CREATED" : "REJECTED"

   const isAdmin = user?.roleId?.name?.toLowerCase() === "admin"
   const canTakeAction = isAdmin ? (indent.status === "ManagerApproved") : (indent.status === "Pending")

   const handleApprove = () => {
      const approvedItems = indent.items.filter((item: any, idx: number) => itemStatuses[idx] === "Approved")
      if (approvedItems.length === 0) {
         toast.error("At least one item must be approved. To reject the whole indent, use the 'Reject Entire Indent' button.")
         return
      }

      const formattedItems = approvedItems.map((i: any) => ({
         itemId: i.itemId?._id || i.itemId,
         unitId: i.unitId?._id || i.unitId,
         quantity: Number(i.quantity),
         description: i.description || "",
         images: i.images || []
      }))

      if (onStatusChange) {
         onStatusChange(indent._id, "Approved", remark, formattedItems, storageLocation)
      }
      setOpen(false)
   }

   const handleReject = () => {
      if (!remark.trim()) {
         toast.error("Please enter a rejection reason in the remark/reason field")
         return
      }
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
         <DialogContent className="sm:max-w-[1000px] w-[95vw] max-h-[90vh] p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] flex flex-col mx-4 bg-white">

            {/* Header Block */}
            <div className="p-8 pb-4 bg-white shrink-0">
               <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                     <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none">Indent Request</span>
                     <h2 className="text-3xl font-black text-zinc-900 tracking-tighter leading-none">#{indent.indentId}</h2>
                  </div>
                  <Badge className={cn(
                     "px-5 py-1.5 rounded-full font-black text-[10px] gap-2 border-none shadow-sm",
                     indent.status === "Pending" || indent.status === "ManagerApproved" ? "bg-amber-100 text-amber-700" :
                     indent.status === "Approved" ? "bg-blue-100 text-blue-700" :
                     indent.status === "ConvertedToPO" ? "bg-emerald-100 text-emerald-700" :
                     "bg-rose-100 text-rose-700"
                  )}>
                     <Clock className="h-3.5 w-3.5" /> {currentLabel}
                  </Badge>
               </div>
            </div>

            {/* Split layout on desktop */}
            <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden bg-zinc-50/20 border-t border-zinc-100">
               
               {/* Left Column: Details & Items */}
               <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">

                  {/* Requester Card: Compact */}
                  <div className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                           <User className="h-6 w-6" />
                        </div>
                        <div className="flex flex-col">
                           <h3 className="text-lg font-black text-zinc-900 leading-tight">{indent.requestedBy?.name || "Unknown"}</h3>
                           <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                              {indent.requestedBy?.email || "Requester"} {indent.requestedBy?.mobile ? `· ${indent.requestedBy.mobile}` : ""}
                           </span>
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
                        !indent.outsideId && { label: "Floor / Flat", val: [indent.floorId?.floorName || indent.floorId?.name, indent.flatId?.flatNumber || indent.flatId?.flatName || indent.flatId?.name].filter(Boolean).join(" · ") || "N/A", icon: MapPin },
                        { label: "Storage Location", val: indent.storageLocation || "N/A", icon: Layers },
                        { label: "Indent Type", val: indent.indentType ? (indent.indentType.charAt(0).toUpperCase() + indent.indentType.slice(1)) : "Item", icon: Layers },
                        { label: "Priority", val: indent.priority ? (indent.priority.charAt(0).toUpperCase() + indent.priority.slice(1)) : "Medium", icon: Zap },
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

                  {indent.approveRemark && (
                     <div className={cn(
                        "p-5 rounded-2xl border border-dashed",
                        indent.status === "Approved" ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-zinc-50 border-zinc-100 text-zinc-600"
                     )}>
                        <span className={cn(
                           "text-[8px] font-black uppercase tracking-widest block mb-1",
                           indent.status === "Approved" ? "text-emerald-500" : "text-zinc-500"
                        )}>Approval Remark / Description</span>
                        <p className="text-[11px] font-bold italic leading-relaxed">&quot;{indent.approveRemark}&quot;</p>
                     </div>
                  )}

                  {/* Requested Items */}
                  <div className="space-y-4">
                     <div className="flex items-center gap-3">
                        <div className="h-1 w-4 rounded-full bg-emerald-500" />
                        <h4 className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">
                           {indent.indentType === "asset" || indent.indentType === "assets" ? "Requested Assets" : "Requested Items"}
                        </h4>
                     </div>

                     {indent.items?.map((item: any, i: number) => (
                        <div key={i} className={cn(
                           "bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm space-y-4 group hover:border-emerald-200 transition-all",
                           itemStatuses[i] === "Rejected" && "bg-rose-50/10 border-rose-100/50 opacity-70"
                        )}>
                           {/* Header: Item name and Priority badge / action */}
                           <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                              <div className="flex items-center gap-3">
                                 <div className="h-8 w-8 rounded-lg bg-zinc-50 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                    <Layers className="h-4 w-4" />
                                 </div>
                                 <div className="flex flex-col">
                                    <h5 className={cn(
                                       "text-sm font-black text-zinc-900 tracking-tight",
                                       itemStatuses[i] === "Rejected" && "text-rose-900/60 line-through"
                                    )}>{item.itemId?.itemName || item.itemId?.name || "Unknown Item"}</h5>
                                    {item.itemId?.itemCode && (
                                       <span className="text-[9px] font-mono text-zinc-400">Code: {item.itemId.itemCode}</span>
                                    )}
                                 </div>
                              </div>
                              <div className="flex items-center gap-2">
                                 {canTakeAction ? (
                                    <div className="flex items-center gap-1 bg-zinc-50 p-1 rounded-xl border border-zinc-100 shrink-0">
                                       <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                             setItemStatuses(prev => ({ ...prev, [i]: "Approved" }))
                                          }}
                                          className={cn(
                                             "h-7 px-3 rounded-lg text-[9px] font-black tracking-wider uppercase transition-all",
                                             itemStatuses[i] === "Approved"
                                                ? "bg-emerald-500 text-white shadow-sm hover:bg-emerald-600"
                                                : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
                                          )}
                                       >
                                          Approve
                                       </Button>
                                       <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                             setItemStatuses(prev => ({ ...prev, [i]: "Rejected" }))
                                          }}
                                          className={cn(
                                             "h-7 px-3 rounded-lg text-[9px] font-black tracking-wider uppercase transition-all",
                                             itemStatuses[i] === "Rejected"
                                                ? "bg-rose-500 text-white shadow-sm hover:bg-rose-600"
                                                : "text-zinc-400 hover:text-rose-600 hover:bg-rose-100"
                                          )}
                                       >
                                          Reject
                                       </Button>
                                    </div>
                                 ) : (
                                    <Badge variant="outline" className="text-[7px] font-black uppercase px-2 py-0.5 border-zinc-100 rounded-md text-zinc-400">
                                       {indent.priority || "low"}
                                    </Badge>
                                 )}
                              </div>
                           </div>

                           {/* Fields Grid */}
                           <div className="grid grid-cols-3 gap-4">
                              <div>
                                 <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block mb-0.5">Quantity</span>
                                 <span className="text-xs font-bold text-zinc-900">{item.quantity}</span>
                              </div>
                              <div>
                                 <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block mb-0.5">Unit</span>
                                 <span className="text-xs font-bold text-zinc-900 uppercase">{item.unitId?.label || item.unitId?.value || item.unitId?.unitName || item.unitId?.name || "Units"}</span>
                              </div>
                              <div className="col-span-1">
                                 <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block mb-0.5">Description</span>
                                 <span className="text-xs font-bold text-zinc-600 italic block truncate" title={item.description || "N/A"}>
                                    {item.description || "N/A"}
                                 </span>
                              </div>
                           </div>

                           {/* Additional Info Cards (Group, Sub-Group, price, total value) */}
                           {(item.itemId?.groupId?.name || item.itemId?.subGroupId?.name || item.itemId?.price) && (
                              <div className="mt-3 pt-3 border-t border-zinc-100/60 grid grid-cols-2 gap-4 bg-zinc-50/50 p-3 rounded-xl">
                                 {(item.itemId?.groupId?.name || item.itemId?.subGroupId?.name) && (
                                    <div>
                                       <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block mb-0.5">Category / Brand</span>
                                       <span className="text-xs font-bold text-zinc-700">
                                          {[item.itemId?.groupId?.name, item.itemId?.subGroupId?.name].filter(Boolean).join(" · ")}
                                       </span>
                                    </div>
                                 )}
                                 {item.itemId?.price && (
                                    <div>
                                       <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block mb-0.5">Est. Price & Total</span>
                                       <span className="text-xs font-black text-zinc-900">
                                          ₹{item.itemId.price} / unit <span className="text-emerald-600 font-bold block text-sm">Total: ₹{Number(item.itemId.price) * item.quantity}</span>
                                       </span>
                                    </div>
                                 )}
                              </div>
                           )}

                           {/* Item-specific Images */}
                           {item.images && item.images.length > 0 && (
                              <div className="space-y-2 border-t border-zinc-100/60 pt-3">
                                 <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Item Images ({item.images.length})</span>
                                 <div className="flex flex-wrap gap-2">
                                    {item.images.map((img: any, imgIdx: number) => {
                                       const imgUrl = getImageUrl(img.filePath)
                                       return (
                                          <div 
                                             key={imgIdx} 
                                             onClick={() => setSelectedImage(imgUrl)}
                                             title={img.fileName || `Attachment ${imgIdx + 1}`}
                                             className="relative h-12 w-20 rounded-xl overflow-hidden border border-zinc-100 shadow-sm cursor-pointer group hover:scale-[1.03] transition-all bg-zinc-50"
                                          >
                                             <img 
                                                src={imgUrl} 
                                                alt={`Attachment ${imgIdx + 1}`} 
                                                className="w-full h-full object-cover"
                                             />
                                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Eye className="h-4 w-4 text-white" />
                                             </div>
                                          </div>
                                       )
                                    })}
                                 </div>
                              </div>
                           )}
                        </div>
                     ))}

                   {/* Attached Images */}
                   {indent.images && indent.images.length > 0 && (
                      <div className="space-y-4 pt-2">
                         <div className="flex items-center gap-3">
                            <div className="h-1 w-4 rounded-full bg-emerald-500" />
                            <h4 className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">
                               Attached Images
                            </h4>
                         </div>
                         <div className="flex flex-wrap gap-3">
                            {indent.images.map((img: any, idx: number) => {
                               const imgUrl = getImageUrl(img.filePath)
                               return (
                                  <div 
                                     key={idx} 
                                     onClick={() => setSelectedImage(imgUrl)}
                                     title={img.fileName || `Attachment ${idx + 1}`}
                                     className="relative h-20 w-32 rounded-2xl overflow-hidden border border-zinc-100 shadow-sm cursor-pointer group hover:scale-[1.03] transition-all bg-zinc-50"
                                  >
                                     <img 
                                        src={imgUrl} 
                                        alt={img.fileName || `Attachment ${idx + 1}`} 
                                        className="w-full h-full object-cover"
                                     />
                                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Eye className="h-4 w-4 text-white" />
                                     </div>
                                  </div>
                               )
                            })}
                         </div>
                      </div>
                   )}
                  </div>
               </div>

               {/* Right Column: Take Action (if applicable) */}
               {canTakeAction && (
                  <div className="w-full md:w-[380px] bg-emerald-50/10 border-t md:border-t-0 md:border-l border-emerald-100/60 p-8 flex flex-col justify-start shrink-0 space-y-5 overflow-y-auto custom-scrollbar">
                     <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-emerald-500 fill-emerald-500" />
                        <h4 className="text-[10px] font-black text-emerald-950 uppercase tracking-widest">Take Action</h4>
                     </div>
                     
                     <div className="space-y-1.5">
                        <Label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Storage Location</Label>
                        <Input
                           placeholder="e.g. Store Room A, Site Office..."
                           value={storageLocation}
                           onChange={(e) => setStorageLocation(e.target.value)}
                           className="h-11 rounded-xl bg-white border-zinc-100 focus:ring-emerald-500 font-bold px-4 text-xs shadow-sm"
                        />
                     </div>

                     <div className="space-y-1.5">
                        <Label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Remark / Rejection Reason</Label>
                        <Textarea
                           placeholder="Add a remark / rejection reason (optional)..."
                           value={remark}
                           onChange={(e) => setRemark(e.target.value)}
                           className="min-h-[80px] rounded-2xl bg-white border-zinc-100 focus:ring-emerald-500 font-bold p-4 text-xs shadow-sm"
                        />
                     </div>

                     <div className="flex flex-col gap-2 pt-2">
                        <Button
                           onClick={handleApprove}
                           className="h-12 w-full rounded-xl bg-emerald-500 text-white font-black text-xs gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
                        >
                           <CheckCircle2 className="h-4 w-4" /> Approve Selected Items
                        </Button>
                        <Button 
                           variant="outline" 
                           onClick={handleReject}
                           className="h-12 w-full rounded-xl border-rose-100 text-rose-500 font-black text-xs gap-2 hover:bg-rose-50 transition-all"
                        >
                           <XCircle className="h-4 w-4" /> Reject Entire Indent
                        </Button>
                     </div>
                  </div>
               )}
            </div>
         </DialogContent>

         {/* Image Lightbox Dialog */}
         <Dialog open={!!selectedImage} onOpenChange={(open) => { if (!open) setSelectedImage(null) }}>
            <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden border-none bg-transparent shadow-none flex items-center justify-center">
               {selectedImage && (
                  <div className="relative max-w-full max-h-[85vh] rounded-3xl overflow-hidden bg-black/95 p-1 flex items-center justify-center shadow-2xl">
                     <img src={selectedImage} alt="Preview" className="max-w-full max-h-[80vh] object-contain rounded-2xl" />
                     <button 
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-md transition-all border border-white/10"
                     >
                        <X className="h-5 w-5" />
                     </button>
                  </div>
               )}
            </DialogContent>
         </Dialog>
      </Dialog>
   )
}


// --- CREATE INDENT DIALOG ---

export function CreateIndentDialog({ trigger, onSuccess }: { trigger: React.ReactNode; onSuccess?: () => void }) {
   const [open, setOpen] = useState(false)
   
   const [projects, setProjects] = useState<any[]>([])
   const [projectsPage, setProjectsPage] = useState(1)
   const [hasMoreProjects, setHasMoreProjects] = useState(true)
   const [isLoadingProjects, setIsLoadingProjects] = useState(false)

   const [availableItems, setAvailableItems] = useState<any[]>([])
   const [itemsPage, setItemsPage] = useState(1)
   const [hasMoreItems, setHasMoreItems] = useState(true)
   const [isLoadingItems, setIsLoadingItems] = useState(false)

   const [availableAssets, setAvailableAssets] = useState<any[]>([])
   const [assetsPage, setAssetsPage] = useState(1)
   const [hasMoreAssets, setHasMoreAssets] = useState(true)
   const [isLoadingAssets, setIsLoadingAssets] = useState(false)

   const [units, setUnits] = useState<any[]>([])
   const [unitsPage, setUnitsPage] = useState(1)
   const [hasMoreUnits, setHasMoreUnits] = useState(true)
   const [isLoadingUnits, setIsLoadingUnits] = useState(false)
   
   const [projectId, setProjectId] = useState("")
   const [towerId, setTowerId] = useState("")
   const [floorId, setFloorId] = useState("")
   const [flatId, setFlatId] = useState("")
   const [outsideId, setOutsideId] = useState("")
   const [priority, setPriority] = useState("medium")
   const [estimateDeliveryDate, setEstimateDeliveryDate] = useState("")
   const [storageLocation, setStorageLocation] = useState("")
   const [indentType, setIndentType] = useState("material")
   const [locationTab, setLocationTab] = useState<"project" | "outside">("project")
   
   const [towers, setTowers] = useState<any[]>([])
   const [floors, setFloors] = useState<any[]>([])
   const [flats, setFlats] = useState<any[]>([])
   const [outsideAreas, setOutsideAreas] = useState<any[]>([])

   const [items, setItems] = useState<any[]>([{ id: Date.now(), itemId: "", quantity: 1, unitId: "", description: "", images: [] }])

   const [isCreateItemOpen, setIsCreateItemOpen] = useState(false)
   const [isCreateAssetOpen, setIsCreateAssetOpen] = useState(false)
   const [newAssetName, setNewAssetName] = useState("")
   const [newAssetType, setNewAssetType] = useState("Equipment")
   const [newAssetSerialNumber, setNewAssetSerialNumber] = useState("")
   const [newAssetExtraNote, setNewAssetExtraNote] = useState("")
   const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null)

   const handleCreateItemSave = async (payload: any) => {
      try {
         const newItem = await itemService.createItem(payload)
         // Refetch available items
         const itemRes = await itemService.getItems({ limit: 200 })
         setAvailableItems(itemRes.items || [])
         
         // Automatically select the new item in the active row
         if (activeItemIndex !== null) {
            handleItemSelect(activeItemIndex, newItem._id || newItem.id || "")
         }
         setIsCreateItemOpen(false)
      } catch (err: any) {
         // Error is handled/shown by the form submit or toast
      }
   }

   const handleCreateAssetSave = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!newAssetName.trim() || !newAssetType.trim()) {
         toast.error("Asset Name and Type are required")
         return
      }
      try {
         const newAsset = await assetService.createAsset({
            name: newAssetName,
            type: newAssetType,
            serialNumber: newAssetSerialNumber || undefined,
            status: "Returned",
            extraNote: newAssetExtraNote
         })
         
         // Refetch assets
         const assetRes = await assetService.getAssets({ limit: 200 })
         setAvailableAssets(assetRes.assets || assetRes.data || assetRes || [])
         
         // Automatically select the new asset in the active row
         if (activeItemIndex !== null) {
            handleItemSelect(activeItemIndex, newAsset._id || "")
         }
         setIsCreateAssetOpen(false)
         // Reset form
         setNewAssetName("")
         setNewAssetType("Equipment")
         setNewAssetSerialNumber("")
         setNewAssetExtraNote("")
         toast.success("New asset created and selected successfully")
      } catch (err: any) {
         toast.error(err.message || "Failed to create asset")
      }
   }

   const addItem = () => setItems([...items, { id: Date.now(), itemId: "", quantity: 1, unitId: "", description: "", images: [] }])
   const removeItem = (id: number) => setItems(items.filter(i => i.id !== id))

   const fetchProjects = async (pageToFetch = 1, reset = false) => {
      if (isLoadingProjects || (!hasMoreProjects && !reset)) return
      setIsLoadingProjects(true)
      try {
         const res = await projectService.getProjects({ page: pageToFetch, limit: 10 })
         const newProjects = res.projects || []
         setProjects(prev => reset ? newProjects : [...prev, ...newProjects])
         setProjectsPage(pageToFetch)
         const totalPages = res.pagination?.totalPages || 1
         setHasMoreProjects(pageToFetch < totalPages)
      } catch (err) {
         console.error("Failed to fetch projects:", err)
      } finally {
         setIsLoadingProjects(false)
      }
   }

   const fetchItems = async (pageToFetch = 1, reset = false) => {
      if (isLoadingItems || (!hasMoreItems && !reset)) return
      setIsLoadingItems(true)
      try {
         const res = await itemService.getItems({ page: pageToFetch, limit: 10 })
         const newItems = res.items || []
         setAvailableItems(prev => reset ? newItems : [...prev, ...newItems])
         setItemsPage(pageToFetch)
         const totalPages = res.pagination?.totalPages || 1
         setHasMoreItems(pageToFetch < totalPages)
      } catch (err) {
         console.error("Failed to fetch items:", err)
      } finally {
         setIsLoadingItems(false)
      }
   }

   const fetchAssets = async (pageToFetch = 1, reset = false) => {
      if (isLoadingAssets || (!hasMoreAssets && !reset)) return
      setIsLoadingAssets(true)
      try {
         const res = await assetService.getAssets({ page: pageToFetch, limit: 10 })
         const newAssets = res.data || []
         setAvailableAssets(prev => reset ? newAssets : [...prev, ...newAssets])
         setAssetsPage(pageToFetch)
         const total = res.pagination?.total || 0
         const totalPages = Math.ceil(total / 10) || 1
         setHasMoreAssets(pageToFetch < totalPages)
      } catch (err) {
         console.error("Failed to fetch assets:", err)
      } finally {
         setIsLoadingAssets(false)
      }
   }

   const fetchUnits = async (pageToFetch = 1, reset = false) => {
      if (isLoadingUnits || (!hasMoreUnits && !reset)) return
      setIsLoadingUnits(true)
      try {
         const res = await unitService.getUnits({ page: pageToFetch, limit: 10 })
         const newUnits = res.units || []
         setUnits(prev => reset ? newUnits : [...prev, ...newUnits])
         setUnitsPage(pageToFetch)
         const totalPages = res.pagination?.totalPages || 1
         setHasMoreUnits(pageToFetch < totalPages)
      } catch (err) {
         console.error("Failed to fetch units:", err)
      } finally {
         setIsLoadingUnits(false)
      }
   }

   useEffect(() => {
      if (!open) {
         setProjects([])
         setProjectsPage(1)
         setHasMoreProjects(true)
         
         setAvailableItems([])
         setItemsPage(1)
         setHasMoreItems(true)
         
         setAvailableAssets([])
         setAssetsPage(1)
         setHasMoreAssets(true)
         
         setUnits([])
         setUnitsPage(1)
         setHasMoreUnits(true)
      }
   }, [open])

   useEffect(() => {
      setItems([{ id: Date.now(), itemId: "", quantity: 1, unitId: "", description: "", images: [] }])
   }, [indentType])

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
          } catch (err: any) {
             console.error(err)
          }
       }
       const fetchOutsides = async () => {
          try {
             const res = await outsideService.getOutsides({ projectId, limit: 100 })
             setOutsideAreas(res.data || [])
             setOutsideId("")
          } catch (err: any) {
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
         } catch (err: any) {
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
         } catch (err: any) {
            console.error(err)
         }
      }
      fetchFlats()
   }, [floorId])

   const handleItemSelect = (index: number, itemId: string) => {
      const selectedItemObj = indentType === "item"
         ? availableItems.find(i => i._id === itemId)
         : availableAssets.find(a => a._id === itemId)
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

      const formData = new FormData()
      formData.append("projectId", projectId)
      formData.append("priority", priority)
      if (estimateDeliveryDate) {
         formData.append("estimateDeliveryDate", new Date(estimateDeliveryDate).toISOString())
      }
      formData.append("indentType", indentType)
      formData.append("indentFor", indentFor)
      if (towerId && towerId !== "none") formData.append("towerId", towerId)
      if (floorId && floorId !== "none") formData.append("floorId", floorId)
      if (flatId && flatId !== "none") formData.append("flatId", flatId)
      if (outsideId && outsideId !== "none") formData.append("outsideId", outsideId)
      if (storageLocation) formData.append("storageLocation", storageLocation)

      const formattedItems = items.map(i => ({
         itemId: i.itemId,
         quantity: Number(i.quantity),
         unitId: i.unitId,
         description: i.description || ""
      }))
      formData.append("items", JSON.stringify(formattedItems))

      // Append all uploaded files to top-level "images" field
      items.forEach(i => {
         if (i.files && i.files.length > 0) {
            i.files.forEach((file: File) => {
               formData.append("images", file)
            })
         }
      })

      try {
         await indentService.createIndent(formData)
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
         setIndentType("material")
         setLocationTab("project")
         setItems([{ id: Date.now(), itemId: "", quantity: 1, unitId: "", description: "", images: [], files: [] }])
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
                      <Select 
                         value={projectId} 
                         onValueChange={setProjectId}
                         onOpenChange={(open) => {
                            if (open && projects.length === 0) {
                               fetchProjects(1, true)
                            }
                         }}
                      >
                        <SelectTrigger className="h-14 rounded-2xl bg-white border-zinc-100 font-bold shadow-sm">
                           <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent 
                           className="rounded-xl bg-white shadow-xl border border-zinc-100 max-h-60 overflow-y-auto"
                           onScroll={(e) => {
                              const target = e.currentTarget
                              if (target.scrollHeight - target.scrollTop <= target.clientHeight + 15) {
                                 if (hasMoreProjects && !isLoadingProjects) {
                                    fetchProjects(projectsPage + 1)
                                 }
                              }
                           }}
                        >
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
                  <div className="space-y-3">
                     <Label className="text-[11px] font-black text-zinc-900 uppercase tracking-tight">Indent Type</Label>
                     <Select value={indentType} onValueChange={setIndentType}>
                        <SelectTrigger className="h-14 rounded-2xl bg-white border-zinc-100 font-bold shadow-sm">
                           <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl bg-white shadow-xl border border-zinc-100">
                           <SelectItem value="material">Item</SelectItem>
                           <SelectItem value="asset">Asset</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="space-y-3">
                      <Label className="text-[11px] font-black text-zinc-900 uppercase tracking-tight">Estimate Delivery Date</Label>
                      <Input
                         type="date"
                         value={estimateDeliveryDate}
                         onChange={(e) => setEstimateDeliveryDate(e.target.value)}
                         className="h-14 rounded-2xl bg-white border-zinc-100 font-bold shadow-sm px-4 appearance-none"
                      />
                   </div>
                   <div className="space-y-3 col-span-2">
                      <Label className="text-[11px] font-black text-zinc-900 uppercase tracking-tight">Storage Location</Label>
                      <Input
                         type="text"
                         placeholder="e.g. Store Room A, Site Office..."
                         value={storageLocation}
                         onChange={(e) => setStorageLocation(e.target.value)}
                         className="h-14 rounded-2xl bg-white border-zinc-100 font-bold shadow-sm px-4"
                      />
                   </div>
               </div>

                {/* Cascading Location Selectors */}
                {projectId && (
                  <div className="space-y-6 col-span-2">
                     <div className="flex bg-zinc-100 p-1.5 rounded-2xl w-full">
                        <button
                           type="button"
                           onClick={() => {
                              setLocationTab("project")
                              setOutsideId("")
                           }}
                           className={cn(
                              "flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all",
                              locationTab === "project" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-900"
                           )}
                        >
                           Project Structure
                        </button>
                        <button
                           type="button"
                           onClick={() => {
                              setLocationTab("outside")
                              setTowerId("")
                              setFloorId("")
                              setFlatId("")
                           }}
                           className={cn(
                              "flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all",
                              locationTab === "outside" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-900"
                           )}
                        >
                           Outside Project
                        </button>
                     </div>

                     {locationTab === "project" ? (
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
                                    }}
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
                     ) : (
                        <div className="grid grid-cols-2 gap-8">
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
                                 }}
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
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           key={item.id}
                           className="bg-zinc-50/50 p-6 rounded-2xl border border-zinc-100/80 space-y-4"
                        >
                           {/* First row: Item selection and delete button */}                           <div className="flex items-end gap-4">
                              <div className="flex-1 space-y-2">
                                 <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                    {indentType === "material" ? "Select Item" : "Select Asset"}
                                 </Label>
                                 <Select 
                                    value={item.itemId} 
                                    onValueChange={(val) => {
                                       if (val === "CREATE_NEW_ITEM") {
                                          setActiveItemIndex(idx)
                                          setIsCreateItemOpen(true)
                                       } else if (val === "CREATE_NEW_ASSET") {
                                          setActiveItemIndex(idx)
                                          setIsCreateAssetOpen(true)
                                       } else {
                                          handleItemSelect(idx, val)
                                       }
                                    }}
                                    onOpenChange={(open) => {
                                       if (open) {
                                          if (indentType === "material" && availableItems.length === 0) {
                                             fetchItems(1, true)
                                          } else if (indentType === "asset" && availableAssets.length === 0) {
                                             fetchAssets(1, true)
                                          }
                                       }
                                    }}
                                 >
                                    <SelectTrigger className="h-14 rounded-2xl bg-white border-zinc-100 font-bold">
                                       <SelectValue placeholder={indentType === "material" ? "Select item" : "Select asset"} />
                                    </SelectTrigger>
                                    <SelectContent 
                                       className="rounded-xl bg-white shadow-xl border border-zinc-100 max-h-60 overflow-y-auto"
                                       onScroll={(e) => {
                                          const target = e.currentTarget
                                          if (target.scrollHeight - target.scrollTop <= target.clientHeight + 15) {
                                             if (indentType === "material") {
                                                if (hasMoreItems && !isLoadingItems) {
                                                   fetchItems(itemsPage + 1)
                                                }
                                             } else {
                                                if (hasMoreAssets && !isLoadingAssets) {
                                                   fetchAssets(assetsPage + 1)
                                                }
                                             }
                                          }
                                       }}
                                    >
                                       {indentType === "material" ? (
                                          <SelectItem 
                                             value="CREATE_NEW_ITEM" 
                                             className="font-black text-xs text-teal-600 hover:text-teal-700 bg-teal-50/50 hover:bg-teal-50 border-b border-zinc-100 focus:bg-teal-50 focus:text-teal-700 py-3 rounded-t-xl"
                                          >
                                             <span className="flex items-center gap-1.5 font-black uppercase tracking-wider">
                                                <Plus className="h-3.5 w-3.5" /> Create New Item
                                             </span>
                                          </SelectItem>
                                       ) : (
                                          <SelectItem 
                                             value="CREATE_NEW_ASSET" 
                                             className="font-black text-xs text-teal-600 hover:text-teal-700 bg-teal-50/50 hover:bg-teal-50 border-b border-zinc-100 focus:bg-teal-50 focus:text-teal-700 py-3 rounded-t-xl"
                                          >
                                             <span className="flex items-center gap-1.5 font-black uppercase tracking-wider">
                                                <Plus className="h-3.5 w-3.5" /> Create New Asset
                                             </span>
                                          </SelectItem>
                                       )}
                                       {indentType === "material" ? (
                                          availableItems.map(i => (
                                             <SelectItem key={i._id} value={i._id}>{i.itemName}</SelectItem>
                                          ))
                                       ) : (
                                          availableAssets.map(a => (
                                             <SelectItem key={a._id} value={a._id}>{a.name}</SelectItem>
                                          ))
                                       )}
                                    </SelectContent>
                                 </Select>
                              </div>
                              {items.length > 1 && (
                                 <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeItem(item.id)}
                                    className="h-14 w-14 rounded-2xl text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                                 >
                                    <Trash2 className="h-5 w-5" />
                                 </Button>
                              )}
                           </div>

                           {/* Second row: Qty and Unit side-by-side */}
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                 <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Quantity</Label>
                                 <Input
                                    type="number"
                                    value={item.quantity || ""}
                                    onChange={(e) => handleQtyChange(idx, e.target.value)}
                                    placeholder="0"
                                    className="h-14 rounded-2xl bg-white border-zinc-100 font-bold focus:bg-white transition-all px-4"
                                 />
                              </div>
                              <div className="space-y-2">
                                 <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Unit</Label>
                                 <Select 
                                    value={item.unitId} 
                                    onValueChange={(val) => handleUnitSelect(idx, val)}
                                    onOpenChange={(open) => {
                                       if (open && units.length === 0) {
                                          fetchUnits(1, true)
                                       }
                                    }}
                                 >
                                    <SelectTrigger className="h-14 rounded-2xl bg-white border-zinc-100 font-bold">
                                       <SelectValue placeholder="Unit" />
                                    </SelectTrigger>
                                    <SelectContent 
                                       className="rounded-xl bg-white shadow-xl border border-zinc-100 max-h-60 overflow-y-auto"
                                       onScroll={(e) => {
                                          const target = e.currentTarget
                                          if (target.scrollHeight - target.scrollTop <= target.clientHeight + 15) {
                                             if (hasMoreUnits && !isLoadingUnits) {
                                                fetchUnits(unitsPage + 1)
                                             }
                                          }
                                       }}
                                    >
                                       {units.map(u => (
                                          <SelectItem key={u._id} value={u._id}>{u.label || u.value}</SelectItem>
                                       ))}
                                    </SelectContent>
                                 </Select>
                              </div>
                           </div>

                           {/* Third row: Item Description */}
                           <div className="space-y-2">
                              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Item Description</Label>
                              <Input
                                 placeholder="Enter specs, brand or other details for this item..."
                                 value={item.description || ""}
                                 onChange={(e) => {
                                    const val = e.target.value
                                    setItems(prev => prev.map((it, i) => i === idx ? { ...it, description: val } : it))
                                 }}
                                 className="h-12 rounded-xl bg-white border-zinc-100 font-medium text-xs px-4"
                              />
                           </div>

                           {/* Fourth row: Item Images upload */}
                           <div className="space-y-2">
                              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Attach Images (Optional)</Label>
                              <div className="flex flex-wrap gap-3 items-center">
                                 <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    id={`item-file-${item.id}`}
                                    className="hidden"
                                    onChange={async (e) => {
                                       const files = Array.from(e.target.files || [])
                                       const readPromises = files.map(file => {
                                          return new Promise((resolve) => {
                                             const reader = new FileReader()
                                             reader.onloadend = () => {
                                                resolve({
                                                   fileName: file.name,
                                                   base64: reader.result as string
                                                })
                                             }
                                             reader.readAsDataURL(file)
                                          })
                                       })
                                       const results = await Promise.all(readPromises)
                                       setItems(prev => prev.map((it, i) => i === idx ? {
                                          ...it,
                                          images: [...(it.images || []), ...results],
                                          files: [...(it.files || []), ...files]
                                       } : it))
                                    }}
                                 />
                                 <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => document.getElementById(`item-file-${item.id}`)?.click()}
                                    className="h-12 px-4 rounded-xl border-dashed border-zinc-200 hover:border-zinc-300 font-bold text-xs gap-1.5"
                                 >
                                    <Plus className="h-4 w-4" /> Upload
                                 </Button>
                                 
                                 {/* Display selected images */}
                                 {item.images?.map((img: any, imgIdx: number) => (
                                    <div key={imgIdx} className="relative h-12 w-12 rounded-xl overflow-hidden border border-zinc-200 shadow-sm group">
                                       <img src={img.base64} alt="Preview" className="h-full w-full object-cover" />
                                       <button
                                          type="button"
                                          onClick={() => {
                                             setItems(prev => prev.map((it, i) => i === idx ? {
                                                ...it,
                                                images: it.images.filter((_: any, k: number) => k !== imgIdx),
                                                files: it.files ? it.files.filter((_: any, k: number) => k !== imgIdx) : []
                                             } : it))
                                          }}
                                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                                       >
                                          <X className="h-4 w-4" />
                                       </button>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        </motion.div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Submit Section */}
            <div className="p-10 pt-4 bg-white shrink-0">
               <Button onClick={handleSubmit} className="w-full h-16 rounded-2xl bg-primary text-primary-foreground font-black text-lg shadow-2xl shadow-primary/20 hover:bg-primary/90 hover:scale-[1.01] transition-all transform active:scale-95">
                  Submit Request
               </Button>
            </div>

            {/* Create Item Nested Dialog */}
            <Dialog open={isCreateItemOpen} onOpenChange={setIsCreateItemOpen}>
               <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-3xl border-none shadow-2xl bg-white p-6">
                  <DialogHeader className="pb-4 border-b border-zinc-100 mb-6">
                     <DialogTitle className="text-2xl font-black">Create Catalog Item</DialogTitle>
                     <DialogDescription className="font-medium text-zinc-500">
                        Initialize a new item record in the master inventory database.
                     </DialogDescription>
                  </DialogHeader>
                  <div className="py-2">
                     {isCreateItemOpen && (
                        <ItemForm
                           onSuccess={() => setIsCreateItemOpen(false)}
                           onSubmit={handleCreateItemSave}
                        />
                     )}
                  </div>
               </DialogContent>
            </Dialog>

            {/* Create Asset Nested Dialog */}
            <Dialog open={isCreateAssetOpen} onOpenChange={setIsCreateAssetOpen}>
               <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-3xl border-none shadow-2xl bg-white p-6">
                  <DialogHeader className="pb-4 border-b border-zinc-100 mb-6">
                     <DialogTitle className="text-2xl font-black">Create Asset</DialogTitle>
                     <DialogDescription className="font-medium text-zinc-500">
                        Create a new asset in the system database.
                     </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateAssetSave} className="space-y-6 py-2">
                     <div className="space-y-2">
                        <Label className="text-xs font-bold text-zinc-700">Asset Name *</Label>
                        <Input
                           required
                           type="text"
                           placeholder="Enter asset name"
                           value={newAssetName}
                           onChange={(e) => setNewAssetName(e.target.value)}
                           className="h-12 rounded-xl bg-zinc-50 border-zinc-100"
                        />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-xs font-bold text-zinc-700">Type *</Label>
                        <Select value={newAssetType} onValueChange={setNewAssetType}>
                           <SelectTrigger className="h-12 rounded-xl bg-zinc-50 border-zinc-100">
                              <SelectValue placeholder="Select type" />
                           </SelectTrigger>
                           <SelectContent className="bg-white">
                              <SelectItem value="Equipment">Equipment</SelectItem>
                              <SelectItem value="Tool">Tool</SelectItem>
                              <SelectItem value="Vehicle">Vehicle</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>
                     <div className="space-y-2">
                        <Label className="text-xs font-bold text-zinc-700">Serial Number (Optional)</Label>
                        <Input
                           type="text"
                           placeholder="Enter serial number"
                           value={newAssetSerialNumber}
                           onChange={(e) => setNewAssetSerialNumber(e.target.value)}
                           className="h-12 rounded-xl bg-zinc-50 border-zinc-100"
                        />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-xs font-bold text-zinc-700">Extra Notes (Optional)</Label>
                        <Textarea
                           placeholder="Enter any additional information..."
                           value={newAssetExtraNote}
                           onChange={(e) => setNewAssetExtraNote(e.target.value)}
                           className="rounded-xl bg-zinc-50 border-zinc-100"
                        />
                     </div>
                     <DialogFooter className="pt-4 border-t border-zinc-100">
                        <Button type="button" variant="ghost" onClick={() => setIsCreateAssetOpen(false)}>
                           Cancel
                        </Button>
                        <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                           Create Asset
                        </Button>
                     </DialogFooter>
                  </form>
               </DialogContent>
            </Dialog>
         </DialogContent>
      </Dialog>
   )
}

