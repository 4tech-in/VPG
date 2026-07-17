"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowLeft, Mail, Phone, User, Eye, EyeOff, Briefcase, Network, Building, Camera } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useRoles } from "@/hooks/use-roles"
import { useUnits } from "@/hooks/use-units"
import { useUsers, Staff } from "@/hooks/use-users"
import { useAuthStore } from "@/store/use-auth-store"
import { useOrganizations } from "@/hooks/use-organizations"
import { geofenceService } from "@/service/geofenceService"
import { projectService } from "@/service/projectService"
import { attendancePolicyService } from "@/service/attendancePolicyService"
import { toast } from "sonner"

type StaffFormProps = {
  initialValues?: Partial<Staff>
  isDialog?: boolean
  onSuccess?: () => void
}

export function StaffForm({ initialValues, isDialog, onSuccess }: StaffFormProps) {
  const { roles, isLoading: rolesLoading, refetch: refetchRoles } = useRoles({ skipFetch: true })
  const { units, isLoading: unitsLoading, refetch: refetchUnits } = useUnits(false)
  const { allUsers, addUser, editUser, isLoading: userActionLoading, refetch: refetchUsers } = useUsers({ skipFetch: true })
  // Geofence Infinite Scroll State
  const [geofencesList, setGeofencesList] = useState<any[]>([])
  const [hasMoreGeofences, setHasMoreGeofences] = useState(true)
  const [isGeofencesLoading, setIsGeofencesLoading] = useState(false)
  const geofenceObserverRef = useRef<HTMLDivElement | null>(null)

  // Projects Infinite Scroll State
  const [projectsList, setProjectsList] = useState<any[]>([])
  const [hasMoreProjects, setHasMoreProjects] = useState(true)
  const [isProjectsLoading, setIsProjectsLoading] = useState(false)
  const projectObserverRef = useRef<HTMLDivElement | null>(null)

  // Attendance Policies Infinite Scroll State
  const [policiesList, setPoliciesList] = useState<any[]>([])
  const [hasMorePolicies, setHasMorePolicies] = useState(true)
  const [isPoliciesLoading, setIsPoliciesLoading] = useState(false)
  const policyObserverRef = useRef<HTMLDivElement | null>(null)

  // Refs to track current page for scroll-based pagination
  const geofencePageRef = useRef(1)
  const projectPageRef = useRef(1)
  const policyPageRef = useRef(1)
  const isGeofenceFetchingRef = useRef(false)
  const isProjectFetchingRef = useRef(false)
  const isPolicyFetchingRef = useRef(false)
  const hasFetchedGeofences = useRef(false)
  const hasFetchedProjects = useRef(false)
  const hasFetchedPolicies = useRef(false)

  // Fetch functions
  const fetchGeofencesPage = async (page: number) => {
    if (isGeofenceFetchingRef.current) return
    isGeofenceFetchingRef.current = true
    setIsGeofencesLoading(true)
    try {
      const response = await geofenceService.getGeofences({ page, limit: 10 })
      const mapped = response.geofences.map((g: any) => ({
        id: String(g._id || g.id || ""),
        name: g.name,
      }))
      setGeofencesList(prev => page === 1 ? mapped : [...prev, ...mapped])
      setHasMoreGeofences(page < response.pagination.totalPages)
      geofencePageRef.current = page
    } catch (e) {
      console.error(e)
      setHasMoreGeofences(false)
    } finally {
      isGeofenceFetchingRef.current = false
      setIsGeofencesLoading(false)
    }
  }

  const fetchProjectsPage = async (page: number) => {
    if (isProjectFetchingRef.current) return
    isProjectFetchingRef.current = true
    setIsProjectsLoading(true)
    try {
      const response = await projectService.getProjects({ page, limit: 10 })
      const mapped = response.projects.map((p: any) => ({
        id: String(p._id || p.id || ""),
        name: p.projectName,
      }))
      setProjectsList(prev => page === 1 ? mapped : [...prev, ...mapped])
      setHasMoreProjects(page < response.pagination.totalPages)
      projectPageRef.current = page
    } catch (e) {
      console.error(e)
      setHasMoreProjects(false)
    } finally {
      isProjectFetchingRef.current = false
      setIsProjectsLoading(false)
    }
  }

  const fetchPoliciesPage = async (page: number) => {
    if (isPolicyFetchingRef.current) return
    isPolicyFetchingRef.current = true
    setIsPoliciesLoading(true)
    try {
      const response = await attendancePolicyService.getPolicies({ page, limit: 10 })
      const mapped = response.data.map((ap: any) => ({
        id: String(ap._id || ap.id || ""),
        name: ap.name,
      }))
      setPoliciesList(prev => page === 1 ? mapped : [...prev, ...mapped])
      const totalPages = response.pagination?.totalPages || 1
      setHasMorePolicies(page < totalPages)
      policyPageRef.current = page
    } catch (e) {
      console.error(e)
      setHasMorePolicies(false)
    } finally {
      isPolicyFetchingRef.current = false
      setIsPoliciesLoading(false)
    }
  }

  // No longer fetching on mount to prevent unnecessary API calls unless dropdowns are clicked


  // Observers for infinite scrolling — deps do NOT include page to avoid re-trigger loops
  useEffect(() => {
    if (!hasMoreGeofences || isGeofencesLoading) return
    const currentRef = geofenceObserverRef.current
    if (!currentRef) return

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isGeofenceFetchingRef.current) {
        fetchGeofencesPage(geofencePageRef.current + 1)
      }
    }, { threshold: 0.1 })

    observer.observe(currentRef)
    return () => observer.disconnect()
  }, [hasMoreGeofences, isGeofencesLoading])

  useEffect(() => {
    if (!hasMoreProjects || isProjectsLoading) return
    const currentRef = projectObserverRef.current
    if (!currentRef) return

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isProjectFetchingRef.current) {
        fetchProjectsPage(projectPageRef.current + 1)
      }
    }, { threshold: 0.1 })

    observer.observe(currentRef)
    return () => observer.disconnect()
  }, [hasMoreProjects, isProjectsLoading])

  useEffect(() => {
    if (!hasMorePolicies || isPoliciesLoading) return
    const currentRef = policyObserverRef.current
    if (!currentRef) return

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isPolicyFetchingRef.current) {
        fetchPoliciesPage(policyPageRef.current + 1)
      }
    }, { threshold: 0.1 })

    observer.observe(currentRef)
    return () => observer.disconnect()
  }, [hasMorePolicies, isPoliciesLoading])

  const { user: loggedInUser, hasPermission } = useAuthStore()
  const isSuperAdmin = loggedInUser?.roleId?.name === "superAdmin"
  const { allOrganizations, refetch: refetchOrganizations } = useOrganizations({ skipFetch: true })

  const [name, setName] = useState(initialValues?.name || "")
  const [email, setEmail] = useState(initialValues?.email || "")
  const [phone, setPhone] = useState(initialValues?.phone || "")
  const [password, setPassword] = useState("")
  const [roleId, setRoleId] = useState(initialValues?.roleId || "")
  const [reportsTo, setReportsTo] = useState(initialValues?.reportsTo || "none")
  const [primaryNodeId, setPrimaryNodeId] = useState(initialValues?.primaryNodeId || "")
  const [geofenceId, setGeofenceId] = useState(initialValues?.geofenceId || "none")
  const [projectId, setProjectId] = useState(initialValues?.projectId || "none")
  const [attendancePolicyId, setAttendancePolicyId] = useState(initialValues?.attendancePolicyId || "none")
  const [organizationId, setOrganizationId] = useState(initialValues?.organizationId || "")
  
  // Custom multi-select or single selection list for nodeIds
  const [selectedNodes, setSelectedNodes] = useState<string[]>(initialValues?.nodeIds || [])
  const [showPassword, setShowPassword] = useState(false)

  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>(initialValues?.avatarUrl || "")

  // Sync state if initialValues changes
  useEffect(() => {
    if (initialValues) {
      setName(initialValues.name || "")
      setEmail(initialValues.email || "")
      setPhone(initialValues.phone || "")
      setRoleId(initialValues.roleId || "")
      setReportsTo(initialValues.reportsTo || "none")
      setPrimaryNodeId(initialValues.primaryNodeId || "")
      setSelectedNodes(initialValues.nodeIds || [])
      setPreviewUrl(initialValues.avatarUrl || "")
      setProfileImageFile(null)
      setGeofenceId(initialValues.geofenceId || "none")
      setProjectId(initialValues.projectId || "none")
      setAttendancePolicyId(initialValues.attendancePolicyId || "none")
      setOrganizationId(initialValues.organizationId || "")
    }
  }, [initialValues])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProfileImageFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleToggleNode = (nodeId: string) => {
    setSelectedNodes((prev) => {
      const next = prev.includes(nodeId) ? prev.filter((id) => id !== nodeId) : [...prev, nodeId]
      // Clear primaryNodeId if it is removed from node list
      if (!next.includes(primaryNodeId)) {
        setPrimaryNodeId("")
      }
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) return toast.error("Full Name is required")
    if (!email.trim()) return toast.error("Email is required")
    if (!roleId) return toast.error("Role is required")
    if (isSuperAdmin && !organizationId) return toast.error("Organization is required")

    try {
      const payload: any = {
        name,
        email,
        mobile: phone,
        roleId,
        nodeIds: selectedNodes,
        primaryNodeId: primaryNodeId || null,
        reportsTo: isSuperAdmin || reportsTo === "none" || !reportsTo ? null : reportsTo,
        geofenceId: geofenceId === "none" || !geofenceId ? null : geofenceId,
        projectId: projectId === "none" || !projectId ? null : projectId,
        attendancePolicyId: attendancePolicyId === "none" || !attendancePolicyId ? null : attendancePolicyId,
      }
      if (isSuperAdmin && organizationId) {
        payload.organizationId = organizationId
      }
      if (profileImageFile) {
        payload.profileImage = profileImageFile
      }
      if (password) {
        payload.password = password
      } else if (!initialValues) {
        // Password is required for new users
        return toast.error("Password is required for new users")
      }

      if (initialValues?.id) {
        await editUser(initialValues.id, payload)
      } else {
        await addUser(payload)
      }

      if (onSuccess) onSuccess()
    } catch (err: any) {
      // toast already called by editUser/addUser hooks
    }
  }

  const activeRoles = roles.filter((r) => r.isActive)
  const activeUnits = units.filter((u) => u.status === "Active")
  
  // Filter out the user itself from reportsTo select dropdown list when editing
  const potentialReportsTo = allUsers.filter((u) => u.isActive && (!initialValues || u.id !== initialValues.id))


  const isLoading = rolesLoading || unitsLoading || userActionLoading

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {!isDialog && (
        <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
          <Link href="/users">
            <Button type="button" variant="ghost" size="icon" className="rounded-full h-10 w-10 bg-white shadow-sm border border-zinc-100 hover:bg-zinc-50 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-black text-zinc-900 tracking-tight">
              {initialValues ? "Edit Staff Member" : "Add New Staff"}
            </h1>
            <p className="text-sm text-zinc-500 font-medium mt-1">Fill in the details below to register a corporate member.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-8">
        {/* Profile & Personal Info Card */}
        <div className={cn(
          "bg-white border border-zinc-100 shadow-sm rounded-[2rem] p-6 sm:p-10 transition-all duration-300 hover:shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75 fill-mode-both",
          isDialog && "border-none shadow-none p-0 hover:shadow-none"
        )}>
          <div className="flex flex-col sm:flex-row gap-10 items-start">
            <div className="relative group cursor-pointer shrink-0" onClick={() => document.getElementById("profile-image-upload")?.click()}>
              <Avatar className="h-32 w-32 sm:h-40 sm:w-40 rounded-[2rem] border-4 border-zinc-50 shadow-sm bg-zinc-100 flex items-center justify-center overflow-hidden transition-all group-hover:scale-105 group-hover:shadow-lg">
                <AvatarImage src={previewUrl} className="object-cover" />
                <AvatarFallback className="bg-primary/5 text-primary text-4xl font-black">
                  {name ? name[0].toUpperCase() : <User className="h-16 w-16 text-zinc-300" />}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/40 rounded-[2rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Camera className="h-10 w-10 text-white" />
              </div>
              <input
                type="file"
                id="profile-image-upload"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            <div className="flex-1 w-full">
              <div className="flex flex-col gap-1 mb-8">
                <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                  Personal Details
                </h2>
                <p className="text-sm text-zinc-400">
                  Basic information and contact details for the member.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Full Name <span className="text-destructive">*</span></Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 focus-visible:ring-primary font-medium transition-colors hover:bg-zinc-50"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Email Address <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="staff@vpg.estate"
                      type="email"
                      className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 focus-visible:ring-primary font-medium transition-colors hover:bg-zinc-50"
                      required
                    />
                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/60" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Phone Number</Label>
                  <div className="relative">
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 focus-visible:ring-primary font-medium transition-colors hover:bg-zinc-50"
                    />
                    <Phone className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-300" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    Password {initialValues && <span className="text-[10px] text-zinc-400 font-bold tracking-normal normal-case">(Leave blank to keep current)</span>} {!initialValues && <span className="text-destructive">*</span>}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 pr-12 focus-visible:ring-primary font-medium transition-colors hover:bg-zinc-50"
                      required={!initialValues}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Corporate Profile Card */}
        <div className={cn(
          "bg-white border border-zinc-100 shadow-sm rounded-[2rem] p-6 sm:p-10 transition-all duration-300 hover:shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 fill-mode-both",
          isDialog && "border-none shadow-none p-0 hover:shadow-none"
        )}>
          <div className="flex flex-col gap-1 mb-8">
            <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" /> Corporate Role
            </h2>
            <p className="text-sm text-zinc-400">
              Set the organization, role, and reporting structure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {isSuperAdmin && (
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Organization <span className="text-destructive">*</span></Label>
                <Select
                  value={organizationId}
                  onValueChange={setOrganizationId}
                  onOpenChange={(open) => {
                    if (open && allOrganizations.length === 0) {
                      refetchOrganizations()
                    }
                  }}
                >
                  <SelectTrigger className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 focus:ring-primary font-medium transition-colors hover:bg-zinc-50">
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-zinc-100 shadow-xl max-h-[250px] overflow-y-auto">
                    {allOrganizations?.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-zinc-400" />
                          {org.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Role <span className="text-destructive">*</span></Label>
              <Select
                value={roleId}
                onValueChange={setRoleId}
                onOpenChange={(open) => {
                  if (open && roles.length === 0) {
                    refetchRoles()
                  }
                }}
              >
                <SelectTrigger className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 focus:ring-primary font-medium transition-colors hover:bg-zinc-50">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
                  {initialValues?.roleId && !activeRoles.some(r => r.id === initialValues.roleId) && (
                    <SelectItem value={initialValues.roleId}>{initialValues.role || "Current Role"}</SelectItem>
                  )}
                  {activeRoles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!isSuperAdmin && (
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Reports To</Label>
                <Select
                  value={reportsTo}
                  onValueChange={setReportsTo}
                  onOpenChange={(open) => {
                    if (open && allUsers.length === 0) {
                      refetchUsers()
                    }
                  }}
                >
                  <SelectTrigger className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 focus:ring-primary font-medium transition-colors hover:bg-zinc-50">
                    <SelectValue placeholder="Select reporting manager" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
                    <SelectItem value="none">None / Self-Managed</SelectItem>
                    {initialValues?.reportsTo && initialValues.reportsTo !== "none" && !potentialReportsTo.some(u => u.id === initialValues.reportsTo) && (
                      <SelectItem value={initialValues.reportsTo}>{initialValues.reportsToName || "Current Manager"}</SelectItem>
                    )}
                    {potentialReportsTo.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} <span className="text-zinc-400">({u.role})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {selectedNodes.length > 0 && (
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Primary Operating Unit</Label>
                <Select
                  value={primaryNodeId}
                  onValueChange={setPrimaryNodeId}
                  onOpenChange={(open) => {
                    if (open && units.length === 0) {
                      refetchUnits()
                    }
                  }}
                >
                  <SelectTrigger className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 focus:ring-primary font-medium transition-colors hover:bg-zinc-50">
                    <SelectValue placeholder="Select primary operating unit" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
                    {activeUnits
                      .filter((u) => selectedNodes.includes(u.id))
                      .map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Location & Assignments Card */}
        <div className={cn(
          "bg-white border border-zinc-100 shadow-sm rounded-[2rem] p-6 sm:p-10 transition-all duration-300 hover:shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-both",
          isDialog && "border-none shadow-none p-0 hover:shadow-none"
        )}>
          <div className="flex flex-col gap-1 mb-8">
            <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
              <Network className="h-5 w-5 text-primary" /> Assignments & Tracking
            </h2>
            <p className="text-sm text-zinc-400">
              Configure geofences, projects, and attendance policies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Geofence Boundary</Label>
              <Select
                value={geofenceId}
                onValueChange={setGeofenceId}
                onOpenChange={(open) => {
                  if (open && !hasFetchedGeofences.current && !isGeofenceFetchingRef.current) {
                    hasFetchedGeofences.current = true
                    fetchGeofencesPage(1)
                  }
                }}
              >
                <SelectTrigger className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 focus:ring-primary font-medium transition-colors hover:bg-zinc-50">
                  <SelectValue placeholder="Select geofence boundary" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-zinc-100 shadow-xl max-h-[250px] overflow-y-auto">
                  <SelectItem value="none">None / No Geofence</SelectItem>
                  {initialValues?.geofenceId && initialValues.geofenceId !== "none" && !geofencesList.some(g => g.id === initialValues.geofenceId) && (
                    <SelectItem value={initialValues.geofenceId}>{initialValues.geofenceName || "Current Geofence"}</SelectItem>
                  )}
                  {geofencesList.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                  {hasMoreGeofences && (
                    <div ref={geofenceObserverRef} className="p-2 text-center text-xs text-zinc-400 font-semibold bg-zinc-50/50">
                      {isGeofencesLoading ? "Loading..." : "Scroll for more"}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Assigned Project</Label>
              <Select
                value={projectId}
                onValueChange={setProjectId}
                onOpenChange={(open) => {
                  if (open && !hasFetchedProjects.current && !isProjectFetchingRef.current) {
                    hasFetchedProjects.current = true
                    fetchProjectsPage(1)
                  }
                }}
              >
                <SelectTrigger className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 focus:ring-primary font-medium transition-colors hover:bg-zinc-50">
                  <SelectValue placeholder="Select corporate project" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-zinc-100 shadow-xl max-h-[250px] overflow-y-auto">
                  <SelectItem value="none">None / Unassigned</SelectItem>
                  {initialValues?.projectId && initialValues.projectId !== "none" && !projectsList.some(p => p.id === initialValues.projectId) && (
                    <SelectItem value={initialValues.projectId}>{initialValues.projectName || "Current Project"}</SelectItem>
                  )}
                  {projectsList.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                  {hasMoreProjects && (
                    <div ref={projectObserverRef} className="p-2 text-center text-xs text-zinc-400 font-semibold bg-zinc-50/50">
                      {isProjectsLoading ? "Loading..." : "Scroll for more"}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Attendance Policy</Label>
              <Select
                value={attendancePolicyId}
                onValueChange={setAttendancePolicyId}
                onOpenChange={(open) => {
                  if (open && !hasFetchedPolicies.current && !isPolicyFetchingRef.current) {
                    hasFetchedPolicies.current = true
                    fetchPoliciesPage(1)
                  }
                }}
              >
                <SelectTrigger className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 focus:ring-primary font-medium transition-colors hover:bg-zinc-50">
                  <SelectValue placeholder="Select attendance ruleset" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-zinc-100 shadow-xl max-h-[250px] overflow-y-auto">
                  <SelectItem value="none">None / System Default</SelectItem>
                  {initialValues?.attendancePolicyId && initialValues.attendancePolicyId !== "none" && !policiesList.some(ap => ap.id === initialValues.attendancePolicyId) && (
                    <SelectItem value={initialValues.attendancePolicyId}>{initialValues.attendancePolicyName || "Current Policy"}</SelectItem>
                  )}
                  {policiesList.map((ap) => (
                    <SelectItem key={ap.id} value={ap.id}>
                      {ap.name}
                    </SelectItem>
                  ))}
                  {hasMorePolicies && (
                    <div ref={policyObserverRef} className="p-2 text-center text-xs text-zinc-400 font-semibold bg-zinc-50/50">
                      {isPoliciesLoading ? "Loading..." : "Scroll for more"}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 fill-mode-both">
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
            className="rounded-2xl h-14 px-8 border-zinc-200 font-bold hover:bg-zinc-50 min-w-[140px] text-zinc-600 transition-all hover:border-zinc-300"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="rounded-2xl h-14 px-12 font-bold shadow-lg shadow-primary/20 min-w-[180px] transition-all hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0"
            disabled={isLoading}
          >
            {isLoading ? "Saving Profile..." : (initialValues ? "Update Member" : "Save Staff Member")}
          </Button>
        </div>
      </div>
    </form>
  )
}
