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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
    email: "julian@marbella.estate",
    phone: "+34 600 123 456",
    properties: 42,
    status: "Active",
  },
  {
    id: "2",
    name: "Sofia Rodriguez",
    role: "Luxury Property Specialist",
    email: "sofia@marbella.estate",
    phone: "+34 600 234 567",
    properties: 28,
    status: "Busy",
  },
  {
    id: "3",
    name: "Marcus Aurelius",
    role: "Operations Manager",
    email: "marcus@marbella.estate",
    phone: "+34 600 345 678",
    properties: 0,
    status: "Away",
  },
  {
    id: "4",
    name: "Elena Gilbert",
    role: "Real Estate Consultant",
    email: "elena@marbella.estate",
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

  const columns: ColumnDef<Staff>[] = [
    {
      accessorKey: "name",
      header: "Member",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={row.original.avatarUrl} />
            <AvatarFallback>{row.original.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-bold text-zinc-900">{row.original.name}</span>
            <span className="text-[10px] text-zinc-400 font-bold uppercase">{row.original.role}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "properties",
      header: "Properties",
      cell: ({ row }) => <span className="font-bold text-zinc-900">{row.getValue("properties")}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        const variants: Record<string, "success" | "secondary" | "destructive" | "outline"> = {
          Active: "success",
          Busy: "destructive",
          Away: "secondary",
          Inactive: "outline",
        }
        return (
          <Badge variant={variants[status]} className="rounded-full px-3 py-0.5 font-bold">
            {status}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-zinc-100">
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4 text-zinc-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl shadow-xl border-zinc-100">
            <DropdownMenuLabel className="text-[10px] font-bold text-zinc-400 uppercase px-2 py-1.5">Actions</DropdownMenuLabel>
            <DropdownMenuItem 
              className="rounded-lg gap-2 cursor-pointer py-2"
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/users/${row.original.id}`)
              }}
            >
              <Edit className="h-4 w-4 text-zinc-500" />
              <span className="font-semibold text-sm">Edit Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="rounded-lg gap-2 cursor-pointer py-2"
              onClick={(e) => {
                e.stopPropagation()
                handleUpdateStatus(row.original.id, "Active")
              }}
            >
              <UserCheck className="h-4 w-4 text-emerald-500" />
              <span className="font-semibold text-sm">Activate</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="rounded-lg gap-2 cursor-pointer py-2"
              onClick={(e) => {
                e.stopPropagation()
                handleUpdateStatus(row.original.id, "Inactive")
              }}
            >
              <UserX className="h-4 w-4 text-amber-500" />
              <span className="font-semibold text-sm">Deactivate</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 bg-zinc-50" />
            <DropdownMenuItem 
              className="rounded-lg gap-2 cursor-pointer py-2 text-rose-500 focus:text-rose-500 focus:bg-rose-50"
              onClick={(e) => {
                e.stopPropagation()
                handleDelete(row.original.id, row.original.name)
              }}
            >
              <Trash2 className="h-4 w-4" />
              <span className="font-semibold text-sm">Delete Member</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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

            <Link href="/users/new">
              <Button className="h-11 rounded-xl px-6 font-bold shadow-lg shadow-primary/20">
                <Plus className="mr-2 h-4 w-4" /> Add Member
              </Button>
            </Link>
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
      </div>
    </ContentLayout>
  )
}