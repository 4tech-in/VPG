"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Trash2,
  CheckCircle2,
  Edit3,
  Paperclip,
  MessageSquare,
  UserPlus,
  Calendar,
  Clock,
  MoreVertical,
  Plus,
  ChevronRight,
  FileText,
  History,
  Info,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AssignDialog } from "@/components/tasks/assign-dialog";
import { cn } from "@/lib/utils";

export default function TaskDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("comments");
  const [assignees, setAssignees] = useState<string[]>([
    "Assa Singh",
    "Vir Singh",
  ]);

  const handleAssign = (name: string) => {
    if (!assignees.includes(name)) {
      setAssignees((prev) => [...prev, name]);
      toast.success(`${name} assigned to mission`);
    }
  };

  const handleRemoveAssignee = (name: string) => {
    setAssignees((prev) => prev.filter((a) => a !== name));
    toast.info(`${name} removed from mission`);
  };

  return (
    <ContentLayout title="Task Details">
      <div className="flex flex-col gap-6 p-6 sm:p-10 max-w-[1400px] mx-auto min-h-screen bg-white">
        {/* Breadcrumbs & Actions Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              <Link
                href="/tasks"
                className="hover:text-primary transition-colors"
              >
                Tasks
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-zinc-900">Task #{params.id || "2384"}</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/tasks">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg hover:bg-zinc-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
                Task Details
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-10 rounded-xl border-zinc-200 text-rose-500 font-bold gap-2 hover:bg-rose-50 hover:text-rose-600 transition-all"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
            <Button className="h-10 rounded-xl bg-primary font-bold gap-2 shadow-lg shadow-primary/20">
              <CheckCircle2 className="h-4 w-4" /> Mark Complete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-10 pt-4">
          {/* Main Workspace */}
          <div className="flex flex-col gap-10">
            {/* Title Block */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className="rounded-md border-rose-100 bg-rose-50/50 text-rose-600 font-bold px-2 py-0.5 text-[10px] uppercase"
                >
                  Urgent
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-md border-blue-100 bg-blue-50/50 text-blue-600 font-bold px-2 py-0.5 text-[10px] uppercase"
                >
                  Engineering
                </Badge>
              </div>

              <div className="flex items-start justify-between">
                <h2 className="text-3xl font-bold text-zinc-900 leading-tight">
                  Finalize architecture review for Marbella Twin Towers Phase 1.
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-zinc-400 hover:text-primary"
                >
                  <Edit3 className="h-5 w-5" />
                </Button>
              </div>

              <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  <Info className="h-3 w-3" /> Description
                </div>
                <p className="text-sm font-medium text-zinc-600 leading-relaxed">
                  Please ensure that all structural modifications follow the
                  updated municipal guidelines for the Sector 402 development
                  zone. All documents must be signed off by the lead architect
                  and uploaded to the resources section before EOD Friday.
                </p>
              </div>
            </div>

            {/* Collaborative Area */}
            <div className="space-y-6">
              <Tabs
                defaultValue="comments"
                className="w-full"
                onValueChange={setActiveTab}
              >
                <TabsList className="bg-transparent h-auto p-0 border-b border-zinc-100 w-full justify-start rounded-none gap-8">
                  <TabsTrigger
                    value="comments"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-11 px-0 font-bold text-zinc-400 data-[state=active]:text-primary"
                  >
                    Comments (3)
                  </TabsTrigger>
                  <TabsTrigger
                    value="attachments"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-11 px-0 font-bold text-zinc-400 data-[state=active]:text-primary"
                  >
                    Resources (2)
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-11 px-0 font-bold text-zinc-400 data-[state=active]:text-primary"
                  >
                    Audit Log
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="comments"
                  className="pt-8 space-y-8 focus-visible:outline-none"
                >
                  <div className="flex gap-4">
                    <Avatar className="h-10 w-10 border border-zinc-100">
                      <AvatarFallback className="bg-zinc-50 text-[10px] font-bold text-zinc-400">
                        ME
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-3">
                      <Textarea
                        placeholder="Write a message..."
                        className="min-h-[100px] rounded-xl border-zinc-200 focus-visible:ring-primary font-medium p-4"
                      />
                      <div className="flex justify-end">
                        <Button className="h-9 px-6 rounded-lg font-bold text-xs">
                          Post Comment
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {[
                      {
                        user: "Sarah Miller",
                        time: "2 hours ago",
                        text: "I've uploaded the revised structural plans. Please review the lobby modifications.",
                      },
                      {
                        user: "Marcus Aurelius",
                        time: "5 hours ago",
                        text: "Confirmed the sector 402 guidelines. We are within compliance.",
                      },
                    ].map((c, i) => (
                      <div
                        key={i}
                        className="flex gap-4 p-4 rounded-xl hover:bg-zinc-50 transition-colors"
                      >
                        <Avatar className="h-10 w-10 border border-zinc-100">
                          <AvatarFallback className="bg-zinc-100 text-[10px] font-bold text-zinc-400">
                            {c.user[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-zinc-900">
                              {c.user}
                            </span>
                            <span className="text-[10px] font-bold text-zinc-400">
                              {c.time}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-600 font-medium">
                            {c.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent
                  value="attachments"
                  className="pt-8 focus-visible:outline-none"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 p-4 rounded-xl border border-zinc-100 hover:border-primary/20 hover:bg-primary/5 transition-all cursor-pointer group"
                      >
                        <div className="h-10 w-10 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:text-primary">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-zinc-900 text-sm">
                            Site_Manual_v{i}.pdf
                          </span>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase">
                            2.4 MB • PDF
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent
                  value="history"
                  className="pt-8 focus-visible:outline-none"
                >
                  <div className="space-y-4">
                    {[
                      {
                        action: "Status changed to In Progress",
                        user: "Admin",
                        date: "May 10, 10:45 AM",
                      },
                      {
                        action: "Priority updated to Urgent",
                        user: "Sarah Miller",
                        date: "May 09, 02:20 PM",
                      },
                      {
                        action: "Task created",
                        user: "Admin",
                        date: "May 08, 09:00 AM",
                      },
                    ].map((log, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-3 border-b border-zinc-50 last:border-0 text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <History className="h-4 w-4 text-zinc-300" />
                          <span className="font-medium text-zinc-600">
                            {log.action}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-bold text-zinc-900">
                            {log.user}
                          </span>
                          <span className="text-xs text-zinc-400">
                            {log.date}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Sidebar Panel */}
          <div className="flex flex-col gap-6">
            {/* Properties Card */}
            <div className="rounded-2xl border border-zinc-100 p-6 space-y-8">
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-50 pb-4">
                Operational Data
              </h3>

              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Status
                  </label>
                  <Select defaultValue="in-progress">
                    <SelectTrigger className="h-10 rounded-lg bg-emerald-50 border-none text-emerald-700 font-bold text-xs focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Priority
                  </label>
                  <Select defaultValue="urgent">
                    <SelectTrigger className="h-10 rounded-lg bg-rose-50 border-none text-rose-700 font-bold text-xs focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Assigned Team
                  </label>
                  <div className="flex flex-col gap-3">
                    {assignees.map((name) => (
                      <div
                        key={name}
                        className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 group hover:bg-zinc-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[8px] font-bold">
                              {name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-bold text-zinc-700">
                            {name}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100"
                          onClick={() => handleRemoveAssignee(name)}
                        >
                          <X className="h-3 w-3 text-rose-500" />
                        </Button>
                      </div>
                    ))}

                    <AssignDialog
                      currentAssignees={assignees}
                      onAssign={handleAssign}
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-zinc-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        Due Date
                      </span>
                    </div>
                    <span className="text-xs font-bold text-zinc-900">
                      May 16, 2026
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        Created
                      </span>
                    </div>
                    <span className="text-xs font-bold text-zinc-900">
                      May 03, 2026
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ContentLayout>
  );
}
