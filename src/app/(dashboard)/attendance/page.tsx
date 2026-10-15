"use client"

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
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
  Palmtree,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Download,
  Building2,
  Phone,
  Mail,
  FileSpreadsheet
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
import {
  format,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isWeekend,
  addMonths,
  subMonths
} from "date-fns"
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
  const [fromDate, setFromDate] = useState<Date | undefined>(startOfMonth(new Date()))
  const [toDate, setToDate] = useState<Date | undefined>(endOfMonth(new Date()))
  const [search, setSearch] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null)
  const [leaveCount, setLeaveCount] = useState(0)
  const attendanceUsersRef = useRef<Map<string, string>>(new Map())

  // Active Tab: "attendance" or "leaves"
  const [activeTab, setActiveTab] = useState<"attendance" | "leaves">("attendance")
  // View mode: "matrix" (Month-wise employee sheet) vs "list" (Log records table)
  const [viewMode, setViewMode] = useState<"matrix" | "list">("matrix")
  // Selected Month for Attendance Sheet (defaults to current month)
  const [selectedMonth, setSelectedMonth] = useState<Date>(startOfMonth(new Date()))

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

  // Fetch users on component mount so employee roster is available for Month Matrix
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await userService.getUsers({ limit: 500 })
        const usersList = Array.isArray(response) ? response : (response?.data || [])
        setUsers(usersList)
      } catch (err: any) {
        console.error("Failed to load users list", err)
      }
    }
    fetchUsers()
  }, [])

  // When in Month Matrix mode, auto sync fromDate and toDate to month start and end
  const handleSelectMonth = (newMonth: Date) => {
    const m = startOfMonth(newMonth)
    setSelectedMonth(m)
    setFromDate(m)
    setToDate(endOfMonth(m))
  }

  // Fetch Attendance Records
  const fetchAttendances = useCallback(async () => {
    setIsLoading(true)
    try {
      const params: any = {
        limit: 1000,
      }

      if (fromDate) {
        params.startDate = format(fromDate, "yyyy-MM-dd")
      }
      if (toDate) {
        params.endDate = format(toDate, "yyyy-MM-dd")
      }
      if (search.trim()) {
        params.search = search.trim()
        const query = search.trim().toLowerCase()
        const matchedUser = Array.from(attendanceUsersRef.current.entries()).find(
          ([label]) => label.includes(query)
        )
        if (matchedUser) params.userId = matchedUser[1]
      }

      const response = await attendanceService.getAttendance(params)
      const records = response.data || response || []
      records.forEach((record: AttendanceRecord) => {
        if (!record.userId?._id) return
        const name = record.userId.name?.toLowerCase() || ""
        const email = record.userId.email?.toLowerCase() || ""
        if (name) attendanceUsersRef.current.set(name, record.userId._id)
        if (email) attendanceUsersRef.current.set(email, record.userId._id)
      })
      setData(records)
      setAttendanceSummary(response.summary || null)
      setLeaveCount(Number(response.leaveCount || 0))
    } catch (err: any) {
      toast.error("Failed to fetch attendance data")
    } finally {
      setIsLoading(false)
    }
  }, [fromDate, toDate, search])

  useEffect(() => {
    const paramsKey = `${fromDate?.getTime() || ""}-${toDate?.getTime() || ""}-${search.trim()}`
    if (lastFetchedParams.current !== paramsKey) {
      lastFetchedParams.current = paramsKey
      fetchAttendances()
    }
  }, [fromDate, toDate, fetchAttendances])

  // Client side search mapping
  const filteredData = useMemo(() => {
    let result = data;
    
    if (selectedStatus) {
      result = result.filter(item => item.status === selectedStatus);
    }

    if (search) {
      const query = search.toLowerCase()
      result = result.filter(
        (item) =>
          item.userId?.name?.toLowerCase().includes(query) ||
          item.userId?.email?.toLowerCase().includes(query)
      )
    }

    return result;
  }, [data, search, selectedStatus])

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

    let relevantData = data;
    if (search) {
      const query = search.toLowerCase()
      relevantData = relevantData.filter(
        (item) =>
          item.userId?.name?.toLowerCase().includes(query) ||
          item.userId?.email?.toLowerCase().includes(query)
      )
    }

    relevantData.forEach((record) => {
      if (record.status === "Present") onTime++
      else if (record.status === "Late") late++
      else if (record.status === "HalfDay") halfDay++
      else if (record.status === "Absent") absent++
      else if (record.status === "WeeklyOff") weeklyOff++
    })

    const leaveDays = Number(attendanceSummary?.totalLeaveDays ?? leaveCount ?? 0)
    return { onTime, late, halfDay, absent, weeklyOff, leaveDays }
  }, [data, search, attendanceSummary, leaveCount])

  // Days of currently selected month
  const monthDays = useMemo(() => {
    const start = startOfMonth(selectedMonth)
    const end = endOfMonth(selectedMonth)
    return eachDayOfInterval({ start, end })
  }, [selectedMonth])

  // Build Month-wise Employee Matrix Data
  const monthMatrixData = useMemo(() => {
    // Collect all distinct staff from either users table or attendance records
    const employeeMap = new Map<string, {
      userId: string
      name: string
      email: string
      mobile?: string
      dept?: string
      role?: string
      recordsByDay: Record<string, AttendanceRecord>
      totalPresent: number
      totalLate: number
      totalHalfDay: number
      totalAbsent: number
      totalWeeklyOff: number
    }>()

    // 1. Populate registered active users
    users.forEach((u) => {
      const id = String(u._id || u.id || "")
      if (!id) return
      const roleName = typeof u.roleId === "object" && u.roleId?.name ? u.roleId.name : "Staff"
      const deptName = u.primaryNodeId && typeof u.primaryNodeId === "object" ? u.primaryNodeId.name : "Dept1"
      employeeMap.set(id, {
        userId: id,
        name: u.name || "Staff Member",
        email: u.email || "",
        mobile: u.mobile || "",
        dept: deptName,
        role: roleName,
        recordsByDay: {},
        totalPresent: 0,
        totalLate: 0,
        totalHalfDay: 0,
        totalAbsent: 0,
        totalWeeklyOff: 0
      })
    })

    // 2. Also incorporate any users appearing in attendance data but not in users list
    data.forEach((rec) => {
      const uId = String(rec.userId?._id || "")
      if (!uId) return
      if (!employeeMap.has(uId)) {
        employeeMap.set(uId, {
          userId: uId,
          name: rec.userId?.name || "Staff Member",
          email: rec.userId?.email || "",
          mobile: rec.userId?.mobile || "",
          dept: "Dept1",
          role: "Staff",
          recordsByDay: {},
          totalPresent: 0,
          totalLate: 0,
          totalHalfDay: 0,
          totalAbsent: 0,
          totalWeeklyOff: 0
        })
      }
    })

    // 3. Map attendance records onto each day
    data.forEach((rec) => {
      const uId = String(rec.userId?._id || "")
      if (!uId || !employeeMap.has(uId)) return
      const emp = employeeMap.get(uId)!
      const dayKey = format(new Date(rec.date), "yyyy-MM-dd")
      emp.recordsByDay[dayKey] = rec

      if (rec.status === "Present") emp.totalPresent++
      else if (rec.status === "Late") emp.totalLate++
      else if (rec.status === "HalfDay") emp.totalHalfDay++
      else if (rec.status === "Absent") emp.totalAbsent++
      else if (rec.status === "WeeklyOff") emp.totalWeeklyOff++
    })

    let list = Array.from(employeeMap.values())

    // Filter by search query
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((emp) =>
        emp.name.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        (emp.mobile && emp.mobile.includes(q))
      )
    }

    return list
  }, [users, data, search])

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

          <div className="flex flex-wrap items-center gap-3">
            {activeTab === "attendance" ? (
              <>
                {/* Search Member */}
                <div className="relative w-56 sm:w-64">
                  <Input
                    placeholder="Search member, phone..."
                    className="h-11 rounded-xl bg-white border-zinc-200/70 pl-10 font-bold shadow-sm text-xs"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                </div>

                {/* View Mode Toggle: Month Matrix vs List Logs */}
                <div className="flex items-center p-1 bg-zinc-100 rounded-xl border border-zinc-200/80 shadow-inner">
                  <Button
                    type="button"
                    variant={viewMode === "matrix" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("matrix")}
                    className={cn(
                      "h-9 px-3 rounded-lg text-xs font-bold gap-1.5 transition-all",
                      viewMode === "matrix"
                        ? "bg-[#006d64] text-white shadow-sm hover:bg-[#005a52]"
                        : "text-zinc-600 hover:text-zinc-900 hover:bg-white/60"
                    )}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    <span>Month Sheet</span>
                  </Button>
                  <Button
                    type="button"
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "h-9 px-3 rounded-lg text-xs font-bold gap-1.5 transition-all",
                      viewMode === "list"
                        ? "bg-[#006d64] text-white shadow-sm hover:bg-[#005a52]"
                        : "text-zinc-600 hover:text-zinc-900 hover:bg-white/60"
                    )}
                  >
                    <List className="h-3.5 w-3.5" />
                    <span>List View</span>
                  </Button>
                </div>

                {viewMode === "matrix" ? (
                  /* Month Navigator */
                  <div className="flex items-center gap-1 bg-white border border-zinc-200/80 rounded-xl p-1 shadow-sm">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-lg hover:bg-zinc-100 text-zinc-700"
                      onClick={() => handleSelectMonth(subMonths(selectedMonth, 1))}
                      title="Previous Month"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="px-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#006d64]" />
                      <span className="text-xs font-black text-zinc-900 uppercase tracking-wider whitespace-nowrap">
                        {format(selectedMonth, "MMMM yyyy")}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-lg hover:bg-zinc-100 text-zinc-700"
                      onClick={() => handleSelectMonth(addMonths(selectedMonth, 1))}
                      title="Next Month"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  /* Range Pickers for List Mode */
                  <>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "h-11 px-4 rounded-xl border-zinc-200/80 font-bold gap-2 hover:bg-zinc-50 shadow-sm",
                            !fromDate ? "text-zinc-400" : "text-zinc-700"
                          )}
                        >
                          <Calendar className="h-4 w-4 text-zinc-400" />
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-zinc-400 font-medium">From:</span>
                            <span>{fromDate ? format(fromDate, "MMM dd, yyyy") : "Select"}</span>
                          </div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-2xl border-zinc-100 shadow-2xl" align="end">
                        <CalendarComponent
                          mode="single"
                          selected={fromDate}
                          onSelect={setFromDate}
                          initialFocus
                          className="rounded-2xl"
                        />
                      </PopoverContent>
                    </Popover>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "h-11 px-4 rounded-xl border-zinc-200/80 font-bold gap-2 hover:bg-zinc-50 shadow-sm",
                            !toDate ? "text-zinc-400" : "text-zinc-700"
                          )}
                        >
                          <Calendar className="h-4 w-4 text-zinc-400" />
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-zinc-400 font-medium">End:</span>
                            <span>{toDate ? format(toDate, "MMM dd, yyyy") : "Select"}</span>
                          </div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-2xl border-zinc-100 shadow-2xl" align="end">
                        <CalendarComponent
                          mode="single"
                          selected={toDate}
                          onSelect={setToDate}
                          initialFocus
                          className="rounded-2xl"
                        />
                      </PopoverContent>
                    </Popover>
                  </>
                )}

                <Button
                  onClick={() => setIsMarkModalOpen(true)}
                  className="h-11 px-5 rounded-xl font-bold gap-2 text-white bg-[#006d64] hover:bg-[#005a52] shadow-md transition-all text-xs"
                >
                  <Plus className="h-4 w-4" />
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
                { label: "Leave Days", val: stats.leaveDays.toString(), icon: Palmtree, color: "text-sky-500", bg: "bg-sky-50/50", statusVal: null },
              ].map((stat, i) => {
                const isActive = Boolean(stat.statusVal && selectedStatus === stat.statusVal);
                return (
                  <div
                    key={i}
                    onClick={() => stat.statusVal && setSelectedStatus(prev => prev === stat.statusVal ? null : stat.statusVal)}
                    className={cn(
                      "bg-white p-6 rounded-[2.5rem] transition-all overflow-hidden relative flex items-center justify-between group h-28",
                      stat.statusVal && "cursor-pointer",
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

            {/* Attendance Content: Matrix vs List */}
            {isLoading ? (
              <div className="text-center py-24 bg-white rounded-2xl border border-zinc-200/80 shadow-sm flex flex-col items-center justify-center gap-3">
                <div className="h-8 w-8 rounded-full border-4 border-[#006d64] border-t-transparent animate-spin" />
                <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest">
                  Loading Attendance Records...
                </p>
              </div>
            ) : viewMode === "matrix" ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
                {/* Sheet Title Bar / Legend */}
                <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-teal-300 backdrop-blur-sm border border-white/10">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-sm uppercase tracking-wider text-white">
                          List of Attendance Logs
                        </h3>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30">
                          {format(selectedMonth, "MMMM yyyy")}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-medium">
                        Period: {format(startOfMonth(selectedMonth), "yyyy/MM/01")} ~ {format(endOfMonth(selectedMonth), "yyyy/MM/dd")} • {monthMatrixData.length} Staff Enrolled
                      </p>
                    </div>
                  </div>

                  {/* Status Badges Legend */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                    <span className="text-slate-400 text-[10px] uppercase tracking-wider mr-1">Legend:</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" /> Present (P)
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300">
                      <span className="h-2 w-2 rounded-full bg-amber-400" /> Late (L)
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300">
                      <span className="h-2 w-2 rounded-full bg-blue-400" /> Half Day (HD)
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300">
                      <span className="h-2 w-2 rounded-full bg-rose-400" /> Absent (A)
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                      <span className="h-2 w-2 rounded-full bg-indigo-400" /> Off (WO)
                    </span>
                  </div>
                </div>

                {/* Horizontal Scrollable Spreadsheet Table */}
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-300 scrollbar-track-zinc-100 max-h-[720px]">
                  <table className="w-full text-xs border-collapse">
                    <thead className="sticky top-0 z-20 bg-slate-100 shadow-sm text-slate-700">
                      <tr className="border-b border-slate-300 text-[11px] font-black uppercase tracking-wider">
                        <th className="sticky left-0 z-30 bg-slate-100 px-4 py-3 text-left w-64 min-w-[260px] border-r border-slate-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                          Employee / Department
                        </th>
                        {monthDays.map((day) => {
                          const isSun = isWeekend(day);
                          return (
                            <th
                              key={day.toISOString()}
                              className={cn(
                                "py-2 px-1 text-center w-12 min-w-[48px] max-w-[52px] border-r border-slate-200",
                                isSun ? "bg-rose-50/70 text-rose-700 font-black" : "bg-slate-100 text-slate-700"
                              )}
                            >
                              <div className="flex flex-col items-center leading-none">
                                <span className="text-[9px] font-extrabold uppercase text-slate-400">
                                  {format(day, "EE")[0]}
                                </span>
                                <span className="text-xs font-black mt-0.5">
                                  {format(day, "d")}
                                </span>
                              </div>
                            </th>
                          );
                        })}
                        <th className="px-3 py-3 text-center bg-emerald-50 text-emerald-800 font-black min-w-[60px] border-r border-slate-300">
                          P
                        </th>
                        <th className="px-3 py-3 text-center bg-amber-50 text-amber-800 font-black min-w-[60px] border-r border-slate-300">
                          L
                        </th>
                        <th className="px-3 py-3 text-center bg-blue-50 text-blue-800 font-black min-w-[60px] border-r border-slate-300">
                          HD
                        </th>
                        <th className="px-3 py-3 text-center bg-rose-50 text-rose-800 font-black min-w-[60px] border-r border-slate-300">
                          A
                        </th>
                        <th className="px-3 py-3 text-center bg-indigo-50 text-indigo-800 font-black min-w-[60px]">
                          WO
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {monthMatrixData.length === 0 ? (
                        <tr>
                          <td
                            colSpan={monthDays.length + 6}
                            className="py-16 text-center text-zinc-400 font-bold text-sm"
                          >
                            No employees or attendance logs found for this period.
                          </td>
                        </tr>
                      ) : (
                        monthMatrixData.map((emp, empIdx) => {
                          const fallbackInitials = emp.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2);

                          return (
                            <React.Fragment key={emp.userId || empIdx}>
                              {/* Primary Employee Info Banner Row (Blue/Teal Bar matching Excel log header) */}
                              <tr className="bg-sky-700 text-white font-bold text-xs hover:bg-sky-800 transition-colors">
                                <td
                                  colSpan={monthDays.length + 6}
                                  className="px-4 py-2 border-b border-sky-800"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                      <span className="bg-sky-900/60 px-2.5 py-0.5 rounded text-[11px] font-mono tracking-wider text-sky-200 border border-sky-600/40">
                                        No: {emp.mobile || emp.userId.slice(-8).toUpperCase()}
                                      </span>
                                      <span className="text-sm font-black tracking-wide text-white uppercase">
                                        Name: {emp.name}
                                      </span>
                                      <span className="text-xs font-semibold text-sky-200">
                                        Dept: {emp.dept || "Dept1"}
                                      </span>
                                      <span className="text-[11px] font-medium text-sky-300 bg-sky-900/40 px-2 py-0.5 rounded">
                                        Role: {emp.role || "Staff"}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] font-mono text-sky-200 pr-2">
                                      <span>Attendance: {emp.totalPresent + emp.totalLate + emp.totalHalfDay} Days</span>
                                    </div>
                                  </div>
                                </td>
                              </tr>

                              {/* Matrix Check In / Check Out Data Row */}
                              <tr className="hover:bg-slate-50/70 transition-colors group">
                                {/* Fixed Left Column: Employee Card */}
                                <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50/90 px-4 py-2.5 border-r border-slate-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                                  <div className="flex items-center gap-2.5">
                                    <Avatar className="h-8 w-8 rounded-lg border border-slate-200 shrink-0">
                                      <AvatarFallback className="rounded-lg bg-teal-50 text-teal-800 font-black text-xs">
                                        {fallbackInitials}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col min-w-0">
                                      <span className="font-extrabold text-slate-900 text-xs truncate" title={emp.name}>
                                        {emp.name}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-medium truncate" title={emp.email}>
                                        {emp.mobile || emp.email || "No contact"}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                {/* Day Cells 1..31 */}
                                {monthDays.map((day) => {
                                  const dayKey = format(day, "yyyy-MM-dd");
                                  const record = emp.recordsByDay[dayKey];
                                  const isSun = isWeekend(day);

                                  if (!record) {
                                    return (
                                      <td
                                        key={dayKey}
                                        className={cn(
                                          "p-1 text-center border-r border-slate-200 align-middle",
                                          isSun ? "bg-slate-50/80 text-slate-300 font-bold" : "bg-white"
                                        )}
                                      >
                                        {isSun ? (
                                          <span className="text-[9px] font-bold text-slate-300">OFF</span>
                                        ) : (
                                          <span className="text-slate-200 font-bold text-xs">—</span>
                                        )}
                                      </td>
                                    );
                                  }

                                  const punchInFormatted = record.punchInTime
                                    ? format(new Date(record.punchInTime), "HH:mm")
                                    : "";
                                  const punchOutFormatted = record.punchOutTime
                                    ? format(new Date(record.punchOutTime), "HH:mm")
                                    : "";

                                  // Status styling
                                  let cellTheme = "bg-white text-slate-700";
                                  let badgeTheme = "bg-emerald-50 text-emerald-700 border-emerald-200";

                                  if (record.status === "Present") {
                                    cellTheme = "bg-emerald-50/30 text-emerald-900";
                                    badgeTheme = "bg-emerald-100 text-emerald-800 border-emerald-300";
                                  } else if (record.status === "Late") {
                                    cellTheme = "bg-amber-50/40 text-amber-900";
                                    badgeTheme = "bg-amber-100 text-amber-800 border-amber-300";
                                  } else if (record.status === "HalfDay") {
                                    cellTheme = "bg-blue-50/40 text-blue-900";
                                    badgeTheme = "bg-blue-100 text-blue-800 border-blue-300";
                                  } else if (record.status === "Absent") {
                                    cellTheme = "bg-rose-50/40 text-rose-900";
                                    badgeTheme = "bg-rose-100 text-rose-800 border-rose-300";
                                  } else if (record.status === "WeeklyOff") {
                                    cellTheme = "bg-indigo-50/30 text-indigo-900";
                                    badgeTheme = "bg-indigo-100 text-indigo-800 border-indigo-300";
                                  }

                                  return (
                                    <td
                                      key={dayKey}
                                      className={cn(
                                        "p-1 text-center border-r border-slate-200 align-middle transition-colors",
                                        cellTheme
                                      )}
                                      title={`${emp.name} on ${dayKey}: ${record.status} ${punchInFormatted ? `(${punchInFormatted} - ${punchOutFormatted || "..."})` : ""}`}
                                    >
                                      <div className="flex flex-col items-center justify-center gap-0.5 leading-none py-1">
                                        <span className={cn(
                                          "px-1 py-0.5 rounded text-[8px] font-black uppercase border tracking-tight",
                                          badgeTheme
                                        )}>
                                          {record.status === "Present" ? "P" :
                                            record.status === "Late" ? "L" :
                                              record.status === "HalfDay" ? "HD" :
                                                record.status === "Absent" ? "A" : "WO"}
                                        </span>
                                        {punchInFormatted ? (
                                          <span className="text-[9px] font-mono font-bold text-slate-800 tracking-tight">
                                            {punchInFormatted}
                                          </span>
                                        ) : null}
                                        {punchOutFormatted ? (
                                          <span className="text-[8px] font-mono text-slate-500 tracking-tight">
                                            {punchOutFormatted}
                                          </span>
                                        ) : null}
                                      </div>
                                    </td>
                                  );
                                })}

                                {/* Monthly Totals for this Employee */}
                                <td className="p-2 text-center bg-emerald-50/60 font-black text-emerald-700 border-r border-slate-300 text-xs">
                                  {emp.totalPresent}
                                </td>
                                <td className="p-2 text-center bg-amber-50/60 font-black text-amber-700 border-r border-slate-300 text-xs">
                                  {emp.totalLate}
                                </td>
                                <td className="p-2 text-center bg-blue-50/60 font-black text-blue-700 border-r border-slate-300 text-xs">
                                  {emp.totalHalfDay}
                                </td>
                                <td className="p-2 text-center bg-rose-50/60 font-black text-rose-700 border-r border-slate-300 text-xs">
                                  {emp.totalAbsent}
                                </td>
                                <td className="p-2 text-center bg-indigo-50/60 font-black text-indigo-700 text-xs">
                                  {emp.totalWeeklyOff}
                                </td>
                              </tr>
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Spreadsheet Footer Stats */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs font-bold text-slate-600 gap-2">
                  <span>
                    Showing {monthMatrixData.length} team members • {monthDays.length} days in {format(selectedMonth, "MMMM yyyy")}
                  </span>
                  <div className="flex items-center gap-4 text-[11px]">
                    <span className="text-emerald-700">Total Present: {monthMatrixData.reduce((acc, e) => acc + e.totalPresent, 0)}</span>
                    <span className="text-amber-700">Late: {monthMatrixData.reduce((acc, e) => acc + e.totalLate, 0)}</span>
                    <span className="text-blue-700">Half Day: {monthMatrixData.reduce((acc, e) => acc + e.totalHalfDay, 0)}</span>
                    <span className="text-rose-700">Absent: {monthMatrixData.reduce((acc, e) => acc + e.totalAbsent, 0)}</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Fallback to Standard DataTable Logs List */
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
