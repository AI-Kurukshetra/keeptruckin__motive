import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

type AlertSeverity = "low" | "medium" | "high" | "critical";
type AlertStatus = "open" | "acknowledged" | "resolved";
type TripStatus = "planned" | "in_progress" | "completed" | "cancelled";
type VehicleStatus = "active" | "maintenance" | "inactive" | string;

function BadgeLabel({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center whitespace-nowrap">{children}</span>;
}

export function AlertSeverityBadge({ severity }: { severity: AlertSeverity }) {
  if (severity === "critical") return <Badge variant="destructive"><BadgeLabel>Critical</BadgeLabel></Badge>;
  if (severity === "high") return <Badge variant="secondary"><BadgeLabel>High</BadgeLabel></Badge>;
  if (severity === "medium") return <Badge variant="outline"><BadgeLabel>Medium</BadgeLabel></Badge>;
  return <Badge variant="ghost"><BadgeLabel>Low</BadgeLabel></Badge>;
}

export function AlertStatusBadge({ status }: { status: AlertStatus }) {
  if (status === "resolved") return <Badge variant="ghost"><BadgeLabel>Resolved</BadgeLabel></Badge>;
  if (status === "acknowledged") return <Badge variant="outline"><BadgeLabel>Acknowledged</BadgeLabel></Badge>;
  return <Badge variant="secondary"><BadgeLabel>Open</BadgeLabel></Badge>;
}

export function TripStatusBadge({ status }: { status: TripStatus }) {
  if (status === "completed") return <Badge variant="ghost"><BadgeLabel>Completed</BadgeLabel></Badge>;
  if (status === "cancelled") return <Badge variant="destructive"><BadgeLabel>Cancelled</BadgeLabel></Badge>;
  if (status === "in_progress") return <Badge variant="secondary"><BadgeLabel>In Progress</BadgeLabel></Badge>;
  return <Badge variant="outline"><BadgeLabel>Planned</BadgeLabel></Badge>;
}

export function VehicleStatusBadge({ status }: { status: VehicleStatus }) {
  const normalized = status.toLowerCase();

  if (normalized === "active") return <Badge variant="secondary"><BadgeLabel>Active</BadgeLabel></Badge>;
  if (normalized === "maintenance") return <Badge variant="outline"><BadgeLabel>Maintenance</BadgeLabel></Badge>;
  if (normalized === "inactive") return <Badge variant="destructive"><BadgeLabel>Inactive</BadgeLabel></Badge>;

  return <Badge variant="ghost"><BadgeLabel>{status}</BadgeLabel></Badge>;
}
