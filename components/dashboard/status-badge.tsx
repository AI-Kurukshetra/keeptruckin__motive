import { Badge } from "@/components/ui/badge";

type AlertSeverity = "low" | "medium" | "high" | "critical";
type AlertStatus = "open" | "acknowledged" | "resolved";
type TripStatus = "planned" | "in_progress" | "completed" | "cancelled";
type VehicleStatus = "active" | "maintenance" | "inactive" | string;

export function AlertSeverityBadge({ severity }: { severity: AlertSeverity }) {
  if (severity === "critical") return <Badge variant="destructive">Critical</Badge>;
  if (severity === "high") return <Badge variant="secondary">High</Badge>;
  if (severity === "medium") return <Badge variant="outline">Medium</Badge>;
  return <Badge variant="ghost">Low</Badge>;
}

export function AlertStatusBadge({ status }: { status: AlertStatus }) {
  if (status === "resolved") return <Badge variant="ghost">Resolved</Badge>;
  if (status === "acknowledged") return <Badge variant="outline">Acknowledged</Badge>;
  return <Badge variant="secondary">Open</Badge>;
}

export function TripStatusBadge({ status }: { status: TripStatus }) {
  if (status === "completed") return <Badge variant="ghost">Completed</Badge>;
  if (status === "cancelled") return <Badge variant="destructive">Cancelled</Badge>;
  if (status === "in_progress") return <Badge variant="secondary">In Progress</Badge>;
  return <Badge variant="outline">Planned</Badge>;
}

export function VehicleStatusBadge({ status }: { status: VehicleStatus }) {
  const normalized = status.toLowerCase();

  if (normalized === "active") return <Badge variant="secondary">Active</Badge>;
  if (normalized === "maintenance") return <Badge variant="outline">Maintenance</Badge>;
  if (normalized === "inactive") return <Badge variant="destructive">Inactive</Badge>;

  return <Badge variant="ghost">{status}</Badge>;
}
