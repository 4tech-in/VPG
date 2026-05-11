"use client"

import { ArrowLeft, Camera, Calendar as CalendarIcon, ChevronDown, Eye, Mail, Phone, User, MapPin, Globe, Briefcase } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function StaffForm() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Link href="/users">
          <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 bg-white shadow-sm border border-zinc-100">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Add New Staff</h1>
      </div>

      <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
        <CardContent className="p-8 sm:p-12">
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
              <div className="relative">
                <Input placeholder="Enter full name" className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 focus-visible:ring-primary font-medium" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Email Address</Label>
              <div className="relative">
                <Input placeholder="staff@marbella.estate" className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 focus-visible:ring-primary font-medium" />
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Phone Number</Label>
              <Input placeholder="+34 000 000 000" className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 focus-visible:ring-primary font-medium" />
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
              <Select>
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
                <Input placeholder="dd/mm/yyyy" className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 focus-visible:ring-primary font-medium" />
                <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-900" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Role</Label>
              <Select>
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
                  <SelectItem value="twin-towers">Marbella Twin Towers</SelectItem>
                  <SelectItem value="royce">Marbella Royce</SelectItem>
                  <SelectItem value="grand">Marbella Grand</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Assigned Geofence</Label>
              <Select>
                <SelectTrigger className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 focus:ring-primary font-medium">
                  <SelectValue placeholder="Select Geofence" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
                  <SelectItem value="main-office">Main Office (Sector 22)</SelectItem>
                  <SelectItem value="site-a">Construction Site A</SelectItem>
                  <SelectItem value="sales-gallery">Sales Gallery</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Country</Label>
              <Select>
                <SelectTrigger className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 focus:ring-primary font-medium text-zinc-900">
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
                  <SelectItem value="spain">Spain</SelectItem>
                  <SelectItem value="uk">United Kingdom</SelectItem>
                  <SelectItem value="usa">USA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">State / Province</Label>
              <Select>
                <SelectTrigger className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 focus:ring-primary font-medium">
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
                  <SelectItem value="andalusia">Andalusia</SelectItem>
                  <SelectItem value="madrid">Madrid</SelectItem>
                  <SelectItem value="catalonia">Catalonia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">City</Label>
              <Select>
                <SelectTrigger className="h-14 bg-zinc-50/50 border-zinc-100 rounded-2xl pl-4 focus:ring-primary font-medium">
                  <SelectValue placeholder="Select City" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
                  <SelectItem value="marbella">Marbella</SelectItem>
                  <SelectItem value="malaga">Malaga</SelectItem>
                  <SelectItem value="seville">Seville</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-16 pt-8 border-t border-zinc-50">
            <Link href="/users">
              <Button variant="outline" className="rounded-2xl h-14 px-8 border-zinc-100 font-bold hover:bg-zinc-50 min-w-[140px]">
                Cancel
              </Button>
            </Link>
            <Button className="rounded-2xl h-14 px-12 font-bold shadow-lg shadow-primary/20 min-w-[180px]">
              Save Staff Member
            </Button>
          </div>
        </CardContent>
      </Card>
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
