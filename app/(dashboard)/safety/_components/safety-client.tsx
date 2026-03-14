"use client";

import { useMemo, useRef, useState } from "react";
import { AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/dashboard/empty-state";
import { TableEmptyRow, TableLoadingRows } from "@/components/dashboard/table-states";

type SafetyEvent = {
  id: string;
  driver_id: string | null;
  vehicle_id: string | null;
  event_type: "speeding" | "harsh_braking" | "rapid_acceleration" | "hard_cornering" | "idling" | "collision_risk" | "phone_usage" | "other";
  severity: number;
  score_impact: number;
  occurred_at: string;
};
type SafetyScore = { totalEvents: number; totalScoreImpact: number; averageSeverity: number; safetyScore: number };
type Driver = { id: string; first_name: string; last_name: string };
type Vehicle = { id: string; unit_number: string; name?: string | null };

type SafetyForm = {
  driverId?: string;
  vehicleId?: string;
  eventType?: SafetyEvent["event_type"];
  severity?: number;
  scoreImpact?: number;
  occurredAt?: string;
};

function toDateTimeLocal(iso: string | null | undefined) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

function fromDateTimeLocal(value: string) {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

export function SafetyClient({ companyId }: { companyId: string }) {
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<SafetyEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<SafetyEvent | null>(null);

  const eventsQuery = useQuery({ queryKey: ["safety-events", companyId], queryFn: () => apiFetch<SafetyEvent[]>(`/api/safety?companyId=${companyId}`) });
  const scoreQuery = useQuery({ queryKey: ["safety-score", companyId], queryFn: () => apiFetch<SafetyScore>(`/api/safety/score?companyId=${companyId}`) });
  const driversQuery = useQuery({ queryKey: ["drivers", companyId], queryFn: () => apiFetch<Driver[]>(`/api/drivers?companyId=${companyId}`) });
  const vehiclesQuery = useQuery({ queryKey: ["vehicles", companyId], queryFn: () => apiFetch<Vehicle[]>(`/api/vehicles?companyId=${companyId}`) });

  const createMutation = useMutation({
    mutationFn: (payload: { eventType: string; severity: number; occurredAt: string; scoreImpact: number; driverId?: string; vehicleId?: string }) =>
      apiFetch<SafetyEvent>("/api/safety", { method: "POST", body: JSON.stringify({ companyId, ...payload }) }),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["safety-events", companyId] });
      queryClient.invalidateQueries({ queryKey: ["safety-score", companyId] });
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: SafetyForm }) =>
      apiFetch<SafetyEvent>(`/api/safety/${payload.id}?companyId=${companyId}`, {
        method: "PATCH",
        body: JSON.stringify(payload.data),
      }),
    onSuccess: () => {
      setError(null);
      setEditingEvent(null);
      queryClient.invalidateQueries({ queryKey: ["safety-events", companyId] });
      queryClient.invalidateQueries({ queryKey: ["safety-score", companyId] });
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ deleted: boolean }>(`/api/safety/${id}?companyId=${companyId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      setError(null);
      setDeletingEvent(null);
      queryClient.invalidateQueries({ queryKey: ["safety-events", companyId] });
      queryClient.invalidateQueries({ queryKey: ["safety-score", companyId] });
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const eventTypeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const event of eventsQuery.data ?? []) {
      counts.set(event.event_type, (counts.get(event.event_type) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([type, value]) => ({ type, value }));
  }, [eventsQuery.data]);

  const driverLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const driver of driversQuery.data ?? []) {
      map.set(driver.id, `${driver.first_name} ${driver.last_name}`);
    }
    return map;
  }, [driversQuery.data]);

  const vehicleLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const vehicle of vehiclesQuery.data ?? []) {
      map.set(vehicle.id, vehicle.name ?? vehicle.unit_number);
    }
    return map;
  }, [vehiclesQuery.data]);

  const events = eventsQuery.data ?? [];
  const showEmptyState = !eventsQuery.isLoading && events.length === 0;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4">
        {scoreQuery.isLoading ? <Skeleton className="h-14 w-full" /> : (
          <>
            <p className="text-sm text-muted-foreground">Safety Score</p>
            <p className="text-2xl font-semibold">{scoreQuery.data?.safetyScore ?? 0}</p>
            <p className="text-xs text-muted-foreground">
              Events: {scoreQuery.data?.totalEvents ?? 0} | Avg severity: {scoreQuery.data?.averageSeverity ?? 0}
            </p>
          </>
        )}
      </div>

      <div className="rounded-lg border p-4 space-y-2">
        <p className="text-sm font-medium">Safety Event Distribution</p>
        {eventsQuery.isLoading ? <Skeleton className="h-24 w-full" /> : null}
        {!eventsQuery.isLoading && eventTypeCounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No safety events logged yet.</p>
        ) : null}
        {eventTypeCounts.map((row) => {
          const max = Math.max(...eventTypeCounts.map((item) => item.value), 1);
          return (
            <div key={row.type} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="capitalize">{row.type.replaceAll("_", " ")}</span>
                <span>{row.value}</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${(row.value / max) * 100}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <Card className="transition-colors hover:border-primary/40">
        <CardContent className="pt-6">
          <form
            ref={formRef}
            className="grid gap-3 md:grid-cols-5"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              createMutation.mutate({
                eventType: String(formData.get("eventType") ?? "speeding"),
                severity: Number(formData.get("severity") ?? 1),
                scoreImpact: Number(formData.get("scoreImpact") ?? 0),
                occurredAt: new Date(String(formData.get("occurredAt") ?? "")).toISOString(),
                driverId: String(formData.get("driverId") ?? "") || undefined,
                vehicleId: String(formData.get("vehicleId") ?? "") || undefined,
              });
              event.currentTarget.reset();
            }}
          >
            <select name="eventType" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue="speeding">
              <option value="speeding">Speeding</option>
              <option value="harsh_braking">Harsh Braking</option>
              <option value="rapid_acceleration">Rapid Acceleration</option>
              <option value="hard_cornering">Hard Cornering</option>
              <option value="idling">Idling</option>
              <option value="collision_risk">Collision Risk</option>
              <option value="phone_usage">Phone Usage</option>
              <option value="other">Other</option>
            </select>
            <Input name="severity" type="number" min="1" max="5" defaultValue="3" required />
            <Input name="scoreImpact" type="number" defaultValue="5" required />
            <Input name="occurredAt" type="datetime-local" required />
            <Button type="submit" disabled={createMutation.isPending}>Log Event</Button>
            <select name="driverId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">Driver (optional)</option>
              {(driversQuery.data ?? []).map((driver) => (
                <option key={driver.id} value={driver.id}>{driver.first_name} {driver.last_name}</option>
              ))}
            </select>
            <select name="vehicleId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">Vehicle (optional)</option>
              {(vehiclesQuery.data ?? []).map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>{vehicle.name ?? vehicle.unit_number}</option>
              ))}
            </select>
          </form>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {showEmptyState ? (
        <EmptyState
          icon={AlertTriangle}
          title="No safety events yet"
          description="Start logging safety events to monitor fleet risk patterns."
          actionLabel="Log first event"
          onAction={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
        />
      ) : (
        <Card className="transition-colors hover:border-primary/20">
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventsQuery.isLoading ? <TableLoadingRows columns={4} /> : null}
                {!eventsQuery.isLoading && events.length === 0 ? <TableEmptyRow columns={4} message="No safety events yet." /> : null}
                {events.map((event) => (
                  <TableRow key={event.id} className="transition-colors hover:bg-muted/40">
                    <TableCell className="capitalize">{event.event_type.replaceAll("_", " ")}</TableCell>
                    <TableCell>{event.severity}</TableCell>
                    <TableCell>{new Date(event.occurred_at).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" className="hover:bg-gray-100" onClick={() => setEditingEvent(event)}>
                          <Pencil className="size-3.5" /> Edit
                        </Button>
                        <Button variant="destructive" size="sm" className="hover:bg-red-600 hover:text-white" onClick={() => setDeletingEvent(event)}>
                          <Trash2 className="size-3.5" /> Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={Boolean(editingEvent)} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Safety Event</DialogTitle>
            <DialogDescription>Update event severity and occurrence details.</DialogDescription>
          </DialogHeader>
          {editingEvent ? (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                updateMutation.mutate({
                  id: editingEvent.id,
                  data: {
                    eventType: String(formData.get("eventType") ?? "speeding") as SafetyForm["eventType"],
                    severity: Number(formData.get("severity") ?? editingEvent.severity),
                    scoreImpact: Number(formData.get("scoreImpact") ?? editingEvent.score_impact),
                    occurredAt: fromDateTimeLocal(String(formData.get("occurredAt") ?? "")),
                    driverId: String(formData.get("driverId") ?? "") || undefined,
                    vehicleId: String(formData.get("vehicleId") ?? "") || undefined,
                  },
                });
              }}
            >
              <select name="eventType" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={editingEvent.event_type}>
                <option value="speeding">Speeding</option>
                <option value="harsh_braking">Harsh Braking</option>
                <option value="rapid_acceleration">Rapid Acceleration</option>
                <option value="hard_cornering">Hard Cornering</option>
                <option value="idling">Idling</option>
                <option value="collision_risk">Collision Risk</option>
                <option value="phone_usage">Phone Usage</option>
                <option value="other">Other</option>
              </select>
              <Input name="severity" type="number" min="1" max="5" defaultValue={editingEvent.severity} required />
              <Input name="scoreImpact" type="number" defaultValue={editingEvent.score_impact} required />
              <Input name="occurredAt" type="datetime-local" defaultValue={toDateTimeLocal(editingEvent.occurred_at)} required />
              <select name="driverId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={editingEvent.driver_id ?? ""}>
                <option value="">Driver (optional)</option>
                {(driversQuery.data ?? []).map((driver) => (
                  <option key={driver.id} value={driver.id}>{driver.first_name} {driver.last_name}</option>
                ))}
              </select>
              <select name="vehicleId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={editingEvent.vehicle_id ?? ""}>
                <option value="">Vehicle (optional)</option>
                {(vehiclesQuery.data ?? []).map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>{vehicle.name ?? vehicle.unit_number}</option>
                ))}
              </select>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingEvent(null)}>Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending}>Save</Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deletingEvent)} onOpenChange={(open) => !open && setDeletingEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Safety Event</DialogTitle>
            <DialogDescription>Are you sure you want to delete this record?</DialogDescription>
          </DialogHeader>
          {deletingEvent ? (
            <p className="text-sm text-muted-foreground">
              {deletingEvent.event_type.replaceAll("_", " ")} | Driver: {deletingEvent.driver_id ? (driverLabelById.get(deletingEvent.driver_id) ?? "Unknown") : "-"} | Vehicle: {deletingEvent.vehicle_id ? (vehicleLabelById.get(deletingEvent.vehicle_id) ?? "Unknown") : "-"}
            </p>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingEvent(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deletingEvent) {
                  deleteMutation.mutate(deletingEvent.id);
                }
              }}
            >
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

