"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import {
  Plus,
  Search,
  MoreVertical,
  Truck,
  FileText,
  Filter,
  ArrowUpDown,
  Eye,
  CheckCircle2,
  XCircle
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
import { cn } from "@/lib/utils"

type Quotation = {
  id: string
  requester: {
    name: string
    role: string
  }
  project: {
    name: string
  }
  items: {
    count: number
    preview: string
  }
  status: "AWAITING QUOTATION" | "QUOTATION RECEIVED"
  created: string
}

const MOCK_QUOTATIONS: Quotation[] = [
  {
    id: "IND-001",
    requester: { name: "Ravi Kumar", role: "Worker" },
    project: { name: "VPG Grande" },
    items: { count: 1, preview: "Cement Bag" },
    status: "AWAITING QUOTATION",
    created: "2024-05-01"
  }
]

export default function QuotationPage() {
  const router = useRouter()
  const [data] = useState<Quotation[]>(MOCK_QUOTATIONS)

  const columns: ColumnDef<Quotation>[] = [
    {
      accessorKey: "id",
      header: ({ column }) => (
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Indent ID <ArrowUpDown className="h-3 w-3" />
        </div>
      ),
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
      cell: ({ row }) => <div className="font-bold text-zinc-900">{row.original.project.name}</div>,
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
            "rounded-full px-5 py-2 font-black text-[10px] border-none shadow-sm flex items-center gap-2 w-fit",
            status === "AWAITING QUOTATION" ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"
          )}>
            {status === "AWAITING QUOTATION" && <Truck className="h-3.5 w-3.5" />}
            {status === "QUOTATION RECEIVED" && <FileText className="h-3.5 w-3.5" />}
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
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-none">
              <DropdownMenuItem
                onClick={() => router.push(`/quotation/${row.original.id}`)}
                className="rounded-xl font-bold text-zinc-600 gap-3 py-3 cursor-pointer"
              >
                <Eye className="h-4 w-4" /> View Details
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl font-bold text-emerald-600 gap-3 py-3 cursor-pointer focus:bg-emerald-50 focus:text-emerald-600">
                <CheckCircle2 className="h-4 w-4" /> Approve Quotation
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl font-bold text-rose-500 gap-3 py-3 cursor-pointer focus:bg-rose-50 focus:text-rose-600">
                <XCircle className="h-4 w-4" /> Reject Quotation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

  return (
    <ContentLayout title="Quotation Requests (RFQs)">
      <div className="flex flex-col gap-8 p-6 sm:p-10 max-w-[1600px] mx-auto min-h-screen">

        {/* Header Control Hub */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Quotation Requests (RFQs)</h1>

          <div className="flex items-center gap-4">
            <div className="relative w-72">
              <Input placeholder="Search by Indent ID..." className="h-12 rounded-2xl bg-white border-zinc-100 pl-11 font-medium shadow-sm" />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300" />
            </div>
            <Button className="h-12 px-8 rounded-2xl bg-primary font-black shadow-lg shadow-primary/20 gap-2">
              <Plus className="h-5 w-5" /> New RFQ
            </Button>
          </div>
        </div>

        {/* Board */}
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
