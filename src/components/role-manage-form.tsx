"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { 
  ArrowLeft, 
  LayoutGrid, 
  User, 
  LucideView, 
  ShoppingCart, 
  Workflow, 
  Scale, 
  LocateIcon, 
  Store, 
  Calendar, 
  User2, 
  DollarSign, 
  Box, 
  ShieldCheck, 
  Settings,
  Eye,
  PlusCircle,
  Edit2,
  Trash2,
  CheckSquare
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Checkbox } from "./ui/checkbox"
// import { Checkbox } from "@/components/ui/checkbox"

const formSchema = z.object({
  name: z.string().min(1, {
    message: "Role name is required.",
  }),
  scope: z.string().min(1, {
    message: "Access scope is required.",
  }),
  permissions: z.array(z.string()),
})

interface RoleManageFormProps {
  initialValues?: {
    id: string
    name: string
    scope: string
    permissions: string[]
  }
  onSubmit: (values: z.infer<typeof formSchema>) => Promise<void>
}

// Module configuration mapping icons and permission base keys
const MODULES_CONFIG = [
  { prefix: "dashboard", label: "Dashboard", icon: LayoutGrid, category: "MAIN MENU" },
  { prefix: "user", label: "Staff Management", icon: User, category: "MAIN MENU" },
  { prefix: "livetracking", label: "Live Tracking", icon: LucideView, category: "MAIN MENU" },
  { prefix: "indent", label: "Indent List", icon: ShoppingCart, category: "MAIN MENU" },
  { prefix: "purchase-order", label: "Purchase Orders", icon: ShoppingCart, category: "MAIN MENU" },
  { prefix: "item", label: "Item Configuration", icon: Workflow, category: "MAIN MENU" },
  { prefix: "project", label: "Project Management", icon: Workflow, category: "MAIN MENU" },
  { prefix: "vendor", label: "Vendor Management", icon: Scale, category: "MAIN MENU" },
  { prefix: "geofence", label: "Geofencing", icon: LocateIcon, category: "MAIN MENU" },
  { prefix: "stores", label: "Stores/Warehouse", icon: Store, category: "MAIN MENU" },
  { prefix: "calendar", label: "Calendar Schedules", icon: Calendar, category: "MAIN MENU" },
  { prefix: "attendance", label: "Staff Attendance", icon: User2, category: "MAIN MENU" },
  { prefix: "leave", label: "Leave Requests", icon: Calendar, category: "MAIN MENU" },
  { prefix: "advance", label: "Salary Advance", icon: DollarSign, category: "MAIN MENU" },
  { prefix: "material", label: "Material Management", icon: Box, category: "MAIN MENU" },
  { prefix: "organization", label: "Organization Entities", icon: Workflow, category: "MANAGEMENT" },
  { prefix: "role", label: "Role Permissions", icon: User, category: "MANAGEMENT" },
  { prefix: "task", label: "Task Workflows", icon: Workflow, category: "MANAGEMENT" },
  { prefix: "attendance-policy", label: "Attendance Policy", icon: ShieldCheck, category: "MANAGEMENT" },
  { prefix: "settings", label: "Setting", icon: Settings, category: "SETTING & OTHERS" },
]

