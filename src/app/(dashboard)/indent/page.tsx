"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import {
  Plus,
  Search,
  MoreVertical,
  Clock,
  FileText,
  CheckCircle2,
  Filter,
  Eye,
  Check,
  X,
  XCircle
} from "lucide-react"

import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ViewIndentDialog, CreateIndentDialog } from "@/components/indent/indent-dialogs"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

type Indent = {
  id: string
  requester: {
    name: string
    role: string
  }
  project: {
    name: string
    area: string
  }
  items: {
    count: number
    preview: string
  }
  status: "PENDING MANAGER" | "QUOTATION RECEIVED" | "PO CREATED" | "REJECTED"
  created: string
  rejectionReason?: string
  usage?: {
    received: number
    used: number
    unit: string
  }
}

const MOCK_INDENTS: Indent[] = [
  {
    id: "IND-001",
    requester: { name: "Ravi Kumar", role: "Worker" },
    project: { name: "VPG Grande", area: "Tower A" },
    items: { count: 2, preview: "Cement Bag, Sand" },
    status: "PENDING MANAGER",
    created: "2024-05-01",
    usage: { received: 0, used: 0, unit: "Bags" }
  },
  {
    id: "IND-002",
    requester: { name: "Ravi Kumar", role: "Worker" },
    project: { name: "VPG Grande", area: "Tower A" },
    items: { count: 1, preview: "Steel Rods" },
    status: "PO CREATED",
    created: "2024-05-02",
    usage: { received: 100, used: 25, unit: "Tons" }
  },
  {
    id: "IND-003",
    requester: { name: "Amit Foreman", role: "Worker" },
    project: { name: "VPG Twin Towers", area: "Tower D" },
    items: { count: 2, preview: "Paint Cans, Brushes" },
    status: "PO CREATED",
    created: "2024-05-03",
    usage: { received: 50, used: 50, unit: "Litres" }
  },
  {
    id: "IND-007",
    requester: { name: "Amit Foreman", role: "Worker" },
    project: { name: "VPG Twin Towers", area: "Tower D" },
    items: { count: 1, preview: "LED Panel Lights" },
    status: "QUOTATION RECEIVED",
    created: "2024-04-30",
    usage: { received: 0, used: 0, unit: "Pcs" }
  },
  {
    id: "IND-008",
    requester: { name: "Sanjay Plumber", role: "Worker" },
    project: { name: "VPG Grande", area: "Tower A" },
    items: { count: 1, preview: "PVC Glue (Large)" },
    status: "PO CREATED",
    created: "2024-04-29",
    usage: { received: 10, used: 7, unit: "Cans" }
  },
  {
    id: "IND-009",
    requester: { name: "Rajesh Saini", role: "Worker" },
    project: { name: "VPG Grande", area: "Tower B" },
    items: { count: 3, preview: "Bricks, Sand, Steel Rods" },
    status: "REJECTED",
    created: "2024-04-28",
    rejectionReason: "Duplicate request for VPG Grande Tower B",
    usage: { received: 0, used: 0, unit: "Units" }
  },
  {
    id: "IND-010",
    requester: { name: "Suresh Carpenter", role: "Contractor" },
    project: { name: "VPG Greens", area: "Villa 12" },
    items: { count: 4, preview: "Plywood Sheets, Wood Glue, Screws, Hinges" },
    status: "QUOTATION RECEIVED",
    created: "2024-05-04",
    usage: { received: 0, used: 0, unit: "Sheets" }
  },
  {
    id: "IND-011",
    requester: { name: "Vikram Electrician", role: "Technician" },
    project: { name: "VPG Twin Towers", area: "Tower C" },
    items: { count: 2, preview: "Copper Wire Roll, Conduit Pipes" },
    status: "PO CREATED",
    created: "2024-05-05",
    usage: { received: 80, used: 65, unit: "Rolls" }
  },
  {
    id: "IND-012",
    requester: { name: "Deepak Mason", role: "Worker" },
    project: { name: "VPG Grande", area: "Basement 2" },
    items: { count: 1, preview: "Waterproofing Compound" },
    status: "PENDING MANAGER",
    created: "2024-05-06",
    usage: { received: 0, used: 0, unit: "Litres" }
  },
  {
    id: "IND-013",
    requester: { name: "Harish Painter", role: "Worker" },
    project: { name: "VPG Greens", area: "Villa 05" },
    items: { count: 2, preview: "Wall Putty, White Primer" },
    status: "PO CREATED",
    created: "2024-05-07",
    usage: { received: 120, used: 12, unit: "Bags" }
  },
  {
    id: "IND-014",
    requester: { name: "Manoj Tiler", role: "Contractor" },
    project: { name: "VPG Twin Towers", area: "Lobby A" },
    items: { count: 3, preview: "Granite Slabs, Marble Tiles, Grout" },
    status: "REJECTED",
    created: "2024-05-08",
    rejectionReason: "Exceeds monthly material budget allocation",
    usage: { received: 0, used: 0, unit: "Slabs" }
  },
  {
    id: "IND-015",
    requester: { name: "Karan Steelworker", role: "Worker" },
    project: { name: "VPG Grande", area: "Tower C Floor 14" },
    items: { count: 1, preview: "Reinforcement Bars (12mm)" },
    status: "PO CREATED",
    created: "2024-05-09",
    usage: { received: 250, used: 250, unit: "Rods" }
  }
]

