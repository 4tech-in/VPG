"use client"

import { useState } from "react"
import { 
  Search, 
  UserPlus, 
  Check, 
  X,
  User,
  ShieldCheck,
  Plus
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

const ALL_USERS = [
  { id: "1", name: "Sarah Miller", role: "Design Lead", email: "sarah@vpg.com" },
  { id: "2", name: "Marcus Aurelius", role: "Structural Engineer", email: "marcus@vpg.com" },
  { id: "3", name: "Elena Gilbert", role: "Site Supervisor", email: "elena@vpg.com" },
  { id: "4", name: "Julian Casablancas", role: "Project Manager", email: "julian@vpg.com" },
  { id: "5", name: "Sofia Rodriguez", role: "Marketing", email: "sofia@vpg.com" },
]

export function AssignDialog({ currentAssignees, onAssign }: { 
  currentAssignees: string[], 
  onAssign: (name: string) => void 
}) {
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)

  const filteredUsers = ALL_USERS.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 rounded-lg border border-dashed border-zinc-200 text-zinc-400 font-bold gap-2 text-[10px] hover:text-primary hover:border-primary/40">
           <UserPlus className="h-3 w-3" /> Assign Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-6 bg-zinc-50 border-b border-zinc-100">
          <div className="flex items-center gap-3 mb-1">
             <div className="p-2 bg-primary/10 rounded-xl">
                <UserPlus className="h-4 w-4 text-primary" />
             </div>
             <DialogTitle className="text-xl font-bold text-zinc-900 tracking-tight">Assign Team Member</DialogTitle>
          </div>
          <DialogDescription className="text-xs font-medium text-zinc-400">
            Select users to deploy them to this mission.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input 
              placeholder="Search by name or role..." 
              className="pl-10 h-11 rounded-xl border-zinc-100 bg-zinc-50/50 focus-visible:ring-primary font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
               {filteredUsers.map((user) => {
                 const isAssigned = currentAssignees.includes(user.name)
                 return (
                   <div 
                     key={user.id} 
                     className={cn(
                       "flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer group border border-transparent",
                       isAssigned ? "bg-primary/5 border-primary/10 shadow-sm" : "hover:bg-zinc-50 hover:border-zinc-100"
                     )}
                     onClick={() => {
                        if (!isAssigned) {
                          onAssign(user.name)
                          setOpen(false)
                        }
                     }}
                   >
                     <div className="flex items-center gap-3">
                       <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                          <AvatarFallback className="bg-zinc-100 text-[10px] font-bold text-zinc-400">{user.name[0]}</AvatarFallback>
                       </Avatar>
                       <div className="flex flex-col">
                         <span className="text-sm font-bold text-zinc-900">{user.name}</span>
                         <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" /> {user.role}
                         </span>
                       </div>
                     </div>

                     <div className={cn(
                       "h-8 w-8 rounded-full flex items-center justify-center transition-all",
                       isAssigned ? "bg-primary text-white scale-110 shadow-lg shadow-primary/20" : "bg-zinc-100 text-zinc-400 opacity-0 group-hover:opacity-100"
                     )}>
                        {isAssigned ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                     </div>
                   </div>
                 )
               })}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="p-6 bg-zinc-50 border-t border-zinc-100">
           <Button variant="ghost" className="h-11 rounded-xl font-bold text-zinc-400" onClick={() => setOpen(false)}>
              Cancel
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
