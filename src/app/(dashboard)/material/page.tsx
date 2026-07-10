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
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
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

  const columns: ColumnDef<MaterialReceipt>[] = [
    {
      accessorKey: "indentId",
      header: "Indent Request",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400">
            <ClipboardCheck className="h-4 w-4 text-primary" />
          </div>
          <span className="text-xs font-black text-zinc-900">{row.getValue("indentId")}</span>
        </div>
      )
    },
    {
      accessorKey: "name",
      header: "Material Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-black text-zinc-900">{row.getValue("name")}</span>
          <span className="text-[8px] font-bold text-zinc-400 uppercase mt-0.5">{row.original.category}</span>
        </div>
      )
    },
    {
      accessorKey: "requestedQty",
      header: () => <div className="text-center">Requested Quantity</div>,
      cell: ({ row }) => (
        <div className="text-center">
          <span className="bg-zinc-100 px-3 py-1 rounded-lg text-[11px] font-black text-zinc-600">
            {row.getValue("requestedQty")} {row.original.unit}
          </span>
        </div>
      )
    },
    {
      accessorKey: "receivedQty",
      header: () => <div className="text-center">Received Quantity</div>,
      cell: ({ row }) => (
        <div className="text-center">
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-[11px] font-black">
            {row.getValue("receivedQty")} {row.original.unit}
          </span>
        </div>
      )
    },
    {
      id: "actions",
      header: () => <div className="text-right pr-4">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end pr-4">
          <Button 
            onClick={() => handleOpenUpdate(row.original)}
            variant="ghost" 
            size="sm" 
            className="h-8 rounded-xl font-black text-[10px] uppercase tracking-wider text-primary hover:text-primary hover:bg-primary/10 gap-1.5"
          >
            <Edit className="h-3.5 w-3.5" /> Update
          </Button>
        </div>
      )
    }
  ]

  return (
    <ContentLayout title="Material Master">
      <div className="flex flex-col gap-8 p-6 sm:p-12 max-w-[1500px] mx-auto min-h-screen">

        {/* Breathtaking Control Hub */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-black text-zinc-900 tracking-tighter">Material Receipts</h1>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Inward & Goods Receipt Ledger</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Input 
                placeholder="Scan or filter registry..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 rounded-xl bg-white border-zinc-100 pl-10 font-bold text-sm shadow-sm" 
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300" />
            </div>

            <Button 
              onClick={handleOpenAdd}
              className="h-11 rounded-xl px-6 font-bold shadow-lg shadow-primary/20 bg-primary text-primary-foreground flex items-center gap-2 transition-all active:scale-95 duration-300"
            >
              <Plus className="h-4 w-4" /> Add Material Receipt
            </Button>
          </div>
        </div>

        {/* Simplistic Material Log Board */}
        <div className="animate-in fade-in duration-300 space-y-6">
          <div className="flex items-center justify-between mb-2 px-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400">
                <Scale className="h-5 w-5 text-zinc-500" />
              </div>
              <h3 className="text-xl font-black text-zinc-900 tracking-tight">Receipt Inward Log</h3>
            </div>
          </div>

          <DataTable columns={columns} data={filteredReceipts} />
        </div>

        {/* Modal: Add Material Receipt */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[90vh] flex flex-col">
            <DialogHeader className="p-8 pb-6 bg-gradient-to-br from-zinc-50 to-white border-b border-zinc-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Box className="h-32 w-32" />
              </div>
              <div className="flex items-center gap-4 relative">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Box className="h-6 w-6" />
                </div>
                <div className="flex flex-col gap-1">
                  <DialogTitle className="text-2xl font-black text-zinc-900 tracking-tight">Add Material Receipt</DialogTitle>
                  <DialogDescription className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest mt-0.5">
                    Goods Inward Entry System
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="p-8 bg-zinc-50/30 space-y-6 overflow-y-auto">
              <div className="space-y-2.5">
                <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Indent Request</Label>
                <Select value={addIndentId} onValueChange={handleIndentChange}>
                  <SelectTrigger className="h-14 rounded-2xl bg-white border-zinc-100 font-bold text-sm focus:ring-primary shadow-sm">
                    <SelectValue placeholder="Select Indent" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-zinc-100 shadow-xl bg-white max-h-56 overflow-y-auto">
                    {MOCK_INDENTS_CATALOG.map((ind) => (
                      <SelectItem key={ind.id} value={ind.id} className="font-bold text-xs text-zinc-700 hover:bg-zinc-50 cursor-pointer">{ind.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2.5">
                <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Requested Material</Label>
                <Select value={addMaterialId} onValueChange={setAddMaterialId}>
                  <SelectTrigger className="h-14 rounded-2xl bg-white border-zinc-100 font-bold text-sm focus:ring-primary shadow-sm">
                    <SelectValue placeholder="Select Material" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-zinc-100 shadow-xl bg-white max-h-56 overflow-y-auto">
                    {activeIndentOptions?.items.map((item) => (
                      <SelectItem key={item.id} value={item.id} className="font-bold text-xs text-zinc-700 hover:bg-zinc-50 cursor-pointer">{item.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {activeMaterialOptions && (
                <div className="grid grid-cols-2 gap-4 bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Requested Limit</span>
                    <span className="text-base font-black text-primary mt-1">
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

              <div className="space-y-2.5">
                <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Received Quantity</Label>
                <div className="relative">
                  <Input 
                    type="number"
                    value={addReceivedQty || ""}
                    onChange={(e) => setAddReceivedQty(Math.min(activeMaterialOptions?.requestedQty || 0, Math.max(0, parseInt(e.target.value) || 0)))}
                    placeholder="Enter received amount"
                    className="h-14 rounded-2xl bg-white border-zinc-100 font-black text-lg pl-4 pr-12 focus:ring-primary shadow-sm"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-black text-zinc-400">
                    {activeMaterialOptions?.unit}
                  </span>
                </div>
              </div>

              <div className="pt-4 flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setIsAddOpen(false)}
                  className="h-14 flex-1 rounded-2xl font-black text-zinc-500 hover:bg-zinc-100 transition-colors"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddSubmit}
                  className="h-14 flex-1 rounded-2xl bg-primary text-primary-foreground font-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                >
                  Add to Log
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal: Update Received Quantity */}
        <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
          <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[90vh] flex flex-col">
            <DialogHeader className="p-8 pb-6 bg-gradient-to-br from-zinc-50 to-white border-b border-zinc-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Edit className="h-32 w-32" />
              </div>
              <div className="flex items-center gap-4 relative">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Edit className="h-6 w-6" />
                </div>
                <div className="flex flex-col gap-1">
                  <DialogTitle className="text-2xl font-black text-zinc-900 tracking-tight">Update Inward Quantity</DialogTitle>
                  <DialogDescription className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest mt-0.5">
                    Recount physical inward registry
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {updatingItem && (
              <div className="p-8 bg-zinc-50/30 space-y-6 overflow-y-auto">
                <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
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

                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">New Received Quantity</Label>
                  <div className="relative">
                    <Input 
                      type="number"
                      value={updatingReceivedQty || ""}
                      onChange={(e) => setUpdatingReceivedQty(Math.min(updatingItem.requestedQty, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="h-14 rounded-2xl bg-white border-zinc-100 font-black text-lg pl-4 pr-12 focus:ring-primary shadow-sm"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-black text-zinc-400">
                      {updatingItem.unit}
                    </span>
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-4">
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsUpdateOpen(false)}
                    className="h-14 flex-1 rounded-2xl font-black text-zinc-500 hover:bg-zinc-100 transition-colors"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleUpdateSubmit}
                    className="h-14 flex-1 rounded-2xl bg-primary text-primary-foreground font-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </ContentLayout>
  )
}
