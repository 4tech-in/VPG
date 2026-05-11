"use client"

import { Phone, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

interface StaffCardProps {
  staff: {
    id: string
    name: string
    role: string
    properties: number
    status: "Active" | "Busy" | "Away"
    avatarUrl?: string
  }
}

export function StaffCard({ staff }: StaffCardProps) {
  const statusColors = {
    Active: "bg-emerald-500",
    Busy: "bg-rose-500",
    Away: "bg-amber-500",
  }

  return (
    <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow duration-300 rounded-3xl bg-white group">
      <CardContent className="p-8">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6">
            <Avatar className="h-32 w-32 rounded-[2.5rem] border-4 border-zinc-50 shadow-sm">
              <AvatarImage src={staff.avatarUrl} alt={staff.name} />
              <AvatarFallback className="bg-zinc-100 text-zinc-400">
                <User className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>
            <div className={`absolute bottom-2 right-2 h-5 w-5 rounded-full border-4 border-white ${statusColors[staff.status]}`} />
          </div>

          <h3 className="text-xl font-bold text-zinc-900 mb-1 group-hover:text-primary transition-colors">
            {staff.name}
          </h3>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-8">
            {staff.role}
          </p>

          <div className="grid grid-cols-2 gap-8 w-full py-6 border-y border-zinc-50 mb-8">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Properties</p>
              <p className="text-xl font-bold text-zinc-900">{staff.properties}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Availability</p>
              <div className="flex items-center justify-center gap-2">
                <div className={`h-2 w-2 rounded-full ${statusColors[staff.status]}`} />
                <span className="text-sm font-bold text-zinc-900">{staff.status}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            <Button variant="outline" className="rounded-2xl h-12 border-zinc-100 font-bold hover:bg-zinc-50">
              <Phone className="mr-2 h-4 w-4" /> Call
            </Button>
            <Link href={`/users/${staff.id}`} className="w-full">
              <Button variant="secondary" className="w-full rounded-2xl h-12 bg-primary/10 text-primary hover:bg-primary/20 font-bold border-none">
                Profile
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
