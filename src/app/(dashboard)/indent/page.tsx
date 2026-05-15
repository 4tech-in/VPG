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
  Trash2
} from "lucide-react"

import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ViewIndentDialog, CreateIndentDialog } from "@/components/indent/indent-dialogs"
import { cn } from "@/lib/utils"

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
  status: "PENDING MANAGER" | "QUOTATION RECEIVED" | "PO CREATED"
  created: string
}

const MOCK_INDENTS: Indent[] = [
  {
    id: "IND-001",
    requester: { name: "Ravi Kumar", role: "Worker" },
    project: { name: "Marbella Grande", area: "Tower A" },
    items: { count: 2, preview: "Cement Bag, Sand" },
    status: "PENDING MANAGER",
    created: "2024-05-01"
  },
  {
    id: "IND-007",
    requester: { name: "Amit Foreman", role: "Worker" },
    project: { name: "Marbella Twin Towers", area: "Tower D" },
    items: { count: 1, preview: "LED Panel Lights" },
    status: "QUOTATION RECEIVED",
    created: "2024-04-30"
  },
  {
    id: "IND-008",
    requester: { name: "Sanjay Plumber", role: "Worker" },
    project: { name: "Marbella Grande", area: "Tower A" },
    items: { count: 1, preview: "PVC Glue (Large)" },
    status: "PO CREATED",
    created: "2024-04-29"
  }
]

export default function IndentPage() {
  const [data] = useState<Indent[]>(MOCK_INDENTS)

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
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge className={cn(
            "rounded-full px-4 py-1.5 font-black text-[9px] border shadow-sm flex items-center gap-2 w-fit",
            status === "PENDING MANAGER" ? "bg-amber-50 text-amber-600 border-amber-100" : 
            status === "QUOTATION RECEIVED" ? "bg-blue-50 text-blue-600 border-blue-100" : 
            "bg-emerald-50 text-emerald-600 border-emerald-100"
          )}>
            {status === "PENDING MANAGER" && <Clock className="h-3 w-3" />}
            {status === "QUOTATION RECEIVED" && <FileText className="h-3 w-3" />}
            {status === "PO CREATED" && <CheckCircle2 className="h-3 w-3" />}
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "created",
      header: "Created",
      cell: ({ row }) => <div className="text-[11px] font-bold text-zinc-500">{row.getValue("created")}</div>,
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => (
        <div className="flex justify-end pr-4">
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                 <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-zinc-100">
                    <MoreVertical className="h-4 w-4 text-zinc-400" />
                 </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl p-2 shadow-2xl border-none">
                 <ViewIndentDialog 
                   trigger={
                     <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="rounded-lg font-bold text-zinc-600 gap-3 py-3 cursor-pointer">
                        <Eye className="h-4 w-4" /> View Details
                     </DropdownMenuItem>
                   }
                 />
                 <DropdownMenuItem className="rounded-lg font-bold text-zinc-600 gap-3 py-3 cursor-pointer">
                    <FileText className="h-4 w-4" /> Export PDF
                 </DropdownMenuItem>
                 <DropdownMenuItem className="rounded-lg font-bold text-rose-500 gap-3 py-3 cursor-pointer focus:bg-rose-50 focus:text-rose-600">
                    <Trash2 className="h-4 w-4" /> Delete Indent
                 </DropdownMenuItem>
              </DropdownMenuContent>
           </DropdownMenu>
        </div>
      ),
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
              <CreateIndentDialog 
                trigger={
                  <Button className="h-12 px-8 rounded-2xl bg-primary font-black shadow-lg shadow-primary/20 gap-2">
                     <Plus className="h-5 w-5" /> Create Indent
                  </Button>
                }
              />
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
    </ContentLayout>
  )
}
