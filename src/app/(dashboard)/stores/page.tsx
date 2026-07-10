"use client"

import { useState, useEffect } from "react"
import { 
  Building2, 
  MapPin, 
  User, 
  BarChart3, 
  Box, 
  AlertCircle, 
  MoreVertical, 
  Search, 
  Plus,
  Warehouse,
  Package,
  Activity,
  ArrowUpRight,
  Store
} from "lucide-react"

import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { assetService } from "@/service/assets.api"

export default function StoresPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // Edit state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<any | null>(null)

  // Form states for creation
  const [newName, setNewName] = useState("")
  const [newType, setNewType] = useState("Equipment")
  const [newSerialNumber, setNewSerialNumber] = useState("")
  const [newIssuedDate, setNewIssuedDate] = useState("")
  const [newStatus, setNewStatus] = useState("Issued")
  const [newMaintenanceDate, setNewMaintenanceDate] = useState("")
  const [newExtraNote, setNewExtraNote] = useState("")

  // Form states for editing
  const [editName, setEditName] = useState("")
  const [editType, setEditType] = useState("")
  const [editSerialNumber, setEditSerialNumber] = useState("")
  const [editIssuedDate, setEditIssuedDate] = useState("")
  const [editStatus, setEditStatus] = useState("")
  const [editMaintenanceDate, setEditMaintenanceDate] = useState("")
  const [editExtraNote, setEditExtraNote] = useState("")

  const fetchAssets = async (search = "") => {
    try {
      setLoading(true)
      const res = await assetService.getAssets({ search })
      if (Array.isArray(res)) {
        setData(res)
      } else if (res && res.data) {
        setData(res.data)
      } else {
        setData([])
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch assets")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchAssets(searchTerm)
    }, 400)
    return () => clearTimeout(delayDebounce)
  }, [searchTerm])

  useEffect(() => {
    if (editingAsset) {
      setEditName(editingAsset.name || "")
      setEditType(editingAsset.type || "")
      setEditSerialNumber(editingAsset.serialNumber || "")
      setEditIssuedDate(editingAsset.issuedDate ? new Date(editingAsset.issuedDate).toISOString().split("T")[0] : "")
      setEditStatus(editingAsset.status || "")
      setEditMaintenanceDate(editingAsset.maintenanceDueDate ? new Date(editingAsset.maintenanceDueDate).toISOString().split("T")[0] : "")
      setEditExtraNote(editingAsset.extraNote || "")
    }
  }, [editingAsset])

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newType.trim()) {
      toast.error("Asset Name and Type are required")
      return
    }

    try {
      await assetService.createAsset({
        name: newName,
        type: newType,
        serialNumber: newSerialNumber,
        issuedDate: newIssuedDate || undefined,
        status: newStatus,
        maintenanceDueDate: newMaintenanceDate || undefined,
        extraNote: newExtraNote
      })
      toast.success("New asset added successfully")
      setIsDialogOpen(false)
      // Reset form
      setNewName("")
      setNewType("Equipment")
      setNewSerialNumber("")
      setNewIssuedDate("")
      setNewStatus("Issued")
      setNewMaintenanceDate("")
      setNewExtraNote("")
      fetchAssets(searchTerm)
    } catch (err: any) {
      toast.error(err.message || "Failed to create asset")
    }
  }

  const handleUpdateAsset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAsset) return

    try {
      await assetService.updateAsset(editingAsset._id, {
        name: editName,
        type: editType,
        serialNumber: editSerialNumber,
        issuedDate: editIssuedDate || undefined,
        status: editStatus,
        maintenanceDueDate: editMaintenanceDate || undefined,
        extraNote: editExtraNote
      })
      toast.success("Asset updated successfully")
      setIsEditDialogOpen(false)
      setEditingAsset(null)
      fetchAssets(searchTerm)
    } catch (err: any) {
      toast.error(err.message || "Failed to update asset")
    }
  }

  const handleDeleteAsset = async (id: string) => {
    try {
      await assetService.deleteAsset(id)
      toast.success("Asset deleted successfully")
      fetchAssets(searchTerm)
    } catch (err: any) {
      toast.error(err.message || "Failed to delete asset")
    }
  }

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "Asset Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-zinc-900 flex items-center justify-center text-white shadow-lg shadow-zinc-900/20">
            <Warehouse className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-zinc-900 text-sm tracking-tight">{row.getValue("name")}</span>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-none mt-1">Type: {row.original.type}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "serialNumber",
      header: "Serial Number",
      cell: ({ row }) => (
        <span className="text-zinc-600 font-medium text-xs">{row.getValue("serialNumber") || "—"}</span>
      ),
    },
    {
      accessorKey: "issuedDate",
      header: "Issued Date",
      cell: ({ row }) => {
        const val = row.getValue("issuedDate")
        return (
          <span className="text-zinc-600 font-medium text-xs">
            {val ? new Date(val as string).toLocaleDateString("en-IN") : "—"}
          </span>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge className={cn(
            "rounded-lg px-3 py-1 font-black text-[9px] border shadow-sm uppercase tracking-wider",
            status === "Returned" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
            status === "Under Maintenance" ? "bg-amber-50 text-amber-600 border-amber-100" :
            "bg-blue-50 text-blue-600 border-blue-100"
          )}>
            {status || "Issued"}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: () => <div className="w-full text-center">Operations</div>,
      cell: ({ row }) => (
        <div className="flex justify-center gap-2 w-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingAsset(row.original)
              setIsEditDialogOpen(true)
            }}
            className="h-9 px-3 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 font-bold text-[11px] gap-2 transition-all"
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm("Are you sure you want to delete this asset?")) {
                handleDeleteAsset(row.original._id)
              }
            }}
            className="h-9 px-3 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 font-bold text-[11px] gap-2 transition-all"
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <ContentLayout title="Asset Management">
      <div className="flex flex-col gap-10 p-6 sm:p-12 max-w-[1700px] mx-auto min-h-screen">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
           <div className="flex flex-col gap-2">
              <h1 className="text-4xl font-black text-zinc-900 tracking-tighter">Asset Management</h1>
              <div className="flex items-center gap-3">
                 <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                 <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Network Asset Inventory</p>
              </div>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="relative w-72">
                 <Input 
                   placeholder="Search assets..." 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="h-12 rounded-2xl bg-white border-zinc-100 pl-11 font-bold shadow-sm focus:ring-primary" 
                 />
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300" />
              </div>

              {/* Create Asset Dialog */}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="h-11 rounded-xl px-6 font-bold shadow-lg shadow-primary/20 bg-primary text-primary-foreground flex items-center gap-2 transition-all active:scale-95 duration-300">
                     Add Asset
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[90vh] flex flex-col">
                  <DialogHeader className="p-8 pb-6 bg-gradient-to-br from-zinc-50 to-white border-b border-zinc-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                       <Store className="h-32 w-32" />
                    </div>
                    <div className="flex items-center gap-4 relative">
                       <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <Store className="h-6 w-6" />
                       </div>
                       <div className="flex flex-col gap-1">
                          <DialogTitle className="text-2xl font-black tracking-tight text-zinc-900">Register New Asset</DialogTitle>
                          <DialogDescription className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest">
                            Add a new asset to the system inventory
                          </DialogDescription>
                       </div>
                    </div>
                  </DialogHeader>
                  <form onSubmit={handleAddStore} className="p-8 bg-zinc-50/30 space-y-6 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Asset Name</Label>
                        <Input 
                          placeholder="e.g. Concrete Mixer" 
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          required
                          className="h-14 rounded-2xl bg-white border-zinc-100 font-bold text-sm focus:ring-primary shadow-sm" 
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Asset Type</Label>
                        <Select value={newType} onValueChange={setNewType}>
                          <SelectTrigger className="h-14 rounded-2xl bg-white border-zinc-100 font-bold text-sm focus:ring-primary shadow-sm">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-zinc-100 shadow-xl bg-white">
                            <SelectItem value="Vehicle">Vehicle</SelectItem>
                            <SelectItem value="Equipment">Equipment</SelectItem>
                            <SelectItem value="Tool">Tool</SelectItem>
                            <SelectItem value="Electronics">Electronics</SelectItem>
                            <SelectItem value="Furniture">Furniture</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Serial Number</Label>
                        <Input 
                          placeholder="e.g. SN-982173" 
                          value={newSerialNumber}
                          onChange={(e) => setNewSerialNumber(e.target.value)}
                          className="h-14 rounded-2xl bg-white border-zinc-100 font-bold text-sm focus:ring-primary shadow-sm" 
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Issued Date</Label>
                        <Input 
                          type="date"
                          value={newIssuedDate}
                          onChange={(e) => setNewIssuedDate(e.target.value)}
                          className="h-14 rounded-2xl bg-white border-zinc-100 font-bold text-sm focus:ring-primary shadow-sm" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Initial Status</Label>
                        <Select value={newStatus} onValueChange={setNewStatus}>
                          <SelectTrigger className="h-14 rounded-2xl bg-white border-zinc-100 font-bold text-sm focus:ring-primary shadow-sm">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-zinc-100 shadow-xl bg-white">
                            <SelectItem value="Issued">Issued</SelectItem>
                            <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                            <SelectItem value="Returned">Returned</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2.5">
                        <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Maintenance Due</Label>
                        <Input 
                          type="date" 
                          value={newMaintenanceDate}
                          onChange={(e) => setNewMaintenanceDate(e.target.value)}
                          className="h-14 rounded-2xl bg-white border-zinc-100 font-bold text-sm focus:ring-primary shadow-sm" 
                        />
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Extra Note</Label>
                      <Textarea 
                        placeholder="Add any specific storage, operator or location remarks..."
                        value={newExtraNote}
                        onChange={(e) => setNewExtraNote(e.target.value)}
                        className="min-h-[100px] rounded-2xl bg-white border-zinc-100 font-bold text-sm p-4 focus:ring-primary shadow-sm resize-none"
                      />
                    </div>

                    <div className="pt-4 flex items-center gap-4">
                      <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-14 flex-1 rounded-2xl font-black text-zinc-500 hover:bg-zinc-100 transition-colors">Cancel</Button>
                      <Button type="submit" className="h-14 flex-1 rounded-2xl bg-primary text-primary-foreground font-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95">Register Asset</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
           </div>
        </div>

        {/* Edit Asset Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[90vh] flex flex-col">
            <DialogHeader className="p-8 pb-6 bg-gradient-to-br from-zinc-50 to-white border-b border-zinc-100 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Store className="h-32 w-32" />
               </div>
               <div className="flex items-center gap-4 relative">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                     <Store className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col gap-1">
                     <DialogTitle className="text-2xl font-black tracking-tight text-zinc-900">Edit Asset</DialogTitle>
                     <DialogDescription className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest">
                       Update Asset Specifications
                     </DialogDescription>
                  </div>
               </div>
            </DialogHeader>
            <form onSubmit={handleUpdateAsset} className="p-8 bg-zinc-50/30 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Asset Name</Label>
                  <Input 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="h-14 rounded-2xl bg-white border-zinc-100 font-bold text-sm focus:ring-primary shadow-sm" 
                  />
                </div>
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Asset Type</Label>
                  <Select value={editType} onValueChange={setEditType}>
                    <SelectTrigger className="h-14 rounded-2xl bg-white border-zinc-100 font-bold text-sm focus:ring-primary shadow-sm">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-zinc-100 shadow-xl bg-white">
                      <SelectItem value="Vehicle">Vehicle</SelectItem>
                      <SelectItem value="Equipment">Equipment</SelectItem>
                      <SelectItem value="Tool">Tool</SelectItem>
                      <SelectItem value="Electronics">Electronics</SelectItem>
                      <SelectItem value="Furniture">Furniture</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Serial Number</Label>
                  <Input 
                    value={editSerialNumber}
                    onChange={(e) => setEditSerialNumber(e.target.value)}
                    className="h-14 rounded-2xl bg-white border-zinc-100 font-bold text-sm focus:ring-primary shadow-sm" 
                  />
                </div>
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Issued Date</Label>
                  <Input 
                    type="date"
                    value={editIssuedDate}
                    onChange={(e) => setEditIssuedDate(e.target.value)}
                    className="h-14 rounded-2xl bg-white border-zinc-100 font-bold text-sm focus:ring-primary shadow-sm" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger className="h-14 rounded-2xl bg-white border-zinc-100 font-bold text-sm focus:ring-primary shadow-sm">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-zinc-100 shadow-xl bg-white">
                      <SelectItem value="Issued">Issued</SelectItem>
                      <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                      <SelectItem value="Returned">Returned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Maintenance Due</Label>
                  <Input 
                    type="date"
                    value={editMaintenanceDate}
                    onChange={(e) => setEditMaintenanceDate(e.target.value)}
                    className="h-14 rounded-2xl bg-white border-zinc-100 font-bold text-sm focus:ring-primary shadow-sm" 
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Extra Note</Label>
                <Textarea 
                  value={editExtraNote}
                  onChange={(e) => setEditExtraNote(e.target.value)}
                  className="min-h-[100px] rounded-2xl bg-white border-zinc-100 font-bold text-sm p-4 focus:ring-primary shadow-sm resize-none"
                />
              </div>

              <div className="pt-4 flex items-center gap-4">
                <Button type="button" variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="h-14 flex-1 rounded-2xl font-black text-zinc-500 hover:bg-zinc-100 transition-colors">Cancel</Button>
                <Button type="submit" className="h-14 flex-1 rounded-2xl bg-primary text-primary-foreground font-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95">Update Asset</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Ledger Card */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-zinc-400 font-bold">
            Loading Assets...
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={data} 
          />
        )}
      </div>
    </ContentLayout>
  )
}