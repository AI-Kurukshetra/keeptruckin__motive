"use client";

import { useMemo, useRef, useState } from "react";
import { Pencil, Trash2, Wrench } from "lucide-react";
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

type Maintenance = {
  id: string;
  vehicle_id: string;
  maintenance_type: string;
  description: string | null;
  status: "scheduled" | "completed" | "overdue" | "cancelled";
  due_at: string | null;
};

type Vehicle = { id: string; unit_number: string; name?: string | null; license_plate: string | null };

type MaintenanceForm = {
  maintenanceType?: string;
  description?: string;
  status?: "scheduled" | "completed" | "overdue" | "cancelled";
  dueAt?: string;
};

export function MaintenanceClient({ companyId }: { companyId: string }) {
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<Maintenance | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<Maintenance | null>(null);

  const maintenanceQuery = useQuery({ queryKey: ["maintenance", companyId], queryFn: () => apiFetch<Maintenance[]>(`/api/maintenance?companyId=${companyId}`) });
  const vehiclesQuery = useQuery({ queryKey: ["vehicles", companyId], queryFn: () => apiFetch<Vehicle[]>(`/api/vehicles?companyId=${companyId}`) });

  const createMutation = useMutation({
    mutationFn: (payload: { vehicleId: string; maintenanceType: string; dueAt: string }) =>
      apiFetch<Maintenance>("/api/maintenance", { method: "POST", body: JSON.stringify({ companyId, ...payload }) }),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["maintenance", companyId] });
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: MaintenanceForm }) =>
      apiFetch<Maintenance>(`/api/maintenance/${payload.id}?companyId=${companyId}`, {
        method: "PATCH",
        body: JSON.stringify(payload.data),
      }),
    onSuccess: () => {
      setError(null);
      setEditingRecord(null);
      queryClient.invalidateQueries({ queryKey: ["maintenance", companyId] });
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ deleted: boolean }>(`/api/maintenance/${id}?companyId=${companyId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      setError(null);
      setDeletingRecord(null);
      queryClient.invalidateQueries({ queryKey: ["maintenance", companyId] });
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const maintenance = maintenanceQuery.data ?? [];
  const vehicleLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const vehicle of vehiclesQuery.data ?? []) {
      map.set(vehicle.id, vehicle.name ?? vehicle.unit_number);
    }
    return map;
  }, [vehiclesQuery.data]);

  const showEmptyState = !maintenanceQuery.isLoading && maintenance.length === 0;

  return (
    <div className="space-y-6">
      <Card className="transition-colors hover:border-primary/40">
        <CardContent className="pt-6">
          <form
            ref={formRef}
            className="grid gap-3 md:grid-cols-4"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              createMutation.mutate({
                vehicleId: String(formData.get("vehicleId") ?? ""),
                maintenanceType: String(formData.get("maintenanceType") ?? ""),
                dueAt: String(formData.get("dueAt") ?? ""),
              });
              event.currentTarget.reset();
            }}
          >
            <select name="vehicleId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
              <option value="">Vehicle</option>
              {(vehiclesQuery.data ?? []).map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>{vehicle.name ?? vehicle.unit_number}</option>
              ))}
            </select>
            <Input name="maintenanceType" placeholder="Maintenance type" required />
            <Input name="dueAt" type="date" required />
            <Button type="submit" disabled={createMutation.isPending}>Schedule</Button>
          </form>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {showEmptyState ? (
        <EmptyState
          icon={Wrench}
          title="No maintenance records"
          description="Create your first maintenance item to track upcoming fleet service work."
          actionLabel="Schedule first maintenance"
          onAction={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
        />
      ) : (
        <Card className="transition-colors hover:border-primary/20">
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenanceQuery.isLoading ? <TableLoadingRows columns={5} /> : null}
                {!maintenanceQuery.isLoading && maintenance.length === 0 ? (
                  <TableEmptyRow columns={5} message="No maintenance records yet. Schedule your first maintenance item." />
                ) : null}
                {maintenance.map((record) => (
                  <TableRow key={record.id} className="transition-colors hover:bg-muted/40">
                    <TableCell>{vehicleLabelById.get(record.vehicle_id) ?? "-"}</TableCell>
                    <TableCell>{record.maintenance_type}</TableCell>
                    <TableCell className="capitalize">{record.status}</TableCell>
                    <TableCell>{record.due_at ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" className="hover:bg-gray-100" onClick={() => setEditingRecord(record)}>
                          <Pencil className="size-3.5" /> Edit
                        </Button>
                        <Button variant="destructive" size="sm" className="hover:bg-red-600 hover:text-white" onClick={() => setDeletingRecord(record)}>
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

      <Dialog open={Boolean(editingRecord)} onOpenChange={(open) => !open && setEditingRecord(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Maintenance Record</DialogTitle>
            <DialogDescription>Update maintenance scheduling details.</DialogDescription>
          </DialogHeader>
          {editingRecord ? (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                updateMutation.mutate({
                  id: editingRecord.id,
                  data: {
                    maintenanceType: String(formData.get("maintenanceType") ?? ""),
                    description: String(formData.get("description") ?? "") || undefined,
                    status: String(formData.get("status") ?? "scheduled") as MaintenanceForm["status"],
                    dueAt: String(formData.get("dueAt") ?? "") || undefined,
                  },
                });
              }}
            >
              <Input name="maintenanceType" defaultValue={editingRecord.maintenance_type} placeholder="Maintenance type" required />
              <Input name="description" defaultValue={editingRecord.description ?? ""} placeholder="Description (optional)" />
              <select name="status" defaultValue={editingRecord.status} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <Input name="dueAt" type="date" defaultValue={editingRecord.due_at ?? ""} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingRecord(null)}>Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending}>Save</Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deletingRecord)} onOpenChange={(open) => !open && setDeletingRecord(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Maintenance Record</DialogTitle>
            <DialogDescription>Are you sure you want to delete this record?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingRecord(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deletingRecord) {
                  deleteMutation.mutate(deletingRecord.id);
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

