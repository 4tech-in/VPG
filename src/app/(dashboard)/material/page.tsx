"use client"

import { useState } from "react"
import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Box,
  Plus,
  Edit,
  ClipboardCheck,
  Search,
  Scale
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type MaterialReceipt = {
  id: string
  indentId: string
  name: string
  requestedQty: number
  receivedQty: number
  unit: string
  category: string
}

const MOCK_INDENTS_CATALOG = [
  {
    id: "IND-001",
    title: "IND-001 (VPG Grande - Tower A)",
    items: [
      { id: "MAT-101", name: "Grade 53 Cement", requestedQty: 150, unit: "Bags", category: "Raw Materials" },
      { id: "MAT-102", name: "Coarse River Sand", requestedQty: 50, unit: "Tons", category: "Raw Materials" },
      { id: "MAT-103", name: "TMT Steel Rods (12mm)", requestedQty: 30, unit: "Tons", category: "Structural Steel" },
    ]
  },
  {
    id: "IND-007",
    title: "IND-007 (VPG Twin Towers - Tower D)",
    items: [
      { id: "MAT-201", name: "LED Panel Lights (12W)", requestedQty: 100, unit: "Pcs", category: "Electrical" },
      { id: "MAT-202", name: "Copper Wiring Rolls (1.5mm)", requestedQty: 25, unit: "Rolls", category: "Electrical" },
    ]
  },
  {
    id: "IND-008",
    title: "IND-008 (VPG Grande - Tower A)",
    items: [
      { id: "MAT-301", name: "Premium PVC Glue", requestedQty: 20, unit: "Cans", category: "Adhesives" },
      { id: "MAT-302", name: "CPVC Pipes (2 inch)", requestedQty: 120, unit: "Pcs", category: "Plumbing" },
    ]
  }
]

const INITIAL_RECEIPTS: MaterialReceipt[] = [
  { id: "MAT-101", indentId: "IND-001", name: "Grade 53 Cement", requestedQty: 150, receivedQty: 90, unit: "Bags", category: "Raw Materials" },
  { id: "MAT-102", indentId: "IND-001", name: "Coarse River Sand", requestedQty: 50, receivedQty: 25, unit: "Tons", category: "Raw Materials" },
  { id: "MAT-103", indentId: "IND-001", name: "TMT Steel Rods (12mm)", requestedQty: 30, receivedQty: 12, unit: "Tons", category: "Structural Steel" },
  { id: "MAT-201", indentId: "IND-007", name: "LED Panel Lights (12W)", requestedQty: 100, receivedQty: 80, unit: "Pcs", category: "Electrical" },
  { id: "MAT-202", indentId: "IND-007", name: "Copper Wiring Rolls (1.5mm)", requestedQty: 25, receivedQty: 15, unit: "Rolls", category: "Electrical" },
  { id: "MAT-301", indentId: "IND-008", name: "Premium PVC Glue", requestedQty: 20, receivedQty: 5, unit: "Cans", category: "Adhesives" },
  { id: "MAT-302", indentId: "IND-008", name: "CPVC Pipes (2 inch)", requestedQty: 120, receivedQty: 100, unit: "Pcs", category: "Plumbing" },
]

