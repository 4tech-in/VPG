"use client"

import { ArrowLeft, Camera, Calendar as CalendarIcon, ChevronDown, Eye, Mail, Phone, User, MapPin, Globe, Briefcase } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

import { useState } from "react"
import { format, parse, isValid } from "date-fns"
type StaffFormProps = {
  initialValues?: {
    name: string
    email: string
    phone: string
    role: string
    gender?: string
    dob?: string
  }
  isDialog?: boolean
  onSuccess?: () => void
}

export function StaffForm({ initialValues, isDialog, onSuccess }: StaffFormProps) {
  return (
    <div className="flex flex-col gap-8">
      {!isDialog && (
        <div className="flex items-center gap-4">
          <Link href="/users">
            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 bg-white shadow-sm border border-zinc-100">
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
              <User className="h-12 w-12 text-zinc-300" />
            </Avatar>
            <Button size="icon" className="absolute -bottom-2 -right-2 rounded-full h-10 w-10 border-4 border-white bg-primary hover:bg-primary/90 shadow-md">
              <PlusIcon className="h-5 w-5 text-white" />
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold text-zinc-900">Staff Photo</h2>
            <p className="text-sm text-zinc-400 max-w-xs">
              Upload a clear profile picture for identification. Supported formats: JPG, PNG.
            </p>
            <Button variant="outline" className="w-fit mt-2 rounded-xl h-10 border-zinc-100 font-bold hover:bg-zinc-50">
              Change Image
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Full Name</Label>
            <Input
              defaultValue={initialValues?.name}
              placeholder="Enter full name"
              className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 focus-visible:ring-primary font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Email Address</Label>
            <div className="relative">
              <Input
                defaultValue={initialValues?.email}
                placeholder="staff@VPG.estate"
                className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 focus-visible:ring-primary font-medium"
              />
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Phone Number</Label>
            <Input
              defaultValue={initialValues?.phone}
              placeholder="+34 000 000 000"
              className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 focus-visible:ring-primary font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Password</Label>
            <div className="relative">
              <Input type="password" placeholder="********" className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 focus-visible:ring-primary font-medium" />
              <Eye className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-300" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Gender</Label>
            <Select defaultValue={initialValues?.gender}>
              <SelectTrigger className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 focus:ring-primary font-medium">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Date of Birth</Label>
            <div className="relative">
              <Input
                type="date"
                defaultValue={initialValues?.dob ? format(parse(initialValues.dob, "dd/MM/yyyy", new Date()), "yyyy-MM-dd") : ""}
                className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 pr-12 focus-visible:ring-primary font-medium appearance-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Role</Label>
            <Select defaultValue={initialValues?.role}>
              <SelectTrigger className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 focus:ring-primary font-medium">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="agent">Sales Agent</SelectItem>
                <SelectItem value="manager">Operations Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Assigned Project</Label>
            <Select>
              <SelectTrigger className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 focus:ring-primary font-medium">
                <SelectValue placeholder="Select Project" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
                <SelectItem value="twin-towers">VPG Twin Towers</SelectItem>
                <SelectItem value="royce">VPG Royce</SelectItem>
                <SelectItem value="grand">VPG Grand</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-16 pt-8 border-t border-zinc-50">
          <Button
            variant="outline"
            onClick={onSuccess}
            className="rounded-2xl h-14 px-8 border-zinc-100 font-bold hover:bg-zinc-50 min-w-[140px]"
          >
            Cancel
          </Button>
          <Button
            onClick={onSuccess}
            className="rounded-2xl h-14 px-12 font-bold shadow-lg shadow-primary/20 min-w-[180px]"
          >
            {initialValues ? "Update Member" : "Save Staff Member"}
          </Button>
        </div>
      </div>
    </div>
  )
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  )
}
