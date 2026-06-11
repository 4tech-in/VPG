"use client"

import { useState, useMemo, useEffect } from "react"
import {
  DollarSign,
  Search,
  Plus,
  MoreVertical,
  CheckCircle,
  XCircle,
  Trash2,
  Calendar,
  Clock,
  Edit,
  Loader2
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useAdvances, Advance } from "@/hooks/use-advances"
import { useUsers } from "@/hooks/use-users"

export default function AdvancePage() {
  const {
    advances,
    isLoading,
    addAdvance,
    editAdvance,
    settleAdvance,
    cancelAdvance,
    removeAdvance,
    page,
    setPage,
    limit,
    search,
    setSearch,
    status,
    setStatus,
    pagination,
  } = useAdvances()

  const { allUsers } = useUsers()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedAdvance, setSelectedAdvance] = useState<Advance | null>(null)

  // Form states
  const [formUserId, setFormUserId] = useState("")
  const [formAmount, setFormAmount] = useState("")
  const [formReason, setFormReason] = useState("")
  const [formNote, setFormNote] = useState("")

  // Edit Form states
  const [editAmount, setEditAmount] = useState("")
  const [editReason, setEditReason] = useState("")
  const [editNote, setEditNote] = useState("")

  const getAvatarUrl = (profileImage?: string) => {
    if (!profileImage) return undefined
    const base = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/api$/, "") || ""
    return `${base}${profileImage}`
  }

  const columns: ColumnDef<Advance>[] = [
    {
      accessorKey: "userId",
      header: "Team Member",
      cell: ({ row }) => {
        const userObj = row.original.userId
        const name = userObj?.name || "Unknown"
        const role = userObj?.role || "Staff"
        const avatar = getAvatarUrl(userObj?.profileImage)
        return (
          <div className="flex items-center gap-3 pl-2">
            <Avatar className="h-9 w-9 rounded-xl border-2 border-white shadow-sm">
              <AvatarImage src={avatar} />
              <AvatarFallback className="rounded-xl bg-zinc-100 text-zinc-900 font-bold text-xs">
                {name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-bold text-zinc-900 text-sm leading-none mb-1">{name}</span>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">{role}</span>
            </div>
          </div>
        )
      },
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
      accessorKey: "advanceDate",
      header: "Issued Date",
      cell: ({ row }) => {
        const dateStr = row.original.advanceDate
        const date = dateStr ? new Date(dateStr).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric"
        }) : "N/A"
        return <span className="text-zinc-500 font-bold text-xs">{date}</span>
      },
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
            status === "Active" ? "bg-blue-50 text-blue-600 border-blue-100" :
            status === "Cancelled" ? "bg-rose-50 text-rose-600 border-rose-100" :
            "bg-emerald-50 text-emerald-600 border-emerald-100" // Settled
          )}>
            {status}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const advance = row.original
        const isActive = advance.status === "Active"

        return (
          <div className="flex justify-end pr-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-zinc-100">
                  <MoreVertical className="h-4 w-4 text-zinc-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl border-zinc-100 shadow-xl bg-white">
                {isActive && (
                  <>
                    <DropdownMenuItem
                      onClick={() => handleOpenEdit(advance)}
                      className="flex items-center gap-2 font-bold text-xs text-zinc-700 hover:text-zinc-900 cursor-pointer rounded-lg m-1"
                    >
                      <Edit className="h-3.5 w-3.5" /> Edit details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleSettle(advance.id)}
                      className="flex items-center gap-2 font-bold text-xs text-emerald-600 hover:text-emerald-700 cursor-pointer rounded-lg m-1"
                    >
                      <CheckCircle className="h-3.5 w-3.5" /> Settle advance
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleCancel(advance.id)}
                      className="flex items-center gap-2 font-bold text-xs text-amber-600 hover:text-amber-700 cursor-pointer rounded-lg m-1"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Cancel advance
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem
                  onClick={() => handleDelete(advance.id)}
                  className="flex items-center gap-2 font-bold text-xs text-rose-600 hover:text-rose-700 cursor-pointer rounded-lg m-1"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete record
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  const handleCreateAdvance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formUserId) return toast.error("Please select a team member")
    if (!formAmount || Number(formAmount) <= 0) return toast.error("Please enter a valid amount")
    if (!formReason.trim()) return toast.error("Please enter a reason")

    try {
      await addAdvance({
        userId: formUserId,
        amount: Number(formAmount),
        reason: formReason,
        note: formNote || undefined,
      })
      setIsCreateOpen(false)
      // Reset form
      setFormUserId("")
      setFormAmount("")
      setFormReason("")
      setFormNote("")
    } catch (err) {}
  }

  const handleOpenEdit = (advance: Advance) => {
    setSelectedAdvance(advance)
    setEditAmount(String(advance.amount))
    setEditReason(advance.reason)
    setEditNote(advance.note || "")
    setIsEditOpen(true)
  }

  const handleUpdateAdvance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAdvance) return
    if (!editAmount || Number(editAmount) <= 0) return toast.error("Please enter a valid amount")
    if (!editReason.trim()) return toast.error("Please enter a reason")

    try {
      await editAdvance(selectedAdvance.id, {
        amount: Number(editAmount),
        reason: editReason,
        note: editNote || undefined,
      })
      setIsEditOpen(false)
    } catch (err) {}
  }

  const handleSettle = async (id: string) => {
    if (confirm("Are you sure you want to settle this advance?")) {
      try {
        await settleAdvance(id)
      } catch (err) {}
    }
  }

  const handleCancel = async (id: string) => {
    if (confirm("Are you sure you want to cancel this advance?")) {
      try {
        await cancelAdvance(id)
      } catch (err) {}
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this advance record permanently?")) {
      try {
        await removeAdvance(id)
      } catch (err) {}
    }
  }

  return (
    <ContentLayout title="Advance Management">
      <div className="flex flex-col gap-8 p-6 sm:p-10 max-w-[1600px] mx-auto min-h-screen">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 animate-in fade-in duration-300">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Advance Management</h1>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Financial Support Ledger</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Input
                placeholder="Search records..."
                className="h-11 rounded-xl bg-white border-zinc-100 pl-10 font-bold shadow-sm"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300" />
            </div>

            <Select
              value={status || "all"}
              onValueChange={(val) => {
                setStatus(val === "all" ? "" : val)
                setPage(1)
              }}
            >
              <SelectTrigger className="h-11 w-40 rounded-xl bg-white border-zinc-100 font-bold shadow-sm">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-zinc-100 shadow-xl bg-white">
                <SelectItem value="all" className="font-bold text-xs text-zinc-700 hover:bg-zinc-50 cursor-pointer">
                  All Status
                </SelectItem>
                <SelectItem value="Active" className="font-bold text-xs text-blue-600 hover:bg-zinc-50 cursor-pointer">
                  Active
                </SelectItem>
                <SelectItem value="Settled" className="font-bold text-xs text-emerald-600 hover:bg-zinc-50 cursor-pointer">
                  Settled
                </SelectItem>
                <SelectItem value="Cancelled" className="font-bold text-xs text-rose-600 hover:bg-zinc-50 cursor-pointer">
                  Cancelled
                </SelectItem>
              </SelectContent>
            </Select>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="h-11 rounded-xl px-6 bg-zinc-900 text-white font-black shadow-xl shadow-zinc-900/20 gap-2">
                  <Plus className="h-4 w-4" /> New Advance
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
                <DialogHeader className="p-8 bg-zinc-900 text-white pb-10">
                  <DialogTitle className="text-2xl font-black tracking-tight">Create Advance Record</DialogTitle>
                  <DialogDescription className="text-zinc-400 font-bold text-[10px] uppercase tracking-widest mt-2">
                    New Financial Disbursement
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateAdvance} className="p-8 bg-white space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider pl-1">Select Team Member</Label>
                    <Select onValueChange={setFormUserId} value={formUserId}>
                      <SelectTrigger className="h-12 rounded-xl bg-zinc-50 border-none font-bold text-sm focus:ring-1 focus:ring-primary">
                        <SelectValue placeholder="Choose a member" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-zinc-100 shadow-xl bg-white max-h-56 overflow-y-auto">
                        {allUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id} className="font-bold text-xs text-zinc-700 hover:bg-zinc-50 cursor-pointer">
                            {user.name} ({user.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider pl-1">Amount (INR)</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={formAmount}
                        onChange={(e) => setFormAmount(e.target.value)}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="h-12 rounded-xl bg-zinc-50 border-none font-black text-lg pl-10 focus:ring-1 focus:ring-primary"
                        required
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-zinc-400 text-sm">₹</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider pl-1">Reason for Advance</Label>
                    <Input
                      placeholder="e.g. Travel, Personal, Medical"
                      value={formReason}
                      onChange={(e) => setFormReason(e.target.value)}
                      className="h-12 rounded-xl bg-zinc-50 border-none font-bold text-sm focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider pl-1">Note (Optional)</Label>
                    <Input
                      placeholder="Additional remarks"
                      value={formNote}
                      onChange={(e) => setFormNote(e.target.value)}
                      className="h-12 rounded-xl bg-zinc-50 border-none font-bold text-sm focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="pt-4 flex items-center gap-3">
                    <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)} className="h-12 flex-1 rounded-xl font-bold text-zinc-400">Cancel</Button>
                    <Button type="submit" className="h-12 flex-1 rounded-xl bg-zinc-900 text-white font-black shadow-xl shadow-zinc-900/10">Record Advance</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
            <DialogHeader className="p-8 bg-zinc-900 text-white pb-10">
              <DialogTitle className="text-2xl font-black tracking-tight">Edit Advance Record</DialogTitle>
              <DialogDescription className="text-zinc-400 font-bold text-[10px] uppercase tracking-widest mt-2">
                Modify Financial Disbursement Details
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateAdvance} className="p-8 bg-white space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider pl-1">Amount (INR)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="h-12 rounded-xl bg-zinc-50 border-none font-black text-lg pl-10 focus:ring-1 focus:ring-primary"
                    required
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-zinc-400 text-sm">₹</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider pl-1">Reason for Advance</Label>
                <Input
                  placeholder="e.g. Travel, Personal, Medical"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="h-12 rounded-xl bg-zinc-50 border-none font-bold text-sm focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider pl-1">Note (Optional)</Label>
                <Input
                  placeholder="Additional remarks"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="h-12 rounded-xl bg-zinc-50 border-none font-bold text-sm focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="pt-4 flex items-center gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="h-12 flex-1 rounded-xl font-bold text-zinc-400">Cancel</Button>
                <Button type="submit" className="h-12 flex-1 rounded-xl bg-zinc-900 text-white font-black shadow-xl shadow-zinc-900/10">Save Changes</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Ledger Table */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-zinc-100 shadow-sm animate-in fade-in duration-300">
          {isLoading && advances.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 text-zinc-400 animate-spin" />
              <p className="text-zinc-500 font-bold text-sm">Loading financial ledger...</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={advances}
              isServerSide={true}
              pageIndex={page - 1}
              pageSize={limit}
              pageCount={pagination.totalPages}
              totalItems={pagination.totalItems}
              searchValue={search}
              onSearchChange={setSearch}
              onPageChange={(p) => setPage(p + 1)}
            />
          )}
        </div>
      </div>
    </ContentLayout>
  )
}