export default function MaterialMasterPage() {
  const [receipts, setReceipts] = useState<MaterialReceipt[]>(INITIAL_RECEIPTS)
  const [searchQuery, setSearchQuery] = useState("")

  // Add Receipt dialog state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addIndentId, setAddIndentId] = useState("")
  const [addMaterialId, setAddMaterialId] = useState("")
  const [addReceivedQty, setAddReceivedQty] = useState<number>(0)

  // Update Receipt dialog state
  const [isUpdateOpen, setIsUpdateOpen] = useState(false)
  const [updatingItem, setUpdatingItem] = useState<MaterialReceipt | null>(null)
  const [updatingReceivedQty, setUpdatingReceivedQty] = useState<number>(0)

  // Computed helper items for Add dialog
  const activeIndentOptions = MOCK_INDENTS_CATALOG.find(ind => ind.id === addIndentId)
  const activeMaterialOptions = activeIndentOptions?.items.find(item => item.id === addMaterialId)

  // Filtered receipts list
  const filteredReceipts = receipts.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.indentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleOpenAdd = () => {
    setAddIndentId(MOCK_INDENTS_CATALOG[0].id)
    setAddMaterialId(MOCK_INDENTS_CATALOG[0].items[0].id)
    setAddReceivedQty(0)
    setIsAddOpen(true)
  }

  const handleIndentChange = (val: string) => {
    setAddIndentId(val)
    const nextIndent = MOCK_INDENTS_CATALOG.find(ind => ind.id === val)
    if (nextIndent && nextIndent.items.length > 0) {
      setAddMaterialId(nextIndent.items[0].id)
    } else {
      setAddMaterialId("")
    }
    setAddReceivedQty(0)
  }

  const handleAddSubmit = () => {
    if (!activeIndentOptions || !activeMaterialOptions) return

    // Check if this material is already in our receipts register
    const existingIndex = receipts.findIndex(
      r => r.indentId === addIndentId && r.id === addMaterialId
    )

    if (existingIndex > -1) {
      // Overwrite/Update existing inward quantity
      const updated = [...receipts]
      const current = updated[existingIndex]
      current.receivedQty = Math.min(current.requestedQty, current.receivedQty + addReceivedQty)
      setReceipts(updated)
      toast.success("Receipt quantity appended to existing item", {
        description: `Added ${addReceivedQty} ${current.unit} to ${current.name} for ${addIndentId}.`
      })
    } else {
      // Add as a new inward row
      const newRow: MaterialReceipt = {
        id: activeMaterialOptions.id,
        indentId: addIndentId,
        name: activeMaterialOptions.name,
        requestedQty: activeMaterialOptions.requestedQty,
        receivedQty: Math.min(activeMaterialOptions.requestedQty, addReceivedQty),
        unit: activeMaterialOptions.unit,
        category: activeMaterialOptions.category
      }
      setReceipts([newRow, ...receipts])
      toast.success("New Material Receipt added successfully", {
        description: `Received ${newRow.receivedQty} ${newRow.unit} of ${newRow.name}.`
      })
    }

    setIsAddOpen(false)
  }

  const handleOpenUpdate = (item: MaterialReceipt) => {
    setUpdatingItem(item)
    setUpdatingReceivedQty(item.receivedQty)
    setIsUpdateOpen(true)
  }

  const handleUpdateSubmit = () => {
    if (!updatingItem) return

    setReceipts(prev => prev.map(item => {
      if (item.indentId === updatingItem.indentId && item.id === updatingItem.id) {
        return {
          ...item,
          receivedQty: Math.min(item.requestedQty, Math.max(0, updatingReceivedQty))
        }
      }
      return item
    }))

    toast.success("Material quantity updated successfully", {
      description: `New balance: ${updatingReceivedQty} out of ${updatingItem.requestedQty} ${updatingItem.unit}.`
    })

    setIsUpdateOpen(false)
    setUpdatingItem(null)
  }

  return (
    <ContentLayout title="Material Master">
      <div className="flex flex-col gap-8 p-6 sm:p-12 max-w-[1500px] mx-auto min-h-screen">

        {/* Breathtaking Control Hub */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-black text-zinc-900 tracking-tighter">Material Receipts</h1>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Inward & Goods Receipt Ledger</p>
            </div>
          </div>

          <Button 
            onClick={handleOpenAdd}
            className="h-12 px-8 rounded-2xl bg-zinc-900 text-white font-black shadow-xl shadow-zinc-900/10 gap-2 hover:bg-zinc-800 transition-all"
          >
            <Plus className="h-5 w-5" /> Add Material Receipt
          </Button>
        </div>

        {/* Simplistic Material Log Board */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-zinc-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between mb-2 px-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400">
                <Scale className="h-5 w-5 text-zinc-500" />
              </div>
              <h3 className="text-xl font-black text-zinc-900 tracking-tight">Receipt Inward Log</h3>
            </div>

            <div className="relative w-72">
              <Input 
                placeholder="Scan or filter registry..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 rounded-xl bg-zinc-50 border-none pl-10 font-bold text-sm" 
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300" />
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 border-b border-zinc-100">
                  <th className="px-6 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-8">Indent Request</th>
                  <th className="px-6 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-widest">Material Name</th>
                  <th className="px-6 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Requested Quantity</th>
                  <th className="px-6 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Received Quantity</th>
                  <th className="px-6 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {filteredReceipts.map((item, idx) => {
                  return (
                    <tr key={`${item.indentId}-${item.id}`} className="group hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4 pl-8">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400">
                            <ClipboardCheck className="h-4 w-4 text-teal-600" />
                          </div>
                          <span className="text-xs font-black text-zinc-900">{item.indentId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-zinc-900">{item.name}</span>
                          <span className="text-[8px] font-bold text-zinc-400 uppercase mt-0.5">{item.category}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-zinc-100 px-3 py-1 rounded-lg text-[11px] font-black text-zinc-600">
                          {item.requestedQty} {item.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-[11px] font-black">
                          {item.receivedQty} {item.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right pr-8">
                        <Button 
                          onClick={() => handleOpenUpdate(item)}
                          variant="ghost" 
                          size="sm" 
                          className="h-8 rounded-xl font-black text-[10px] uppercase tracking-wider text-teal-600 hover:text-teal-700 hover:bg-teal-50 gap-1.5"
                        >
                          <Edit className="h-3.5 w-3.5" /> Update
                        </Button>
                      </td>
                    </tr>
                  )
                })}
                {filteredReceipts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-400 font-bold">
                      No material records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Add Material Receipt */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl bg-white p-8">
            <DialogHeader className="gap-2">
              <div className="h-10 w-10 rounded-xl bg-zinc-900 flex items-center justify-center text-white">
                <Box className="h-5 w-5" />
              </div>
              <DialogTitle className="text-2xl font-black text-zinc-900 tracking-tight">Add Material Receipt</DialogTitle>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Goods Inward Entry System</p>
            </DialogHeader>

            <div className="space-y-6 my-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Indent Request</Label>
                <Select value={addIndentId} onValueChange={handleIndentChange}>
                  <SelectTrigger className="h-12 rounded-xl bg-zinc-50 border-none font-bold text-sm">
                    <SelectValue placeholder="Select Indent" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {MOCK_INDENTS_CATALOG.map((ind) => (
                      <SelectItem key={ind.id} value={ind.id}>{ind.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Requested Material</Label>
                <Select value={addMaterialId} onValueChange={setAddMaterialId}>
                  <SelectTrigger className="h-12 rounded-xl bg-zinc-50 border-none font-bold text-sm">
                    <SelectValue placeholder="Select Material" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {activeIndentOptions?.items.map((item) => (
                      <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {activeMaterialOptions && (
                <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-5 rounded-2xl border border-zinc-100">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Requested Limit</span>
                    <span className="text-base font-black text-zinc-900 mt-1">
                      {activeMaterialOptions.requestedQty} {activeMaterialOptions.unit}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Category</span>
                    <span className="text-xs font-black text-zinc-600 mt-1">
                      {activeMaterialOptions.category}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Received Quantity</Label>
                <div className="relative">
                  <Input 
                    type="number"
                    value={addReceivedQty || ""}
                    onChange={(e) => setAddReceivedQty(Math.min(activeMaterialOptions?.requestedQty || 0, Math.max(0, parseInt(e.target.value) || 0)))}
                    placeholder="Enter received amount"
                    className="h-12 rounded-xl bg-zinc-50 border-none font-bold pl-4 pr-12 focus:bg-white transition-all text-sm"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-400">
                    {activeMaterialOptions?.unit}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-3 sm:gap-0">
              <Button 
                variant="ghost" 
                onClick={() => setIsAddOpen(false)}
                className="h-12 rounded-xl font-bold text-xs uppercase tracking-widest text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddSubmit}
                className="h-12 px-6 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-black text-xs uppercase tracking-widest"
              >
                Add to Log
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal: Update Received Quantity */}
        <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
          <DialogContent className="sm:max-w-[460px] rounded-[2rem] border-none shadow-2xl bg-white p-8">
            <DialogHeader className="gap-2">
              <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                <Edit className="h-5 w-5" />
              </div>
              <DialogTitle className="text-2xl font-black text-zinc-900 tracking-tight">Update Inward Quantity</DialogTitle>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Recount physical inward registry</p>
            </DialogHeader>

            {updatingItem && (
              <div className="space-y-6 my-6">
                <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-100 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Indent Source</span>
                      <span className="text-sm font-black text-zinc-900 mt-1">{updatingItem.indentId}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Material Name</span>
                      <span className="text-sm font-black text-zinc-900 mt-1 truncate">{updatingItem.name}</span>
                    </div>
                  </div>
                  <div className="h-px bg-zinc-100" />
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Requested Quantity limit</span>
                    <span className="text-sm font-black text-zinc-600 mt-1">
                      {updatingItem.requestedQty} {updatingItem.unit}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">New Received Quantity</Label>
                  <div className="relative">
                    <Input 
                      type="number"
                      value={updatingReceivedQty || ""}
                      onChange={(e) => setUpdatingReceivedQty(Math.min(updatingItem.requestedQty, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="h-12 rounded-xl bg-zinc-50 border-none font-bold pl-4 pr-12 focus:bg-white transition-all text-sm"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-400">
                      {updatingItem.unit}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-3 sm:gap-0">
              <Button 
                variant="ghost" 
                onClick={() => setIsUpdateOpen(false)}
                className="h-12 rounded-xl font-bold text-xs uppercase tracking-widest text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateSubmit}
                className="h-12 px-6 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-teal-500/20"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </ContentLayout>
  )
}
