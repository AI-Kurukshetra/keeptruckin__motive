import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { getPrimaryMembership } from "@/lib/supabase/company";
import { canViewAlerts, canViewDrivers, canViewTrips, canViewVehicles, type CompanyRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/actions/auth";
import { SidebarNav, type SidebarNavItem } from "@/components/dashboard/sidebar-nav";

const DashboardToolbar = dynamic(
  () => import("@/components/dashboard/dashboard-toolbar").then((module) => module.DashboardToolbar),
  {
    loading: () => <div className="h-9 flex-1 rounded-md bg-muted/70" />,
  }
);

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Fleet dashboard and operations overview.",
};

const navItems: readonly SidebarNavItem[] = [
  { href: "/dashboard", label: "Overview", icon: "layout" },
  { href: "/drivers", label: "Drivers", icon: "users" },
  { href: "/vehicles", label: "Vehicles", icon: "truck" },
  { href: "/trips", label: "Trips", icon: "route" },
  { href: "/eld", label: "ELD", icon: "activity" },
  { href: "/inspections", label: "Inspections", icon: "clipboard" },
  { href: "/maintenance", label: "Maintenance", icon: "wrench" },
  { href: "/safety", label: "Safety", icon: "shield" },
  { href: "/alerts", label: "Alerts", icon: "bell" },
] as const;

function canViewNavItem(role: CompanyRole | null, href: SidebarNavItem["href"]): boolean {
  if (!role) {
    return true;
  }

  if (href === "/drivers") return canViewDrivers(role);
  if (href === "/vehicles") return canViewVehicles(role);
  if (href === "/trips") return canViewTrips(role);
  if (href === "/alerts") return canViewAlerts(role);

  return true;
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const membership = await getPrimaryMembership();
  const role = membership?.role ?? null;
  const visibleNavItems = navItems.filter((item) => canViewNavItem(role, item.href));

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-64 border-r bg-background lg:flex lg:flex-col">
          <div className="border-b px-4 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Fleet Operations</p>
            <p className="mt-1 truncate text-sm font-medium">{user.email}</p>
          </div>

          <SidebarNav items={visibleNavItems} />

          <div className="mt-auto border-t p-4">
            <form action={logoutAction}>
              <Button type="submit" variant="outline" className="w-full">
                Logout
              </Button>
            </form>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
            <div className="flex items-center gap-3 px-4 py-3 md:px-6">
              <div className="hidden min-w-0 lg:block">
                <p className="text-sm font-semibold">Fleet Operations</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>

              <DashboardToolbar role={role} />

              <form action={logoutAction}>
                <Button type="submit" variant="outline" size="sm">
                  Logout
                </Button>
              </form>
            </div>

            <div className="border-t lg:hidden">
              <SidebarNav items={visibleNavItems} compact />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}