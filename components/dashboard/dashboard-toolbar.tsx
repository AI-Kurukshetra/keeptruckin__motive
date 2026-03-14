"use client";

import type { Route } from "next";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Car,
  Command,
  LayoutDashboard,
  Route as RouteIcon,
  Search,
  Siren,
  Truck,
  UserPlus,
  Users,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

type SearchScope = "drivers" | "vehicles" | "trips";

type CommandEntry = {
  label: string;
  href: Route;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
};

const pageEntries: readonly CommandEntry[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, shortcut: "G D" },
  { label: "Drivers", href: "/drivers", icon: Users },
  { label: "Vehicles", href: "/vehicles", icon: Truck, shortcut: "G V" },
  { label: "Trips", href: "/trips", icon: RouteIcon, shortcut: "G T" },
  { label: "Alerts", href: "/alerts", icon: Siren, shortcut: "G A" },
] as const;

const actionEntries: readonly CommandEntry[] = [
  { label: "Add Driver", href: "/drivers", icon: UserPlus },
  { label: "Add Vehicle", href: "/vehicles", icon: Car },
  { label: "Create Trip", href: "/trips", icon: RouteIcon },
] as const;

function scopeToPath(scope: SearchScope): Route {
  if (scope === "drivers") return "/drivers";
  if (scope === "vehicles") return "/vehicles";
  return "/trips";
}

function inferScope(pathname: string): SearchScope {
  if (pathname.startsWith("/vehicles")) return "vehicles";
  if (pathname.startsWith("/trips")) return "trips";
  return "drivers";
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
}

export function DashboardToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState(searchParams.get("search") ?? "");
  const [scope, setScope] = useState<SearchScope>(inferScope(pathname));
  const pendingG = useRef(false);
  const gTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setScope(inferScope(pathname));
  }, [pathname]);

  useEffect(() => {
    setQuery(searchParams.get("search") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if ((event.metaKey || event.ctrlKey) && key === "k") {
        event.preventDefault();
        setPaletteOpen((prev) => !prev);
        return;
      }

      if (isTypingTarget(event.target)) {
        return;
      }

      if (key === "g") {
        pendingG.current = true;
        if (gTimer.current) clearTimeout(gTimer.current);
        gTimer.current = setTimeout(() => {
          pendingG.current = false;
        }, 900);
        return;
      }

      if (!pendingG.current) {
        return;
      }

      if (gTimer.current) clearTimeout(gTimer.current);
      pendingG.current = false;

      if (key === "d") router.push("/dashboard");
      if (key === "v") router.push("/vehicles");
      if (key === "t") router.push("/trips");
      if (key === "a") router.push("/alerts");
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      if (gTimer.current) clearTimeout(gTimer.current);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [router]);

  const searchPlaceholder = useMemo(() => {
    if (scope === "drivers") return "Search drivers by name/license";
    if (scope === "vehicles") return "Search vehicles by unit/VIN";
    return "Search trips by route/status";
  }, [scope]);

  function runNavigation(href: Route) {
    setPaletteOpen(false);
    router.push(href);
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const basePath = scopeToPath(scope);
    const trimmed = query.trim();

    if (!trimmed) {
      router.push(basePath);
      return;
    }

    router.push(`${basePath}?search=${encodeURIComponent(trimmed)}` as Route);
  }

  return (
    <>
      <div className="flex flex-1 items-center gap-2">
        <form onSubmit={submitSearch} className="flex w-full items-center gap-2 md:max-w-xl">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input data-testid="global-search-input" value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-8"
              placeholder={searchPlaceholder}
            />
          </div>
          <select
            value={scope}
            onChange={(event) => setScope(event.target.value as SearchScope)}
            className="hidden h-9 rounded-md border border-input bg-background px-2 text-sm md:block"
            aria-label="Search scope" data-testid="global-search-scope"
          >
            <option value="drivers">Drivers</option>
            <option value="vehicles">Vehicles</option>
            <option value="trips">Trips</option>
          </select>
        </form>

        <Button type="button" variant="outline" size="sm" onClick={() => setPaletteOpen(true)} data-testid="command-palette-trigger">
          <Command className="mr-2 size-4" />
          <span className="hidden md:inline">Command</span>
          <kbd className="ml-2 hidden rounded border bg-muted px-1 text-[10px] text-muted-foreground md:inline">?K</kbd>
        </Button>

        <ThemeToggle />
      </div>

      <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <CommandInput placeholder="Search pages or actions..." />
        <CommandList>
          <CommandEmpty>No result found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {pageEntries.map((entry) => {
              const Icon = entry.icon;

              return (
                <CommandItem key={entry.label} onSelect={() => runNavigation(entry.href)} data-testid={`command-page-${entry.label.toLowerCase().replaceAll(" ", "-")}`}>
                  <Icon className="size-4" />
                  <span>{entry.label}</span>
                  {entry.shortcut ? <CommandShortcut>{entry.shortcut}</CommandShortcut> : null}
                </CommandItem>
              );
            })}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Actions">
            {actionEntries.map((entry) => {
              const Icon = entry.icon;

              return (
                <CommandItem key={entry.label} onSelect={() => runNavigation(entry.href)} data-testid={`command-action-${entry.label.toLowerCase().replaceAll(" ", "-")}`}>
                  <Icon className="size-4" />
                  <span>{entry.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}






