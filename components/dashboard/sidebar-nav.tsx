"use client";

import { memo } from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Activity,
  ClipboardCheck,
  LayoutDashboard,
  Route as RouteIcon,
  Shield,
  Truck,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type SidebarIconKey =
  | "layout"
  | "users"
  | "truck"
  | "route"
  | "activity"
  | "clipboard"
  | "wrench"
  | "shield"
  | "bell";

export type SidebarNavItem = {
  href: Route;
  label: string;
  icon: SidebarIconKey;
};

const iconMap: Record<SidebarIconKey, LucideIcon> = {
  layout: LayoutDashboard,
  users: Users,
  truck: Truck,
  route: RouteIcon,
  activity: Activity,
  clipboard: ClipboardCheck,
  wrench: Wrench,
  shield: Shield,
  bell: Bell,
};

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export const SidebarNav = memo(function SidebarNav({
  items,
  compact = false,
}: {
  items: readonly SidebarNavItem[];
  compact?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex gap-1", compact ? "overflow-x-auto p-2" : "flex-col p-2")}>
      {items.map((item) => {
        const active = isActivePath(pathname, item.href);
        const Icon = iconMap[item.icon];

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-muted",
              compact ? "min-w-fit" : "w-full",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon
              className={cn(
                "size-[18px] opacity-80",
                active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
              )}
            />
            <span className="whitespace-nowrap">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
});


