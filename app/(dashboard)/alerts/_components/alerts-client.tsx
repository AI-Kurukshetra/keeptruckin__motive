"use client";

import { useMemo, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { canEditAlerts, type CompanyRole } from "@/lib/permissions";
import { apiFetch } from "@/lib/api/fetcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertSeverityBadge, AlertStatusBadge } from "@/components/dashboard/status-badge";
import { TableEmptyRow, TableLoadingRows } from "@/components/dashboard/table-states";
import { EmptyState } from "@/components/dashboard/empty-state";

type Alert = {
  id: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "acknowledged" | "resolved";
  triggered_at: string;
  alert_type: string;
};

export function AlertsClient({ companyId, role }: { companyId: string; role: CompanyRole }) {
  const queryClient = useQueryClient();
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | Alert["status"]>("all");
  const [severityFilter, setSeverityFilter] = useState<"all" | Alert["severity"]>("all");
  const [search, setSearch] = useState("");

  const canEdit = canEditAlerts(role);

  const alertsQuery = useQuery({
    queryKey: ["alerts", companyId],
    queryFn: () => apiFetch<Alert[]>(`/api/alerts?companyId=${companyId}&limit=200`),
  });

  const createMutation = useMutation({
    mutationFn: (payload: { title: string; alertType: string; severity: string }) =>
      apiFetch<Alert>("/api/alerts", { method: "POST", body: JSON.stringify({ companyId, ...payload }) }),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["alerts", companyId] });
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const statusMutation = useMutation({
    mutationFn: (payload: { id: string; status: "acknowledged" | "resolved" }) =>
      apiFetch<Alert>(`/api/alerts/${payload.id}?companyId=${companyId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: payload.status }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts", companyId] }),
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const filteredAlerts = useMemo(() => {
    const records = alertsQuery.data ?? [];

    return records.filter((alert) => {
      if (statusFilter !== "all" && alert.status !== statusFilter) return false;
      if (severityFilter !== "all" && alert.severity !== severityFilter) return false;
      if (search.trim() && !alert.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [alertsQuery.data, search, severityFilter, statusFilter]);

  const showEmptyState = !alertsQuery.isLoading && (alertsQuery.data ?? []).length === 0;

  return (
    <div className="space-y-6">
      {canEdit ? (
        <Card className="transition-colors hover:border-primary/40">
          <CardContent className="pt-6">
            <form
              className="grid gap-3 md:grid-cols-4"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                createMutation.mutate({
                  title: String(formData.get("title") ?? ""),
                  alertType: String(formData.get("alertType") ?? "system"),
                  severity: String(formData.get("severity") ?? "medium"),
                });
                event.currentTarget.reset();
              }}
            >
              <Input ref={titleInputRef} name="title" placeholder="Alert title" required />
              <Input name="alertType" placeholder="Type (e.g. compliance)" required />
              <select
                name="severity"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                defaultValue="medium"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <Button type="submit" disabled={createMutation.isPending}>Create Alert</Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card className="transition-colors hover:border-primary/20">
        <CardContent className="grid gap-3 pt-6 md:grid-cols-3">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search alert title" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
          </select>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as typeof severityFilter)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {showEmptyState ? (
        <EmptyState
          icon={Bell}
          title="No alerts yet"
          description="Create an alert to track compliance, safety, or maintenance exceptions."
          actionLabel={canEdit ? "Create first alert" : undefined}
          onAction={canEdit ? () => titleInputRef.current?.focus() : undefined}
        />
      ) : (
        <Card className="transition-colors hover:border-primary/20">
          <CardContent className="pt-6">
            <Table data-testid="alerts-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Triggered</TableHead>
                  {canEdit ? <TableHead className="text-right">Actions</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {alertsQuery.isLoading ? <TableLoadingRows columns={canEdit ? 6 : 5} /> : null}
                {!alertsQuery.isLoading && filteredAlerts.length === 0 ? (
                  <TableEmptyRow columns={canEdit ? 6 : 5} message="No alerts match the current filters." />
                ) : null}
                {filteredAlerts.map((alert) => (
                  <TableRow key={alert.id} className="transition-colors hover:bg-muted/50">
                    <TableCell className="max-w-[260px] truncate font-medium">{alert.title}</TableCell>
                    <TableCell>{alert.alert_type}</TableCell>
                    <TableCell><AlertSeverityBadge severity={alert.severity} /></TableCell>
                    <TableCell><AlertStatusBadge status={alert.status} /></TableCell>
                    <TableCell>{new Date(alert.triggered_at).toLocaleString()}</TableCell>
                    {canEdit ? (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => statusMutation.mutate({ id: alert.id, status: "acknowledged" })}
                            disabled={statusMutation.isPending || alert.status !== "open"}
                          >
                            Ack
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => statusMutation.mutate({ id: alert.id, status: "resolved" })}
                            disabled={statusMutation.isPending || alert.status === "resolved"}
                          >
                            Resolve
                          </Button>
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}