"use client"

import { useEffect } from "react"
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

const groupOptions = [
  { value: "construction", label: "Construction Materials" },
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electricals" },
]

const subGroupOptions = [
  { value: "pipes", label: "Pipes" },
  { value: "cements", label: "Cements" },
  { value: "wires", label: "Wires" },
]

const categoryOptions = [
  { value: "smart", label: "Smart Devices" },
  { value: "raw", label: "Raw Material" },
  { value: "finished", label: "Finished Good" },
]

const getInitials = (text: string) => {
  if (!text) return ""
  return text
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
}

const formSchema = z.object({
  groupName: z.string().min(1, "Group Name is required"),
  subGroup: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  itemName: z.string().min(1, "Item Name is required"),
  itemCode: z.string().min(1, "Item Code is required"),
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
  initialValues?: Partial<z.infer<typeof formSchema>>
}

export function ItemForm({ onSuccess, initialValues }: ItemFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      groupName: initialValues?.groupName || "",
      subGroup: initialValues?.subGroup || "",
      category: initialValues?.category || "",
      itemName: initialValues?.itemName || "",
      itemCode: initialValues?.itemCode || "",
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

  // Reset form when initialValues change (e.g. when switching from Add to Edit)
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
        category: "",
        itemName: "",
        itemCode: "",
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
  const category = form.watch("category")

  useEffect(() => {
    // Only auto-generate if we're not in edit mode (or if code is empty)
    if (initialValues?.itemCode) return;

    const groupLabel = groupOptions.find((o) => o.value === groupName)?.label || ""
    const subLabel = subGroupOptions.find((o) => o.value === subGroup)?.label || ""
    const catLabel = categoryOptions.find((o) => o.value === category)?.label || ""

    const initials = [
      getInitials(groupLabel),
      getInitials(subLabel),
      getInitials(catLabel),
    ]
      .filter(Boolean)
      .join("/")

    if (initials) {
      const generatedCode = `${initials}/0001`
      form.setValue("itemCode", generatedCode, { shouldValidate: true })
    }
  }, [groupName, subGroup, category, form, initialValues?.itemCode])

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
    onSuccess?.()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Section: Classification */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Classification</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="groupName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Group" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {groupOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Sub Group" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subGroupOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categoryOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              name="itemCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Code <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="JK/YY/SM/0001" {...field} />
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid grid-cols-2 gap-2">
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
            </div>
            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="KG">KG</SelectItem>
                      <SelectItem value="PCS">PCS</SelectItem>
                      <SelectItem value="BAG">BAG</SelectItem>
                      <SelectItem value="COIL">COIL</SelectItem>
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
          <Button variant="outline" type="button" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit">Save Item</Button>
        </div>
      </form>
    </Form>
  )
}
