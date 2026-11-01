"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  ArrowLeft, 
  Edit2, 
  Mail, 
  Phone, 
  MoreVertical, 
  Briefcase, 
  Building2, 
  CreditCard, 
  Heart, 
  PhoneCall,
  Calendar,
  IndianRupee,
  ShieldCheck
} from "lucide-react"
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
import { indentService } from "@/service/indents.api"

type IndentRequest = {
  id: string
  items: string
  status: string
  date: string
}

export function StaffProfileContent({ id }: { id: string }) {
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const { getUserById } = useUsers({ skipFetch: true })
  const [user, setUser] = useState<Staff | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [indents, setIndents] = useState<IndentRequest[]>([])
  const [isLoadingIndents, setIsLoadingIndents] = useState(true)

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

  const fetchIndents = useCallback(async () => {
    try {
      setIsLoadingIndents(true)
      const res = await indentService.getIndents({ userId: id })
      console.log("FETCHED INDENTS FOR USER", id, res)
      const rawIndents = res.data || []
      
      const mapped = rawIndents.map((ind: any) => {
        const itemNames = ind.items?.map((i: any) => 
          i.itemModel === "Asset" ? i.itemId?.assetName || "Asset" : i.itemId?.itemName || "Item"
        ).join(", ") || "N/A"

        return {
          id: ind.indentId,
          items: itemNames,
          status: ind.status?.toUpperCase() || "PENDING",
          date: new Date(ind.createdAt).toLocaleDateString(),
          _raw: ind
        }
      })
      setIndents(mapped)
    } catch (err) {
      console.error("Failed to load indents:", err)
    } finally {
      setIsLoadingIndents(false)
    }
  }, [id])

  useEffect(() => {
    fetchUser()
    fetchIndents()
  }, [fetchUser, fetchIndents])

  const columns: ColumnDef<IndentRequest>[] = [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "items", header: "Items" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = (row.getValue("status") as string) || "PENDING"
        const variants: Record<string, string> = {
          "PENDING": "bg-amber-100 text-amber-600 border-none",
          "MANAGERAPPROVED": "bg-amber-100 text-amber-600 border-none",
          "APPROVED": "bg-emerald-100 text-emerald-600 border-none",
          "CONVERTEDTOPO": "bg-blue-100 text-blue-600 border-none",
          "REJECTED": "bg-rose-100 text-rose-600 border-none",
        }
        const badgeColor = variants[status] || "bg-zinc-100 text-zinc-600 border-none"
        return (
          <Badge variant="outline" className={`rounded-full font-bold text-[10px] uppercase px-3 ${badgeColor}`}>
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
              <div className="flex flex-wrap items-center justify-center gap-1.5 mb-6">
                <Badge variant="outline" className="px-3 py-1 font-bold text-[10px] uppercase bg-primary/10 text-primary border-primary/20 rounded-full">
                  {user.role}
                </Badge>
                {user.designation && (
                  <Badge variant="outline" className="px-3 py-1 font-bold text-[10px] bg-zinc-100 text-zinc-700 border-zinc-200 rounded-full">
                    {user.designation}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 py-6 border-y border-zinc-50">
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Properties</p>
                  <p className="text-xl font-black text-zinc-900">{user.properties || 0}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Requests</p>
                  <p className="text-xl font-black text-zinc-900">{indents.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
            <CardContent className="p-8">
              <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-6">Contact & Personal</h4>
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 shrink-0">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">Email</span>
                    <span className="text-sm font-bold text-zinc-900 break-all">{user.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 shrink-0">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">Phone</span>
                    <span className="text-sm font-bold text-zinc-900">{user.phone || "-"}</span>
                  </div>
                </div>

                {user.emergencyContactNumber && (
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                      <PhoneCall className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">Emergency Contact</span>
                      <span className="text-sm font-bold text-zinc-900">{user.emergencyContactNumber}</span>
                    </div>
                  </div>
                )}

                {user.bloodGroup && (
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                      <Heart className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">Blood Group</span>
                      <span className="text-sm font-bold text-rose-600">{user.bloodGroup}</span>
                    </div>
                  </div>
                )}

                {user.aadhaarNumber && (
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 shrink-0">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">Aadhaar Card</span>
                      <span className="text-sm font-bold text-zinc-900 font-mono tracking-wider">
                        {user.aadhaarNumber.length === 12
                          ? `${user.aadhaarNumber.slice(0, 4)} ${user.aadhaarNumber.slice(4, 8)} ${user.aadhaarNumber.slice(8)}`
                          : user.aadhaarNumber}
                      </span>
                    </div>
                  </div>
                )}
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
                <CardContent className="p-10 space-y-10">
                  {/* Section 1: Employment & Professional Details */}
                  <div>
                    <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-primary" /> Professional & Employment
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-6">
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Full Name</p>
                        <p className="text-base font-bold text-zinc-900">{user.name}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Role</p>
                        <p className="text-base font-bold text-zinc-900 capitalize">{user.role}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Designation</p>
                        <p className="text-base font-bold text-zinc-900">{user.designation || "-"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Status</p>
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-zinc-400"}`} />
                          <p className="text-base font-bold text-zinc-900">{user.isActive ? "Active" : "Inactive"}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Date of Joining</p>
                        <p className="text-base font-bold text-zinc-900">
                          {user.dateOfJoining
                            ? new Date(user.dateOfJoining).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                            : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Monthly Salary</p>
                        <p className="text-base font-black text-zinc-900">
                          {user.salary !== undefined && user.salary !== null && (user.salary as any) !== ""
                            ? `₹${Number(user.salary).toLocaleString("en-IN")}`
                            : "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <hr className="border-zinc-100" />

                  {/* Section 2: Work Allocation & Operations */}
                  <div>
                    <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" /> Work Allocation & Operations
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-6">
                      <div className="sm:col-span-2 lg:col-span-1">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Assigned Project(s)</p>
                        {user.projectNames && Object.keys(user.projectNames).length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {Object.values(user.projectNames).map((pName, idx) => (
                              <Badge key={idx} variant="secondary" className="font-bold text-xs bg-zinc-100 text-zinc-800">
                                {pName}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-base font-bold text-zinc-900">{user.projectName || "-"}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Geofence Boundaries</p>
                        {user.geofenceNames && Object.keys(user.geofenceNames).length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {Object.entries(user.geofenceNames).map(([id, name]) => (
                              <Badge key={id} variant="secondary" className="bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border-none px-2.5 py-0.5 rounded-lg text-xs font-semibold">
                                {name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-base font-bold text-zinc-900">{user.geofenceName || "-"}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Reporting Manager (Reporter)</p>
                        <p className="text-base font-bold text-zinc-900">{user.reportsToName || "-"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Attendance Policy</p>
                        <p className="text-base font-bold text-zinc-900">{user.attendancePolicyName || "-"}</p>
                      </div>
                      {user.primaryNodeName && (
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Primary Business Unit</p>
                          <p className="text-base font-bold text-zinc-900">{user.primaryNodeName}</p>
                        </div>
                      )}
                      {user.nodeNames && user.nodeNames.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Assigned Units / Nodes</p>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {user.nodeNames.map((nName, idx) => (
                              <Badge key={idx} variant="outline" className="font-bold text-xs text-zinc-700">
                                {nName}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <hr className="border-zinc-100" />

                  {/* Section 3: Bio / Notes */}
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Bio / Notes</p>
                    <p className="text-zinc-500 leading-relaxed text-sm font-medium">
                      Active corporate team member of VPG Estate mapped to the <strong className="text-zinc-800">{user.role}</strong> role{user.designation ? ` as ${user.designation}` : ""}. Equipped with complete platform authorization to manage property assets and process corporate estate resources.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="requests">
              <DataTable columns={columns} data={indents} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
