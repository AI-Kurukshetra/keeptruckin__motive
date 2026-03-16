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
  Cpu,
  Plus,
  Radio,
  Route,
  Shield,
  Sparkles,
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
import {
  canCreateDrivers,
  canCreateTrips,
  canEditVehicles,
  canViewAlerts,
  canViewDrivers,
  canViewInspections,
  canViewMaintenance,
  canViewSafety,
  canViewTrips,
  canViewVehicles,
  type CompanyRole,
} from "@/lib/permissions";

type Driver = { id: string; created_at: string };
type Vehicle = { id: string; status: string; created_at: string };
type Trip = { id: string; status: string; started_at: string | null; created_at: string };
type Alert = { id: string; severity: "low" | "medium" | "high" | "critical"; status: string; triggered_at: string; alert_type: string };
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
const chartAnimationDuration = 1200;
const chartAnimationEasing = "ease-out";

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
    <Card data-testid={testId} className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
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
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3} animationDuration={chartAnimationDuration} animationEasing={chartAnimationEasing} isAnimationActive>
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
              <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={chartAnimationDuration} animationEasing={chartAnimationEasing} isAnimationActive>
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

function indicatorTone(score: number): "good" | "warn" | "risk" {
  if (score >= 85) return "good";
  if (score >= 65) return "warn";
  return "risk";
}

