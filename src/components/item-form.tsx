"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { AppleSwitch } from "@/components/unlumen-ui/apple-switch"
import { useGroups } from "@/hooks/use-groups"
import { useSubGroups } from "@/hooks/use-sub-groups"
import { useUnits } from "@/hooks/use-units"

const getInitials = (text: string) => {
  if (!text) return ""
  const cleaned = text.replace(/[^a-zA-Z\s]/g, "")
  return cleaned
    .split(/\s+/)
    .map((word) => word[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
}

const formSchema = z.object({
  groupName: z.string().min(1, "Group Name is required"),
  subGroup: z.string().optional(),
  itemName: z.string().min(1, "Item Name is required"),
  specification: z.string().optional(),
  size: z.string().optional(),
  info: z.string().optional(),
  unit: z.string().min(1, "Unit is required"),
  rate: z.string().min(1, "Rate is required"),
  gst: z.string().optional(),
  hsnCode: z.string().optional(),
  minLevel: z.string().optional(),
  maxLevel: z.string().optional(),
  openingLedger: z.string().optional(),
  openingPhysical: z.string().optional(),
  isBlocked: z.boolean(),
})

interface ItemFormProps {
  onSuccess?: () => void
  initialValues?: any
  onSubmit: (values: any) => Promise<void>
}

export function ItemForm({ onSuccess, initialValues, onSubmit: onSubmitProp }: ItemFormProps) {
  // Fetch dynamic categories dropdown from backend APIs
  const { groups } = useGroups(true)
  const { subGroups } = useSubGroups()
  const { units } = useUnits(true, 1000)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUnitOpen, setIsUnitOpen] = useState(false)
  const [unitSearch, setUnitSearch] = useState("")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      groupName: initialValues?.groupName || "",
      subGroup: initialValues?.subGroup || "",
      itemName: initialValues?.itemName || "",
      specification: initialValues?.specification || "",
      size: initialValues?.size || "",
      info: initialValues?.info || "",
      unit: initialValues?.unit || "",
      rate: initialValues?.rate || "",
      gst: initialValues?.gst || "",
      hsnCode: initialValues?.hsnCode || "",
      minLevel: initialValues?.minLevel || "",
      maxLevel: initialValues?.maxLevel || "",
      openingLedger: initialValues?.openingLedger || "",
      openingPhysical: initialValues?.openingPhysical || "",
      isBlocked: initialValues?.isBlocked ?? false,
    },
  })

  // Reset form when initialValues change
  useEffect(() => {
    if (initialValues) {
      form.reset({
        ...form.getValues(),
        ...initialValues,
      })
    } else {
      form.reset({
        groupName: "",
        subGroup: "",
        itemName: "",
        specification: "",
        size: "",
        info: "",
        unit: "",
        rate: "",
        gst: "",
        hsnCode: "",
        minLevel: "",
        maxLevel: "",
        openingLedger: "",
        openingPhysical: "",
        isBlocked: false,
      })
    }
  }, [initialValues, form])

  const groupName = form.watch("groupName")
  const subGroup = form.watch("subGroup")

  const filteredUnits = useMemo(() => {
    if (!unitSearch.trim()) return units
    const q = unitSearch.toLowerCase().trim()
    return units.filter(
      (u) =>
        (u.label && u.label.toLowerCase().includes(q)) ||
        (u.value && u.value.toLowerCase().includes(q))
    )
  }, [units, unitSearch])

  // Filter subGroups locally to match selected Group dynamically
  const filteredSubGroups = useMemo(() => {
    if (!groupName) return []
    return subGroups.filter((sg) => sg.groupId === groupName)
  }, [groupName, subGroups])

  const prevGroupNameRef = useRef(groupName)

  // Clear subGroup selection only if selected groupName changes and old subGroup is no longer matching
  useEffect(() => {
    if (prevGroupNameRef.current !== groupName) {
      if (subGroup && !filteredSubGroups.some((sg) => sg.id === subGroup)) {
        form.setValue("subGroup", "")
      }
      prevGroupNameRef.current = groupName
    } else if (groupName && filteredSubGroups.length > 0 && prevGroupNameRef.current === groupName) {
      // Ensure the ref stays in sync if groupName is initialized
      prevGroupNameRef.current = groupName
    }
  }, [groupName, filteredSubGroups, subGroup, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      // Auto-generate a unique itemCode in the background to satisfy backend validation
      const generatedCode = initialValues?.itemCode || `ITEM-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

      const payload = {
        itemCode: generatedCode,
        HSNcode: values.hsnCode,
        itemName: values.itemName,
        blockItem: values.isBlocked,
        specification: values.specification,
        openingLedger: values.openingLedger,
        openingPhysical: values.openingPhysical,
        size: values.size,
        info: values.info,
        unitId: values.unit,
        groupId: values.groupName,
        subGroupId: values.subGroup || undefined,
        price: values.rate,
        minLevel: values.minLevel,
        maxLevel: values.maxLevel,
        gstPercentage: values.gst,
      }
      await onSubmitProp(payload)
      onSuccess?.()
    } catch (error) {
      // Handled in hooks / interceptors
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Section: Classification */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Classification</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="groupName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Group" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {groups.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subGroup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sub Group</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value} 
                    disabled={!groupName}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={groupName ? "Select Sub Group" : "Select Group first"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredSubGroups.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>{opt.subGroup}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Section: Basic Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="itemName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. TILE" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="specification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specification</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. GVT" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        
            <div className="grid grid-cols-3 gap-2">
              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Size</FormLabel>
                    <FormControl>
                      <Input placeholder="800*1200" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="info"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Info/Color</FormLabel>
                    <FormControl>
                      <Input placeholder="BLACK" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => {
                  const selectedUnit = units.find((u) => u.id === field.value)
                  return (
                    <FormItem className="flex flex-col">
                      <FormLabel>Unit <span className="text-destructive">*</span></FormLabel>
                      <Popover
                        open={isUnitOpen}
                        onOpenChange={(open) => {
                          setIsUnitOpen(open)
                          if (!open) setUnitSearch("")
                        }}
                      >
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              role="combobox"
                              aria-expanded={isUnitOpen}
                              className={cn(
                                "w-full justify-between font-normal h-9 px-3",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <span className="truncate">
                                {selectedUnit
                                  ? `${selectedUnit.label} (${selectedUnit.value})`
                                  : "Select Unit"}
                              </span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-[--radix-popover-trigger-width] p-0 z-[9999]"
                          align="start"
                          onWheel={(e) => e.stopPropagation()}
                        >
                          <div className="flex flex-col w-full bg-popover rounded-md">
                            <div className="flex items-center border-b px-3 py-2 gap-2">
                              <Search className="h-4 w-4 shrink-0 opacity-50" />
                              <input
                                autoFocus
                                value={unitSearch}
                                onChange={(e) => setUnitSearch(e.target.value)}
                                placeholder="Search unit..."
                                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                              />
                            </div>
                            <div className="max-h-[220px] overflow-y-auto p-1 divide-y divide-transparent">
                              {filteredUnits.length === 0 ? (
                                <p className="py-4 text-center text-xs text-muted-foreground">
                                  No unit found.
                                </p>
                              ) : (
                                filteredUnits.map((u) => {
                                  const isSelected = field.value === u.id
                                  return (
                                    <button
                                      type="button"
                                      key={u.id}
                                      onClick={() => {
                                        field.onChange(u.id)
                                        setIsUnitOpen(false)
                                        setUnitSearch("")
                                      }}
                                      className={cn(
                                        "w-full flex items-center justify-between text-left px-2.5 py-2 text-sm rounded-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                                        isSelected && "bg-accent/60 font-medium"
                                      )}
                                    >
                                      <span className="truncate">
                                        {u.label} ({u.value})
                                      </span>
                                      {isSelected && (
                                        <Check className="ml-2 h-4 w-4 shrink-0 opacity-100 text-primary" />
                                      )}
                                    </button>
                                  )
                                })
                              )}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
            </div>

        </div>

        {/* Section: Pricing & Inventory */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pricing & Inventory</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate (₹) <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gst"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GST %</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hsnCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>HSN Code</FormLabel>
                  <FormControl>
                    <Input placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="minLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Min. Level</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maxLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max. Level</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="openingLedger"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opening Ledger (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <FormField
              control={form.control}
              name="openingPhysical"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opening Physical</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isBlocked"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3 space-y-0 rounded-md border p-2 bg-muted/5">
                  <FormControl>
                    <AppleSwitch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      size="sm"
                    />
                  </FormControl>
                  <FormLabel className="cursor-pointer">Block this item</FormLabel>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <Button variant="outline" type="button" onClick={onSuccess} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Item"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
