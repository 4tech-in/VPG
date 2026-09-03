"use client";

import { useState } from "react";
import {
  Bell,
  Check,
  Clock,
  Info,
  AlertTriangle,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useNotificationStore } from "@/store/use-notification-store";
import { formatDistanceToNow } from "date-fns";

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const notifications = useNotificationStore((state) => state.notifications);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const markAsRead = useNotificationStore((state) => state.markAsRead);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <ShieldCheck className="h-4 w-4 text-emerald-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatTime = (time: string) => {
    if (time === "Just now") return "Just now";
    try {
      const date = new Date(time);
      if (isNaN(date.getTime())) return time;
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return time;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl relative text-zinc-500 hover:text-primary hover:bg-primary/5 transition-all"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-destructive rounded-full border-2 border-white"></span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0 rounded-2xl border-zinc-200/50 shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm text-zinc-900">Notifications</h4>
            {unreadCount > 0 && (
              <Badge
                variant="secondary"
                className="px-1.5 py-0 rounded-md text-[10px] bg-primary/10 text-primary font-bold"
              >
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-auto p-0 text-[10px] font-semibold text-zinc-500 hover:text-primary hover:bg-transparent"
            >
              <Check className="h-3 w-3 mr-1" /> Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[320px]">
          {notifications.length > 0 ? (
            <div className="flex flex-col">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 p-4 border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors cursor-pointer ${!notif.read ? "bg-primary/[0.02]" : ""}`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div
                    className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${!notif.read ? "bg-white shadow-sm border border-zinc-100" : "bg-zinc-100"}`}
                  >
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex flex-col gap-1 pr-2">
                    <p
                      className={`text-xs ${!notif.read ? "font-bold text-zinc-900" : "font-semibold text-zinc-700"}`}
                    >
                      {notif.title}
                    </p>
                    <p className="text-[11px] text-zinc-500 leading-snug line-clamp-2">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-[9px] font-semibold text-zinc-400">
                      <Clock className="h-3 w-3" />
                      {formatTime(notif.time)}
                    </div>
                  </div>
                  {!notif.read && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5"></div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-zinc-50 flex items-center justify-center">
                <Bell className="h-5 w-5 text-zinc-300" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-700">
                  All caught up!
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Check back later for new notifications.
                </p>
              </div>
            </div>
          )}
        </ScrollArea>
        <div className="p-2 border-t border-zinc-100 bg-zinc-50/50">
          <Button
            variant="ghost"
            className="w-full text-xs font-semibold text-primary hover:text-primary hover:bg-primary/5 h-8 rounded-xl"
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
