import { UserNav } from "@/components/admin-panel/user-nav";
import { SheetMenu } from "@/components/admin-panel/sheet-menu";
import { NotificationDropdown } from "@/components/admin-panel/notification-dropdown";

interface NavbarProps {
  title: string;
}

export function Navbar({ title }: NavbarProps) {
  return (
    <header className="sticky top-0 z-10 w-full bg-white/80 backdrop-blur-md border-b border-zinc-200/50 shadow-sm shadow-zinc-200/20">
      <div className="mx-4 sm:mx-8 flex h-16 items-center">
        <div className="flex items-center space-x-4 lg:space-x-0">
          <SheetMenu />
          <h1 className="text-xl font-bold md:hidden text-primary">{title}</h1>
        </div>
        
        <div className="flex flex-1 items-center justify-end gap-3">
          <div className="flex items-center gap-2">
            <NotificationDropdown />
            <div className="h-8 w-[1px] bg-zinc-200 mx-1"></div>
            <UserNav />
          </div>
        </div>
      </div>
    </header>
  );
}
