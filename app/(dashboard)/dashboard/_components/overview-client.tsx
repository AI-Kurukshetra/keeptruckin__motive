"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Bell,
  Car,
  ClipboardCheck,
  Plus,
  Route,
  Shield,
  Truck,
  UserPlus,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api/fetcher";

type Driver = { id: string; created_at: string };
type Vehicle = { id: string; status: string; created_at: string };
type Trip = { id: string; status: string; started_at: string | null; created_at: string };
type Alert = { id: string; severity: string; status: string; triggered_at: string; alert_type: string };
type Maintenance = { id: string; status: string };
type Inspection = { id: string; status: string };
type SafetyEvent = { id: string; event_type: string };
type SafetyScore = { safetyScore: number; totalEvents: number };

type ChartDatum = {
  name: string;
  value: number;
};

type ActivityItem = {
  type: "driver" | "vehicle" | "trip" | "alert";
  timestamp: string;
  title: string;
  description: string;
};

const chartPalette = ["#2563eb", "#0ea5e9", "#14b8a6", "#22c55e", "#f59e0b", "#ef4444"];

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  testId,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  testId: string;
}) {
  return (
    <Card data-testid={testId} className="animate-in fade-in slide-in-from-bottom-2 duration-300 transition-all duration-200 hover:shadow-lg hover:scale-[1.01]">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardDescription>{label}</CardDescription>
          <CardTitle className="text-2xl">{value}</CardTitle>
        </div>
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function PieChartCard({ title, description, data }: { title: string; description: string; data: ChartDatum[] }) {
  return (
    <Card className="transition-all duration-200 hover:shadow-lg hover:scale-[1.01]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                {data.map((entry, index) => (
                  <Cell key={`${entry.name}-${index}`} fill={chartPalette[index % chartPalette.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, "Count"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {data.length > 0 ? (
            data.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2 text-xs">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: chartPalette[index % chartPalette.length] }}
                />
                <span className="capitalize text-muted-foreground">{entry.name.replaceAll("_", " ")}</span>
                <span className="ml-auto font-medium">{entry.value}</span>
              </div>
            ))
          ) : (
            <p className="col-span-2 text-sm text-muted-foreground">No data available.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function BarChartCard({ title, description, data }: { title: string; description: string; data: ChartDatum[] }) {
  return (
    <Card className="transition-all duration-200 hover:shadow-lg hover:scale-[1.01]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickFormatter={(value: string) => value.replaceAll("_", " ")} fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip formatter={(value) => [value, "Count"]} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`${entry.name}-${index}`} fill={chartPalette[index % chartPalette.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function getCountDistribution(values: string[]): ChartDatum[] {
  const counts = new Map<string, number>();

  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
}

function formatActivityTime(timestamp: string): string {
  return new Date(timestamp).toLocaleString();
}

function ActivityIcon({ type }: { type: ActivityItem["type"] }) {
  if (type === "driver") return <UserPlus className="size-4 text-blue-500" />;
  if (type === "vehicle") return <Truck className="size-4 text-teal-500" />;
  if (type === "trip") return <Route className="size-4 text-amber-500" />;
  return <Bell className="size-4 text-red-500" />;
}

export function DashboardOverviewClient({ companyId }: { companyId: string }) {
  const driversQuery = useQuery({ queryKey: ["drivers", companyId], queryFn: () => apiFetch<Driver[]>(`/api/drivers?companyId=${companyId}`) });
  const vehiclesQuery = useQuery({ queryKey: ["vehicles", companyId], queryFn: () => apiFetch<Vehicle[]>(`/api/vehicles?companyId=${companyId}`) });
  const tripsQuery = useQuery({ queryKey: ["trips", companyId], queryFn: () => apiFetch<Trip[]>(`/api/trips?companyId=${companyId}`) });
  const alertsQuery = useQuery({ queryKey: ["alerts", companyId], queryFn: () => apiFetch<Alert[]>(`/api/alerts?companyId=${companyId}&limit=200`) });
  const maintenanceQuery = useQuery({ queryKey: ["maintenance", companyId], queryFn: () => apiFetch<Maintenance[]>(`/api/maintenance?companyId=${companyId}&limit=200`) });
  const inspectionsQuery = useQuery({ queryKey: ["inspections", companyId], queryFn: () => apiFetch<Inspection[]>(`/api/inspections?companyId=${companyId}&limit=200`) });
  const safetyEventsQuery = useQuery({ queryKey: ["safety-events", companyId], queryFn: () => apiFetch<SafetyEvent[]>(`/api/safety?companyId=${companyId}&limit=200`) });
  const safetyScoreQuery = useQuery({ queryKey: ["safety-score", companyId], queryFn: () => apiFetch<SafetyScore>(`/api/safety/score?companyId=${companyId}`) });

  const loading = [
    driversQuery,
    vehiclesQuery,
    tripsQuery,
    alertsQuery,
    maintenanceQuery,
    inspectionsQuery,
    safetyEventsQuery,
    safetyScoreQuery,
  ].some((query) => query.isLoading);

  const openAlerts = useMemo(
    () => (alertsQuery.data ?? []).filter((alert) => alert.status !== "resolved").length,
    [alertsQuery.data]
  );

  const activeTrips = useMemo(
    () => (tripsQuery.data ?? []).filter((trip) => trip.status === "in_progress").length,
    [tripsQuery.data]
  );

  const fleetHealthScore = useMemo(() => {
    const safetyScore = safetyScoreQuery.data?.safetyScore ?? 100;
    const unresolvedAlertPenalty = Math.min(openAlerts * 3, 30);
    const maintenancePenalty = Math.min(
      (maintenanceQuery.data ?? []).filter((record) => record.status === "overdue").length * 4,
      20
    );

    return Math.max(0, Math.round(safetyScore - unresolvedAlertPenalty - maintenancePenalty));
  }, [maintenanceQuery.data, openAlerts, safetyScoreQuery.data?.safetyScore]);

  const safetyEventDistribution = useMemo(
    () => getCountDistribution((safetyEventsQuery.data ?? []).map((event) => event.event_type)),
    [safetyEventsQuery.data]
  );

  const maintenanceDistribution = useMemo(
    () => getCountDistribution((maintenanceQuery.data ?? []).map((record) => record.status)),
    [maintenanceQuery.data]
  );

  const inspectionsDistribution = useMemo(
    () => getCountDistribution((inspectionsQuery.data ?? []).map((inspection) => inspection.status)),
    [inspectionsQuery.data]
  );

  const recentActivity = useMemo(() => {
    const items: ActivityItem[] = [];

    for (const driver of driversQuery.data ?? []) {
      items.push({
        type: "driver",
        timestamp: driver.created_at,
        title: "New driver created",
        description: `Driver record added (${driver.id.slice(0, 8)}...)`,
      });
    }

    for (const vehicle of vehiclesQuery.data ?? []) {
      items.push({
        type: "vehicle",
        timestamp: vehicle.created_at,
        title: "New vehicle added",
        description: `Vehicle onboarded (${vehicle.id.slice(0, 8)}...)`,
      });
    }

    for (const trip of tripsQuery.data ?? []) {
      if (trip.started_at || trip.status === "in_progress") {
        items.push({
          type: "trip",
          timestamp: trip.started_at ?? trip.created_at,
          title: "Trip started",
          description: `Trip is now ${trip.status.replaceAll("_", " ")}`,
        });
      }
    }

    for (const alert of alertsQuery.data ?? []) {
      items.push({
        type: "alert",
        timestamp: alert.triggered_at,
        title: "Alert triggered",
        description: `${alert.alert_type} (${alert.severity})`,
      });
    }

    return items
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);
  }, [alertsQuery.data, driversQuery.data, tripsQuery.data, vehiclesQuery.data]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32" />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-80" />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          <Skeleton className="h-72 xl:col-span-2" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Drivers" value={driversQuery.data?.length ?? 0} hint="Registered driver records" icon={Users} testId="metric-card-drivers" />
        <MetricCard label="Vehicles" value={vehiclesQuery.data?.length ?? 0} hint="Fleet vehicle count" icon={Truck} testId="metric-card-vehicles" />
        <MetricCard label="Active Trips" value={activeTrips} hint="Trips currently in progress" icon={Activity} testId="metric-card-active-trips" />
        <MetricCard label="Open Alerts" value={openAlerts} hint="Unresolved operational alerts" icon={AlertTriangle} testId="metric-card-open-alerts" />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-9">
          <Card className="transition-all duration-200 hover:shadow-lg hover:scale-[1.01]">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="size-4 text-primary" />
                  Fleet Health Score
                </CardTitle>
                <CardDescription>Composite of safety score, alerts, and maintenance risk.</CardDescription>
              </div>
              <Badge variant={fleetHealthScore >= 75 ? "default" : fleetHealthScore >= 50 ? "secondary" : "destructive"}>
                {fleetHealthScore >= 75 ? "Healthy" : fleetHealthScore >= 50 ? "Watch" : "Critical"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-semibold">{fleetHealthScore}</p>
                <p className="text-xs text-muted-foreground">Out of 100</p>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(6, fleetHealthScore)}%` }} />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <PieChartCard
              title="Safety Events"
              description="Distribution by event type"
              data={safetyEventDistribution}
            />
            <BarChartCard
              title="Maintenance Status"
              description="Current maintenance workload"
              data={maintenanceDistribution}
            />
            <PieChartCard
              title="Inspections"
              description="Inspection outcome distribution"
              data={inspectionsDistribution}
            />
          </div>
        </div>

        <div className="space-y-4 xl:col-span-3">
          <Card className="transition-all duration-200 hover:shadow-lg hover:scale-[1.01]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="size-4 text-primary" />
                Quick Actions
              </CardTitle>
              <CardDescription>Jump to common tasks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/drivers" className={cn(buttonVariants({ variant: "secondary" }), "w-full justify-start")}>
                <UserPlus className="mr-2 size-4" />
                Add Driver
              </Link>
              <Link href="/vehicles" className={cn(buttonVariants({ variant: "secondary" }), "w-full justify-start")}>
                <Car className="mr-2 size-4" />
                Add Vehicle
              </Link>
              <Link href="/trips" className={cn(buttonVariants({ variant: "secondary" }), "w-full justify-start")}>
                <Route className="mr-2 size-4" />
                Create Trip
              </Link>
              <Link href="/alerts" className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start")}>
                <Bell className="mr-2 size-4" />
                View Alerts
              </Link>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-lg hover:scale-[1.01]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="size-4 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest fleet system events.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((item, index) => (
                    <div key={`${item.type}-${item.timestamp}-${index}`} className="space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-md bg-muted p-1.5">
                          <ActivityIcon type={item.type} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="truncate text-xs text-muted-foreground">{item.description}</p>
                          <p className="text-xs text-muted-foreground">{formatActivityTime(item.timestamp)}</p>
                        </div>
                      </div>
                      {index < recentActivity.length - 1 ? <Separator /> : null}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No recent activity yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}







