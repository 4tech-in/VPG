"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Dot, LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DropdownMenuArrow } from "@radix-ui/react-dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { usePathname } from "next/navigation";

type Submenu = {
  href: string;
  label: string;
  active?: boolean;
};

interface CollapseMenuButtonProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  submenus: Submenu[];
  isOpen: boolean | undefined;
  iconBg?: string;
  iconColor?: string;
}

export function CollapseMenuButton({
  icon: Icon,
  label,
  active,
  submenus,
  isOpen,
  iconBg,
  iconColor
}: CollapseMenuButtonProps) {
  const pathname = usePathname();
  const isSubmenuActive = submenus.some((submenu) =>
    submenu.active === undefined ? submenu.href === pathname : submenu.active
  );
  const [isCollapsed, setIsCollapsed] = useState<boolean>(isSubmenuActive);

  return isOpen ? (
    <Collapsible
      open={isCollapsed}
      onOpenChange={setIsCollapsed}
      className="w-full"
    >
      <CollapsibleTrigger
        className="[&[data-state=open]>div>div>svg]:rotate-180 mb-1"
        asChild
      >
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start h-11 mb-1 rounded-xl transition-all duration-200",
            isSubmenuActive
              ? "bg-[#006d64] text-white shadow-md hover:bg-[#005a52]"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <div className="w-full items-center flex justify-between">
            <div className="flex items-center">
              <span className={cn(
                "flex items-center justify-center p-1.5 rounded-lg mr-4",
                isSubmenuActive ? "text-white bg-transparent" : cn(iconBg, iconColor)
              )}>
                <Icon size={18} />
              </span>
              <p
                className={cn(
                  "max-w-[150px] truncate",
                  isOpen
                    ? "translate-x-0 opacity-100"
                    : "-translate-x-96 opacity-0",
                  isSubmenuActive ? "text-white" : ""
                )}
              >
                {label}
              </p>
            </div>
            <div
              className={cn(
                "whitespace-nowrap",
                isOpen
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-96 opacity-0",
                isSubmenuActive ? "text-white" : ""
              )}
            >
              <ChevronDown
                size={18}
                className="transition-transform duration-200"
              />
            </div>
          </div>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        <div className="ml-5 mt-2 border-l-[3px] border-[#006d64] pl-2 bg-slate-50/50 rounded-r-xl py-1">
          {submenus.map(({ href, label, active }, index) => (
            <Button
              key={index}
              variant="ghost"
              className={cn(
                "w-full justify-start h-9 mb-1 rounded-xl transition-all duration-200",
                ((active === undefined && pathname === href) || active)
                  ? "bg-transparent text-[#006d64] font-semibold"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
              asChild
            >
              <Link href={href}>
                <span className="mr-3 ml-1">
                  <Dot size={24} className={cn(
                     ((active === undefined && pathname === href) || active) ? "text-[#006d64]" : "text-muted-foreground/50"
                  )} />
                </span>
                <p
                  className={cn(
                    "max-w-[170px] truncate",
                    isOpen
                      ? "translate-x-0 opacity-100"
                      : "-translate-x-96 opacity-0"
                  )}
                >
                  {label}
                </p>
              </Link>
            </Button>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  ) : (
    <DropdownMenu>
      <TooltipProvider disableHoverableContent>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start h-11 mb-1 rounded-xl transition-all duration-200",
                  isSubmenuActive
                    ? "bg-[#006d64] text-white shadow-md hover:bg-[#005a52]"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <div className="w-full items-center flex justify-between">
                  <div className="flex items-center">
                    <span className={cn(
                      "flex items-center justify-center p-1.5 rounded-lg",
                      isOpen === false ? "" : "mr-4",
                      isSubmenuActive ? "text-white bg-transparent" : cn(iconBg, iconColor)
                    )}>
                      <Icon size={18} />
                    </span>
                    <p
                      className={cn(
                        "max-w-[200px] truncate",
                        isOpen === false ? "opacity-0" : "opacity-100"
                      )}
                    >
                      {label}
                    </p>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right" align="start" alignOffset={2}>
            {label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent side="right" sideOffset={25} align="start">
        <DropdownMenuLabel className="max-w-[190px] truncate">
          {label}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {submenus.map(({ href, label, active }, index) => (
          <DropdownMenuItem key={index} asChild>
            <Link
              className={`cursor-pointer ${
                ((active === undefined && pathname === href) || active) &&
                "bg-secondary"
              }`}
              href={href}
            >
              <p className="max-w-[180px] truncate">{label}</p>
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuArrow className="fill-border" />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
