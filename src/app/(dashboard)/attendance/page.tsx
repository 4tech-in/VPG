"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
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
  ArrowUpRight,
  Plus,
  Coffee
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
import { format, startOfDay, endOfDay } from "date-fns"
import { cn } from "@/lib/utils"
import { attendanceService } from "@/service/attendance.api"
import { userService, ApiUser } from "@/service/userService"
import { leaveService } from "@/service/leaves.api"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type AttendanceRecord = {
  _id: string
  userId: {
    _id: string
    name: string
    email: string
    mobile?: string
  } | null
  date: string
  punchInTime?: string
  punchOutTime?: string
  totalMinutes?: number
  status: "Present" | "Late" | "HalfDay" | "Absent" | "WeeklyOff"
  note?: string
}

export default function AttendancePage() {
  const [data, setData] = useState<AttendanceRecord[]>([])
  const [users, setUsers] = useState<ApiUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [search, setSearch] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)

  // Active Tab: "attendance" or "leaves"
  const [activeTab, setActiveTab] = useState<"attendance" | "leaves">("attendance")

  useEffect(() => {
    const savedTab = localStorage.getItem("attendance_active_tab")
    if (savedTab === "leaves" || savedTab === "attendance") {
      setActiveTab(savedTab)
    }
  }, [])

  const handleTabChange = (tab: "attendance" | "leaves") => {
    setActiveTab(tab)
    localStorage.setItem("attendance_active_tab", tab)
  }

  // Mark Attendance Modal State
  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false)
  const [markUserId, setMarkUserId] = useState("")
  const [markDate, setMarkDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [markStatus, setMarkStatus] = useState("Present")
  const [markPunchIn, setMarkPunchIn] = useState("09:00")
  const [markPunchOut, setMarkPunchOut] = useState("18:00")
  const [markNote, setMarkNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Leave State
  const [leavesData, setLeavesData] = useState<any[]>([])
  const [isLeavesLoading, setIsLeavesLoading] = useState(false)
  const [leaveSearch, setLeaveSearch] = useState("")
  const [debouncedLeaveSearch, setDebouncedLeaveSearch] = useState("")
  const [leaveStatusFilter, setLeaveStatusFilter] = useState<string>("")

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setDebouncedLeaveSearch(leaveSearch)
    }, 400)
    return () => clearTimeout(delayDebounce)
  }, [leaveSearch])

  // Leave Dialog State
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
  const [leaveUserId, setLeaveUserId] = useState("")
  const [leaveType, setLeaveType] = useState("Casual")
  const [leaveStartDate, setLeaveStartDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [leaveEndDate, setLeaveEndDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [leaveReason, setLeaveReason] = useState("")
  const [leaveStatus, setLeaveStatus] = useState("Pending")
  const [isLeaveSubmitting, setIsLeaveSubmitting] = useState(false)

  const lastFetchedParams = useRef("")

  // Fetch users only when modal is opened and we don't have them yet
  useEffect(() => {
    if ((isMarkModalOpen || isLeaveModalOpen) && users.length === 0) {
      const fetchUsers = async () => {
        try {
          const response = await userService.getUsers({ limit: 200 })
          const usersList = Array.isArray(response) ? response : (response?.data || [])
          setUsers(usersList)
        } catch (err: any) {
          toast.error("Failed to load users list")
        }
      }
      fetchUsers()
    }
  }, [isMarkModalOpen, isLeaveModalOpen, users.length])

  // Fetch Attendance Records
  const fetchAttendances = useCallback(async () => {
    setIsLoading(true)
    try {
      const params: any = {
        limit: 10,
      }

      if (date) {
        const formattedDate = format(date, "yyyy-MM-dd")
        params.startDate = formattedDate
        params.endDate = formattedDate
      }

      if (selectedStatus) {
        params.status = selectedStatus
      }

      const response = await attendanceService.getAttendance(params)
      const records = response.data || response || []
      setData(records)
    } catch (err: any) {
      toast.error("Failed to fetch attendance data")
    } finally {
      setIsLoading(false)
    }
  }, [date, selectedStatus])

  useEffect(() => {
    const paramsKey = `${date?.getTime() || ""}-${selectedStatus || ""}`
    if (lastFetchedParams.current !== paramsKey) {
      lastFetchedParams.current = paramsKey
      fetchAttendances()
    }
  }, [date, selectedStatus, fetchAttendances])

  // Client side search mapping
  const filteredData = useMemo(() => {
    if (!search) return data
    const query = search.toLowerCase()
    return data.filter(
      (item) =>
        item.userId?.name?.toLowerCase().includes(query) ||
        item.userId?.email?.toLowerCase().includes(query)
    )
  }, [data, search])

  // Mark Attendance Submit Handler
  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!markUserId) {
      toast.error("Please select a team member")
      return
    }

    setIsSubmitting(true)
    try {
      await attendanceService.markAttendance({
        userId: markUserId,
        date: markDate,
        status: markStatus as any,
        punchInTime: ["Present", "Late", "HalfDay"].includes(markStatus) ? markPunchIn : undefined,
        punchOutTime: ["Present", "Late", "HalfDay"].includes(markStatus) ? markPunchOut : undefined,
        note: markNote || undefined,
      })
      toast.success("Attendance marked successfully")
      setIsMarkModalOpen(false)
      fetchAttendances()

      // Reset Modal Form
      setMarkUserId("")
      setMarkNote("")
    } catch (err: any) {
      toast.error(err.message || "Failed to mark attendance")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Fetch Leaves Handler
  const fetchLeaves = useCallback(async () => {
    setIsLeavesLoading(true)
    try {
      const response = await leaveService.getLeaves({
        status: leaveStatusFilter || undefined,
        search: debouncedLeaveSearch || undefined
      })
      setLeavesData(response.data || response || [])
    } catch (err: any) {
      toast.error("Failed to fetch leave applications")
    } finally {
      setIsLeavesLoading(false)
    }
  }, [leaveStatusFilter, debouncedLeaveSearch])

  // Auto fetch leaves when active tab is leaves
  useEffect(() => {
    if (activeTab === "leaves") {
      fetchLeaves()
    }
  }, [activeTab, fetchLeaves])

  // Update Leave Status
  const handleUpdateLeaveStatus = async (id: string, newStatus: string, rejectionReason?: string) => {
    try {
      await leaveService.updateLeaveStatus(id, { status: newStatus, rejectionReason })
      toast.success(`Leave ${newStatus.toLowerCase()} successfully`)
      fetchLeaves()
    } catch (err: any) {
      toast.error(err.message || "Failed to update leave status")
    }
  }

  // Create Leave Submit Handler
  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!leaveUserId) {
      toast.error("Please select a team member")
      return
    }
    if (!leaveReason.trim()) {
      toast.error("Please enter a reason for the leave")
      return
    }

    setIsLeaveSubmitting(true)
    try {
      await leaveService.createLeave({
        userId: leaveUserId,
        leaveType,
        startDate: leaveStartDate,
        endDate: leaveEndDate,
        reason: leaveReason,
        status: leaveStatus,
      })
      toast.success("Leave recorded successfully")
      setIsLeaveModalOpen(false)
      fetchLeaves()

      // Reset Leave Form
      setLeaveUserId("")
      setLeaveReason("")
      setLeaveType("Casual")
      setLeaveStatus("Pending")
    } catch (err: any) {
      toast.error(err.message || "Failed to record leave")
    } finally {
      setIsLeaveSubmitting(false)
    }
  }

  // Server-side leaves search mapping
  const filteredLeavesData = leavesData

  // Columns for leaves table
  const leaveColumns: ColumnDef<any>[] = [
    {
      accessorKey: "userId.name",
      header: "Team Member",
      cell: ({ row }) => {
        const user = row.original.userId
        const name = user?.name || "Unknown Staff"
        const email = user?.email || "No email info"
        const fallbackInitials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 rounded-xl border-2 border-white shadow-sm">
              <AvatarFallback className="rounded-xl bg-zinc-100 text-zinc-950 font-bold text-xs">
                {fallbackInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-bold text-zinc-900 text-sm leading-none mb-1">{name}</span>
              <span className="text-[10px] text-zinc-400 font-bold tracking-tight">{email}</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "leaveType",
      header: "Leave Type",
      cell: ({ row }) => (
        <Badge className="bg-zinc-100 text-zinc-800 border-none font-bold uppercase text-[9px] px-2.5 py-1 rounded-lg">
          {row.original.leaveType}
        </Badge>
      ),
    },
    {
      header: "Duration",
      cell: ({ row }) => {
        const start = format(new Date(row.original.startDate), "MMM dd, yyyy")
        const end = format(new Date(row.original.endDate), "MMM dd, yyyy")
        return (
          <div className="flex flex-col">
            <span className="text-zinc-900 font-bold text-xs">{start} - {end}</span>
            <span className="text-[10px] text-zinc-400 font-bold mt-0.5">{row.original.totalDays} Days</span>
          </div>
        )
      },
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => (
        <span className="text-zinc-600 font-medium text-xs max-w-[200px] truncate block" title={row.original.reason}>
          {row.original.reason}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status
        const id = row.original._id
        const rejectionReason = row.original.rejectionReason

        if (status !== "Pending") {
          return (
            <div className="flex flex-col gap-1">
              <Badge className={cn(
                "rounded-lg px-3 py-1 font-black text-[9px] border shadow-sm uppercase tracking-wider w-[120px] justify-center flex",
                status === "Approved" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                status === "Cancelled" ? "bg-zinc-50 text-zinc-500 border-zinc-100" :
                "bg-rose-50 text-rose-600 border-rose-100"
              )}>
                {status}
              </Badge>
              {status === "Rejected" && rejectionReason && (
                <span className="text-[10px] text-rose-500 font-bold italic max-w-[120px] truncate" title={rejectionReason}>
                  &quot;{rejectionReason}&quot;
                </span>
              )}
            </div>
          )
        }

        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-black text-[10px] uppercase border-none px-3"
              onClick={() => handleUpdateLeaveStatus(id, "Approved")}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-black text-[10px] uppercase border-none px-3"
              onClick={() => {
                const reason = prompt("Enter rejection reason:")
                if (reason === null) return
                if (!reason.trim()) {
                  toast.error("Rejection reason is required")
                  return
                }
                handleUpdateLeaveStatus(id, "Rejected", reason)
              }}
            >
              Reject
            </Button>
          </div>
        )
      },
    },
  ]

  // Calculate Stat Cards
  const stats = useMemo(() => {
    let onTime = 0
    let late = 0
    let halfDay = 0
    let absent = 0
    let weeklyOff = 0

    filteredData.forEach((record) => {
      if (record.status === "Present") onTime++
      else if (record.status === "Late") late++
      else if (record.status === "HalfDay") halfDay++
      else if (record.status === "Absent") absent++
      else if (record.status === "WeeklyOff") weeklyOff++
    })

    return { onTime, late, halfDay, absent, weeklyOff }
  }, [filteredData])

  const columns: ColumnDef<AttendanceRecord>[] = [
    {
      accessorKey: "userId.name",
      header: "Team Member",
      cell: ({ row }) => {
        const user = row.original.userId
        const name = user?.name || "Unknown Staff"
        const email = user?.email || "No email info"
        const fallbackInitials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 rounded-xl border-2 border-white shadow-sm">
              <AvatarFallback className="rounded-xl bg-zinc-100 text-zinc-950 font-bold text-xs">
                {fallbackInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-bold text-zinc-900 text-sm leading-none mb-1">{name}</span>
              <span className="text-[10px] text-zinc-400 font-bold tracking-tight">{email}</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-zinc-500 font-bold text-xs">
          {format(new Date(row.original.date), "MMM dd, yyyy")}
        </span>
      ),
    },
    {
      accessorKey: "punchInTime",
      header: "Check In",
      cell: ({ row }) => {
        const time = row.original.punchInTime
        if (!time) return <span className="text-zinc-400 font-medium">-</span>
        return (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="font-bold text-zinc-900 text-xs">
              {format(new Date(time), "hh:mm a")}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "punchOutTime",
      header: "Check Out",
      cell: ({ row }) => {
        const time = row.original.punchOutTime
        if (!time) return <span className="text-zinc-400 font-medium">-</span>
        return (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            <span className="font-bold text-zinc-900 text-xs">
              {format(new Date(time), "hh:mm a")}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "totalMinutes",
      header: "Work Hours",
      cell: ({ row }) => {
        const mins = row.original.totalMinutes
        const hours = mins ? `${(mins / 60).toFixed(1)}h` : "0.0h"
        return (
          <div className="px-3 py-1 bg-zinc-50 rounded-lg w-fit border border-zinc-100">
            <span className="font-black text-zinc-900 text-[10px]">{hours}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <Badge className={cn(
            "rounded-lg px-3 py-1 font-black text-[9px] border shadow-sm uppercase tracking-wider",
            status === "Present" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
              status === "Late" ? "bg-amber-50 text-amber-600 border-amber-100" :
                status === "HalfDay" ? "bg-blue-50 text-blue-600 border-blue-100" :
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
    <ContentLayout title={activeTab === "attendance" ? "Attendance Tracker" : "Leave Management"}>
      <div className="flex flex-col gap-8 p-6 sm:p-10 max-w-[1600px] mx-auto min-h-screen">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black text-zinc-900 tracking-tight">
              {activeTab === "attendance" ? "Attendance Tracker" : "Leave Management"}
            </h1>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                {activeTab === "attendance" ? "Live Presence Monitor" : "Time Off Coordinator"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === "attendance" ? (
              <>
                <div className="relative w-64">
                  <Input
                    placeholder="Search member..."
                    className="h-11 rounded-xl bg-white border-zinc-100 pl-10 font-bold shadow-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
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

                <Button
                  onClick={() => setIsMarkModalOpen(true)}
                  className="h-11 px-5 rounded-xl font-bold gap-2 text-white bg-zinc-900 hover:bg-zinc-800 shadow-lg transition-all"
                >
                  Mark Attendance
                </Button>
              </>
            ) : (
              <>
                <div className="relative w-64">
                  <Input
                    placeholder="Search leaves..."
                    className="h-11 rounded-xl bg-white border-zinc-100 pl-10 font-bold shadow-sm"
                    value={leaveSearch}
                    onChange={(e) => setLeaveSearch(e.target.value)}
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300" />
                </div>

                <Select
                  value={leaveStatusFilter || "all"}
                  onValueChange={(val) => {
                    setLeaveStatusFilter(val === "all" ? "" : val)
                  }}
                >
                  <SelectTrigger className="h-11 w-40 rounded-xl bg-white border-zinc-100 font-bold shadow-sm">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-zinc-100 shadow-xl bg-white">
                    <SelectItem value="all" className="font-bold text-xs text-zinc-700 hover:bg-zinc-50 cursor-pointer">
                      All Status
                    </SelectItem>
                    <SelectItem value="Pending" className="font-bold text-xs text-amber-600 hover:bg-zinc-50 cursor-pointer">
                      Pending
                    </SelectItem>
                    <SelectItem value="Approved" className="font-bold text-xs text-emerald-600 hover:bg-zinc-50 cursor-pointer">
                      Approved
                    </SelectItem>
                    <SelectItem value="Rejected" className="font-bold text-xs text-rose-600 hover:bg-zinc-50 cursor-pointer">
                      Rejected
                    </SelectItem>
                    <SelectItem value="Cancelled" className="font-bold text-xs text-zinc-400 hover:bg-zinc-50 cursor-pointer">
                      Cancelled
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={() => setIsLeaveModalOpen(true)}
                  className="h-11 px-5 rounded-xl font-bold gap-2 text-white bg-zinc-900 hover:bg-zinc-800 shadow-lg transition-all"
                >
                  Apply Leave
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1.5 bg-zinc-100/50 backdrop-blur-sm w-fit rounded-[1.25rem] border border-zinc-100">
          <Button
            variant={activeTab === "attendance" ? "white" : "ghost"}
            size="sm"
            className={cn(
              "rounded-xl px-6 h-10 font-bold text-xs transition-all",
              activeTab === "attendance"
                ? "shadow-lg text-primary scale-105 bg-white"
                : "text-zinc-500 hover:text-zinc-900 hover:bg-transparent"
            )}
            onClick={() => handleTabChange("attendance")}
          >
            Attendance Logs
          </Button>
          <Button
            variant={activeTab === "leaves" ? "white" : "ghost"}
            size="sm"
            className={cn(
              "rounded-xl px-6 h-10 font-bold text-xs transition-all",
              activeTab === "leaves"
                ? "shadow-lg text-primary scale-105 bg-white"
                : "text-zinc-500 hover:text-zinc-900 hover:bg-transparent"
            )}
            onClick={() => handleTabChange("leaves")}
          >
            Leave Applications
          </Button>
        </div>

        {activeTab === "attendance" ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
              {[
                { label: "On Time", val: stats.onTime.toString(), icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50/50", statusVal: "Present" },
                { label: "Late Arrivals", val: stats.late.toString(), icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50/50", statusVal: "Late" },
                { label: "Half Day", val: stats.halfDay.toString(), icon: Calendar, color: "text-blue-500", bg: "bg-blue-50/50", statusVal: "HalfDay" },
                { label: "Absent / Off", val: stats.absent.toString(), icon: XCircle, color: "text-rose-500", bg: "bg-rose-50/50", statusVal: "Absent" },
                { label: "Weekly Off", val: stats.weeklyOff.toString(), icon: Coffee, color: "text-sky-500", bg: "bg-sky-50/50", statusVal: "WeeklyOff" },
              ].map((stat, i) => {
                const isActive = selectedStatus === stat.statusVal;
                return (
                  <div
                    key={i}
                    onClick={() => setSelectedStatus(prev => prev === stat.statusVal ? null : stat.statusVal)}
                    className={cn(
                      "bg-white p-6 rounded-[2.5rem] transition-all cursor-pointer overflow-hidden relative flex items-center justify-between group h-28",
                      isActive
                        ? "shadow-md ring-2 ring-zinc-900/10 scale-[1.02]"
                        : "border border-zinc-50 shadow-sm hover:shadow-md hover:scale-[1.01]"
                    )}
                  >
                    <div className="flex flex-col gap-1 z-10">
                      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none">{stat.label}</span>
                      <span className="text-3xl font-black text-zinc-900 tracking-tighter leading-none">{stat.val}</span>
                    </div>
                    <div className={cn("h-12 w-12 rounded-[1.25rem] flex items-center justify-center z-10", stat.bg)}>
                      <stat.icon className={cn("h-5 w-5", stat.color)} strokeWidth={2.5} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Attendance Table */}
            {isLoading ? (
              <div className="text-center py-20 text-zinc-400 font-bold text-xs uppercase tracking-widest animate-pulse">
                Loading Attendance Records...
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={filteredData}
              />
            )}
          </>
        ) : (
          <>
            {/* Leaves Table */}
            {isLeavesLoading ? (
              <div className="text-center py-20 text-zinc-400 font-bold text-xs uppercase tracking-widest animate-pulse">
                Loading Leave Records...
              </div>
            ) : (
              <DataTable
                columns={leaveColumns}
                data={filteredLeavesData}
              />
            )}
          </>
        )}

      </div>

      {/* Manual Mark Attendance Dialog */}
      <Dialog open={isMarkModalOpen} onOpenChange={setIsMarkModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl border-none shadow-2xl bg-white">
          <DialogHeader className="pb-4 border-b border-zinc-100">
            <DialogTitle className="text-2xl font-black">Mark Attendance</DialogTitle>
            <DialogDescription className="font-medium text-zinc-500">
              Manually register or overwrite attendance for a staff member.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleMarkAttendance} className="space-y-5 pt-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase tracking-wider">Select Team Member</label>
              <select
                required
                value={markUserId}
                onChange={(e) => setMarkUserId(e.target.value)}
                className="h-11 w-full rounded-xl border border-zinc-100 bg-white px-3 font-bold text-zinc-900 focus-visible:ring-primary shadow-sm outline-none text-sm cursor-pointer"
              >
                <option value="">-- Choose Member --</option>
                {users.map((u) => (
                  <option key={u._id || u.id} value={u._id || u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-wider">Date</label>
                <Input
                  type="date"
                  required
                  value={markDate}
                  onChange={(e) => setMarkDate(e.target.value)}
                  className="h-11 rounded-xl bg-white border-zinc-100 font-bold text-sm shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-wider">Status</label>
                <select
                  required
                  value={markStatus}
                  onChange={(e) => setMarkStatus(e.target.value)}
                  className="h-11 w-full rounded-xl border border-zinc-100 bg-white px-3 font-bold text-zinc-900 focus-visible:ring-primary shadow-sm outline-none text-sm cursor-pointer"
                >
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="HalfDay">Half Day</option>
                  <option value="Absent">Absent</option>
                  <option value="WeeklyOff">Weekly Off</option>
                </select>
              </div>
            </div>

            {["Present", "Late", "HalfDay"].includes(markStatus) && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-wider">Check In Time</label>
                  <Input
                    type="time"
                    required
                    value={markPunchIn}
                    onChange={(e) => setMarkPunchIn(e.target.value)}
                    className="h-11 rounded-xl bg-white border-zinc-100 font-bold text-sm shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-wider">Check Out Time</label>
                  <Input
                    type="time"
                    required
                    value={markPunchOut}
                    onChange={(e) => setMarkPunchOut(e.target.value)}
                    className="h-11 rounded-xl bg-white border-zinc-100 font-bold text-sm shadow-sm"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase tracking-wider">Note (Optional)</label>
              <Input
                placeholder="Add notes..."
                value={markNote}
                onChange={(e) => setMarkNote(e.target.value)}
                className="h-11 rounded-xl bg-white border-zinc-100 font-bold text-sm shadow-sm"
              />
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-zinc-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsMarkModalOpen(false)}
                className="h-11 px-6 rounded-xl font-bold text-zinc-500 border-zinc-100"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 px-6 rounded-xl font-bold text-white bg-zinc-900 hover:bg-zinc-800 shadow-md"
              >
                {isSubmitting ? "Marking..." : "Submit"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manual Record Leave Dialog */}
      <Dialog open={isLeaveModalOpen} onOpenChange={setIsLeaveModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl border-none shadow-2xl bg-white animate-in fade-in zoom-in-95 duration-200">
          <DialogHeader className="pb-4 border-b border-zinc-100">
            <DialogTitle className="text-2xl font-black">Record Leave</DialogTitle>
            <DialogDescription className="font-medium text-zinc-500">
              Apply or manually record a leave request for a staff member.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateLeave} className="space-y-5 pt-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase tracking-wider">Select Team Member</label>
              <select
                required
                value={leaveUserId}
                onChange={(e) => setLeaveUserId(e.target.value)}
                className="h-11 w-full rounded-xl border border-zinc-100 bg-white px-3 font-bold text-zinc-900 focus-visible:ring-primary shadow-sm outline-none text-sm cursor-pointer"
              >
                <option value="">-- Choose Member --</option>
                {users.map((u) => (
                  <option key={u._id || u.id} value={u._id || u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-wider">Leave Type</label>
                <select
                  required
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="h-11 w-full rounded-xl border border-zinc-100 bg-white px-3 font-bold text-zinc-900 focus-visible:ring-primary shadow-sm outline-none text-sm cursor-pointer"
                >
                  <option value="Casual">Casual</option>
                  <option value="Sick">Sick</option>
                  <option value="Paid">Paid</option>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-wider">Status</label>
                <select
                  required
                  value={leaveStatus}
                  onChange={(e) => setLeaveStatus(e.target.value)}
                  className="h-11 w-full rounded-xl border border-zinc-100 bg-white px-3 font-bold text-zinc-900 focus-visible:ring-primary shadow-sm outline-none text-sm cursor-pointer"
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-wider">Start Date</label>
                <Input
                  type="date"
                  required
                  value={leaveStartDate}
                  onChange={(e) => setLeaveStartDate(e.target.value)}
                  className="h-11 rounded-xl bg-white border-zinc-100 font-bold text-sm shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-wider">End Date</label>
                <Input
                  type="date"
                  required
                  value={leaveEndDate}
                  onChange={(e) => setLeaveEndDate(e.target.value)}
                  className="h-11 rounded-xl bg-white border-zinc-100 font-bold text-sm shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase tracking-wider">Reason</label>
              <Input
                required
                placeholder="Reason for leave..."
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                className="h-11 rounded-xl bg-white border-zinc-100 font-bold text-sm shadow-sm"
              />
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-zinc-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsLeaveModalOpen(false)}
                className="h-11 px-6 rounded-xl font-bold text-zinc-500 border-zinc-100"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLeaveSubmitting}
                className="h-11 px-6 rounded-xl font-bold text-white bg-zinc-900 hover:bg-zinc-800 shadow-md"
              >
                {isLeaveSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </ContentLayout>
  )
}
