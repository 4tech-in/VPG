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
  const [dueDate, setDueDate] = useState("")
  const [priority, setPriority] = useState("medium")
  const [status, setStatus] = useState("pending")

  const { users } = useUsers()
  const { addTask, editTask } = useTasks({ skipFetch: true })

  useEffect(() => {
    if (isOpen) {
      if (task) {
        setTitle(task.title)
        setDescription(task.description || "")
        setAssignedToId(task.assignedToId)
        setDueDate(task.dueDate || "")
        setPriority(task.priority)
        setStatus(task.status)
      } else {
        setTitle("")
        setDescription("")
        setAssignedToId("")
        setDueDate("")
        setPriority("medium")
        setStatus("pending")
      }
    }
  }, [task, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !assignedToId) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      if (task) {
        await editTask(task.id, {
          title,
          description,
          assignedToId,
          priority,
          dueDate,
          status,
        })
      } else {
        await addTask({
          title,
          description,
          assignedToId,
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
          <Button className="h-11 rounded-xl px-6 font-bold shadow-lg shadow-primary/20 bg-primary">
            <Plus className="mr-2 h-4 w-4" /> Create Task
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-8 pb-4 bg-zinc-50/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-primary/10 rounded-xl">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-black text-zinc-900 tracking-tight">
              {task ? "Edit Task Details" : "Create New Task"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-zinc-400 font-medium">
            {task
              ? "Modify the details of this operational mission below."
              : "Fill in the details to assign a new mission to your team."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Task Name */}
            <div className="space-y-2 md:col-span-2">
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Task Name</Label>
              <Input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Finalize Sale for Unit 402"
                className="h-14 rounded-2xl bg-zinc-50 border-zinc-100 focus-visible:ring-primary font-bold"
              />
            </div>

            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the task in detail..."
                className="min-h-[100px] rounded-2xl bg-zinc-50 border-zinc-100 focus-visible:ring-primary font-medium p-4"
              />
            </div>

            {/* Assignee Selection */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Assign To</Label>
              <Select onValueChange={setAssignedToId} value={assignedToId} required>
                <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 border-zinc-100 font-bold">
                  <SelectValue placeholder="Select User" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
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
                  <SelectItem value="urgent">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-700" />
                      Urgent
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div className={cn("space-y-2", task ? "md:col-span-1" : "md:col-span-2")}>
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Due Date</Label>
              <div className="relative">
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-14 rounded-2xl bg-zinc-50 border-zinc-100 focus-visible:ring-primary font-bold pl-4"
                />
                <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            {/* Status (Only when editing) */}
            {task && (
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 border-zinc-100 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="pt-8 border-t border-zinc-50 gap-4">
            <Button type="button" variant="ghost" className="h-14 rounded-2xl px-8 font-bold text-zinc-400" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="h-14 rounded-2xl px-12 font-black shadow-xl shadow-primary/20 bg-primary text-sm tracking-wider uppercase">
              {task ? "Save Changes" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
