"use client"

import { useState, useEffect } from "react"
import {
  Plus,
  Trash2,
  PlayCircle,
  CheckCircle,
  ArrowDown,
  ChevronRight,
  Sparkles,
  Save,
  X,
  FileText,
  UserCheck,
  ToggleLeft,
  ToggleRight,
  MoreVertical,
  Activity,
  GitCommit
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { approvalFlowService, ApprovalFlow, ApprovalLevel } from "@/service/approvalFlow.api"
import { roleService, ApiRole } from "@/service/roleService"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"

export default function ApprovalFlowPage() {
  const [view, setView] = useState<"list" | "add" | "edit">("list")
  const [flows, setFlows] = useState<ApprovalFlow[]>([])
  const [roles, setRoles] = useState<ApiRole[]>([])
  const [loading, setLoading] = useState(true)
  const [previewFlow, setPreviewFlow] = useState<ApprovalFlow | null>(null)

  // Designer Form States
  const [editingFlowId, setEditingFlowId] = useState<string | null>(null)
  const [flowName, setFlowName] = useState("")
  const [moduleName, setModuleName] = useState<"indent" | "purchaseOrder">("indent")
  const [status, setStatus] = useState<"active" | "inactive">("active")
  const [levels, setLevels] = useState<ApprovalLevel[]>([
    { level: 1, roleId: "" }
  ])

  // Load flows and roles
  const loadData = async () => {
    try {
      setLoading(true)
      const [flowsRes, rolesRes] = await Promise.all([
        approvalFlowService.getApprovalFlows(),
        roleService.getRoles()
      ])
      setFlows(flowsRes.data || flowsRes || [])
      setRoles(rolesRes.roles || [])
    } catch (err: any) {
      toast.error(err.message || "Failed to load approval flow details")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAddNewStep = () => {
    setLevels(prev => [
      ...prev,
      { level: prev.length + 1, roleId: "" }
    ])
  }

  const handleRemoveStep = (index: number) => {
    if (levels.length === 1) return
    const updated = levels
      .filter((_, idx) => idx !== index)
      .map((item, idx) => ({ ...item, level: idx + 1 }))
    setLevels(updated)
  }

  const handleStepRoleChange = (index: number, roleId: string) => {
    setLevels(prev => prev.map((item, idx) => idx === index ? { ...item, roleId } : item))
  }

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!flowName.trim()) {
      toast.error("Please provide a flow name")
      return
    }

    const unassignedStep = levels.find(l => !l.roleId)
    if (unassignedStep) {
      toast.error(`Please select a role for Level ${unassignedStep.level}`)
      return
    }

    try {
      const payload = {
        flowName,
        moduleName,
        status,
        levels: levels.map(l => ({ level: l.level, roleId: l.roleId }))
      }

      if (view === "edit" && editingFlowId) {
        await approvalFlowService.updateApprovalFlow(editingFlowId, payload)
        toast.success("Approval flow updated successfully")
      } else {
        await approvalFlowService.createApprovalFlow(payload)
        toast.success("Approval flow created successfully")
      }

      // Reset & go back to list
      setView("list")
      setEditingFlowId(null)
      setFlowName("")
      setModuleName("indent")
      setStatus("active")
      setLevels([{ level: 1, roleId: "" }])
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to save approval flow")
    }
  }

  const handleEditClick = (flow: ApprovalFlow) => {
    setEditingFlowId(flow._id)
    setFlowName(flow.flowName)
    setModuleName(flow.moduleName)
    setStatus(flow.status)
    setLevels(
      flow.levels.map(l => ({
        level: l.level,
        roleId: typeof l.roleId === "object" ? l.roleId._id : l.roleId
      }))
    )
    setView("edit")
  }

  const handleDeleteClick = async (id: string) => {
    if (!confirm("Are you sure you want to delete this approval flow?")) return
    try {
      await approvalFlowService.deleteApprovalFlow(id)
      toast.success("Approval flow deleted successfully")
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete approval flow")
    }
  }

  const toggleFlowStatus = async (flow: ApprovalFlow) => {
    const originalStatus = flow.status
    const newStatus = originalStatus === "active" ? "inactive" : "active"

    // Optimistically update status in state
    setFlows(prev => prev.map(f => f._id === flow._id ? { ...f, status: newStatus } : f))

    try {
      await approvalFlowService.updateApprovalFlow(flow._id, { status: newStatus })
      toast.success(`Flow status changed to ${newStatus}`)
    } catch (err: any) {
      // Revert if API call fails
      setFlows(prev => prev.map(f => f._id === flow._id ? { ...f, status: originalStatus } : f))
      toast.error(err.message || "Failed to update flow status")
    }
  }

  const listColumns: ColumnDef<ApprovalFlow>[] = [
    {
      id: "index",
      header: "S.No",
      cell: ({ row }) => <span className="font-bold text-zinc-500 text-xs">{row.index + 1}</span>
    },
    {
      accessorKey: "flowName",
      header: "Flow Name",
      cell: ({ row }) => (
        <span className="font-bold text-zinc-950 tracking-tight text-sm uppercase">
          {row.getValue("flowName")}
        </span>
      )
    },
    {
      accessorKey: "moduleName",
      header: "Module",
      cell: ({ row }) => {
        const val = row.getValue("moduleName") as string
        return (
          <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 font-bold px-3.5 py-1 text-[10px] tracking-wider uppercase rounded-full">
            {val === "indent" ? "Indent" : "Purchase Order"}
          </Badge>
        )
      }
    },
    {
      accessorKey: "levels",
      header: "Steps",
      cell: ({ row }) => {
        const count = row.original.levels?.length || 0
        return (
          <div className="flex items-center gap-1.5 font-bold text-zinc-500 text-xs">
            <GitCommit className="h-4 w-4 text-zinc-400" />
            <span>{count} {count === 1 ? "Level" : "Levels"}</span>
          </div>
        )
      }
    },
    {
      id: "preview",
      header: "Flow Map",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPreviewFlow(row.original)}
          className="h-8 px-3.5 rounded-xl border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 font-bold text-[10px] uppercase tracking-wider gap-1.5 transition-all"
        >
          Show Flow
        </Button>
      )
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.original.status === "active"
        return (
          <div className="flex items-center">
            <Switch
              checked={isActive}
              onCheckedChange={() => toggleFlowStatus(row.original)}
            />
          </div>
        )
      }
    },
    {
      id: "actions",
      header: () => <div className="text-right pr-6">Action</div>,
      cell: ({ row }) => (
        <div className="flex justify-end pr-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 p-0 rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32 rounded-xl bg-white shadow-xl border border-zinc-100 p-1 font-bold text-xs">
              <DropdownMenuItem
                onClick={() => handleEditClick(row.original)}
                className="rounded-lg py-2 px-3 hover:bg-zinc-50 cursor-pointer text-zinc-700 focus:bg-zinc-50 focus:text-zinc-900"
              >
                Edit Flow
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteClick(row.original._id)}
                className="rounded-lg py-2 px-3 hover:bg-rose-50 cursor-pointer text-rose-600 focus:bg-rose-50 focus:text-rose-700"
              >
                Delete Flow
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ]

  return (
    <ContentLayout title="Approval Flow">
      <div className="flex flex-col gap-8 p-6 sm:p-10 max-w-[1600px] mx-auto min-h-screen">


        {/* Dynamic Header Hub */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-3xl font-black text-zinc-900 tracking-tight">
              {view === "list" ? "Approval Flow" : view === "add" ? "Add Approval Flow" : "Edit Approval Flow"}
            </h1>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              {view === "list" ? "Configure document authorization routes" : "Map document approval hierarchies visually"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {view === "list" ? (
              <Button
                onClick={() => {
                  setView("add")
                  setFlowName("")
                  setModuleName("indent")
                  setStatus("active")
                  setLevels([{ level: 1, roleId: "" }])
                }}
                className="h-12 px-6 rounded-2xl bg-zinc-900 text-white font-black shadow-lg shadow-zinc-900/10 gap-2 hover:scale-[1.01]"
              >
                <Plus className="h-4 w-4" /> Add New Flow
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setView("list")}
                  className="h-12 px-6 rounded-2xl border-zinc-200 text-zinc-500 font-bold hover:bg-zinc-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateOrUpdate}
                  className="h-12 px-6 rounded-2xl bg-emerald-500 text-white font-black shadow-lg shadow-emerald-500/20 gap-2 hover:bg-emerald-600 hover:scale-[1.01] transition-all"
                >
                  <Save className="h-4 w-4" /> Save Flow
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <AnimatePresence mode="wait">
          {view === "list" ? (
            <motion.div
              key="list-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white rounded-[2.5rem] p-8 border border-zinc-100 shadow-sm"
            >
              {loading ? (
                <div className="flex items-center justify-center py-24 text-zinc-400 font-bold text-sm gap-2">
                  <Activity className="h-4 w-4 animate-spin text-primary" />
                  Loading Approval Routes...
                </div>
              ) : (
                <DataTable
                  columns={listColumns}
                  data={flows}
                />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="designer-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* Form Info Box */}
              <div className="bg-white rounded-[2.5rem] p-10 border border-zinc-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1">Flow Name</Label>
                  <Input
                    placeholder="e.g. Indent Approval Flow"
                    value={flowName}
                    onChange={(e) => setFlowName(e.target.value)}
                    required
                    className="h-14 rounded-2xl bg-zinc-50 border-none font-bold text-sm focus:ring-1 focus:ring-primary px-6 shadow-inner"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1">Target Module</Label>
                  <Select
                    value={moduleName}
                    onValueChange={(val: any) => setModuleName(val)}
                  >
                    <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 border-none font-bold text-sm focus:ring-1 focus:ring-primary px-6 shadow-inner">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-zinc-100 shadow-2xl bg-white p-1">
                      <SelectItem value="indent" className="rounded-xl py-3 font-bold text-xs">Indent Requisition</SelectItem>
                      <SelectItem value="purchaseOrder" className="rounded-xl py-3 font-bold text-xs">Purchase Order</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Visual Connector Designer Canvas */}
              <div 
                className="bg-zinc-50/50 rounded-[2rem] border border-dashed border-zinc-200 p-6 flex flex-col items-center max-h-[50vh] overflow-y-auto relative"
                style={{ scrollbarWidth: 'thin' }}
              >

                {/* Start Node */}
                <div className="flex flex-col items-center group">
                  <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
                    <PlayCircle className="h-5 w-5" />
                  </div>
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-2">Start Flow</span>
                </div>

                {/* Vertical Line Connector */}
                <div className="w-[3px] h-6 bg-gradient-to-b from-emerald-500 to-zinc-300" />

                {/* Level Cards List */}
                <div className="space-y-0 w-full max-w-[380px] flex flex-col items-center">
                  {levels.map((item, idx) => {
                    const isLast = idx === levels.length - 1
                    return (
                      <div key={idx} className="w-full flex flex-col items-center">
                        {/* Step Card Container */}
                        <div className="w-full bg-white rounded-2xl border border-zinc-100 p-4 shadow-md relative hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500">
                          
                          {/* Step Index Badge */}
                          <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-md border-2 border-white">
                            {idx + 1}
                          </div>

                          <div className="flex items-center justify-between mb-2.5 pl-2">
                            <div className="flex items-center gap-2.5">
                              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                                <UserCheck className="h-3.5 w-3.5" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none">Approver Role</span>
                                <span className="text-xs font-black text-zinc-800 leading-none mt-1">Level {idx + 1}.1</span>
                              </div>
                            </div>
                            
                            {levels.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveStep(idx)}
                                className="h-7 w-7 rounded-lg text-zinc-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>

                          <div className="space-y-2 pl-2">
                            <Select
                              value={item.roleId}
                              onValueChange={(val) => handleStepRoleChange(idx, val)}
                            >
                              <SelectTrigger className="h-9 rounded-lg bg-zinc-50/50 border-none font-bold text-xs">
                                <SelectValue placeholder="Select Authorizing Role" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-zinc-100 shadow-xl bg-white max-h-48 p-1">
                                {roles.map((role) => (
                                  <SelectItem key={role._id} value={role._id || ""} className="rounded-lg py-2 font-bold text-xs">
                                    {role.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Bottom Row */}
                          <div className="flex items-center justify-between mt-3 pl-2 border-t border-zinc-50 pt-2 text-[9px] font-black text-zinc-400 uppercase tracking-wider">
                            <span className="flex items-center gap-1 text-emerald-500">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Sequential
                            </span>
                            <div className="flex gap-1">
                              <GitCommit className="h-3.5 w-3.5 text-zinc-300" />
                            </div>
                          </div>
                        </div>

                        {/* Connector line (drawn if this card is not the last level or if we have another node below) */}
                        <div className="w-[3px] h-6 bg-zinc-200" />
                      </div>
                    )
                  })}
                </div>

                {/* Add Step Button Node */}
                <button
                  type="button"
                  onClick={handleAddNewStep}
                  className="group flex items-center justify-center gap-2 px-6 py-2 rounded-full border-2 border-dashed border-zinc-300 hover:border-primary bg-white hover:bg-zinc-50 text-zinc-500 hover:text-primary transition-all duration-300 shadow-sm"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest">Add Step</span>
                </button>

                {/* Connector line */}
                <div className="w-[3px] h-6 bg-gradient-to-b from-zinc-200 to-zinc-800" />

                {/* Process Completed Node */}
                <div className="flex flex-col items-center group">
                  <div className="h-10 w-10 rounded-full bg-zinc-900 flex items-center justify-center text-white shadow-xl shadow-zinc-900/10 group-hover:scale-105 transition-transform duration-300">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <span className="text-[9px] font-black text-zinc-800 uppercase tracking-widest mt-2">Process Completed</span>
                </div>

              </div>

            </motion.div>
          )}
        </AnimatePresence>

        {previewFlow && (
          <Dialog open={!!previewFlow} onOpenChange={(open) => !open && setPreviewFlow(null)}>
            <DialogContent className="sm:max-w-[420px] rounded-3xl bg-white p-6 shadow-2xl border border-zinc-100">
              <DialogHeader>
                <DialogTitle className="text-lg font-black text-zinc-900 tracking-tight uppercase">
                  {previewFlow.flowName}
                </DialogTitle>
                <DialogDescription className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Approval Flow Path for {previewFlow.moduleName === "indent" ? "Indent Requisition" : "Purchase Order"}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-6 flex flex-col items-center">
                <div className="flex flex-col items-center w-full max-w-[280px]">
                  {/* Start Node */}
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                      <PlayCircle className="h-4 w-4" />
                    </div>
                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mt-1">Start Flow</span>
                  </div>

                  <div className="w-[2px] h-4 bg-zinc-200" />

                  {previewFlow.levels.map((lvl, index) => {
                    const roleName = typeof lvl.roleId === "object" ? lvl.roleId?.name : (roles.find(r => r._id === lvl.roleId)?.name || "Unknown Role")
                    const roleScope = typeof lvl.roleId === "object" ? lvl.roleId?.scope : (roles.find(r => r._id === lvl.roleId)?.scope || "organization")
                    return (
                      <div key={index} className="w-full flex flex-col items-center">
                        <div className="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-3.5 flex items-center gap-3 relative border-l-4 border-l-blue-500 shadow-sm">
                          <div className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-[10px]">
                            {lvl.level}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-zinc-800 leading-none">{roleName}</span>
                            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Scope: {roleScope}</span>
                          </div>
                        </div>
                        {index < previewFlow.levels.length - 1 && <div className="w-[2px] h-4 bg-zinc-200" />}
                      </div>
                    )
                  })}

                  <div className="w-[2px] h-4 bg-zinc-200" />

                  {/* End Node */}
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full bg-zinc-900 flex items-center justify-center text-white shadow-md shadow-zinc-900/10">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <span className="text-[8px] font-black text-zinc-800 uppercase tracking-widest mt-1">Completed</span>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

      </div>
    </ContentLayout>
  )
}
