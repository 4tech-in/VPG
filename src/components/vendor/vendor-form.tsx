"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Banknote,
  ShieldCheck,
  Save,
  X,
  ChevronDown,
  Search,
  Loader2,
  Check
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { itemService } from "@/service/itemService"
import { cn } from "@/lib/utils"

const formSchema = z.object({
  vendorCode: z.string().optional(),
  name: z.string().min(1, "Vendor Name is required"),
  companyName: z.string().optional(),
  itemIds: z.array(z.string()).min(1, "At least one Associated Item is required"),
  contactPerson: z.string().optional(),
  contactNumber: z.string().min(1, "Mobile Number is required"),
  alternateNumber: z.string().optional(),
  email: z.string().email("Invalid email").or(z.literal("")),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  status: z.enum(["active", "inactive"]),
})

interface VendorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialValues?: any
  onSubmit: (values: any) => Promise<void>
}

export function VendorDialog({ open, onOpenChange, initialValues, onSubmit: onSubmitProp }: VendorDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Infinite Scroll State for Supplied Items
  const [items, setItems] = useState<any[]>([])
  const [itemPage, setItemPage] = useState(1)
  const [hasMoreItems, setHasMoreItems] = useState(true)
  const [itemSearch, setItemSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [isFetchingItems, setIsFetchingItems] = useState(false)
  const [isOpenDropdown, setIsOpenDropdown] = useState(false)
  const [selectedItems, setSelectedItems] = useState<{ id: string; name: string }[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vendorCode: "",
      name: "",
      companyName: "",
      itemIds: [],
      contactPerson: "",
      contactNumber: "",
      alternateNumber: "",
      email: "",
      gstNumber: "",
      panNumber: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      bankName: "",
      accountNumber: "",
      ifscCode: "",
      status: "active",
    },
  })

  const isFetchingRef = useRef(false)

  // Load first batch of items when component mounts or search changes
  const fetchItems = useCallback(async (pageToFetch: number, searchQuery: string, isAppend = false) => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true
    setIsFetchingItems(true)
    try {
      const response = await itemService.getItems({
        page: pageToFetch,
        limit: 10,
        search: searchQuery,
      })

      const newItems = response.items || []
      
      if (isAppend) {
        setItems((prev) => [...prev, ...newItems])
      } else {
        setItems(newItems)
      }

      setHasMoreItems(pageToFetch < response.pagination.totalPages)
    } catch (error) {
      console.error("Failed to load catalog items:", error)
    } finally {
      isFetchingRef.current = false
      setIsFetchingItems(false)
    }
  }, [])

  // Debounce search query
  useEffect(() => {
    if (!open) return
    const handler = setTimeout(() => {
      setDebouncedSearch(itemSearch)
    }, 400)
    return () => clearTimeout(handler)
  }, [itemSearch, open])

  // Reload items when debounced search updates
  useEffect(() => {
    if (open) {
      setItemPage(1)
      fetchItems(1, debouncedSearch, false)
    }
  }, [debouncedSearch, open, fetchItems])

  // Fetch more items when page increments
  useEffect(() => {
    if (itemPage > 1 && open) {
      fetchItems(itemPage, debouncedSearch, true)
    }
  }, [itemPage, open, debouncedSearch, fetchItems])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpenDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (initialValues) {
      setSelectedItems(
        (initialValues.items || []).map((i: any) => ({
          id: i.id || i._id,
          name: i.name || i.itemName,
        }))
      )
      form.reset({
        ...form.getValues(),
        ...initialValues,
      })
    } else {
      setSelectedItems([])
      form.reset({
        vendorCode: "",
        name: "",
        companyName: "",
        itemIds: [],
        contactPerson: "",
        contactNumber: "",
        alternateNumber: "",
        email: "",
        gstNumber: "",
        panNumber: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        bankName: "",
        accountNumber: "",
        ifscCode: "",
        status: "active",
      })
    }
  }, [initialValues, open, form])

  const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <div className="flex items-center gap-3 mb-6 pb-2 border-b border-zinc-100">
      <div className="h-8 w-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400">
        <Icon className="h-4 w-4" />
      </div>
      <h2 className="text-xs font-black text-zinc-900 uppercase tracking-[0.2em]">{title}</h2>
    </div>
  )

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    if (
      target.scrollHeight - target.scrollTop <= target.clientHeight * 1.1 &&
      hasMoreItems &&
      !isFetchingItems
    ) {
      setItemPage((prev) => prev + 1)
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      await onSubmitProp(values)
      onOpenChange(false)
    } catch (error) {
      // Handled in hooks / interceptors
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()} className="sm:max-w-[700px] w-[95vw] max-h-[90vh] p-0 overflow-hidden border-none shadow-2xl rounded-[2rem] flex flex-col bg-white">
        
        {/* Modern Header */}
        <div className="flex items-center justify-between p-8 bg-white shrink-0 border-b border-zinc-50">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-white shadow-lg shadow-zinc-900/20">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black tracking-tight text-zinc-900">
                {initialValues ? "UPDATE VENDOR" : "VENDOR MASTER"}
              </DialogTitle>
              <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.3em] leading-none mt-1">
                {initialValues ? "Modify Strategic Partner" : "Partner Registration System"}
              </p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-12">
              
              {/* Vendor Details */}
              <section>
                <SectionHeader icon={Building2} title="Vendor Details" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">
                            Vendor Name <span className="text-rose-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. VPG Concrete Ltd." {...field} className="h-11 rounded-xl bg-zinc-50/55 border-zinc-100" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Legal registered name" {...field} className="h-11 rounded-xl bg-zinc-50/55 border-zinc-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vendorCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">
                          Vendor Code <span className="text-rose-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter Vendor Code" {...field} className="h-11 rounded-xl bg-zinc-50/55 border-zinc-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="md:col-span-2 space-y-2">
                    <FormField
                      control={form.control}
                      name="itemIds"
                      render={({ field }) => (
                        <FormItem className="relative">
                          <FormLabel className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">
                            Supplied Catalog Items <span className="text-rose-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <div ref={dropdownRef} className="relative">
                              {/* Trigger Button */}
                              <button
                                type="button"
                                onClick={() => setIsOpenDropdown(!isOpenDropdown)}
                                className="flex h-min w-full min-h-[44px] rounded-xl border border-zinc-100 bg-zinc-50/55 px-3 py-2 text-sm justify-between items-center font-bold text-zinc-900 transition-all hover:bg-zinc-50 flex-wrap gap-2"
                              >
                                <div className="flex flex-wrap gap-1 flex-1">
                                  {selectedItems.length > 0 ? (
                                    selectedItems.map((si) => (
                                      <span key={si.id} className="bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 shadow-sm">
                                        {si.name}
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const newSelected = selectedItems.filter((i) => i.id !== si.id);
                                            setSelectedItems(newSelected);
                                            form.setValue("itemIds", newSelected.map(i => i.id), { shouldValidate: true });
                                          }}
                                          className="h-4 w-4 rounded-full flex items-center justify-center bg-primary/20 text-primary hover:bg-rose-500 hover:text-white transition-colors"
                                        >
                                          <X className="h-2.5 w-2.5" />
                                        </button>
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-zinc-400 font-medium pl-1">Select Supplied Items</span>
                                  )}
                                </div>
                                <ChevronDown className={cn("h-4 w-4 text-zinc-400 shrink-0 transition-transform duration-200", isOpenDropdown && "rotate-180")} />
                              </button>

                              {/* Dropdown Options */}
                              {isOpenDropdown && (
                                <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-zinc-100 shadow-2xl rounded-2xl p-2 z-50 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200 origin-top">
                                  {/* Local Search Input */}
                                  <div className="relative shrink-0 p-1">
                                    <Input
                                      placeholder="Search catalog item..."
                                      value={itemSearch}
                                      onChange={(e) => setItemSearch(e.target.value)}
                                      className="h-9 rounded-xl pl-9 bg-zinc-50/50 border border-zinc-100 font-bold text-xs focus-visible:ring-1 focus-visible:ring-primary/20"
                                    />
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                                  </div>

                                  {/* Scrollable Item Options */}
                                  <div
                                    onScroll={handleScroll}
                                    className="max-h-56 overflow-y-auto custom-scrollbar flex flex-col gap-0.5 px-1 pb-1"
                                  >
                                    {items.length === 0 && !isFetchingItems ? (
                                      <div className="text-[10px] text-zinc-400 font-bold uppercase text-center py-4">No Items Found</div>
                                    ) : (
                                      items.map((item) => (
                                        <button
                                          key={item._id || item.id}
                                          type="button"
                                          onClick={() => {
                                            const id = item._id || item.id;
                                            const isSelected = field.value?.includes(id);
                                            
                                            let newSelectedItems;
                                            let newIds;
                                            
                                            if (isSelected) {
                                              newSelectedItems = selectedItems.filter(i => i.id !== id);
                                              newIds = newSelectedItems.map(i => i.id);
                                            } else {
                                              newSelectedItems = [...selectedItems, { id, name: item.itemName }];
                                              newIds = newSelectedItems.map(i => i.id);
                                            }
                                            
                                            setSelectedItems(newSelectedItems);
                                            field.onChange(newIds);
                                          }}
                                          className={cn(
                                            "w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex justify-between items-center group",
                                            field.value?.includes(item._id || item.id)
                                              ? "bg-primary/5 text-primary hover:bg-primary/10" 
                                              : "text-zinc-700 hover:bg-zinc-50"
                                          )}
                                        >
                                          <div className="flex items-center gap-2.5">
                                            <div className={cn(
                                              "flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors",
                                              field.value?.includes(item._id || item.id)
                                                ? "border-primary bg-primary text-primary-foreground"
                                                : "border-zinc-300 bg-transparent group-hover:border-zinc-400"
                                            )}>
                                              {field.value?.includes(item._id || item.id) && <Check className="h-2.5 w-2.5" />}
                                            </div>
                                            <span className="truncate max-w-[200px] sm:max-w-[300px]">{item.itemName}</span>
                                          </div>
                                          <span className={cn(
                                            "text-[10px] uppercase font-bold tracking-tight shrink-0",
                                            field.value?.includes(item._id || item.id) ? "text-primary/70" : "text-zinc-400 group-hover:text-zinc-500"
                                          )}>{(item.itemCode || "").split("-").pop()}</span>
                                        </button>
                                      ))
                                    )}

                                    {/* Spinner for Loading More */}
                                    {isFetchingItems && (
                                      <div className="flex justify-center items-center py-2 shrink-0">
                                        <Loader2 className="h-4 w-4 text-zinc-400 animate-spin" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </section>

              {/* Contact Information */}
              <section>
                <SectionHeader icon={User} title="Contact Information" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Contact Person</FormLabel>
                        <FormControl>
                          <Input placeholder="Name of primary contact" {...field} className="h-11 rounded-xl bg-zinc-50/55 border-zinc-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">
                          Mobile Number <span className="text-rose-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="+91 00000 00000" {...field} className="h-11 rounded-xl bg-zinc-50/55 border-zinc-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="alternateNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Alternate Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+91 00000 00000" {...field} className="h-11 rounded-xl bg-zinc-50/55 border-zinc-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Email</FormLabel>
                        <FormControl>
                          <Input placeholder="contact@company.com" {...field} className="h-11 rounded-xl bg-zinc-50/55 border-zinc-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* Business Information */}
              <section>
                <SectionHeader icon={ShieldCheck} title="Business Information" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="gstNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">GST Number</FormLabel>
                        <FormControl>
                          <Input placeholder="22AAAAA0000A1Z5" {...field} className="h-11 rounded-xl bg-zinc-50/55 border-zinc-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="panNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">PAN Number</FormLabel>
                        <FormControl>
                          <Input placeholder="ABCDE1234F" {...field} className="h-11 rounded-xl bg-zinc-50/55 border-zinc-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* Address Information */}
              <section>
                <SectionHeader icon={MapPin} title="Address Information" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Full office/factory address" {...field} className="h-11 rounded-xl bg-zinc-50/55 border-zinc-100" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">City</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter city" {...field} className="h-11 rounded-xl bg-zinc-50/55 border-zinc-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">State</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter state" {...field} className="h-11 rounded-xl bg-zinc-50/55 border-zinc-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pincode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Pincode</FormLabel>
                        <FormControl>
                          <Input placeholder="000000" {...field} className="h-11 rounded-xl bg-zinc-50/55 border-zinc-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* Bank Details */}
              <section>
                <SectionHeader icon={Banknote} title="Bank Details" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Bank Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. HDFC Bank" {...field} className="h-11 rounded-xl bg-zinc-50/55 border-zinc-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Account Number</FormLabel>
                        <FormControl>
                          <Input placeholder="000000000000" {...field} className="h-11 rounded-xl bg-zinc-50/55 border-zinc-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="ifscCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">IFSC Code</FormLabel>
                          <FormControl>
                            <Input placeholder="HDFC0000000" {...field} className="h-11 rounded-xl bg-zinc-50/55 border-zinc-100" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </section>

              {/* Status */}
              <section>
                <SectionHeader icon={ShieldCheck} title="Status" />
                <div className="w-full max-w-[200px]">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-2 block">
                          Lifecycle Status
                        </FormLabel>
                        <FormControl>
                          <select
                            className="flex h-11 w-full rounded-xl border border-zinc-100 bg-zinc-50/55 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-bold"
                            onChange={field.onChange}
                            value={field.value || ""}
                          >
                            <option value="active" className="rounded-lg font-bold text-emerald-600">Active</option>
                            <option value="inactive" className="rounded-lg font-bold text-rose-500">Inactive</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

            </div>

            {/* Action Footer */}
            <div className="p-8 bg-zinc-50/50 border-t border-zinc-100 flex items-center justify-end gap-4 shrink-0">
              <Button
                variant="ghost"
                type="button"
                onClick={() => onOpenChange(false)}
                className="h-12 px-8 rounded-2xl font-black text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-all"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground h-11 px-6 rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2 transition-all active:scale-95 animate-in fade-in-50 duration-300" disabled={isSubmitting}>
                <Save className="h-5 w-5" /> {isSubmitting ? "Saving..." : "Save Vendor"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
