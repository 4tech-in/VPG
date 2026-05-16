"use client"

import { useState } from "react"
import { 
  User2,
  Calendar,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MoreVertical,
  ArrowUpRight
} from "lucide-react"

import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

type Attendance = {
  id: string
  member: {
    name: string
    role: string
    avatar?: string
  }
  date: string
  checkIn: string
  checkOut: string
  hours: string
  status: "Present" | "Late" | "Absent"
}

const MOCK_ATTENDANCE: Attendance[] = [
  {
    id: "1",
    member: { name: "Julian Casablancas", role: "Senior Sales Agent" },
    date: "May 15, 2026",
    checkIn: "09:00 AM",
    checkOut: "06:00 PM",
    hours: "9.0h",
    status: "Present"
  },
  {
    id: "2",
    member: { name: "Sofia Rodriguez", role: "Specialist" },
    date: "May 15, 2026",
    checkIn: "09:45 AM",
    checkOut: "06:15 PM",
    hours: "8.5h",
    status: "Late"
  },
  {
    id: "3",
    member: { name: "Marcus Aurelius", role: "Manager" },
    date: "May 15, 2026",
    checkIn: "-",
    checkOut: "-",
    hours: "0h",
    status: "Absent"
  }
]

export default function AttendancePage() {
  const [data] = useState<Attendance[]>(MOCK_ATTENDANCE)
  const [date, setDate] = useState<Date | undefined>(new Date())

  const columns: ColumnDef<Attendance>[] = [
    {
      accessorKey: "member",
      header: "Team Member",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
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
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => <span className="text-zinc-500 font-bold text-xs">{row.getValue("date")}</span>,
    },
    {
      accessorKey: "checkIn",
      header: "Check In",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="font-bold text-zinc-900 text-xs">{row.getValue("checkIn")}</span>
        </div>
      ),
    },
    {
      accessorKey: "checkOut",
      header: "Check Out",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          <span className="font-bold text-zinc-900 text-xs">{row.getValue("checkOut")}</span>
        </div>
      ),
    },
    {
      accessorKey: "hours",
      header: "Work Hours",
      cell: ({ row }) => (
        <div className="px-3 py-1 bg-zinc-50 rounded-lg w-fit border border-zinc-100">
          <span className="font-black text-zinc-900 text-[10px]">{row.getValue("hours")}</span>
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
            status === "Present" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
            status === "Late" ? "bg-amber-50 text-amber-600 border-amber-100" : 
            "bg-rose-50 text-rose-600 border-rose-100"
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

  return (
    <ContentLayout title="Attendance Tracker">
      <div className="flex flex-col gap-8 p-6 sm:p-10 max-w-[1600px] mx-auto min-h-screen">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
           <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Attendance Tracker</h1>
              <div className="flex items-center gap-2">
                 <div className="h-2 w-2 rounded-full bg-emerald-500" />
                 <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Live Presence Monitor</p>
              </div>
           </div>
           
           <div className="flex items-center gap-3">
              <div className="relative w-64">
                 <Input placeholder="Search member..." className="h-11 rounded-xl bg-white border-zinc-100 pl-10 font-bold shadow-sm" />
                 <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300" />
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-11 px-5 rounded-xl border-zinc-100 font-bold gap-2 text-zinc-500 hover:bg-zinc-50",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl border-zinc-100 shadow-2xl" align="end">
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className="rounded-2xl"
                  />
                </PopoverContent>
              </Popover>

              <Button variant="outline" className="h-11 px-5 rounded-xl border-zinc-100 font-bold gap-2 text-zinc-500 hover:bg-zinc-50">
                 <Filter className="h-4 w-4" /> Filter
              </Button>
           </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           {[
             { label: "On Time", val: "32", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
             { label: "Late Arrivals", val: "05", icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50" },
             { label: "On Leave", val: "03", icon: Calendar, color: "text-blue-500", bg: "bg-blue-50" },
             { label: "Absent", val: "02", icon: XCircle, color: "text-rose-500", bg: "bg-rose-50" },
           ].map((stat, i) => (
             <div key={i} className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all cursor-pointer overflow-hidden relative">
                <div className="flex flex-col gap-1 z-10">
                   <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{stat.label}</span>
                   <span className="text-3xl font-black text-zinc-900 tracking-tighter">{stat.val}</span>
                </div>
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center z-10", stat.bg)}>
                   <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
                <div className="absolute -bottom-2 -right-2 opacity-[0.03] rotate-12 transition-transform group-hover:scale-110">
                   <stat.icon className="h-24 w-24" />
                </div>
             </div>
           ))}
        </div>

        {/* Attendance Table */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-zinc-100 shadow-sm">
           <div className="flex items-center justify-between mb-8 px-2">
              <div className="flex items-center gap-3">
                 <div className="h-9 w-9 rounded-xl bg-zinc-900 flex items-center justify-center text-white">
                    <User2 className="h-5 w-5" />
                 </div>
                 <h3 className="text-lg font-black text-zinc-900 tracking-tight">Today&apos;s Presence</h3>
              </div>
              <Button variant="ghost" className="text-zinc-400 font-bold text-xs gap-2 hover:text-zinc-900">
                 View History <ArrowUpRight className="h-4 w-4" />
              </Button>
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
