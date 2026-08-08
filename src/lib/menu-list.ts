import {
  Tag,
  Bookmark,
  SquarePen,
  LayoutGrid,
  LucideIcon,
  Scale,
  Settings,
  Workflow,
  User,
  LocateIcon,
  Store,
  Calendar,
  ShieldCheck,
  ShoppingCart,
  LayoutDashboard,
  LucideView,
  User2,
  DollarSign,
  Box,
  Briefcase
} from "lucide-react";

type Submenu = {
  href: string;
  label: string;
  active?: boolean;
  permission?: string;
};

type Menu = {
  href: string;
  label: string;
  active?: boolean;
  icon: LucideIcon;
  submenus?: Submenu[];
  permission?: string;
  iconBg?: string;
  iconColor?: string;
};

type Group = {
  groupLabel: string;
  menus: Menu[];
};

export function getMenuList(
  pathname: string, 
  userRole?: string,
  hasPermission?: (permission: string) => boolean
): Group[] {

  const rawList: Group[] = [
    {
      groupLabel: "MAIN MENU",
      menus: [
        {
          href: "/dashboard",
          label: "Dashboard",
          icon: LayoutGrid,
          submenus: [],
          permission: "dashboard:view",
          iconBg: "bg-blue-50",
          iconColor: "text-blue-500"
        },
        {
          href: "",
          icon: User,
          label: "User Management",
          iconBg: "bg-teal-50",
          iconColor: "text-teal-600",
          submenus: [
            {
              href: "/users",
              label: "Staff",
              permission: "user:view"
            },
            {
              href: "/livetracking",
              label: "Live Tracking",
              permission: "livetracking:view"
            },
            {
              href: "/advance",
              label: "Advance",
              permission: "advance:view"
            }
          ]
        },
        {
          href: "",
          icon: ShoppingCart,
          label: "Purchase",
          iconBg: "bg-emerald-50",
          iconColor: "text-emerald-500",
          submenus: [
            {
              href: "/indent",
              label: "Indent List",
              permission: "indent:view"
            },
            {
              href: "/purchase-order",
              label: "Purchase Orders",
              permission: "purchase-order:view"
            },
            {
              href: "/item",
              label: "Item",
              permission: "item:view"
            }
          ]
        },
        {
          href: "",
          icon: Workflow,
          label: "Project",
          iconBg: "bg-blue-50",
          iconColor: "text-blue-500",
          submenus: [
            {
              href: "/project",
              label: "Project",
              permission: "project:view"
            }
          ]
        },
        {
          href: "/vendor",
          label: "Vendor",
          icon: Scale,
          submenus: [],
          permission: "vendor:view",
          iconBg: "bg-orange-50",
          iconColor: "text-orange-500"
        },
        {
          href: "/geofence",
          label: "Geofence",
          icon: LocateIcon,
          submenus: [],
          permission: "geofence:view",
          iconBg: "bg-purple-50",
          iconColor: "text-purple-500"
        },
        {
          href: "",
          label: "Asset",
          icon: Store,
          iconBg: "bg-emerald-50",
          iconColor: "text-emerald-500",
          submenus: [
            {
              href: "/stores",
              label: "Asset Master",
              permission: "asset:view"
            },
            {
              href: "/asset-site-transfers",
              label: "Site Transfers",
              permission: "asset-site-transfer:view"
            },
            {
              href: "/asset-maintenances",
              label: "Maintenance",
              permission: "asset-maintenance:view"
            }
          ]
        },

        {
          href: "",
          label: "Material",
          icon: Box,
          iconBg: "bg-rose-50",
          iconColor: "text-rose-500",
          submenus: [
            {
              href: "/material",
              label: "Material Master",
              permission: "material:view"
            },
            {
              href: "/material-site-transfers",
              label: "Site Transfers",
              permission: "material-site-transfer:view"
            },
            {
              href: "/material-returns",
              label: "Returns",
              permission: "material-return:view"
            }
          ]
        }
      ]
    },
    {
      groupLabel: "ATTENDANCE",
      menus: [
        {
          href: "/attendance",
          label: "Attendance",
          icon: User2,
          submenus: [],
          permission: "attendance:view",
          iconBg: "bg-blue-50",
          iconColor: "text-blue-500"
        },
        {
          href: "/Attendance-policy",
          label: "Attendance Policy",
          icon: ShieldCheck,
          submenus: [],
          permission: "attendance-policy:view",
          iconBg: "bg-emerald-50",
          iconColor: "text-emerald-500"
        }
      ]
    },
    {
      groupLabel: "MANAGEMENT",
      menus: [
        {
          href: "/roles",
          label: "Role Master",
          icon: User,
          submenus: [],
          permission: "role:view",
          iconBg: "bg-purple-50",
          iconColor: "text-purple-500"
        },
        
        {
          href: "/tasks",
          label: "Task Master",
          icon: Workflow,
          submenus: [],
          permission: "task:view",
          iconBg: "bg-blue-50",
          iconColor: "text-blue-500"
        }
      ]
    },
    {
      groupLabel: "SETTING & OTHERS",
      menus: [
        {
          href: "",
          icon: Settings,
          label: "Settings",
          iconBg: "bg-slate-100",
          iconColor: "text-slate-600",
          submenus: [
            {
              href: "/unit",
              label: "Unit",
              permission: "unit:view"
            },
            {
              href: "/group",
              label: "Group",
              permission: "group:view"
            },
            {
              href: "/sub-group",
              label: "Sub Group",
              permission: "sub-group:view"
            },
          ]
        }
      ]
    }
  ];

  const isSuperAdmin = userRole?.toLowerCase() === "superadmin" || userRole?.toLowerCase() === "admin";

  if (!hasPermission || isSuperAdmin) return rawList;

  // Filter the list based on hasPermission
  return rawList
    .map(group => {
      const filteredMenus = group.menus
        .map(menu => {
          if (menu.submenus && menu.submenus.length > 0) {
            return {
              ...menu,
              submenus: menu.submenus.filter(
                sub => !sub.permission || hasPermission(sub.permission)
              )
            };
          }
          return menu;
        })
        .filter(menu => {
          // If menu has a direct permission, check it
          if (menu.permission && !hasPermission(menu.permission)) return false;
          // If it was meant to have submenus but all were filtered out, hide the parent menu entirely
          if (menu.submenus && menu.submenus.length === 0 && (rawList.find(g => g.groupLabel === group.groupLabel)?.menus.find(m => m.label === menu.label)?.submenus?.length || 0) > 0) {
            return false; 
          }
          return true;
        });

      return {
        ...group,
        menus: filteredMenus
      };
    })
    .filter(group => group.menus.length > 0);
}
