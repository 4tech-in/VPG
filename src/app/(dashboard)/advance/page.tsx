"use client"

import { useState } from "react"
import {
  DollarSign,
  User2,
  Calendar,
  Clock,
  Search,
  Plus,
  MoreVertical,
  ChevronRight,
  Wallet,
  ArrowUpRight,
  TrendingDown,
  History
} from "lucide-react"

import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type AdvanceRecord = {
  id: string
  member: {
    name: string
    role: string
    avatar?: string
  }
  amount: number
  date: string
  reason: string
  status: "Pending" | "Recovered" | "Approved"
}

const MOCK_ADVANCES: AdvanceRecord[] = [
  {
    id: "ADV-001",
    member: { name: "Julian Casablancas", role: "Senior Sales Agent" },
    amount: 5000,
    date: "May 10, 2026",
    reason: "Personal Emergency",
    status: "Approved"
  },
  {
    id: "ADV-002",
    member: { name: "Sofia Rodriguez", role: "Specialist" },
    amount: 2500,
    date: "May 12, 2026",
    reason: "Medical Expense",
    status: "Pending"
  },
  {
    id: "ADV-003",
    member: { name: "Marcus Aurelius", role: "Manager" },
    amount: 10000,
    date: "May 01, 2026",
    reason: "Travel Advance",
    status: "Recovered"
  }
]

export default function AdvancePage() {
  const [data, setData] = useState<AdvanceRecord[]>(MOCK_ADVANCES)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const columns: ColumnDef<AdvanceRecord>[] = [
    {
      accessorKey: "member",
      header: "Team Member",
      cell: ({ row }) => (
        <div className="flex items-center gap-3 pl-2">
          <Avatar className="h-9 w-9 rounded-xl border-2 border-white shadow-sm">
            <AvatarImage src={row.original.member.avatar} />
            <AvatarFallback className="rounded-xl bg-zinc-100 text-zinc-900 font-bold text-xs">
              {row.original.member.name[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-bold text-zinc-900 text-sm leading-none mb-1">{row.original.member.name}</span>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">{row.original.member.role}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <div className="font-black text-zinc-900 text-sm tracking-tight">
          ₹{row.original.amount.toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: "date",
      header: "Issued Date",
      cell: ({ row }) => <span className="text-zinc-500 font-bold text-xs">{row.getValue("date")}</span>,
    },
    {
      accessorKey: "reason",
      header: "Reason for Advance",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate text-zinc-500 font-medium text-xs">
          {row.getValue("reason")}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge className={cn(
            "rounded-lg px-3 py-1 font-black text-[9px] border shadow-sm uppercase tracking-wider",
            status === "Approved" ? "bg-blue-50 text-blue-600 border-blue-100" :
              status === "Pending" ? "bg-amber-50 text-amber-600 border-amber-100" :
                "bg-emerald-50 text-emerald-600 border-emerald-100"
          )}>
            {status}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: "",
      cell: () => (
        <div className="flex justify-end pr-4">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-zinc-100">
            <MoreVertical className="h-4 w-4 text-zinc-400" />
          </Button>
        </div>
      ),
    },
  ]

  const handleCreateAdvance = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success("Advance request recorded successfully")
    setIsDialogOpen(false)
  }

  return (
    <ContentLayout title="Advance Management">
      <div className="flex flex-col gap-8 p-6 sm:p-10 max-w-[1600px] mx-auto min-h-screen">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Advance Management</h1>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Financial Support Ledger</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Input placeholder="Search records..." className="h-11 rounded-xl bg-white border-zinc-100 pl-10 font-bold shadow-sm" />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300" />
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-11 rounded-xl px-6 bg-zinc-900 text-white font-black shadow-xl shadow-zinc-900/20 gap-2">
                  <Plus className="h-4 w-4" /> New Advance
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
                <DialogHeader className="p-8 bg-zinc-900 text-white pb-10">
                  <DialogTitle className="text-2xl font-black tracking-tight">Create Advance Record</DialogTitle>
                  <DialogDescription className="text-zinc-400 font-bold text-[10px] uppercase tracking-widest mt-2">
                    New Financial Disbursement
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateAdvance} className="p-8 bg-white space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider pl-1">Select Team Member</Label>
                    <Select>
                      <SelectTrigger className="h-12 rounded-xl bg-zinc-50 border-none font-bold text-sm focus:ring-1 focus:ring-primary">
                        <SelectValue placeholder="Choose a member" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
                        <SelectItem value="1">Julian Casablancas</SelectItem>
                        <SelectItem value="2">Sofia Rodriguez</SelectItem>
                        <SelectItem value="3">Marcus Aurelius</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider pl-1">Amount (INR)</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="h-12 rounded-xl bg-zinc-50 border-none font-black text-lg pl-10 focus:ring-1 focus:ring-primary"
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-zinc-400 text-sm">₹</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider pl-1">Reason for Advance</Label>
                    <Input
                      placeholder="e.g. Travel, Personal, Emergency"
                      className="h-12 rounded-xl bg-zinc-50 border-none font-bold text-sm focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="pt-4 flex items-center gap-3">
                    <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-12 flex-1 rounded-xl font-bold text-zinc-400">Cancel</Button>
                    <Button type="submit" className="h-12 flex-1 rounded-xl bg-zinc-900 font-black shadow-xl shadow-zinc-900/10">Record Advance</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Financial Metrics */}
        {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {[
             { label: "Total Disbursed", val: "₹1,45,000", icon: Wallet, color: "text-zinc-600", bg: "bg-zinc-100", trend: "+12% vs last mo" },
             { label: "Pending Recovery", val: "₹42,500", icon: History, color: "text-amber-500", bg: "bg-amber-50", trend: "08 Records pending" },
             { label: "Total Recovered", val: "₹1,02,500", icon: TrendingDown, color: "text-emerald-500", bg: "bg-emerald-50", trend: "84% Recovery Rate" },
           ].map((stat, i) => (
             <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm group hover:shadow-xl transition-all cursor-pointer relative overflow-hidden">
                <div className="flex items-start justify-between relative z-10">
                   <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{stat.label}</span>
                      <span className="text-3xl font-black text-zinc-900 tracking-tighter">{stat.val}</span>
                      <span className="text-[9px] font-bold text-zinc-400 mt-2 flex items-center gap-1">
                        <ArrowUpRight className="h-3 w-3" /> {stat.trend}
                      </span>
                   </div>
                   <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", stat.bg)}>
                      <stat.icon className={cn("h-6 w-6", stat.color)} />
                   </div>
                </div>
                <div className="absolute -bottom-4 -right-4 opacity-[0.02] rotate-12 group-hover:scale-110 transition-transform">
                   <stat.icon className="h-32 w-32" />
                </div>
             </div>
           ))}
        </div> */}

        {/* Ledger Table */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-zinc-100 shadow-sm">
          {/* <div className="flex items-center justify-between mb-8 px-2">
              <div className="flex items-center gap-3">
                 <div className="h-9 w-9 rounded-xl bg-zinc-900 flex items-center justify-center text-white shadow-lg shadow-zinc-900/20">
                    <DollarSign className="h-5 w-5" />
                 </div>
                 <h3 className="text-lg font-black text-zinc-900 tracking-tight">Advance Ledger</h3>
              </div>
              <div className="flex items-center gap-2">
                 <Button variant="ghost" className="h-9 rounded-xl font-bold text-[10px] uppercase tracking-widest text-zinc-400 hover:text-zinc-900">Download Excel</Button>
              </div>
           </div> */}
          <DataTable
            columns={columns}
            data={data}
          />
        </div>
      </div>
    </ContentLayout>
  )
}
