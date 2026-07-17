"use client"

import { useState, useEffect, useCallback } from "react"
import { ArrowLeft, Edit2, Mail, Phone, MoreVertical } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { StaffForm } from "./staff-form"
import { NewRequestDialog } from "./new-request-dialog"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useUsers, Staff } from "@/hooks/use-users"

type IndentRequest = {
  id: string
  items: string
  status: "PENDING MANAGER" | "APPROVED" | "REJECTED"
  date: string
}

const mockRequests: IndentRequest[] = [
  { id: "IND-001", items: "Cement Bag", status: "PENDING MANAGER", date: "2024-05-01" },
  { id: "IND-004", items: "Safety Helmets", status: "APPROVED", date: "2024-04-20" },
  { id: "IND-009", items: "Tiles (Blue)", status: "REJECTED", date: "2024-04-15" },
]

export function StaffProfileContent({ id }: { id: string }) {
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const { getUserById } = useUsers({ skipFetch: true })
  const [user, setUser] = useState<Staff | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await getUserById(id)
      setUser(data)
    } catch (err) {
      console.error("Failed to load user profile:", err)
    } finally {
      setIsLoading(false)
    }
  }, [id, getUserById])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const columns: ColumnDef<IndentRequest>[] = [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "items", header: "Items" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        const variants: Record<string, string> = {
          "PENDING MANAGER": "bg-amber-100 text-amber-600 border-none",
          "APPROVED": "bg-emerald-100 text-emerald-600 border-none",
          "REJECTED": "bg-rose-100 text-rose-600 border-none",
        }
        return (
          <Badge variant="outline" className={`rounded-full font-bold text-[10px] uppercase px-3 ${variants[status]}`}>
            {status}
          </Badge>
        )
      },
    },
    { accessorKey: "date", header: "Date" },
    {
      id: "actions",
      header: "Action",
      cell: () => (
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
          <MoreVertical className="h-4 w-4 text-zinc-400" />
        </Button>
      ),
    },
  ]

  if (isLoading) {
    return (
      <div className="text-center py-12 text-zinc-400 font-bold">
        Loading staff profile...
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12 text-zinc-400 font-bold">
        Staff profile not found.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/users">
            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 bg-white shadow-sm border border-zinc-100">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Staff Profile</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsRequestDialogOpen(true)}
            className="h-11 rounded-xl px-6 bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-primary/20"
          >
            New Request
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsEditDialogOpen(true)}
            className="h-11 rounded-xl px-6 border-zinc-100 font-bold hover:bg-zinc-50"
          >
            <Edit2 className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
        </div>
      </div>

      <NewRequestDialog
        open={isRequestDialogOpen}
        onOpenChange={setIsRequestDialogOpen}
      />

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem]">
          <div className="max-h-[90vh] overflow-y-auto p-12 custom-scrollbar bg-white">
            <StaffForm
              isDialog
              initialValues={user}
              onSuccess={() => {
                setIsEditDialogOpen(false)
                fetchUser()
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Summary */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden text-center">
            <CardContent className="p-8">
              <div className="relative mx-auto w-fit mb-6">
                <Avatar className="h-32 w-32 rounded-[2.5rem] border-4 border-zinc-50 shadow-sm bg-zinc-100 overflow-hidden">
                  <AvatarImage src={user.avatarUrl} className="object-cover" />
                  <AvatarFallback className="text-4xl font-black bg-primary/5 text-primary">
                    {user.name ? user.name[0].toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-2 right-2 h-5 w-5 rounded-full border-4 border-white bg-primary" />
              </div>
              <h3 className="text-2xl font-black text-zinc-900 mb-1">{user.name}</h3>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-8">{user.role}</p>

              <div className="grid grid-cols-2 gap-4 py-6 border-y border-zinc-50">
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Properties</p>
                  <p className="text-xl font-black text-zinc-900">{user.properties || 0}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Requests</p>
                  <p className="text-xl font-black text-zinc-900">{mockRequests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
            <CardContent className="p-8">
              <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-6">Contact Details</h4>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">Email</span>
                    <span className="text-sm font-bold text-zinc-900 break-all">{user.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">Phone</span>
                    <span className="text-sm font-bold text-zinc-900">{user.phone || "-"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Tabs */}
        <div className="lg:col-span-8">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full bg-zinc-100 p-1.5 rounded-2xl h-14 mb-8">
              <TabsTrigger value="overview" className="flex-1 rounded-xl h-full font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Overview
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex-1 rounded-xl h-full font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Indent Requests
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                <CardContent className="p-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-10 gap-x-6 mb-12">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Full Name</p>
                      <p className="text-lg font-bold text-zinc-900">{user.name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Role</p>
                      <p className="text-lg font-bold text-zinc-900 capitalize">{user.role}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Status</p>
                      <p className="text-lg font-bold text-zinc-900">{user.isActive ? "Active" : "Inactive"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Phone</p>
                      <p className="text-lg font-bold text-zinc-900">{user.phone || "-"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Geofence Boundary</p>
                      <p className="text-lg font-bold text-zinc-900">{user.geofenceName || "-"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Assigned Project</p>
                      <p className="text-lg font-bold text-zinc-900">{user.projectName || "-"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Reporter</p>
                      <p className="text-lg font-bold text-zinc-900">{user.reportsToName || "-"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Attendance Policy</p>
                      <p className="text-lg font-bold text-zinc-900">{user.attendancePolicyName || "-"}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Bio / Notes</p>
                    <p className="text-zinc-500 leading-relaxed">
                      Active corporate team member of VPG Estate mapped to the {user.role} role. Equipped with complete platform authorization to manage property assets and process corporate estate resources.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="requests">
              <DataTable columns={columns} data={mockRequests} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
