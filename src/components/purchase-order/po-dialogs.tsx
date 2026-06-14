"use client"

import { useState, useEffect } from "react"
import {
  FileText,
  Box,
  Loader2,
  ClipboardCheck
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { indentService } from "@/service/indents.api"
import { vendorService } from "@/service/vendorService"
import { purchaseOrderService } from "@/service/purchaseOrderService"

interface CreatePODialogProps {
  defaultIndentId?: string
  onSuccess?: () => void
  trigger: React.ReactNode
}

export function CreatePODialog({ defaultIndentId, onSuccess, trigger }: CreatePODialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [indents, setIndents] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [selectedIndentId, setSelectedIndentId] = useState<string>("")
  const [selectedVendorId, setSelectedVendorId] = useState<string>("")
  const [activeIndent, setActiveIndent] = useState<any | null>(null)
  const [items, setItems] = useState<any[]>([])
  const [dropLocation, setDropLocation] = useState("")
  const [isFormSubmitting, setIsFormSubmitting] = useState(false)

  // Fetch approved indents & active vendors when Dialog opens
  useEffect(() => {
    if (isOpen) {
      const loadInitialData = async () => {
        try {
          // If defaultIndentId is passed, we fetch all approved indents but also ensure the default one is fetched/available
          const indentsRes = await indentService.getIndents({ status: "Approved" })
          let loadedIndents = indentsRes.data || indentsRes || []
          
          if (defaultIndentId && !loadedIndents.some((ind: any) => ind._id === defaultIndentId)) {
            try {
              const defaultIndent = await indentService.getIndentById(defaultIndentId)
              if (defaultIndent) {
                loadedIndents = [...loadedIndents, defaultIndent]
              }
            } catch (e) {
              console.error("Failed to fetch default indent", e)
            }
          }
          
          setIndents(loadedIndents)
          
          const vendorsRes = await vendorService.getVendors()
          setVendors(vendorsRes.vendors || vendorsRes || [])

          if (defaultIndentId) {
            handleIndentSelect(defaultIndentId)
          }
        } catch (err: any) {
          toast.error("Failed to load indents or vendors data")
        }
      }
      loadInitialData()
    } else {
      // Clear state when closed
      setSelectedIndentId("")
      setSelectedVendorId("")
      setActiveIndent(null)
      setItems([])
      setDropLocation("")
    }
  }, [isOpen, defaultIndentId])

  const handleIndentSelect = async (val: string) => {
    setSelectedIndentId(val)
    setSelectedVendorId("")
    setActiveIndent(null)
    setItems([])
    
    try {
      const fullIndent = await indentService.getIndentById(val)
      setActiveIndent(fullIndent)
      if (fullIndent && Array.isArray(fullIndent.items)) {
         setItems(
            fullIndent.items.map((item: any) => ({
               itemId: item.itemId?._id || item.itemId || "",
               name: item.itemId?.name || item.itemId?.itemName || "Unknown Item",
               qty: item.quantity,
               unitId: item.unitId?._id || item.unitId || "",
               unit: item.unitId?.name || item.unitId?.unitName || "Pcs",
               price: "",
               description: ""
            }))
         )
      }
    } catch (err) {
      toast.error("Failed to fetch indent details")
    }
  }

  const handleVendorSelect = (val: string) => {
    setSelectedVendorId(val)
  }

  const handlePriceChange = (idx: number, val: number | string) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, price: val } : item))
  }

  const handleDescriptionChange = (idx: number, val: string) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, description: val } : item))
  }

  const activeVendor = vendors.find(v => (v._id || v.id) === selectedVendorId)

  const subtotal = items.reduce((sum, item) => sum + (item.qty * (item.price || 0)), 0)
  const grandTotal = subtotal

  const handleGeneratePO = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedIndentId || !selectedVendorId || !activeVendor) {
       toast.error("Please select both indent and vendor")
       return
    }

    setIsFormSubmitting(true)
    try {
       await purchaseOrderService.createPurchaseOrder({
          indentId: selectedIndentId,
          vendorId: selectedVendorId,
          vendorName: activeVendor.name,
          vendorMobile: activeVendor.contactNumber || "",
          vendorAddress: activeVendor.address || "",
          items: items.map(item => ({
             itemId: item.itemId || null,
             unitId: item.unitId || null,
             indentQuantity: item.qty,
             orderQuantity: item.qty,
             rate: item.price,
             description: item.description || ""
          })),
          bypassApproval: true
       })
       toast.success("Purchase Order created successfully")
       setIsOpen(false)
       if (onSuccess) {
         onSuccess()
       }
    } catch (err) {
    } finally {
       setIsFormSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white text-zinc-950">
        <DialogHeader className="p-8 bg-zinc-900 text-white pb-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-white/15 rounded-xl">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <DialogTitle className="text-2xl font-black tracking-tight">Create Purchase Order</DialogTitle>
          </div>
          <DialogDescription className="text-zinc-400 font-bold text-[10px] uppercase tracking-widest mt-2">
            Generate a new procurement request from an indent
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleGeneratePO} className="p-8 space-y-6">
          <ScrollArea className="max-h-[55vh] pr-4">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider pl-1">Select Indent</Label>
                  <Select value={selectedIndentId} onValueChange={handleIndentSelect} required disabled={!!defaultIndentId}>
                    <SelectTrigger className="h-12 rounded-xl bg-zinc-50 border-none font-bold text-sm">
                      <SelectValue placeholder="Choose an Indent" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-zinc-100 shadow-xl bg-white max-h-56">
                      {indents.map((ind) => (
                        <SelectItem key={ind._id} value={ind._id} className="font-bold text-xs">
                          {ind.indentId || ind.indentNo} ({ind.projectId?.projectName || ind.projectId?.name || "No Project"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider pl-1">Select Vendor</Label>
                  <Select value={selectedVendorId} onValueChange={handleVendorSelect} required>
                    <SelectTrigger className="h-12 rounded-xl bg-zinc-50 border-none font-bold text-sm">
                      <SelectValue placeholder="Choose a Vendor" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-zinc-100 shadow-xl bg-white max-h-56">
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor._id || vendor.id} value={vendor._id || vendor.id || ""} className="font-bold text-xs">
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedIndentId && activeIndent && (
                <div className="space-y-4">
                  <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider pl-1">Requested Items</Label>
                  <div className="rounded-2xl border border-zinc-100 overflow-hidden">
                     <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-50/50 border-b border-zinc-100">
                          <th className="px-6 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest w-[30%]">Item</th>
                          <th className="px-6 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-left w-[35%]">Description</th>
                          <th className="px-6 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center w-[12%]">Quantity</th>
                          <th className="px-6 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center w-[13%]">Unit Price (₹)</th>
                          <th className="px-6 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-right w-[10%]">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                        {items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-6 py-3 w-[30%]">
                              <div className="flex items-center gap-2">
                                <Box className="h-4 w-4 text-zinc-400" />
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-zinc-900">{item.name}</span>
                                  <span className="text-[8px] font-bold text-zinc-400 uppercase">ID: {item.itemId ? item.itemId.slice(-6).toUpperCase() : "N/A"}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-3 w-[35%]">
                              <Input
                                placeholder="e.g. Specifications / Brand"
                                value={item.description || ""}
                                onChange={(e) => handleDescriptionChange(idx, e.target.value)}
                                className="h-8 w-full rounded-lg bg-zinc-50 border-zinc-200 font-bold text-xs px-2.5"
                              />
                            </td>
                            <td className="px-6 py-3 text-center w-[12%]">
                              <span className="bg-zinc-100 px-2 py-0.5 rounded text-[10px] font-bold text-zinc-600">{item.qty} {item.unit}</span>
                            </td>
                            <td className="px-6 py-3 text-center w-[13%]">
                              <div className="flex justify-center">
                                <Input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={item.price}
                                  onWheel={(e) => e.currentTarget.blur()}
                                  onChange={(e) => handlePriceChange(idx, e.target.value === "" ? "" : Number(e.target.value))}
                                  className="h-8 w-20 rounded-lg bg-zinc-50 border-zinc-200 text-center font-bold text-xs"
                                />
                              </div>
                            </td>
                            <td className="px-6 py-3 text-right text-xs font-bold text-zinc-900 w-[10%]">
                              ₹{(item.qty * (item.price || 0)).toLocaleString("en-IN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {activeVendor && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-50">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider pl-1">Drop Location</Label>
                        <Textarea
                          value={dropLocation}
                          onChange={(e) => setDropLocation(e.target.value)}
                          placeholder="Specify delivery drop location"
                          className="min-h-[80px] rounded-xl bg-zinc-50 border-zinc-100 p-4 font-bold text-xs"
                        />
                      </div>
                      <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100 space-y-2 text-xs flex flex-col justify-center">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Subtotal:</span>
                          <span className="font-bold">₹{subtotal.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="h-px bg-zinc-200 my-2" />
                        <div className="flex justify-between text-sm">
                          <span className="font-black text-zinc-900">Grand Total:</span>
                          <span className="font-black text-teal-600">₹{grandTotal.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="pt-4 border-t border-zinc-50 gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="rounded-xl font-bold text-zinc-400">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!activeVendor || isFormSubmitting}
              className="rounded-xl bg-primary text-white font-black shadow-lg shadow-primary/10 gap-2"
            >
              {isFormSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <ClipboardCheck className="h-4 w-4" /> Generate PO
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
