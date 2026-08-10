"use client";
import { Menu } from "@/components/admin-panel/menu";
import { SidebarToggle } from "@/components/admin-panel/sidebar-toggle";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useSidebar } from "@/hooks/use-sidebar";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";
import { LayoutDashboard } from "lucide-react";
import Link from "next/link";

export function Sidebar() {
  const sidebar = useStore(useSidebar, (x) => x);
  if (!sidebar) return null;
  const { isOpen, toggleOpen, getOpenState, setIsHover, settings } = sidebar;
  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-20 h-screen -translate-x-full lg:translate-x-0 transition-[width] ease-in-out duration-300 bg-sidebar text-sidebar-foreground",
        !getOpenState() ? "w-[90px]" : "w-72",
        settings.disabled && "hidden"
      )}
    >
      <SidebarToggle isOpen={isOpen} setIsOpen={toggleOpen} />
      <div
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        className="relative h-full flex flex-col pl-0 pr-2 pt-0 pb-4 overflow-y-auto shadow-md bg-sidebar text-sidebar-foreground"
      >
        <Button
          className={cn(
            "transition-transform ease-in-out duration-300 mt-6 mb-0 hover:bg-transparent text-sidebar-primary",
            !getOpenState() ? "translate-x-1" : "translate-x-0"
          )}
          variant="ghost"
          asChild
        >
          <Link href="/dashboard" className="flex items-center gap-1">
            <Image
              src="/vpg.jpeg"
              alt="VPG Logo"
              width={48}
              height={48}
              className={cn(
                "object-cover rounded-full transition-all duration-300",
                !getOpenState() ? "w-10 h-10" : "w-12 h-12"
              )}
            />
            <div
              className={cn(
                "flex flex-col text-left transition-[transform,opacity,display] ease-in-out duration-300",
                !getOpenState()
                  ? "-translate-x-96 opacity-0 hidden"
                  : "translate-x-0 opacity-100"
              )}
            >
              <span className="font-extrabold leading-tight tracking-wide text-sidebar-foreground whitespace-nowrap truncate max-w-[180px]">
                VPG CONSTRUCTION
              </span>
            </div>
          </Link>
        </Button>
        <Menu isOpen={getOpenState()} />
      </div>
    </aside>
  );
}
