"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import {
  Building2,
  Plus,
  Search,
  MoreVertical,
  Zap,
  LayoutGrid,
  ListFilter,
  ShieldCheck,
  Factory
} from "lucide-react"

import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { VendorDialog } from "@/components/vendor/vendor-form"
import { cn } from "@/lib/utils"

type Vendor = {
  id: string
  name: string
  type: string
  category: string
  email: string
  status: "Active" | "On Trial" | "Blacklisted"
  rating: number
}

const MOCK_VENDORS: Vendor[] = [
  {
    id: "VND-2026-001",
    name: "VPG Concrete Ltd.",
    type: "Corporation",
    category: "Raw Materials",
    email: "ops@VPG.com",
    status: "Active",
    rating: 4.8
  },
  {
    id: "VND-2026-002",
    name: "Downtown Logistics",
    type: "Partnership",
    category: "Logistics",
    email: "fleet@downtown.com",
    status: "On Trial",
    rating: 4.2
  },
  {
    id: "VND-2026-003",
    name: "Steel Dynamics",
    type: "Corporation",
    category: "Raw Materials",
    email: "sales@steeldynamics.com",
    status: "Blacklisted",
    rating: 2.1
  }
]

export default function VendorPage() {
  const [data] = useState<Vendor[]>(MOCK_VENDORS)

  const columns: ColumnDef<Vendor>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div className="font-black text-zinc-400 text-[10px] pl-4">{row.getValue("id")}</div>,
    },
    {
      accessorKey: "name",
      header: "VENDOR NAME",
      cell: ({ row }) => (
        <div className="flex items-center gap-3 pl-4">
          <div className="h-9 w-9 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="font-bold text-zinc-900">{row.getValue("name")}</div>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "CATEGORY",
      cell: ({ row }) => <Badge variant="outline" className="rounded-lg font-bold text-zinc-500 border-zinc-100">{row.getValue("category")}</Badge>,
    },
    {
      accessorKey: "status",
      header: "STATUS",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge className={cn(
            "rounded-full px-4 py-0.5 font-bold border-none",
            status === "Active" ? "bg-emerald-100 text-emerald-700" :
              status === "On Trial" ? "bg-amber-100 text-amber-700" :
                "bg-rose-100 text-rose-700"
          )}>
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "rating",
      header: "RATING",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-12 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full",
                (row.getValue("rating") as number) > 4 ? "bg-emerald-500" :
                  (row.getValue("rating") as number) > 3 ? "bg-amber-500" : "bg-rose-500"
              )}
              style={{ width: `${((row.getValue("rating") as number) / 5) * 100}%` }}
            />
          </div>
          <span className="text-[10px] font-black text-zinc-900">{row.getValue("rating")}</span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end pr-4">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-zinc-100">
            <MoreVertical className="h-4 w-4 text-zinc-400" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <ContentLayout title="Strategic Vendors">
      <div className="flex flex-col gap-10 p-6 sm:p-12 max-w-[1700px] mx-auto min-h-screen">

        {/* Header Control Hub */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-black text-zinc-900 tracking-tighter">Strategic Vendors</h1>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Partner Ecosystem Management</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" className="h-12 px-6 rounded-2xl border-zinc-100 font-bold gap-2 text-zinc-500 hover:bg-zinc-50">
              <ListFilter className="h-4 w-4" /> Filter
            </Button>
            <VendorDialog />
          </div>
        </div>

        {/* Global Strategy Metrics */}
        {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           {[
             { label: "Active Partners", val: "48", icon: Building2, color: "text-teal-600", bg: "bg-teal-50" },
             { label: "Pending Compliance", val: "12", icon: ShieldCheck, color: "text-amber-500", bg: "bg-amber-50" },
             { label: "Operational Tiers", val: "04", icon: Factory, color: "text-emerald-500", bg: "bg-emerald-50" },
             { label: "Avg. Reliability", val: "94%", icon: Zap, color: "text-zinc-600", bg: "bg-zinc-100" },
           ].map((stat, i) => (
             <div key={i} className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm flex items-center gap-6 group hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer">
                <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center", stat.bg)}>
                   <stat.icon className={cn("h-7 w-7", stat.color)} />
                </div>
                <div className="flex flex-col">
                   <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{stat.label}</span>
                   <span className="text-2xl font-black text-zinc-900 tracking-tighter">{stat.val}</span>
                </div>
             </div>
           ))}
        </div> */}

        {/* Vendor Inventory Board */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-zinc-100 shadow-sm">
          <div className="flex items-center justify-between mb-8 px-4">
            {/* <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-zinc-900 flex items-center justify-center text-white">
                <LayoutGrid className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-black text-zinc-900 tracking-tight">Partner Grid</h3>
            </div> */}
            <div className="relative w-72">
              <Input placeholder="Scan for partner..." className="h-11 rounded-xl bg-zinc-50 border-none pl-10 font-bold" />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300" />
            </div>
          </div>
          <DataTable
            columns={columns}
            data={data}
          />
        </div>
      </div>
    </ContentLayout>
  )
}