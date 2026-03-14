"use client";

import { useMemo, useRef, useState } from "react";
import { ClipboardCheck, Pencil, Trash2 } from "lucide-react";
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

type Inspection = {
  id: string;
  driver_id: string;
  vehicle_id: string;
  inspection_type: "pre_trip" | "post_trip";
  status: "passed" | "failed" | "resolved";
  notes: string | null;
  inspected_at: string;
  resolved_at: string | null;
};
type Driver = { id: string; first_name: string; last_name: string };
type Vehicle = { id: string; unit_number: string; name?: string | null };

type InspectionForm = {
  status?: "passed" | "failed" | "resolved";
  notes?: string;
  resolvedAt?: string;
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

export function InspectionsClient({ companyId }: { companyId: string }) {
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingInspection, setEditingInspection] = useState<Inspection | null>(null);
  const [deletingInspection, setDeletingInspection] = useState<Inspection | null>(null);

  const inspectionsQuery = useQuery({ queryKey: ["inspections", companyId], queryFn: () => apiFetch<Inspection[]>(`/api/inspections?companyId=${companyId}`) });
  const driversQuery = useQuery({ queryKey: ["drivers", companyId], queryFn: () => apiFetch<Driver[]>(`/api/drivers?companyId=${companyId}`) });
  const vehiclesQuery = useQuery({ queryKey: ["vehicles", companyId], queryFn: () => apiFetch<Vehicle[]>(`/api/vehicles?companyId=${companyId}`) });

  const createMutation = useMutation({
    mutationFn: (payload: { driverId: string; vehicleId: string; inspectionType: string; status: string }) =>
      apiFetch<Inspection>("/api/inspections", { method: "POST", body: JSON.stringify({ companyId, ...payload }) }),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["inspections", companyId] });
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: InspectionForm }) =>
      apiFetch<Inspection>(`/api/inspections/${payload.id}?companyId=${companyId}`, {
        method: "PATCH",
        body: JSON.stringify(payload.data),
      }),
    onSuccess: () => {
      setError(null);
      setEditingInspection(null);
      queryClient.invalidateQueries({ queryKey: ["inspections", companyId] });
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ deleted: boolean }>(`/api/inspections/${id}?companyId=${companyId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      setError(null);
      setDeletingInspection(null);
      queryClient.invalidateQueries({ queryKey: ["inspections", companyId] });
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const inspections = inspectionsQuery.data ?? [];

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

  const showEmptyState = !inspectionsQuery.isLoading && inspections.length === 0;

  return (
    <div className="space-y-6">
      <Card className="transition-colors hover:border-primary/40">
        <CardContent className="pt-6">
          <form
            ref={formRef}
            className="grid gap-3 md:grid-cols-5"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              createMutation.mutate({
                driverId: String(formData.get("driverId") ?? ""),
                vehicleId: String(formData.get("vehicleId") ?? ""),
                inspectionType: String(formData.get("inspectionType") ?? "pre_trip"),
                status: String(formData.get("status") ?? "passed"),
              });
              event.currentTarget.reset();
            }}
          >
            <select name="driverId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
              <option value="">Driver</option>
              {(driversQuery.data ?? []).map((driver) => (
                <option key={driver.id} value={driver.id}>{driver.first_name} {driver.last_name}</option>
              ))}
            </select>
            <select name="vehicleId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
              <option value="">Vehicle</option>
              {(vehiclesQuery.data ?? []).map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>{vehicle.name ?? vehicle.unit_number}</option>
              ))}
            </select>
            <select name="inspectionType" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue="pre_trip">
              <option value="pre_trip">Pre Trip</option>
              <option value="post_trip">Post Trip</option>
            </select>
            <select name="status" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue="passed">
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
              <option value="resolved">Resolved</option>
            </select>
            <Button type="submit" disabled={createMutation.isPending}>Add Inspection</Button>
          </form>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {showEmptyState ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No inspections yet"
          description="Log your first pre/post trip inspection to start defect tracking."
          actionLabel="Add first inspection"
          onAction={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
        />
      ) : (
        <Card className="transition-colors hover:border-primary/20">
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inspectionsQuery.isLoading ? <TableLoadingRows columns={4} /> : null}
                {!inspectionsQuery.isLoading && inspections.length === 0 ? (
                  <TableEmptyRow columns={4} message="No inspections yet. Add a pre/post trip inspection above." />
                ) : null}
                {inspections.map((inspection) => (
                  <TableRow key={inspection.id} className="transition-colors hover:bg-muted/40">
                    <TableCell>{inspection.inspection_type}</TableCell>
                    <TableCell className="capitalize">{inspection.status}</TableCell>
                    <TableCell>{new Date(inspection.inspected_at).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" className="hover:bg-gray-100" onClick={() => setEditingInspection(inspection)}>
                          <Pencil className="size-3.5" /> Edit
                        </Button>
                        <Button variant="destructive" size="sm" className="hover:bg-red-600 hover:text-white" onClick={() => setDeletingInspection(inspection)}>
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

      <Dialog open={Boolean(editingInspection)} onOpenChange={(open) => !open && setEditingInspection(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Inspection</DialogTitle>
            <DialogDescription>Update inspection status and notes.</DialogDescription>
          </DialogHeader>
          {editingInspection ? (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                updateMutation.mutate({
                  id: editingInspection.id,
                  data: {
                    status: String(formData.get("status") ?? "passed") as InspectionForm["status"],
                    notes: String(formData.get("notes") ?? "") || undefined,
                    resolvedAt: fromDateTimeLocal(String(formData.get("resolvedAt") ?? "")),
                  },
                });
              }}
            >
              <Input value={driverLabelById.get(editingInspection.driver_id) ?? "Unknown Driver"} disabled />
              <Input value={vehicleLabelById.get(editingInspection.vehicle_id) ?? "Unknown Vehicle"} disabled />
              <select name="status" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={editingInspection.status}>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
                <option value="resolved">Resolved</option>
              </select>
              <Input name="notes" defaultValue={editingInspection.notes ?? ""} placeholder="Notes (optional)" />
              <Input name="resolvedAt" type="datetime-local" defaultValue={toDateTimeLocal(editingInspection.resolved_at)} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingInspection(null)}>Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending}>Save</Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deletingInspection)} onOpenChange={(open) => !open && setDeletingInspection(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Inspection</DialogTitle>
            <DialogDescription>Are you sure you want to delete this record?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingInspection(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deletingInspection) {
                  deleteMutation.mutate(deletingInspection.id);
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

