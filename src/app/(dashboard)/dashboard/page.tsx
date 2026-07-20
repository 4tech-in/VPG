"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { purchaseOrderService } from "@/service/purchaseOrderService";
import { dashboardService, type DashboardStats } from "@/service/dashboardService";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { 
  Users, 
  Search, 
  Bell, 
  Globe, 
  Plus,
  ClipboardCheck,
  ArrowUpRight,
  UserCheck,
  UserX,
  CalendarDays,
  ClipboardList,
  FileText,
  ShoppingCart,
  Package,
  Wrench,
  ArrowDownRight,
  Check
} from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const [dateFilter, setDateFilter] = useState("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  useEffect(() => {
    purchaseOrderService.getPendingVerifications()
      .then(res => setPendingCount(res.total || 0))
      .catch(console.error);
  }, []);

  const fetchStats = () => {
    setIsLoadingStats(true);
    dashboardService.getDashboardStats(
      undefined,
      dateFilter,
      customStart,
      customEnd
    )
      .then(res => {
        setStats(res);
      })
      .catch(console.error)
      .finally(() => setIsLoadingStats(false));
  };

  useEffect(() => {
    if (dateFilter !== "custom" || (customStart && customEnd)) {
      fetchStats();
    }
  }, [dateFilter, customStart, customEnd]);

  return (
    <ContentLayout title="Dashboard">
      <div className="flex flex-col gap-6 p-4 md:p-8 pt-2">
        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Dashboard</h1>
            <div className="flex items-center gap-2 mt-2">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="text-xs border border-zinc-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Date</option>
              </select>
              {dateFilter === "custom" && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="text-xs border border-zinc-200 rounded-lg px-2 py-1.5 focus:outline-none"
                  />
                  <span className="text-zinc-400 text-xs">to</span>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="text-xs border border-zinc-200 rounded-lg px-2 py-1.5 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Type here to search anything" 
                className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 bg-muted rounded text-[10px] font-medium text-muted-foreground">
                ⌘F
              </div>
            </div>
            
            
            
            
          </div>
        </div>

        {/* Action Alerts */}
        {pendingCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-orange-500 rounded-2xl p-6 text-white shadow-lg shadow-orange-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer hover:bg-orange-600 transition-colors"
            onClick={() => router.push("/purchase-order/pending-verification")}
          >
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <ClipboardCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Action Required: Pending Verifications</h3>
                <p className="text-orange-100 font-medium text-sm">
                  You have {pendingCount} goods receipt{pendingCount !== 1 && "s"} waiting for your approval. Stock cannot be updated until these are verified.
                </p>
              </div>
            </div>
            <Button className="bg-white text-orange-600 hover:bg-orange-50 font-bold whitespace-nowrap">
              Review Now <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { 
              title: "Present", 
              value: isLoadingStats ? "..." : (stats?.presentEmployees || 0).toString(), 
              icon: UserCheck, 
              sub: isLoadingStats ? "Loading..." : `${stats?.totalEmployees ? Math.round(((stats?.presentEmployees || 0) / stats.totalEmployees) * 100) : 0}% of Total`, 
              color: "text-emerald-500", 
              bg: "bg-emerald-50",
              graphColor: "text-emerald-500",
              points: "0,15 10,25 20,10 30,15 40,5 50,15 60,0"
            },
            { 
              title: "Absent", 
              value: isLoadingStats ? "..." : (stats?.absentEmployees || 0).toString(), 
              icon: UserX, 
              sub: isLoadingStats ? "Loading..." : `${stats?.totalEmployees ? Math.round(((stats?.absentEmployees || 0) / stats.totalEmployees) * 100) : 0}% of Total`, 
              color: "text-rose-500", 
              bg: "bg-rose-50",
              graphColor: "text-rose-500",
              points: "0,25 10,20 20,30 30,15 40,25 50,10 60,20"
            },
            { 
              title: "On Leave", 
              value: isLoadingStats ? "..." : (stats?.employeesOnLeave || 0).toString(), 
              icon: CalendarDays, 
              sub: isLoadingStats ? "Loading..." : `${stats?.totalEmployees ? Math.round(((stats?.employeesOnLeave || 0) / stats.totalEmployees) * 100) : 0}% of Total`, 
              color: "text-amber-500", 
              bg: "bg-amber-50",
              graphColor: "text-amber-500",
              points: "0,20 10,15 20,25 30,10 40,20 50,5 60,15"
            },
            { 
              title: "Total Employees", 
              value: isLoadingStats ? "..." : (stats?.totalEmployees || 0).toString(), 
              icon: Users, 
              sub: "Active Users", 
              color: "text-blue-500", 
              bg: "bg-blue-50",
              graphColor: "text-blue-500",
              points: "0,25 10,20 20,22 30,15 40,18 50,5 60,10"
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="border border-zinc-100 shadow-sm rounded-2xl overflow-hidden bg-white">
                <CardContent className="p-5 flex flex-col justify-between h-full">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2.5 rounded-full flex items-center justify-center", stat.bg, stat.color)}>
                        <stat.icon className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-zinc-900">{stat.title}</span>
                        <span className={cn("text-3xl font-black mt-1", stat.color)}>{stat.value}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-end justify-between mt-4 gap-2">
                    <span className="text-[11px] font-bold text-zinc-500">{stat.sub}</span>
                    <svg viewBox="0 0 60 30" className="w-16 h-8 overflow-visible">
                      <polyline
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={stat.points}
                        className={stat.graphColor}
                      />
                    </svg>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

 {/* Bottom Section: Assets & Attendance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Absent Employees Table */}
          <Card className="lg:col-span-2 border border-zinc-100 shadow-sm rounded-2xl bg-white overflow-hidden flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-zinc-50/50">
              <div className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-rose-500" />
                <CardTitle className="text-sm font-black text-zinc-800">Absent Employees Today</CardTitle>
              </div>
              <Button variant="link" className="text-rose-600 font-bold text-xs p-0 h-auto">View All</Button>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <div className="overflow-x-auto h-full max-h-[350px]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-zinc-50/90 backdrop-blur-sm">
                    <tr className="border-b border-zinc-100 text-[11px] uppercase tracking-wider text-zinc-500 font-bold">
                      <th className="text-left py-3 px-6 font-semibold">Employee Name</th>
                      <th className="text-left py-3 px-6 font-semibold">Email Address</th>
                      <th className="text-left py-3 px-6 font-semibold">Mobile Number</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {stats?.absentList && stats.absentList.length > 0 ? (
                      stats.absentList.map((emp, i) => (
                        <tr key={emp._id || i} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="py-3 px-6">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs">
                                {emp.name?.charAt(0).toUpperCase() || "U"}
                              </div>
                              <span className="font-bold text-xs text-zinc-800">{emp.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-6 text-xs text-zinc-600 font-medium">
                            {emp.email || "-"}
                          </td>
                          <td className="py-3 px-6 text-xs text-zinc-600 font-medium">
                            {emp.mobile || "-"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-8 text-center">
                          <div className="flex flex-col items-center justify-center text-zinc-400">
                            <Check className="h-8 w-8 text-emerald-400 mb-2" />
                            <span className="text-sm font-bold text-zinc-500">Everyone is present today!</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Overview Donut Chart */}
          <Card className="border border-zinc-100 shadow-sm rounded-2xl bg-white flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between py-4 pb-0">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-sm font-black text-zinc-800">Attendance Overview</CardTitle>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold rounded-lg px-2">This Week <ArrowDownRight className="h-3 w-3 ml-1" /></Button>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-6 flex-1">
              <div className="flex w-full items-center justify-between gap-6">
                
                {/* SVG Donut Chart */}
                <div className="relative h-40 w-40 flex items-center justify-center flex-shrink-0">
                  <svg className="w-40 h-40 transform -rotate-90">
                    <circle cx="80" cy="80" r="60" fill="transparent" stroke="currentColor" strokeWidth="20" className="text-zinc-50" />
                    
                    {(() => {
                      const t = stats?.totalEmployees || 1; // avoid div by 0
                      const p = stats?.presentEmployees || 0;
                      const a = stats?.absentEmployees || 0;
                      const l = stats?.employeesOnLeave || 0;

                      // Calculate percentages (0 to 1)
                      const pPct = p / t;
                      const aPct = a / t;
                      const lPct = l / t;

                      // Stroke dash array circumference for r=60 is ~376.99
                      const circ = 376.99;
                      
                      return (
                        <>
                          {/* Absent (Red) */}
                          {aPct > 0 && (
                            <circle 
                              cx="80" cy="80" r="60" fill="transparent" stroke="currentColor" strokeWidth="20" 
                              strokeDasharray={circ} 
                              strokeDashoffset={circ * (1 - aPct)}
                              className="text-rose-500" 
                            />
                          )}
                          
                          {/* On Leave (Yellow) */}
                          {lPct > 0 && (
                            <circle 
                              cx="80" cy="80" r="60" fill="transparent" stroke="currentColor" strokeWidth="20" 
                              strokeDasharray={circ} 
                              strokeDashoffset={circ * (1 - lPct)}
                              className="text-amber-400" 
                              style={{ transformOrigin: "80px 80px", transform: `rotate(${aPct * 360}deg)` }}
                            />
                          )}
                          
                          {/* Present (Green) */}
                          {pPct > 0 && (
                            <circle 
                              cx="80" cy="80" r="60" fill="transparent" stroke="currentColor" strokeWidth="20" 
                              strokeDasharray={circ} 
                              strokeDashoffset={circ * (1 - pPct)}
                              className="text-emerald-500" 
                              style={{ transformOrigin: "80px 80px", transform: `rotate(${(aPct + lPct) * 360}deg)` }}
                            />
                          )}

                          {/* Gaps (only render if there's data to separate) */}
                          <circle cx="80" cy="80" r="60" fill="transparent" stroke="white" strokeWidth="22" strokeDasharray="3 373.99" strokeDashoffset="0" />
                          {lPct > 0 && (
                            <circle cx="80" cy="80" r="60" fill="transparent" stroke="white" strokeWidth="22" strokeDasharray="3 373.99" strokeDashoffset={-circ * aPct} />
                          )}
                          {pPct > 0 && (
                            <circle cx="80" cy="80" r="60" fill="transparent" stroke="white" strokeWidth="22" strokeDasharray="3 373.99" strokeDashoffset={-circ * (aPct + lPct)} />
                          )}
                        </>
                      )
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black text-zinc-900 leading-none">{stats?.totalEmployees || 0}</span>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Total</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-col gap-4 flex-1">
                  {[
                    { label: "Present", value: stats?.presentEmployees || 0, pct: stats?.totalEmployees ? `(${Math.round(((stats.presentEmployees || 0) / stats.totalEmployees) * 100)}%)` : "(0%)", color: "bg-emerald-500" },
                    { label: "Absent", value: stats?.absentEmployees || 0, pct: stats?.totalEmployees ? `(${Math.round(((stats.absentEmployees || 0) / stats.totalEmployees) * 100)}%)` : "(0%)", color: "bg-rose-500" },
                    { label: "On Leave", value: stats?.employeesOnLeave || 0, pct: stats?.totalEmployees ? `(${Math.round(((stats.employeesOnLeave || 0) / stats.totalEmployees) * 100)}%)` : "(0%)", color: "bg-amber-400" },
                  ].map(leg => (
                    <div key={leg.label} className="flex flex-col gap-1 w-full">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <span className={cn("w-2 h-2 rounded-full shadow-sm", leg.color)} />
                          <span className="text-[11px] font-bold text-zinc-600">{leg.label}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-black text-zinc-900">{leg.value}</span>
                          <span className="text-[10px] font-semibold text-zinc-400">{leg.pct}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </CardContent>
          </Card>
        </div>
        {/* Middle Section: Pending Tasks & Request Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Tasks Table */}
          <Card className="lg:col-span-2 border border-zinc-100 shadow-sm rounded-2xl bg-white overflow-hidden flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-zinc-50/50">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-sm font-black text-zinc-800">Pending Tasks</CardTitle>
              </div>
              <Button variant="link" className="text-blue-600 font-bold text-xs p-0 h-auto">View All</Button>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <div className="overflow-x-auto h-full">
                <table className="w-full text-sm h-full">
                  <thead>
                    <tr className="border-b border-zinc-100 text-[11px] uppercase tracking-wider text-zinc-500 font-bold bg-zinc-50/50">
                      <th className="text-left py-3 px-6 font-semibold">Task</th>
                      <th className="text-left py-3 px-6 font-semibold">Project</th>
                      <th className="text-left py-3 px-6 font-semibold">Assigned To</th>
                      <th className="text-left py-3 px-6 font-semibold">Due Date</th>
                      <th className="text-left py-3 px-6 font-semibold">Priority</th>
                      <th className="text-left py-3 px-6 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {stats?.pendingTaskList && stats.pendingTaskList.length > 0 ? (
                      stats.pendingTaskList.map((row, i) => (
                        <tr key={i} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="py-3 px-6 font-bold text-xs text-zinc-800">{row.title || "Unnamed Task"}</td>
                          <td className="py-3 px-6 text-xs text-zinc-600 font-medium">{row.projectId?.projectName || "N/A"}</td>
                          <td className="py-3 px-6">
                            <div className="flex items-center gap-2">
                              {row.assignedToId?.profilePic ? (
                                <Image src={`${process.env.NEXT_PUBLIC_BASE_URL?.replace("/api", "") || ""}${row.assignedToId.profilePic}`} alt={row.assignedToId?.name} width={24} height={24} className="rounded-full object-cover w-6 h-6 border border-zinc-200" />
                              ) : (
                                <div className="rounded-full bg-blue-100 text-blue-600 w-6 h-6 flex items-center justify-center font-bold text-[10px]">
                                  {row.assignedToId?.name?.charAt(0) || "U"}
                                </div>
                              )}
                              <span className="text-xs font-semibold text-zinc-700">{row.assignedToId?.name || "Unassigned"}</span>
                            </div>
                          </td>
                          <td className="py-3 px-6 text-xs text-zinc-600 font-medium">{row.dueDate ? new Date(row.dueDate).toLocaleDateString() : "-"}</td>
                          <td className="py-3 px-6">
                            <div className="flex items-center gap-1.5">
                              <span className={cn("w-2 h-2 rounded-full shadow-sm", row.priority === "high" ? "bg-rose-500" : row.priority === "medium" ? "bg-orange-500" : "bg-emerald-500")} />
                              <span className="text-xs font-semibold text-zinc-700 capitalize">{row.priority || "low"}</span>
                            </div>
                          </td>
                          <td className="py-3 px-6">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-100/50 capitalize">
                              {row.status || "Pending"}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-zinc-500 font-bold text-xs">No pending tasks found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Request Summary */}
          <Card className="border border-zinc-100 shadow-sm rounded-2xl bg-white flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between py-4 pb-2">
              <div className="flex items-center gap-2">
                <div className="bg-purple-100 p-1 rounded relative">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 absolute m-[3px] shadow top-0 left-0" />
                  <div className="border-[1.5px] border-purple-500 border-dashed w-4 h-4 rounded" />
                </div>
                <CardTitle className="text-sm font-black text-zinc-800">Request Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-2 flex flex-col gap-4 flex-1 justify-center">
              {[
                { label: "Indent Requests", value: "12", pending: "03 Pending", icon: FileText, bg: "bg-indigo-50", color: "text-indigo-600" },
                { label: "PO Requests", value: "08", pending: "02 Pending", icon: ShoppingCart, bg: "bg-blue-50", color: "text-blue-500" },
                { label: "Asset Requests", value: "06", pending: "01 Pending", icon: Package, bg: "bg-emerald-50", color: "text-emerald-500" },
              ].map((req, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-2.5 rounded-xl", req.bg, req.color)}>
                      <req.icon className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-zinc-900">{req.label}</span>
                      <span className={cn("text-xl font-black leading-tight", req.color)}>{req.value}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between self-stretch gap-2">
                    <Button variant="link" className="text-blue-600 font-bold text-[10px] h-auto p-0 hover:underline">View All</Button>
                    <span className="text-[10px] font-bold text-orange-500">{req.pending}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

       
      </div>
    </ContentLayout>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
