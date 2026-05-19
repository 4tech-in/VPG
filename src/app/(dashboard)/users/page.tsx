"use client"

import { useState } from "react"
import {
  LayoutGrid,
  List,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  UserCheck,
  UserX
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StaffCard } from "@/components/staff/staff-card"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { StaffForm } from "@/components/staff/staff-form"

import { Switch } from "@/components/ui/switch"
import { Trash } from "lucide-react"
import { cn } from "@/lib/utils"

import { toast } from "sonner"

type Staff = {
  id: string
  name: string
  role: string
  email: string
  phone: string
  properties: number
  status: "Active" | "Busy" | "Away" | "Inactive"
  avatarUrl?: string
}

const INITIAL_STAFF: Staff[] = [
  {
    id: "1",
    name: "Julian Casablancas",
    role: "Senior Sales Agent",
    email: "julian@VPG.estate",
    phone: "+34 600 123 456",
    properties: 42,
    status: "Active",
  },
  {
    id: "2",
    name: "Sofia Rodriguez",
    role: "Luxury Property Specialist",
    email: "sofia@VPG.estate",
    phone: "+34 600 234 567",
    properties: 28,
    status: "Busy",
  },
  {
    id: "3",
    name: "Marcus Aurelius",
    role: "Operations Manager",
    email: "marcus@VPG.estate",
    phone: "+34 600 345 678",
    properties: 0,
    status: "Away",
  },
  {
    id: "4",
    name: "Elena Gilbert",
    role: "Real Estate Consultant",
    email: "elena@VPG.estate",
    phone: "+34 600 456 789",
    properties: 15,
    status: "Active",
  },
]

export default function UserPage() {
  const router = useRouter()
  const [view, setView] = useState<"grid" | "table">("table")
  const [searchQuery, setSearchQuery] = useState("")
  const [staffList, setStaffList] = useState<Staff[]>(INITIAL_STAFF)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)

  const filteredStaff = staffList.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleUpdateStatus = (id: string, status: Staff["status"]) => {
    setStaffList(prev => prev.map(s => s.id === id ? { ...s, status } : s))
    toast.success(`Member status updated to ${status}`)
  }

  const handleDelete = (id: string, name: string) => {
    setStaffList(prev => prev.filter(s => s.id !== id))
    toast.success(`${name} has been removed from the team`)
  }

  const handleEdit = (staff: Staff) => {
    setEditingStaff(staff)
    setIsDialogOpen(true)
  }

  const handleAddNew = () => {
    setEditingStaff(null)
    setIsDialogOpen(true)
  }

  const columns: ColumnDef<Staff>[] = [
    {
      accessorKey: "name",
      header: "Member",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 rounded-xl">
            <AvatarImage src={row.original.avatarUrl} />
            <AvatarFallback className="rounded-xl bg-primary/5 text-primary font-bold">{row.original.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-bold text-zinc-900 leading-none mb-1">{row.original.name}</span>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">{row.original.role}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span className="text-zinc-500 font-medium">{row.getValue("email")}</span>,
    },
    {
      accessorKey: "properties",
      header: () => <div className="text-center w-full">Properties</div>,
      cell: ({ row }) => <div className="text-center w-full font-black text-zinc-900">{row.getValue("properties")}</div>,
    },
    {
      accessorKey: "status",
      header: () => <div className="text-center w-full">Status</div>,
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        const isActive = status === "Active"
        return (
          <div className="flex items-center justify-center gap-2">
            <Switch
              checked={isActive}
              onCheckedChange={(checked) => handleUpdateStatus(row.original.id, checked ? "Active" : "Inactive")}
              className="data-[state=checked]:bg-emerald-600"
            />
            <span className={cn(
              "text-xs font-bold min-w-[65px] px-2 py-0.5 rounded-full transition-colors text-center",
              isActive ? "text-emerald-700 bg-emerald-50" : "text-zinc-500 bg-zinc-100"
            )}>
              {status}
            </span>
          </div>
        )
      },
    },
    {
      id: "actions",
      header: () => <div className="text-center w-full uppercase text-[10px] tracking-widest font-black text-zinc-400">Action</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl text-zinc-400 hover:text-primary hover:bg-primary/5 transition-all"
            onClick={(e) => {
              e.stopPropagation()
              handleEdit(row.original)
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl text-zinc-400 hover:text-destructive hover:bg-destructive/5 transition-all"
            onClick={(e) => {
              e.stopPropagation()
              handleDelete(row.original.id, row.original.name)
            }}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <ContentLayout title="Staff Members">
      <div className="flex flex-col gap-8 p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Staff Members</h1>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search team..."
                className="pl-10 h-11 bg-white border-none shadow-sm rounded-xl focus-visible:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex p-1 bg-zinc-100 rounded-xl">
              <Button
                variant={view === "grid" ? "white" : "ghost"}
                size="icon"
                className={`h-9 w-9 rounded-lg ${view === "grid" ? "shadow-sm" : "text-zinc-500"}`}
                onClick={() => setView("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={view === "table" ? "white" : "ghost"}
                size="icon"
                className={`h-9 w-9 rounded-lg ${view === "table" ? "shadow-sm" : "text-zinc-500"}`}
                onClick={() => setView("table")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            <Button
              onClick={handleAddNew}
              className="h-11 rounded-xl px-6 font-bold shadow-lg shadow-primary/20"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Member
            </Button>
          </div>
        </div>

        {view === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredStaff.map((staff) => (
              <StaffCard key={staff.id} staff={staff} />
            ))}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredStaff}
            onRowClick={(row) => router.push(`/users/${row.id}`)}
          />
        )}

        {/* Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-3xl border-none shadow-2xl">
            <DialogHeader className="pb-4 border-b border-zinc-100 mb-6">
              <DialogTitle className="text-2xl font-black">{editingStaff ? "Update Staff Profile" : "Register New Staff"}</DialogTitle>
              <DialogDescription className="font-medium text-zinc-500">
                {editingStaff
                  ? "Modify account permissions and professional details for this member."
                  : "Onboard a new member to the VPG Estate team."}
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <StaffForm
                isDialog
                onSuccess={() => setIsDialogOpen(false)}
                initialValues={editingStaff ? {
                  name: editingStaff.name,
                  email: editingStaff.email,
                  phone: editingStaff.phone,
                  role: editingStaff.role.toLowerCase().includes("agent") ? "agent" :
                    editingStaff.role.toLowerCase().includes("manager") ? "manager" : "admin"
                } : undefined}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ContentLayout>
  )
}