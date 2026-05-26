"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Mail, Phone, User, Eye, EyeOff, Briefcase, Network, Building } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useRoles } from "@/hooks/use-roles"
import { useUnits } from "@/hooks/use-units"
import { useUsers, Staff } from "@/hooks/use-users"
import { toast } from "sonner"

type StaffFormProps = {
  initialValues?: Partial<Staff>
  isDialog?: boolean
  onSuccess?: () => void
}

export function StaffForm({ initialValues, isDialog, onSuccess }: StaffFormProps) {
  const { roles, isLoading: rolesLoading } = useRoles()
  const { units, isLoading: unitsLoading } = useUnits(true)
  const { allUsers, addUser, editUser, isLoading: userActionLoading } = useUsers()

  const [name, setName] = useState(initialValues?.name || "")
  const [email, setEmail] = useState(initialValues?.email || "")
  const [phone, setPhone] = useState(initialValues?.phone || "")
  const [password, setPassword] = useState("")
  const [roleId, setRoleId] = useState(initialValues?.roleId || "")
  const [reportsTo, setReportsTo] = useState(initialValues?.reportsTo || "none")
  const [primaryNodeId, setPrimaryNodeId] = useState(initialValues?.primaryNodeId || "")
  
  // Custom multi-select or single selection list for nodeIds
  const [selectedNodes, setSelectedNodes] = useState<string[]>(initialValues?.nodeIds || [])
  const [showPassword, setShowPassword] = useState(false)

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
    }
  }, [initialValues])

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

    try {
      const payload: any = {
        name,
        email,
        mobile: phone,
        roleId,
        nodeIds: selectedNodes,
        primaryNodeId: primaryNodeId || null,
        reportsTo: reportsTo === "none" || !reportsTo ? null : reportsTo,
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {!isDialog && (
        <div className="flex items-center gap-4">
          <Link href="/users">
            <Button type="button" variant="ghost" size="icon" className="rounded-full h-10 w-10 bg-white shadow-sm border border-zinc-100">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">
            {initialValues ? "Edit Staff Member" : "Add New Staff"}
          </h1>
        </div>
      )}

      <div className={cn(
        "bg-white overflow-hidden",
        !isDialog && "border-none shadow-sm rounded-3xl p-8 sm:p-12"
      )}>
        <div className="flex flex-col sm:flex-row gap-12 mb-12 items-start">
          <div className="relative group">
            <Avatar className="h-32 w-32 rounded-[2.5rem] border-4 border-zinc-50 shadow-sm bg-zinc-100 flex items-center justify-center">
              <AvatarFallback className="bg-primary/5 text-primary text-3xl font-black">
                {name ? name[0].toUpperCase() : <User className="h-12 w-12 text-zinc-300" />}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold text-zinc-900">Member Profile</h2>
            <p className="text-sm text-zinc-400 max-w-xs">
              Fill in the corporate profile and resource mapping details for VPG Estate members.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Full Name <span className="text-destructive">*</span></Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter full name"
              className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 focus-visible:ring-primary font-medium"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Email Address <span className="text-destructive">*</span></Label>
            <div className="relative">
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@VPG.estate"
                type="email"
                className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 focus-visible:ring-primary font-medium"
                required
              />
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Phone Number</Label>
            <div className="relative">
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+34 000 000 000"
                className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 focus-visible:ring-primary font-medium"
              />
              <Phone className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-300" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Password {initialValues && <span className="text-[10px] text-zinc-400 font-bold tracking-normal">(Leave blank to keep current)</span>} {!initialValues && <span className="text-destructive">*</span>}
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 pr-12 focus-visible:ring-primary font-medium"
                required={!initialValues}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-500 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Role <span className="text-destructive">*</span></Label>
            <Select value={roleId} onValueChange={setRoleId}>
              <SelectTrigger className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 focus:ring-primary font-medium">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
                {activeRoles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Reports To</Label>
            <Select value={reportsTo} onValueChange={setReportsTo}>
              <SelectTrigger className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 focus:ring-primary font-medium">
                <SelectValue placeholder="Select reporting manager" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
                <SelectItem value="none">None / Self-Managed</SelectItem>
                {potentialReportsTo.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 md:col-span-2 border-t border-zinc-50 pt-6">
            <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="h-4 w-4 text-primary" /> Operating Units Selection
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {activeUnits.map((u) => {
                const isSelected = selectedNodes.includes(u.id)
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleToggleNode(u.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 border rounded-2xl transition-all font-bold text-center gap-1 h-20 shadow-sm",
                      isSelected
                        ? "bg-primary border-primary text-white scale-[1.02]"
                        : "bg-white border-zinc-100 text-zinc-700 hover:bg-zinc-50"
                    )}
                  >
                    <span className="text-[13px] leading-tight">{u.label}</span>
                    <span className={cn(
                      "text-[9px] uppercase font-bold",
                      isSelected ? "text-white/80" : "text-zinc-400"
                    )}>
                      {u.value}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {selectedNodes.length > 0 && (
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Primary Operating Unit</Label>
              <Select value={primaryNodeId} onValueChange={setPrimaryNodeId}>
                <SelectTrigger className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 focus:ring-primary font-medium">
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

        <div className="flex justify-end gap-4 mt-16 pt-8 border-t border-zinc-50">
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
            className="rounded-2xl h-14 px-8 border-zinc-100 font-bold hover:bg-zinc-50 min-w-[140px]"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="rounded-2xl h-14 px-12 font-bold shadow-lg shadow-primary/20 min-w-[180px]"
            disabled={isLoading}
          >
            {isLoading ? "Saving Profile..." : (initialValues ? "Update Member" : "Save Staff Member")}
          </Button>
        </div>
      </div>
    </form>
  )
}
