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
          permission: "dashboard:view"
        },
        {
          href: "/users",
          label: "Staff",
          icon: User,
          submenus: [],
          permission: "user:view"
        },
        {
          href: "/livetracking",
          label: "Live Tracking",
          icon: LucideView,
          submenus: [],
          permission: "livetracking:view"
        },
        {
          href: "",
          icon: ShoppingCart,
          label: "Purchase",
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
            }
          ]
        },
        {
          href: "",
          icon: Workflow,
          label: "Project",
          submenus: [
            {
              href: "/item",
              label: "Item",
              permission: "item:view"
            },
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
          permission: "vendor:view"
        },
        {
          href: "/geofence",
          label: "Geofence",
          icon: LocateIcon,
          submenus: [],
          permission: "geofence:view"
        },
        {
          href: "",
          label: "Asset",
          icon: Store,
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
          href:"/advance",
          label:"Advance",
          icon:DollarSign,
          permission: "advance:view"
        },
        {
          href: "",
          label: "Material",
          icon: Box,
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
          permission: "attendance:view"
        },
        {
          href: "/Attendance-policy",
          label: "Attendance Policy",
          icon: ShieldCheck,
          submenus: [],
          permission: "attendance-policy:view"
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
          permission: "role:view"
        },
        
        {
          href: "/tasks",
          label: "Task Master",
          icon: Workflow,
          submenus: [],
          permission: "task:view"
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
