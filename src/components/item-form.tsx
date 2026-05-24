"use client"

import { useEffect, useState, useMemo } from "react"
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
  const { units } = useUnits(true)
  
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  // Filter subGroups locally to match selected Group dynamically
  const filteredSubGroups = useMemo(() => {
    if (!groupName) return []
    return subGroups.filter((sg) => sg.groupId === groupName)
  }, [groupName, subGroups])

  // Clear subGroup selection if selected groupName changes and old subGroup is no longer matching
  useEffect(() => {
    if (subGroup && !filteredSubGroups.some((sg) => sg.id === subGroup)) {
      form.setValue("subGroup", "")
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
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {units.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.label} ({u.value})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
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
