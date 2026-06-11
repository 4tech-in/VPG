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
};

type Menu = {
  href: string;
  label: string;
  active?: boolean;
  icon: LucideIcon;
  submenus?: Submenu[];
};

type Group = {
  groupLabel: string;
  menus: Menu[];
};

export function getMenuList(pathname: string, userRole?: string): Group[] {
  const isSuperAdmin = userRole?.toLowerCase() === "superadmin";

  return [
    {
      groupLabel: "MAIN MENU",
      menus: [
        {
          href: "/dashboard",
          label: "Dashboard",
          icon: LayoutGrid,
          submenus: []
        },
        {
          href: "/users",
          label: "Staff",
          icon: User,
          submenus: []
        },
        {
          href: "/livetracking",
          label: "Live Tracking",
          icon: LucideView,
          submenus: []
        },
        {
          href: "",
          icon: ShoppingCart,
          label: "Purchase",
          submenus: [
            {
              href: "/indent",
              label: "Indent List"
            },
            // {
            //   href: "/quotation",
            //   label: "Quotation Requests"
            // },
            {
              href: "/purchase-order",
              label: "Purchase Orders"
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
              label: "Item"
            },
            {
              href: "/project",
              label: "Project"
            }
          ]
        },
        {
          href: "/vendor",
          label: "Vendor",
          icon: Scale,
          submenus: []
        },
        {
          href: "/geofence",
          label: "Geofence",
          icon: LocateIcon,
          submenus: []
        },
        {
          href: "/stores",
          label: "Asset",
          icon: Store,
          submenus: []
        },
        // {
        //   href: "/calendar",
        //   label: "Calendar",
        //   icon: Calendar,
        //   submenus: []
        // },
        // {
        //   href:"/leave",
        //   label:"Leave",
        //   icon:Calendar
        // },
        {
          href:"/advance",
          label:"Advance",
          icon:DollarSign
        },
        {
          href:"/material",
          label:"Material",
          icon:Box
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
          submenus: []
        },
        {
          href: "/Attendance-policy",
          label: "Attendance Policy",
          icon: ShieldCheck,
          submenus: []
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
          submenus: []
        },
        ...(isSuperAdmin
          ? [
              {
                href: "/orgnization",
                label: "Organization Master",
                icon: Workflow,
                submenus: []
              },
              {
                href: "/business-nodes",
                label: "Business Node",
                icon: Briefcase,
                submenus: []
              }
            ]
          : []),
        {
          href: "/tasks",
          label: "Task Master",
          icon: Workflow,
          submenus: []
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
              label: "Unit"
            },
            {
              href: "/group",
              label: "Group"
            },
            {
              href: "/sub-group",
              label: "Sub Group"
            },
            {
              href: "/approval-flow",
              label: "Approval Flow"
            },
            // {
            //   href: "/category",
            //   label: "Category"
            // }
          ]
        }
      ]
    }
  ];
}
