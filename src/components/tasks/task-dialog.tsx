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

import { useUsers } from "@/hooks/use-users"
import { useTasks, Task } from "@/hooks/use-tasks"
import { useProjects } from "@/hooks/use-projects"
import { cn } from "@/lib/utils"

interface TaskDialogProps {
  onSuccess?: () => void
  task?: Task | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function TaskDialog({ onSuccess, task, open, onOpenChange }: TaskDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = open !== undefined ? open : internalOpen
  const setIsOpen = onOpenChange !== undefined ? onOpenChange : setInternalOpen

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [assignedToId, setAssignedToId] = useState("")
  const [projectId, setProjectId] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [priority, setPriority] = useState("medium")
  const [status, setStatus] = useState("pending")

  const { users } = useUsers()
  const { projects } = useProjects()
  const { addTask, editTask } = useTasks({ skipFetch: true })

  useEffect(() => {
    if (isOpen) {
      if (task) {
        setTitle(task.title)
        setDescription(task.description || "")
        setAssignedToId(task.assignedToId)
        setProjectId(task.projectId || "")
        setDueDate(task.dueDate || "")
        setPriority(task.priority)
        setStatus(task.status)
      } else {
        setTitle("")
        setDescription("")
        setAssignedToId("")
        setProjectId("")
        setDueDate("")
        setPriority("medium")
        setStatus("pending")
      }
    }
  }, [task, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !assignedToId || !projectId) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      if (task) {
        await editTask(task.id, {
          title,
          description,
          assignedToId,
          projectId,
          priority,
          dueDate,
          status,
        })
      } else {
        await addTask({
          title,
          description,
          assignedToId,
          projectId,
          priority,
          dueDate,
        })
      }
      if (onSuccess) onSuccess()
      setIsOpen(false)
      if (!task) {
        setTitle("")
        setDescription("")
        setAssignedToId("")
        setProjectId("")
        setDueDate("")
        setPriority("medium")
        setStatus("pending")
      }
    } catch (error) {
      // toast is handled by useTasks
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {open === undefined && (
        <DialogTrigger asChild>
          <Button className="h-11 rounded-xl px-6 font-bold shadow-lg shadow-primary/20 bg-primary hover:scale-[1.02] transition-all">
            <Plus className="mr-2 h-4 w-4" /> Create Task
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="p-8 pb-6 bg-gradient-to-br from-zinc-50 to-white border-b border-zinc-100 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-[0.03] rotate-12 pointer-events-none">
            <Briefcase className="h-32 w-32" />
          </div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="flex flex-col text-left">
              <DialogTitle className="text-2xl font-black text-zinc-900 tracking-tight">
                {task ? "Edit Task Details" : "Create New Task"}
              </DialogTitle>
              <DialogDescription className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                {task
                  ? "Modify the details of this operational mission."
                  : "Fill in the details to assign a new mission to your team."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 bg-white relative overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Project Selection */}
            <div className="space-y-2 md:col-span-2 group">
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest group-focus-within:text-primary transition-colors">Project <span className="text-rose-500">*</span></Label>
              <Select onValueChange={setProjectId} value={projectId} required>
                <SelectTrigger className="h-14 rounded-2xl bg-zinc-50/50 border-zinc-100 focus:ring-primary focus:bg-white font-bold shadow-sm hover:border-primary/20 transition-all px-5">
                  <SelectValue placeholder="Select Project..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-zinc-100 shadow-2xl p-1">
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id} className="rounded-xl cursor-pointer focus:bg-primary/5 focus:text-primary transition-colors">
                      <div className="flex items-center gap-2 font-semibold">
                        {p.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Task Name */}
            <div className="space-y-2 md:col-span-2 group">
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest group-focus-within:text-primary transition-colors">Task Name <span className="text-rose-500">*</span></Label>
              <Input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Finalize Sale for Unit 402"
                className="h-14 rounded-2xl bg-zinc-50/50 border-zinc-100 focus-visible:ring-primary focus-visible:bg-white font-bold shadow-sm hover:border-primary/20 transition-all text-base px-5"
              />
            </div>

            {/* Description */}
            <div className="space-y-2 md:col-span-2 group">
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest group-focus-within:text-primary transition-colors">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the task in detail..."
                className="min-h-[120px] rounded-[1.25rem] bg-zinc-50/50 border-zinc-100 focus-visible:ring-primary focus-visible:bg-white font-medium shadow-sm hover:border-primary/20 transition-all p-5 resize-none leading-relaxed"
              />
            </div>



            {/* Assignee Selection */}
            <div className="space-y-2 group">
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest group-focus-within:text-primary transition-colors">Assign To</Label>
              <Select onValueChange={setAssignedToId} value={assignedToId} required>
                <SelectTrigger className="h-14 rounded-2xl bg-zinc-50/50 border-zinc-100 focus:ring-primary focus:bg-white font-bold shadow-sm hover:border-primary/20 transition-all px-5">
                  <SelectValue placeholder="Select Team Member" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-zinc-100 shadow-2xl p-1">
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id} className="rounded-xl cursor-pointer focus:bg-primary/5 focus:text-primary transition-colors">
                      <div className="flex items-center gap-2 font-semibold">
                        {u.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2 group">
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest group-focus-within:text-primary transition-colors">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-14 rounded-2xl bg-zinc-50/50 border-zinc-100 focus:ring-primary focus:bg-white font-bold shadow-sm hover:border-primary/20 transition-all px-5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-zinc-100 shadow-2xl p-1">
                  <SelectItem value="low" className="rounded-xl focus:bg-emerald-50 focus:text-emerald-700 cursor-pointer transition-colors">
                    <div className="flex items-center gap-2 font-bold text-emerald-600">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                      Low Priority
                    </div>
                  </SelectItem>
                  <SelectItem value="medium" className="rounded-xl focus:bg-amber-50 focus:text-amber-700 cursor-pointer transition-colors">
                    <div className="flex items-center gap-2 font-bold text-amber-600">
                      <div className="h-2 w-2 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
                      Medium Priority
                    </div>
                  </SelectItem>
                  <SelectItem value="high" className="rounded-xl focus:bg-rose-50 focus:text-rose-700 cursor-pointer transition-colors">
                    <div className="flex items-center gap-2 font-bold text-rose-600">
                      <div className="h-2 w-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
                      High Priority
                    </div>
                  </SelectItem>
                  <SelectItem value="urgent" className="rounded-xl focus:bg-red-100 focus:text-red-800 cursor-pointer transition-colors">
                    <div className="flex items-center gap-2 font-black text-red-700">
                      <div className="h-2 w-2 rounded-full bg-red-600 shadow-sm shadow-red-600/50 animate-pulse" />
                      Urgent Mission
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div className={cn("space-y-2 group", task ? "md:col-span-1" : "md:col-span-2")}>
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest group-focus-within:text-primary transition-colors">Due Date</Label>
              <div className="relative">
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-14 rounded-2xl bg-zinc-50/50 border-zinc-100 focus-visible:ring-primary focus-visible:bg-white font-bold shadow-sm hover:border-primary/20 transition-all pl-5 pr-12 text-sm"
                />
                <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            {/* Status (Only when editing) */}
            {task && (
              <div className="space-y-2 group">
                <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest group-focus-within:text-primary transition-colors">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-14 rounded-2xl bg-zinc-50/50 border-zinc-100 focus:ring-primary focus:bg-white font-bold shadow-sm hover:border-primary/20 transition-all px-5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-zinc-100 shadow-2xl p-1">
                    <SelectItem value="pending" className="rounded-xl focus:bg-amber-50 cursor-pointer">
                      <span className="font-bold text-amber-600">Pending</span>
                    </SelectItem>
                    <SelectItem value="in_progress" className="rounded-xl focus:bg-blue-50 cursor-pointer">
                      <span className="font-bold text-blue-600">In Progress</span>
                    </SelectItem>
                    <SelectItem value="review" className="rounded-xl focus:bg-purple-50 cursor-pointer">
                      <span className="font-bold text-purple-600">Review</span>
                    </SelectItem>
                    <SelectItem value="completed" className="rounded-xl focus:bg-primary/5 cursor-pointer">
                      <span className="font-bold text-primary">Completed</span>
                    </SelectItem>
                    <SelectItem value="cancelled" className="rounded-xl focus:bg-rose-50 cursor-pointer">
                      <span className="font-bold text-rose-600">Cancelled</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="pt-8 mt-2 border-t border-zinc-50/80 gap-3">
            <Button type="button" variant="ghost" className="h-14 rounded-2xl px-8 font-bold text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors" onClick={() => setIsOpen(false)}>
              Discard
            </Button>
            <Button type="submit" className="h-14 rounded-2xl px-12 font-black shadow-xl shadow-primary/20 bg-gradient-to-r from-primary to-primary/90 text-white tracking-widest uppercase hover:scale-[1.02] hover:shadow-primary/30 active:scale-95 transition-all">
              {task ? "Save Mission" : "Launch Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
