"use client"

import { useState } from "react"
import {
  LayoutGrid,
  List,
  Plus,
  Search,
  Edit,
  Trash,
  Eye,
  EyeOff,
  ArrowRight
} from "lucide-react"
import { useRouter } from "next/navigation"

import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StaffCard } from "@/components/staff/staff-card"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { StaffDialog } from "@/components/staff/staff-dialog"

import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { useUsers, Staff } from "@/hooks/use-users"
import { useAuthStore } from "@/store/use-auth-store"
import { authService } from "@/service/auth.api"
import { toast } from "sonner"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const PasswordCell = ({ password }: { password?: string }) => {
  const [showPassword, setShowPassword] = useState(false)
  if (!password) return <span className="text-zinc-500 font-medium">-</span>
  return (
    <div className="flex items-center gap-2">
      <span className="text-zinc-500 font-medium font-mono text-sm min-w-[60px]">
        {showPassword ? password : "••••••••"}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-zinc-400 hover:text-primary hover:bg-primary/5 transition-all"
        onClick={(e) => {
          e.stopPropagation()
          setShowPassword(!showPassword)
        }}
      >
        {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
      </Button>
    </div>
  )
}

const MemberCell = ({ staff }: { staff: Staff }) => {
  const { clearAuth, setAuth } = useAuthStore()

  const handleLoginAs = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const email = staff.email
    const password = staff.password
    if (!password) {
      toast.error("No password stored for this user.")
      return
    }
    try {
      const response = await authService.login({
        emailOrMobile: email,
        password: password
      })
      // Clear storage and state, then immediately update with new credentials
      clearAuth()
      setAuth(response.token, response.data as any)
      toast.success(`Logged in as ${staff.name}`)
      window.location.href = "/"
    } catch (err: any) {
      toast.error(err.message || "Failed to login as user")
    }
  }

  return (
    <div className="flex items-center justify-between w-full gap-3">
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8 rounded-xl">
          <AvatarImage src={staff.avatarUrl} />
          <AvatarFallback className="rounded-xl bg-primary/5 text-primary font-bold">{staff.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-bold text-zinc-900 leading-none mb-1">{staff.name}</span>
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">{staff.role}</span>
        </div>
      </div>

      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-lg text-zinc-400 hover:text-primary hover:bg-primary/5 transition-all shrink-0"
              onClick={handleLoginAs}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="rounded-xl border border-zinc-100 bg-white/95 px-3 py-2 text-xs font-bold text-zinc-900 shadow-xl backdrop-blur-md">
            <span>Login as user {staff.name}</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

export default function UserPage() {
  const router = useRouter()
  const { user: loggedInUser, hasPermission } = useAuthStore()
  const isSuperAdmin = hasPermission("organization:view")

  const {
    users,
    search,
    setSearch,
    toggleUserStatus,
    removeUser,
    isLoading,
    refetch
  } = useUsers()

  const [view, setView] = useState<"grid" | "table">("table")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)

  const handleUpdateStatus = async (id: string) => {
    await toggleUserStatus(id)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to remove this staff member?")) {
      await removeUser(id)
    }
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
      cell: ({ row }) => <MemberCell staff={row.original} />,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span className="text-zinc-500 font-medium">{row.getValue("email")}</span>,
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => <span className="text-zinc-500 font-medium">{row.original.phone || "-"}</span>,
    },
    {
      accessorKey: "password",
      header: "Password",
      cell: ({ row }) => <PasswordCell password={row.original.password} />,
    },
    {
      accessorKey: "geofenceName",
      header: "Geofence",
      cell: ({ row }) => <span className="text-zinc-500 font-medium">{row.original.geofenceName || "-"}</span>,
    },
    {
      accessorKey: "attendancePolicyName",
      header: "Attendance Policy",
      cell: ({ row }) => <span className="text-zinc-500 font-medium">{row.original.attendancePolicyName || "-"}</span>,
    },
    {
      accessorKey: "status",
      header: () => <div className="text-center w-full">Status</div>,
      cell: ({ row }) => {
        const isActive = row.original.isActive
        return (
          <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Switch
              checked={isActive}
              onCheckedChange={() => handleUpdateStatus(row.original.id)}
              className="data-[state=checked]:bg-emerald-600"
            />
            <span className={cn(
              "text-xs font-bold min-w-[65px] px-2 py-0.5 rounded-full transition-colors text-center",
              isActive ? "text-emerald-700 bg-emerald-50" : "text-zinc-500 bg-zinc-100"
            )}>
              {isActive ? "Active" : "Inactive"}
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
              handleDelete(row.original.id)
            }}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <ContentLayout title={isSuperAdmin ? "Users" : "Staff Members"}>
      <div className="flex flex-col gap-8 p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">
            {isSuperAdmin ? "Users" : "Staff Members"}
          </h1>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder={isSuperAdmin ? "Search users..." : "Search team..."}
                className="pl-10 h-11 bg-white border-none shadow-sm rounded-xl focus-visible:ring-primary"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
              {isSuperAdmin ? "Add User" : "Add Member"}
            </Button>
          </div>
        </div>

        {isLoading && users.length === 0 ? (
          <div className="text-center py-12 text-zinc-400 font-bold">
            {isSuperAdmin ? "Loading user profiles..." : "Loading team profiles..."}
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {users.map((staff) => (
              <StaffCard key={staff.id} staff={{
                ...staff,
                status: staff.isActive ? "Active" : "Inactive"
              }} />
            ))}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={users}
            onRowClick={(row) => router.push(`/users/${row.id}`)}
          />
        )}

        {/* Dialog */}
        <StaffDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          editingStaff={editingStaff}
          isSuperAdmin={isSuperAdmin}
          onSuccess={() => {
            setIsDialogOpen(false)
          }}
        />
      </div>
    </ContentLayout>
  )
}