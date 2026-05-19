"use client"

import { useState } from "react"
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Banknote,
  ShieldCheck,
  Plus,
  Save,
  X
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export function VendorDialog() {
  const [open, setOpen] = useState(false)

  const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <div className="flex items-center gap-3 mb-6 pb-2 border-b border-zinc-100">
      <div className="h-8 w-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400">
        <Icon className="h-4 w-4" />
      </div>
      <h2 className="text-xs font-black text-zinc-900 uppercase tracking-[0.2em]">{title}</h2>
    </div>
  )

  const FormField = ({ label, placeholder, required = false }: { label: string, placeholder?: string, required?: boolean }) => (
    <div className="space-y-2">
      <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">
        {label} {required && <span className="text-rose-500">*</span>}
      </Label>
      <Input
        placeholder={placeholder}
        className="h-11 rounded-xl bg-zinc-50/50 border-zinc-100 focus:bg-white transition-all font-medium text-sm"
      />
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-12 px-8 rounded-2xl bg-zinc-900 text-white font-black shadow-xl shadow-zinc-900/20 gap-2 hover:bg-zinc-800 transition-all">
          <Plus className="h-5 w-5" /> Add Strategic Vendor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] w-[95vw] max-h-[90vh] p-0 overflow-hidden border-none shadow-2xl rounded-[2rem] flex flex-col bg-white">

        {/* Modern Header */}
        <div className="flex items-center justify-between p-8 bg-white shrink-0 border-b border-zinc-50">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-white shadow-lg shadow-zinc-900/20">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black tracking-tight text-zinc-900">VENDOR MASTER</DialogTitle>
              <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.3em] leading-none mt-1">Partner Registration System</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="rounded-full hover:bg-zinc-50">
            <X className="h-5 w-5 text-zinc-400" />
          </Button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-12">

          {/* Vendor Details */}
          <section>
            <SectionHeader icon={Building2} title="Vendor Details" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <FormField label="Vendor Name" placeholder="e.g. VPG Concrete Ltd." required />
              </div>
              <FormField label="Company Name" placeholder="Legal registered name" />
              <FormField label="Vendor Code" placeholder="VND-000" />

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">
                  Group <span className="text-rose-500">*</span>
                </Label>
                <Select>
                  <SelectTrigger className="h-11 rounded-xl bg-zinc-50/50 border-zinc-100 font-bold text-sm">
                    <SelectValue placeholder="Select Group" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
                    <SelectItem value="material">Material Supplier</SelectItem>
                    <SelectItem value="service">Service Provider</SelectItem>
                    <SelectItem value="consultant">Consultant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">
                  Subgroup
                </Label>
                <Select>
                  <SelectTrigger className="h-11 rounded-xl bg-zinc-50/50 border-zinc-100 font-bold text-sm">
                    <SelectValue placeholder="Select Subgroup" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
                    <SelectItem value="civil">Civil Works</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section>
            <SectionHeader icon={User} title="Contact Information" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Contact Person" placeholder="Name of primary contact" />
              <FormField label="Mobile Number" placeholder="+91 00000 00000" required />
              <FormField label="Alternate Number" placeholder="+91 00000 00000" />
              <FormField label="Email" placeholder="contact@company.com" />
            </div>
          </section>

          {/* Business Information */}
          <section>
            <SectionHeader icon={ShieldCheck} title="Business Information" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="GST Number" placeholder="22AAAAA0000A1Z5" />
              <FormField label="PAN Number" placeholder="ABCDE1234F" />
            </div>
          </section>

          {/* Address Information */}
          <section>
            <SectionHeader icon={MapPin} title="Address Information" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <FormField label="Address" placeholder="Full office/factory address" />
              </div>
              <FormField label="City" placeholder="Enter city" />
              <FormField label="State" placeholder="Enter state" />
              <FormField label="Pincode" placeholder="000000" />
            </div>
          </section>

          {/* Bank Details */}
          <section>
            <SectionHeader icon={Banknote} title="Bank Details" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Bank Name" placeholder="e.g. HDFC Bank" />
              <FormField label="Account Number" placeholder="000000000000" />
              <div className="md:col-span-2">
                <FormField label="IFSC Code" placeholder="HDFC0000000" />
              </div>
            </div>
          </section>

          {/* Status */}
          <section>
            <SectionHeader icon={ShieldCheck} title="Status" />
            <div className="w-full max-w-[200px]">
              <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-2 block">
                Lifecycle Status
              </Label>
              <Select defaultValue="active">
                <SelectTrigger className="h-11 rounded-xl bg-zinc-50/50 border-zinc-100 font-bold text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
                  <SelectItem value="active" className="rounded-lg font-bold text-emerald-600">Active</SelectItem>
                  <SelectItem value="inactive" className="rounded-lg font-bold text-rose-500">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>

        </div>

        {/* Action Footer */}
        <div className="p-8 bg-zinc-50/50 border-t border-zinc-100 flex items-center justify-end gap-4 shrink-0">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            className="h-12 px-8 rounded-2xl font-black text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-all"
          >
            Cancel
          </Button>
          <Button className="h-12 px-10 rounded-2xl bg-zinc-900 text-white font-black shadow-xl shadow-zinc-900/20 gap-3 hover:bg-zinc-800 transition-all active:scale-95">
            <Save className="h-5 w-5" /> Save Vendor
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