function indicatorClasses(tone: "good" | "warn" | "risk") {
  if (tone === "good") return { bar: "bg-emerald-500", text: "text-emerald-600", chip: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700" };
  if (tone === "warn") return { bar: "bg-amber-500", text: "text-amber-600", chip: "border-amber-500/20 bg-amber-500/10 text-amber-700" };
  return { bar: "bg-red-500", text: "text-red-600", chip: "border-red-500/20 bg-red-500/10 text-red-700" };
}

export function DashboardOverviewClient({ companyId, role }: { companyId: string; role: CompanyRole }) {
  const canReadDrivers = canViewDrivers(role);
  const canReadVehicles = canViewVehicles(role);
  const canReadTrips = canViewTrips(role);
  const canReadAlerts = canViewAlerts(role);
  const canReadMaintenance = canViewMaintenance(role);
  const canReadInspections = canViewInspections(role);
  const canReadSafety = canViewSafety(role);

  const driversQuery = useQuery({
    queryKey: ["drivers", companyId],
    queryFn: () => apiFetch<Driver[]>(`/api/drivers?companyId=${companyId}`),
    enabled: canReadDrivers,
  });
  const vehiclesQuery = useQuery({
    queryKey: ["vehicles", companyId],
    queryFn: () => apiFetch<Vehicle[]>(`/api/vehicles?companyId=${companyId}`),
    enabled: canReadVehicles,
  });
  const tripsQuery = useQuery({
    queryKey: ["trips", companyId],
    queryFn: () => apiFetch<Trip[]>(`/api/trips?companyId=${companyId}`),
    enabled: canReadTrips,
  });
  const alertsQuery = useQuery({
    queryKey: ["alerts", companyId],
    queryFn: () => apiFetch<Alert[]>(`/api/alerts?companyId=${companyId}&limit=200`),
    enabled: canReadAlerts,
  });
  const maintenanceQuery = useQuery({
    queryKey: ["maintenance", companyId],
    queryFn: () => apiFetch<Maintenance[]>(`/api/maintenance?companyId=${companyId}&limit=200`),
    enabled: canReadMaintenance,
  });
  const inspectionsQuery = useQuery({
    queryKey: ["inspections", companyId],
    queryFn: () => apiFetch<Inspection[]>(`/api/inspections?companyId=${companyId}&limit=200`),
    enabled: canReadInspections,
  });
  const safetyEventsQuery = useQuery({
    queryKey: ["safety-events", companyId],
    queryFn: () => apiFetch<SafetyEvent[]>(`/api/safety?companyId=${companyId}&limit=200`),
    enabled: canReadSafety,
  });
  const safetyScoreQuery = useQuery({
    queryKey: ["safety-score", companyId],
    queryFn: () => apiFetch<SafetyScore>(`/api/safety/score?companyId=${companyId}`),
    enabled: canReadSafety,
  });

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

  const criticalAlerts = useMemo(
    () => (alertsQuery.data ?? []).filter((alert) => alert.status !== "resolved" && (alert.severity === "critical" || alert.severity === "high")).length,
    [alertsQuery.data]
  );

  const activeTrips = useMemo(
    () => (tripsQuery.data ?? []).filter((trip) => trip.status === "in_progress").length,
    [tripsQuery.data]
  );

  const overdueMaintenance = useMemo(
    () => (maintenanceQuery.data ?? []).filter((record) => record.status === "overdue").length,
    [maintenanceQuery.data]
  );

  const inactiveVehicles = useMemo(
    () => (vehiclesQuery.data ?? []).filter((vehicle) => vehicle.status !== "active").length,
    [vehiclesQuery.data]
  );

  const safetyBase = safetyScoreQuery.data?.safetyScore ?? 100;

  const maintenanceIndicator = Math.max(0, 100 - overdueMaintenance * 12);
  const alertsIndicator = Math.max(0, 100 - openAlerts * 8);
  const fleetHealthScore = Math.max(0, Math.min(100, Math.round((safetyBase * 0.45) + (maintenanceIndicator * 0.3) + (alertsIndicator * 0.25))));

  const healthTone = indicatorTone(fleetHealthScore);
  const healthClasses = indicatorClasses(healthTone);

  const safetyTone = indicatorTone(safetyBase);
  const maintenanceTone = indicatorTone(maintenanceIndicator);
  const alertsTone = indicatorTone(alertsIndicator);

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
        title: "Driver onboarded",
        description: `New profile created (${driver.id.slice(0, 8)}...)`,
      });
    }

    for (const vehicle of vehiclesQuery.data ?? []) {
      items.push({
        type: "vehicle",
        timestamp: vehicle.created_at,
        title: "Vehicle registered",
        description: `Fleet asset added (${vehicle.id.slice(0, 8)}...)`,
      });
    }

    for (const trip of tripsQuery.data ?? []) {
      items.push({
        type: "trip",
        timestamp: trip.started_at ?? trip.created_at,
        title: trip.status === "in_progress" ? "Trip in progress" : "Trip updated",
        description: `Trip status: ${trip.status.replaceAll("_", " ")}`,
      });
    }

    for (const alert of alertsQuery.data ?? []) {
      items.push({
        type: "alert",
        timestamp: alert.triggered_at,
        title: `${alert.severity.toUpperCase()} ${alert.alert_type.replaceAll("_", " ")}`,
        description: `Alert is ${alert.status}`,
      });
    }

    return items
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }, [alertsQuery.data, driversQuery.data, tripsQuery.data, vehiclesQuery.data]);

  const systemStatus = useMemo<{
    telemetry: "healthy" | "degraded";
    dispatch: "healthy" | "monitor";
    compliance: "healthy" | "risk";
    overall: "stable" | "attention";
  }>(() => {
    const telemetry = inactiveVehicles > 0 ? "degraded" : "healthy";
    const dispatch = activeTrips > 0 ? "healthy" : "monitor";
    const compliance = criticalAlerts > 0 || overdueMaintenance > 0 ? "risk" : "healthy";
    const overall = compliance === "risk" || telemetry === "degraded" ? "attention" : "stable";

    return { telemetry, dispatch, compliance, overall };
  }, [activeTrips, criticalAlerts, inactiveVehicles, overdueMaintenance]);

  const aiInsights = useMemo(() => {
    const insights: Array<{ title: string; detail: string; tone: "good" | "warn" | "risk" }> = [];

    if (criticalAlerts > 0) {
      insights.push({
        title: "Escalate critical alerts",
        detail: `${criticalAlerts} high/critical alerts are unresolved and may impact compliance windows.`,
        tone: "risk",
      });
    } else {
      insights.push({
        title: "Alert risk is controlled",
        detail: "No unresolved high-severity alerts detected in current operations.",
        tone: "good",
      });
    }

    if (overdueMaintenance > 0) {
      insights.push({
        title: "Maintenance backlog detected",
        detail: `${overdueMaintenance} records are overdue. Prioritize service scheduling for uptime stability.`,
        tone: "warn",
      });
    } else {
      insights.push({
        title: "Maintenance schedule healthy",
        detail: "No overdue maintenance records currently affecting fleet readiness.",
        tone: "good",
      });
    }

    if (safetyBase < 80) {
      insights.push({
        title: "Safety coaching recommended",
        detail: `Current safety score is ${safetyBase}. Target 85+ to reduce operational risk exposure.`,
        tone: "warn",
      });
    } else {
      insights.push({
        title: "Safety posture strong",
        detail: `Safety score at ${safetyBase}. Maintain current driving standards and monitoring cadence.`,
        tone: "good",
      });
    }

    return insights.slice(0, 3);
  }, [criticalAlerts, overdueMaintenance, safetyBase]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32" />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-12">
          <Skeleton className="h-[460px] xl:col-span-8" />
          <Skeleton className="h-[460px] xl:col-span-4" />
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
        <div className="space-y-4 xl:col-span-8">
          <Card className="transition-all duration-200 hover:shadow-lg hover:scale-[1.01]">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="size-4 text-primary" />
                  Fleet Health Indicators
                </CardTitle>
                <CardDescription>Color-coded health across safety, maintenance, and alert pressure.</CardDescription>
              </div>
              <Badge variant="outline" className={cn("border", healthClasses.chip)}>
                {healthTone === "good" ? "Healthy" : healthTone === "warn" ? "Warning" : "Critical"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end justify-between gap-4">
                <p className={cn("text-4xl font-semibold", healthClasses.text)}>{fleetHealthScore} / 100</p>
                <p className="text-xs text-muted-foreground">Composite Enterprise Health Score</p>
              </div>

              <div className="space-y-3">
                {[{
                  label: "Safety",
                  score: safetyBase,
                  tone: safetyTone,
                }, {
                  label: "Maintenance",
                  score: maintenanceIndicator,
                  tone: maintenanceTone,
                }, {
                  label: "Alerts",
                  score: alertsIndicator,
                  tone: alertsTone,
                }].map((item) => {
                  const classes = indicatorClasses(item.tone);
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{item.label}</span>
                        <span className={classes.text}>{Math.round(item.score)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div className={cn("h-2 rounded-full", classes.bar)} style={{ width: `${Math.max(4, Math.min(100, item.score))}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <PieChartCard title="Safety Events" description="Distribution by event type" data={safetyEventDistribution} />
            <BarChartCard title="Maintenance Status" description="Current maintenance workload" data={maintenanceDistribution} />
            <PieChartCard title="Inspections" description="Inspection outcome distribution" data={inspectionsDistribution} />
          </div>

          <Card className="transition-all duration-200 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="size-4 text-primary" />
                Fleet Activity Timeline
              </CardTitle>
              <CardDescription>Chronological operational events across drivers, assets, trips, and alerts.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 border-l-2 border-border pl-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((item) => (
                    <div key={`${item.type}-${item.timestamp}-${item.title}`} className="relative">
                      <span className="absolute -left-[22px] top-1.5 size-2 rounded-full bg-primary" />
                      <div className="flex items-start gap-3 rounded-md border bg-background p-3">
                        <div className="mt-0.5 rounded-md bg-muted p-1.5">
                          <ActivityIcon type={item.type} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">{item.title}</p>
                            <Badge variant="secondary" className="capitalize">{item.type}</Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">{formatActivityTime(item.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No recent fleet activity yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 xl:col-span-4">
          <Card className="transition-all duration-200 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="size-4 text-primary" />
                Fleet System Status
              </CardTitle>
              <CardDescription>Live operational health of core console subsystems.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatusRow label="Telemetry" status={systemStatus.telemetry} />
              <StatusRow label="Dispatch Engine" status={systemStatus.dispatch} />
              <StatusRow label="Compliance Monitor" status={systemStatus.compliance} />
              <Separator />
              <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Overall</span>
                <Badge variant={systemStatus.overall === "stable" ? "secondary" : "destructive"}>
                  {systemStatus.overall === "stable" ? "Stable" : "Needs Attention"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                AI Fleet Insights
              </CardTitle>
              <CardDescription>Derived recommendations from current operational data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiInsights.map((insight) => {
                const classes = indicatorClasses(insight.tone);
                return (
                  <div key={insight.title} className="rounded-md border bg-background p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{insight.title}</p>
                      <Badge variant="outline" className={cn("text-[11px]", classes.chip)}>
                        {insight.tone === "good" ? "Positive" : insight.tone === "warn" ? "Watch" : "Risk"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{insight.detail}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-lg hover:scale-[1.01]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="size-4 text-primary" />
                Quick Actions
              </CardTitle>
              <CardDescription>Jump to common tasks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {canCreateDrivers(role) ? (
                <Link href="/drivers" className={cn(buttonVariants({ variant: "secondary" }), "w-full justify-start transition duration-200 hover:bg-blue-600 hover:text-white")}>
                  <UserPlus className="mr-2 size-4" />
                  Add Driver
                </Link>
              ) : null}
              {canEditVehicles(role) ? (
                <Link href="/vehicles" className={cn(buttonVariants({ variant: "secondary" }), "w-full justify-start transition duration-200 hover:bg-blue-600 hover:text-white")}>
                  <Car className="mr-2 size-4" />
                  Add Vehicle
                </Link>
              ) : null}
              {canCreateTrips(role) ? (
                <Link href="/trips" className={cn(buttonVariants({ variant: "secondary" }), "w-full justify-start transition duration-200 hover:bg-blue-600 hover:text-white")}>
                  <Route className="mr-2 size-4" />
                  Create Trip
                </Link>
              ) : null}
              <Link href="/alerts" className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start transition duration-200 hover:bg-blue-600 hover:text-white")}>
                <Bell className="mr-2 size-4" />
                View Alerts
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatusRow({ label, status }: { label: string; status: "healthy" | "degraded" | "monitor" | "risk" }) {
  const tone = status === "healthy" ? "good" : status === "monitor" ? "warn" : "risk";
  const classes = indicatorClasses(tone);
  const statusLabel = status === "healthy" ? "Healthy" : status === "degraded" ? "Degraded" : status === "monitor" ? "Monitor" : "Risk";

  return (
    <div className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
      <div className="flex items-center gap-2">
        <Radio className={cn("size-3.5", classes.text)} />
        <span className="text-sm">{label}</span>
      </div>
      <Badge variant="outline" className={cn("text-[11px]", classes.chip)}>{statusLabel}</Badge>
    </div>
  );
}