export default function IndentPage() {
  const [data, setData] = useState<Indent[]>(MOCK_INDENTS)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")

  const handleStatusChange = (id: string, newStatus: Indent["status"], reason?: string) => {
    setData(prev => prev.map(item =>
      item.id === id ? { ...item, status: newStatus, rejectionReason: reason } : item
    ))
    if (newStatus === "REJECTED") {
      toast.error(`Indent ${id} has been rejected${reason ? `: "${reason}"` : ""}`)
    } else {
      toast.success(`Indent ${id} status updated to ${newStatus}`)
    }
  }

  const handleConfirmReject = () => {
    if (!rejectingId) return
    if (!rejectionReason.trim()) {
      toast.error("Please enter a reason for rejection")
      return
    }
    handleStatusChange(rejectingId, "REJECTED", rejectionReason)
    setRejectingId(null)
    setRejectionReason("")
  }

  const handleCancelReject = () => {
    setRejectingId(null)
    setRejectionReason("")
  }

  const columns: ColumnDef<Indent>[] = [
    {
      accessorKey: "id",
      header: "Indent ID",
      cell: ({ row }) => <div className="font-bold text-emerald-500">{row.getValue("id")}</div>,
    },
    {
      accessorKey: "requester",
      header: "Requester",
      cell: ({ row }) => {
        const req = row.original.requester
        return (
          <div className="flex flex-col">
            <span className="font-bold text-zinc-900">{req.name}</span>
            <span className="text-[10px] text-zinc-400 font-medium">{req.role}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "project",
      header: "Project / Area",
      cell: ({ row }) => {
        const proj = row.original.project
        return (
          <div className="flex flex-col">
            <span className="font-bold text-zinc-900">{proj.name}</span>
            <span className="text-[10px] text-zinc-400 font-medium">{proj.area}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "items",
      header: "Items",
      cell: ({ row }) => {
        const items = row.original.items
        return (
          <div className="flex flex-col">
            <span className="font-bold text-zinc-900">{items.count} Items</span>
            <span className="text-[10px] text-zinc-400 font-medium">{items.preview}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "used",
      header: "Used Qty",
      cell: ({ row }) => {
        const usage = row.original.usage
        if (!usage || usage.received === 0) {
          return <div className="text-zinc-300 font-bold text-[11px]">—</div>
        }
        return (
          <div className="flex items-center gap-1 text-zinc-900 font-bold text-xs">
            <span className="text-[13px] font-black text-zinc-900">{usage.used}</span>
            <span className="text-[11px] text-zinc-300 font-normal">/</span>
            <span className="text-[12px] text-zinc-500 font-bold">{usage.received}</span>
            <span className="text-[9px] text-zinc-400 font-black tracking-wider uppercase ml-1">{usage.unit}</span>
          </div>
        )
      }
    },
    // {
    //   accessorKey: "consumption",
    //   header: "Consumption",
    //   cell: ({ row }) => {
    //     const usage = row.original.usage
    //     if (!usage || usage.received === 0) {
    //       return (
    //         <div className="flex items-center gap-2">
    //           <span className="text-[10px] text-zinc-400 font-bold tracking-wider uppercase">Not Received</span>
    //         </div>
    //       )
    //     }
        
    //     const percent = Math.round((usage.used / usage.received) * 100)
        
    //     return (
    //       <div className="flex flex-col gap-1.5 w-32">
    //         <div className="flex items-center justify-between font-black text-[10px] tracking-wide">
    //           <span className={cn(
    //             percent === 100 ? "text-rose-500" :
    //             percent > 50 ? "text-amber-500" :
    //             "text-emerald-500"
    //           )}>{percent}% Used</span>
    //           <span className="text-zinc-400">{usage.received - usage.used} left</span>
    //         </div>
    //         <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
    //           <div 
    //             className={cn(
    //               "h-full rounded-full transition-all duration-500",
    //               percent === 100 ? "bg-rose-500" :
    //               percent > 50 ? "bg-amber-500" :
    //               "bg-emerald-500"
    //             )}
    //             style={{ width: `${percent}%` }}
    //           />
    //         </div>
    //       </div>
    //     )
    //   }
    // },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status
        const id = row.original.id
        const rejectionReason = row.original.rejectionReason

        return (
          <div className="flex items-center justify-start py-1">
            <div className="flex flex-col gap-1.5">
              <Select
                value={status}
                onValueChange={(val) => {
                  if (val === "REJECTED") {
                    setRejectingId(id)
                  } else {
                    handleStatusChange(id, val as Indent["status"])
                  }
                }}
              >
                <SelectTrigger className={cn(
                  "h-9 w-[160px] rounded-xl border-none font-black text-[9px] tracking-[0.15em] uppercase transition-all shadow-sm",
                  status === "PENDING MANAGER" ? "bg-amber-50 text-amber-600 hover:bg-amber-100/50" :
                    status === "QUOTATION RECEIVED" ? "bg-blue-50 text-blue-600 hover:bg-blue-100/50" :
                      status === "REJECTED" ? "bg-rose-50 text-rose-500 hover:bg-rose-100/50" :
                        "bg-emerald-50 text-emerald-600 hover:bg-emerald-100/50"
                )}>
                  <div className="flex items-center gap-2">
                    {status === "PENDING MANAGER" && <Clock className="h-3 w-3" />}
                    {status === "QUOTATION RECEIVED" && <FileText className="h-3 w-3" />}
                    {status === "PO CREATED" && <CheckCircle2 className="h-3 w-3" />}
                    {status === "REJECTED" && <X className="h-3 w-3" />}
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-zinc-100 shadow-2xl p-1">
                  <SelectItem value="PO CREATED" className="rounded-xl font-bold text-[10px] uppercase tracking-wider py-3 text-emerald-600">Approve</SelectItem>
                  <SelectItem value="REJECTED" className="rounded-xl font-bold text-[10px] uppercase tracking-wider py-3 text-rose-500">Reject</SelectItem>
                </SelectContent>
              </Select>
              {status === "REJECTED" && rejectionReason && (
                <span className="text-[10px] text-rose-500 font-bold italic max-w-[160px] truncate leading-tight mt-1" title={rejectionReason}>
                  &quot;{rejectionReason}&quot;
                </span>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "created",
      header: "Created Date",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-zinc-500 font-bold text-[11px]">
          <Clock className="h-3 w-3 text-zinc-300" />
          {row.getValue("created")}
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right pr-6">Operations</div>,
      cell: ({ row }) => {
        return (
          <div className="flex items-center justify-end gap-1 pr-4">
            <ViewIndentDialog
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3 rounded-xl text-zinc-400 hover:text-primary hover:bg-primary/5 font-bold text-[11px] gap-2 transition-all"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Details
                </Button>
              }
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-3 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 font-bold text-[11px] gap-2 transition-all"
            >
              <FileText className="h-3.5 w-3.5" />
              Export
            </Button>
          </div>
        );
      },
    },
  ]

  return (
    <ContentLayout title="Indent Requests">
      <div className="flex flex-col gap-8 p-6 sm:p-10 max-w-[1600px] mx-auto min-h-screen">

        {/* Header Control Hub */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Indent Requests</h1>

          <div className="flex items-center gap-4">
            <div className="relative w-72">
              <Input placeholder="Search material, vendor..." className="h-12 rounded-2xl bg-white border-zinc-100 pl-11 font-medium shadow-sm" />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300" />
            </div>
            {/* <CreateIndentDialog 
                trigger={
                  <Button className="h-12 px-8 rounded-2xl bg-primary font-black shadow-lg shadow-primary/20 gap-2">
                     <Plus className="h-5 w-5" /> Create Indent
                  </Button>
                }
              /> */}
          </div>
        </div>

        {/* Global Strategy Metrics
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {[
             { label: "Total Indents", val: "142", color: "text-zinc-600", bg: "bg-zinc-50" },
             { label: "Pending Approval", val: "18", color: "text-amber-500", bg: "bg-amber-50" },
             { label: "Converted to PO", val: "84", color: "text-emerald-500", bg: "bg-emerald-50" },
           ].map((stat, i) => (
             <div key={i} className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all cursor-pointer">
                <div className="flex flex-col gap-1">
                   <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{stat.label}</span>
                   <span className="text-2xl font-black text-zinc-900 tracking-tighter">{stat.val}</span>
                </div>
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", stat.bg)}>
                   <Filter className={cn("h-5 w-5", stat.color)} />
                </div>
             </div>
           ))}
        </div> */}

        {/* Indent Board */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-zinc-100 shadow-sm">
          <DataTable
            columns={columns}
            data={data}
          />
        </div>
      </div>

      {/* Reject Indent Dialog */}
      <Dialog open={!!rejectingId} onOpenChange={(open) => { if (!open) handleCancelReject() }}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] flex flex-col mx-4 bg-white">
          <div className="p-8 pb-4 shrink-0 bg-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                <XCircle className="h-6 w-6" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none">Status Change</span>
                <DialogTitle className="text-2xl font-black text-zinc-900 tracking-tight leading-none">Reject Indent {rejectingId}</DialogTitle>
              </div>
            </div>
            <DialogDescription className="text-zinc-400 text-xs font-bold uppercase tracking-wider leading-relaxed">
              Please provide a clear reason for rejecting this indent request.
            </DialogDescription>
          </div>

          <div className="flex-1 p-8 pt-2 space-y-4 bg-zinc-50/10">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Rejection Reason</Label>
              <Textarea
                placeholder="e.g. Insufficient budget, duplicate request, or incorrect specifications..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[120px] rounded-2xl bg-white border-zinc-100 focus:ring-rose-500 focus:border-rose-500 font-bold shadow-inner p-4 text-xs resize-none"
              />
            </div>
          </div>

          <div className="p-8 bg-rose-50/20 border-t border-rose-100 shrink-0 flex gap-4">
            <Button
              variant="outline"
              onClick={handleCancelReject}
              className="flex-1 h-12 rounded-xl border-zinc-100 text-zinc-500 font-black text-xs hover:bg-zinc-50 transition-all"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmReject}
              className="flex-1 h-12 rounded-xl bg-rose-500 text-white font-black text-xs gap-2 shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all"
            >
              Confirm Reject
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ContentLayout>
  )
}
