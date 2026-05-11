"use client"

import { useState, useEffect } from "react"
import { 
  Plus, 
  Calendar as CalendarIcon, 
  MessageSquare, 
  Paperclip, 
  User, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Briefcase
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

// Mock projects and users for the "automatic assignment" demo
const PROJECTS = [
  { id: "p1", name: "Marbella Twin Towers", users: ["Julian Casablancas", "Sofia Rodriguez"] },
  { id: "p2", name: "Marbella Royce", users: ["Marcus Aurelius", "Elena Gilbert"] },
  { id: "p3", name: "Marbella Grand", users: ["Julian Casablancas", "Marcus Aurelius"] },
]

export function TaskDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<string>("")
  const [assignedUsers, setAssignedUsers] = useState<string[]>([])
  
  // Handle automatic user assignment based on project
  useEffect(() => {
    if (selectedProject) {
      const project = PROJECTS.find(p => p.id === selectedProject)
      if (project) {
        setAssignedUsers(project.users)
      }
    } else {
      setAssignedUsers([])
    }
  }, [selectedProject])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success("Task created successfully and team notified!")
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="h-11 rounded-xl px-6 font-bold shadow-lg shadow-primary/20 bg-primary">
          <Plus className="mr-2 h-4 w-4" /> Create Task
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-8 pb-4 bg-zinc-50/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-primary/10 rounded-xl">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-black text-zinc-900 tracking-tight">Create New Task</DialogTitle>
          </div>
          <DialogDescription className="text-zinc-400 font-medium">
            Fill in the details to assign a new mission to your team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Task Name */}
            <div className="space-y-2 md:col-span-2">
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Task Name</Label>
              <Input 
                required 
                placeholder="e.g. Finalize Sale for Unit 402" 
                className="h-14 rounded-2xl bg-zinc-50 border-zinc-100 focus-visible:ring-primary font-bold"
              />
            </div>

            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Description</Label>
              <Textarea 
                placeholder="Describe the task in detail..." 
                className="min-h-[100px] rounded-2xl bg-zinc-50 border-zinc-100 focus-visible:ring-primary font-medium p-4"
              />
            </div>

            {/* Project Selection */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Select Project</Label>
              <Select onValueChange={setSelectedProject} required>
                <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 border-zinc-100 font-bold">
                  <SelectValue placeholder="Choose Project" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
                  {PROJECTS.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            {/* <div className="space-y-2">
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Priority</Label>
              <Select defaultValue="medium">
                <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 border-zinc-100 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      Low Priority
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-amber-500" />
                      Medium Priority
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-rose-500" />
                      High Priority
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div> */}

            {/* Due Date */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Due Date</Label>
              <div className="relative">
                <Input 
                  type="date" 
                  className="h-14 rounded-2xl bg-zinc-50 border-zinc-100 focus-visible:ring-primary font-bold pl-4"
                />
                <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            {/* Automatic Assignees */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Assigned Team (Auto)</Label>
              <div className="h-14 rounded-2xl bg-white border border-dashed border-zinc-200 flex items-center px-4 gap-2 overflow-x-auto">
                {assignedUsers.length > 0 ? (
                  assignedUsers.map(user => (
                    <Badge key={user} variant="secondary" className="rounded-lg py-1 px-3 gap-2 bg-zinc-100 text-zinc-600 border-none shrink-0">
                      <User className="h-3 w-3" />
                      {user}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-zinc-400 italic">Select a project first</span>
                )}
              </div>
            </div>
          </div>

          
          <DialogFooter className="pt-8 border-t border-zinc-50 gap-4">
            <Button type="button" variant="ghost" className="h-14 rounded-2xl px-8 font-bold text-zinc-400" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="h-14 rounded-2xl px-12 font-black shadow-xl shadow-primary/20 bg-primary text-sm tracking-wider uppercase">
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