export function RoleManageForm({ initialValues, onSubmit: onSubmitProp }: RoleManageFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Helper to fetch all available permission string keys
  const getAllAvailablePermissions = () => {
    const list: string[] = []
    MODULES_CONFIG.forEach((mod) => {
      if (mod.prefix === "settings") {
        // Expand Settings into actual database unit/group/sub-group permissions
        const subprefixes = ["unit", "group", "sub-group"]
        subprefixes.forEach((sub) => {
          list.push(`${sub}:view`, `${sub}:create`, `${sub}:update`, `${sub}:delete`)
        })
      } else if (mod.prefix === "dashboard" || mod.prefix === "livetracking") {
        list.push(`${mod.prefix}:view`)
      } else {
        list.push(`${mod.prefix}:view`, `${mod.prefix}:create`, `${mod.prefix}:update`, `${mod.prefix}:delete`)
      }
    })
    return list
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialValues?.name || "",
      scope: initialValues?.scope || "self",
      permissions: initialValues?.permissions || [],
    },
  })

  // Synchronize dynamic updates on load
  // Synchronize dynamic updates on load
  useEffect(() => {
    if (initialValues) {
      let initialPerms = initialValues.permissions || []
      if (initialPerms.includes("*")) {
        initialPerms = getAllAvailablePermissions()
      } else {
        initialPerms = initialPerms.filter((p) => p !== "*")
      }
      form.reset({
        name: initialValues.name,
        scope: initialValues.scope,
        permissions: initialPerms,
      })
    }
  }, [initialValues, form])

  const watchedPermissions = form.watch("permissions")
  const permissions = useMemo(() => watchedPermissions || [], [watchedPermissions])

  const isSuperAdmin = useMemo(() => {
    const allAvailable = getAllAvailablePermissions()
    return allAvailable.every((p) => permissions.includes(p))
  }, [permissions])

  // Check if a single permission is active
  const isChecked = (perm: string) => {
    // Custom check for settings
    if (perm.startsWith("settings:")) {
      const action = perm.split(":")[1]
      return ["unit", "group", "sub-group"].every((prefix) => 
        permissions.includes(`${prefix}:${action}`)
      )
    }

    return permissions.includes(perm)
  }

  // Toggle single permission key
  const handleTogglePermission = (perm: string) => {
    let current = [...permissions]
    
    let next: string[]
    if (perm.startsWith("settings:")) {
      const action = perm.split(":")[1]
      const subprefixes = ["unit", "group", "sub-group"]
      const subperms = subprefixes.map((prefix) => `${prefix}:${action}`)
      
      const alreadyHasAll = subperms.every((p) => current.includes(p))
      
      if (alreadyHasAll) {
        next = current.filter((p) => !subperms.includes(p))
      } else {
        next = [...current]
        subperms.forEach((p) => {
          if (!next.includes(p)) next.push(p)
        })
      }
    } else {
      if (current.includes(perm)) {
        next = current.filter((p) => p !== perm)
      } else {
        next = [...current, perm]
      }
    }
    
    form.setValue("permissions", next, { shouldValidate: true })
  }

  // Check if all permissions for a specific module are active
  const isModuleAllAccess = (prefix: string) => {
    if (prefix === "dashboard" || prefix === "livetracking") {
      return permissions.includes(`${prefix}:view`)
    }

    if (prefix === "settings") {
      const subprefixes = ["unit", "group", "sub-group"]
      return subprefixes.every((sub) => 
        ["view", "create", "update", "delete"].every((act) => 
          permissions.includes(`${sub}:${act}`)
        )
      )
    }

    const modulePerms = [`${prefix}:view`, `${prefix}:create`, `${prefix}:update`, `${prefix}:delete`]
    return modulePerms.every((p) => permissions.includes(p))
  }

  // Toggle All Access check for a single module
  const handleToggleModuleAllAccess = (prefix: string, checked: boolean) => {
    let current = [...permissions]
    
    let subperms: string[] = []
    if (prefix === "settings") {
      const subprefixes = ["unit", "group", "sub-group"]
      subprefixes.forEach((sub) => {
        subperms.push(`${sub}:view`, `${sub}:create`, `${sub}:update`, `${sub}:delete`)
      })
    } else if (prefix === "dashboard" || prefix === "livetracking") {
      subperms = [`${prefix}:view`]
    } else {
      subperms = [`${prefix}:view`, `${prefix}:create`, `${prefix}:update`, `${prefix}:delete`]
    }
    
    let next: string[]
    if (checked) {
      next = [...current]
      subperms.forEach((p) => {
        if (!next.includes(p)) next.push(p)
      })
    } else {
      next = current.filter((p) => !subperms.includes(p))
    }
    
    form.setValue("permissions", next, { shouldValidate: true })
  }

  // Toggle absolute Super Admin wildcard mode
  const handleToggleSuperAdmin = (checked: boolean) => {
    if (checked) {
      form.setValue("permissions", getAllAvailablePermissions(), { shouldValidate: true })
    } else {
      form.setValue("permissions", [], { shouldValidate: true })
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      let finalPermissions = values.permissions.filter((p) => p !== "*")
      const actions = ["view", "create", "update", "delete"]
      actions.forEach((act) => {
        const subperms = [`unit:${act}`, `group:${act}`, `sub-group:${act}`]
        const hasAll = subperms.every((p) => finalPermissions.includes(p))
        if (!hasAll) {
          finalPermissions = finalPermissions.filter((p) => !subperms.includes(p))
        }
      })

      await onSubmitProp({
        ...values,
        permissions: finalPermissions,
      })
      router.push("/roles")
    } catch (error) {
      // Errors toasted by apiClient
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl border-slate-200 hover:bg-slate-50 transition-colors"
              onClick={() => router.push("/roles")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                {initialValues ? "Edit Role Configuration" : "Create New Role"}
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Set name, dynamic access scope, and customize fine-grained action levels.
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/roles")}
              className="rounded-xl"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-xl shadow-sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving Configuration..." : "Save Role"}
            </Button>
          </div>
        </div>

        {/* Top parameters: Name & Scope */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 border border-slate-200 rounded-2xl shadow-sm">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-700 font-bold">Role Title <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Project Manager, Field Supervisor" {...field} className="rounded-xl focus-visible:ring-primary/20" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="scope"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-700 font-bold">Access Scope <span className="text-destructive">*</span></FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl focus:ring-primary/20">
                      <SelectValue placeholder="Select access scope" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="organization">Organization (Full Company access)</SelectItem>
                    <SelectItem value="unit">Unit (Single operating unit)</SelectItem>
                    <SelectItem value="child_units">Child Units (Parent and branch operating units)</SelectItem>
                    <SelectItem value="team">Team (Workforce team scope)</SelectItem>
                    <SelectItem value="self">Self (Self data access scope)</SelectItem>
                    <SelectItem value="custom">Custom (Bespoke node queries)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Global Override Card */}
        <div className="bg-zinc-900 text-white p-5 border border-zinc-950 rounded-2xl shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/10 text-amber-400 border border-white/10">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="font-bold text-sm">Full Administrative Privilege</div>
              <p className="text-[11px] text-zinc-400 mt-0.5">Grants complete permissions across all modules (Wildcard access).</p>
            </div>
          </div>
          <Checkbox 
            checked={isSuperAdmin} 
            onCheckedChange={(checked) => handleToggleSuperAdmin(!!checked)}
            className="border-white/40 data-[state=checked]:bg-white data-[state=checked]:text-zinc-900 h-6 w-6 transition-all"
          />
        </div>

        {/* Beautiful Mockup grid permissions table */}
        <div className="w-full overflow-hidden border border-slate-200 rounded-2xl shadow-sm bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="py-4 px-6 font-bold text-zinc-800 text-[11px] uppercase tracking-wider min-w-[280px]">
                    Module Name
                  </th>
                  <th className="py-4 px-4 font-bold text-center border-l border-slate-100 min-w-[120px]">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="h-7 w-7 flex items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                        <CheckSquare className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-600">All Access</span>
                    </div>
                  </th>
                  <th className="py-4 px-4 font-bold text-center border-l border-slate-100 min-w-[120px]">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="h-7 w-7 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <Eye className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600">Read</span>
                    </div>
                  </th>
                  <th className="py-4 px-4 font-bold text-center border-l border-slate-100 min-w-[120px]">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="h-7 w-7 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <PlusCircle className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600">Create</span>
                    </div>
                  </th>
                  <th className="py-4 px-4 font-bold text-center border-l border-slate-100 min-w-[120px]">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="h-7 w-7 flex items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                        <Edit2 className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600">Update</span>
                    </div>
                  </th>
                  <th className="py-4 px-4 font-bold text-center border-l border-slate-100 min-w-[120px]">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="h-7 w-7 flex items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                        <Trash2 className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-rose-600">Delete</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {MODULES_CONFIG.map((mod) => {
                  const IconComponent = mod.icon
                  const allAccessActive = isModuleAllAccess(mod.prefix)
                  const readActive = isChecked(`${mod.prefix}:view`)
                  const createActive = isChecked(`${mod.prefix}:create`)
                  const updateActive = isChecked(`${mod.prefix}:update`)
                  const deleteActive = isChecked(`${mod.prefix}:delete`)
                  const isViewOnly = mod.prefix === "dashboard" || mod.prefix === "livetracking"

                  return (
                    <tr 
                      key={mod.prefix} 
                      className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/30 transition-colors group"
                    >
                      <td className="py-4 px-6 flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-50 border border-slate-200 text-zinc-500 shadow-sm group-hover:bg-white group-hover:text-primary transition-all">
                          <IconComponent className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-800 text-sm">{mod.label}</div>
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide">
                            {mod.category}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center border-l border-slate-100 bg-slate-50/10">
                        {isViewOnly ? (
                          <span className="text-zinc-300 font-bold">-</span>
                        ) : (
                          <Checkbox
                            checked={allAccessActive}
                            onCheckedChange={(checked) => handleToggleModuleAllAccess(mod.prefix, !!checked)}
                            className="h-5 w-5 border-slate-300 mx-auto"
                          />
                        )}
                      </td>
                      <td className="py-4 px-4 text-center border-l border-slate-100">
                        <Checkbox
                          checked={readActive}
                          onCheckedChange={() => handleTogglePermission(`${mod.prefix}:view`)}
                          className="h-5 w-5 border-slate-300 mx-auto"
                        />
                      </td>
                      <td className="py-4 px-4 text-center border-l border-slate-100">
                        {isViewOnly ? (
                          <span className="text-zinc-300 font-bold">-</span>
                        ) : (
                          <Checkbox
                            checked={createActive}
                            onCheckedChange={() => handleTogglePermission(`${mod.prefix}:create`)}
                            className="h-5 w-5 border-slate-300 mx-auto"
                          />
                        )}
                      </td>
                      <td className="py-4 px-4 text-center border-l border-slate-100">
                        {isViewOnly ? (
                          <span className="text-zinc-300 font-bold">-</span>
                        ) : (
                          <Checkbox
                            checked={updateActive}
                            onCheckedChange={() => handleTogglePermission(`${mod.prefix}:update`)}
                            className="h-5 w-5 border-slate-300 mx-auto"
                          />
                        )}
                      </td>
                      <td className="py-4 px-4 text-center border-l border-slate-100">
                        {isViewOnly ? (
                          <span className="text-zinc-300 font-bold">-</span>
                        ) : (
                          <Checkbox
                            checked={deleteActive}
                            onCheckedChange={() => handleTogglePermission(`${mod.prefix}:delete`)}
                            className="h-5 w-5 border-slate-300 mx-auto"
                          />
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons at the bottom */}
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/roles")}
            className="rounded-xl"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="rounded-xl shadow-sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving Configuration..." : "Save Role"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
