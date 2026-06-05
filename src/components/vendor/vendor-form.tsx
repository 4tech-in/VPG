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
  Loader2
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
  itemId: z.string().min(1, "Associated Item is required"),
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
  const [selectedItemName, setSelectedItemName] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vendorCode: "",
      name: "",
      companyName: "",
      itemId: "",
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
      setSelectedItemName(initialValues.itemName || "")
      form.reset({
        ...form.getValues(),
        ...initialValues,
      })
    } else {
      setSelectedItemName("")
      form.reset({
        vendorCode: "",
        name: "",
        companyName: "",
        itemId: "",
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
      <DialogContent className="sm:max-w-[700px] w-[95vw] max-h-[90vh] p-0 overflow-hidden border-none shadow-2xl rounded-[2rem] flex flex-col bg-white">
        
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
                      name="itemId"
                      render={({ field }) => (
                        <FormItem className="relative">
                          <FormLabel className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">
                            Supplied Catalog Item <span className="text-rose-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <div ref={dropdownRef} className="relative">
                              {/* Trigger Button */}
                              <button
                                type="button"
                                onClick={() => setIsOpenDropdown(!isOpenDropdown)}
                                className="flex h-11 w-full rounded-xl border border-zinc-100 bg-zinc-50/55 px-3 py-2 text-sm justify-between items-center font-bold text-zinc-900 transition-all hover:bg-zinc-50"
                              >
                                <span>{selectedItemName || "Select Supplied Item"}</span>
                                <ChevronDown className="h-4 w-4 text-zinc-400" />
                              </button>

                              {/* Dropdown Options */}
                              {isOpenDropdown && (
                                <div className="absolute top-12 left-0 w-full bg-white border border-zinc-100 shadow-2xl rounded-2xl p-3 z-50 flex flex-col gap-3 animate-in fade-in duration-200">
                                  {/* Local Search Input */}
                                  <div className="relative shrink-0">
                                    <Input
                                      placeholder="Search catalog item..."
                                      value={itemSearch}
                                      onChange={(e) => setItemSearch(e.target.value)}
                                      className="h-9 rounded-xl pl-9 bg-zinc-50 border-none font-bold text-xs"
                                    />
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-300" />
                                  </div>

                                  {/* Scrollable Item Options */}
                                  <div
                                    onScroll={handleScroll}
                                    className="max-h-48 overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1"
                                  >
                                    {items.length === 0 && !isFetchingItems ? (
                                      <div className="text-[10px] text-zinc-400 font-bold uppercase text-center py-4">No Items Found</div>
                                    ) : (
                                      items.map((item) => (
                                        <button
                                          key={item._id || item.id}
                                          type="button"
                                          onClick={() => {
                                            field.onChange(item._id || item.id)
                                            setSelectedItemName(item.itemName)
                                            setIsOpenDropdown(false)
                                          }}
                                          className={cn(
                                            "w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex justify-between items-center",
                                            field.value === (item._id || item.id)
                                              ? "bg-zinc-900 text-white" 
                                              : "text-zinc-700 hover:bg-zinc-50"
                                          )}
                                        >
                                          <span>{item.itemName}</span>
                                          <span className={cn(
                                            "text-[10px] uppercase font-medium tracking-tight",
                                            field.value === (item._id || item.id) ? "text-zinc-300" : "text-zinc-400"
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
