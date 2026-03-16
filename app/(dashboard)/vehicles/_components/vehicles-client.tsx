"use client";

import { useMemo, useRef, useState } from "react";
import { Pencil, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { canDeleteVehicles, canEditVehicles, type CompanyRole } from "@/lib/permissions";
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
import { VehicleStatusBadge } from "@/components/dashboard/status-badge";
import { TableEmptyRow, TableLoadingRows } from "@/components/dashboard/table-states";
import { EmptyState } from "@/components/dashboard/empty-state";

type Vehicle = { id: string; name?: string | null; vin: string; unit_number: string; status: string };

type VehicleForm = { vehicleName?: string; vin?: string; unitNumber?: string; status?: string };

export function VehiclesClient({ companyId, role, initialSearch = "" }: { companyId: string; role: CompanyRole; initialSearch?: string }) {
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);

  const canEdit = canEditVehicles(role);
  const canDelete = canDeleteVehicles(role);
  const showActions = canEdit || canDelete;

  const vehiclesQuery = useQuery({
    queryKey: ["vehicles", companyId],
    queryFn: () => apiFetch<Vehicle[]>(`/api/vehicles?companyId=${companyId}`),
  });

  const createMutation = useMutation({
    mutationFn: (payload: VehicleForm) =>
      apiFetch<Vehicle>("/api/vehicles", {
        method: "POST",
        body: JSON.stringify({ companyId, ...payload }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles", companyId] });
      toast.success("Vehicle created.");
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: VehicleForm }) =>
      apiFetch<Vehicle>(`/api/vehicles/${payload.id}?companyId=${companyId}`, {
        method: "PATCH",
        body: JSON.stringify(payload.data),
      }),
    onSuccess: () => {
      setEditingVehicle(null);
      queryClient.invalidateQueries({ queryKey: ["vehicles", companyId] });
      toast.success("Vehicle updated.");
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ deleted: boolean }>(`/api/vehicles/${id}?companyId=${companyId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      setDeletingVehicle(null);
      queryClient.invalidateQueries({ queryKey: ["vehicles", companyId] });
      toast.success("Vehicle deleted.");
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const deactivateMutation = useMutation({
    mutationFn: (vehicle: Vehicle) =>
      apiFetch<Vehicle>(`/api/vehicles/${vehicle.id}?companyId=${companyId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "inactive" }),
      }),
    onSuccess: () => {
      setDeletingVehicle(null);
      queryClient.invalidateQueries({ queryKey: ["vehicles", companyId] });
      toast.success("Vehicle deactivated.");
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const query = initialSearch.trim().toLowerCase();
  const vehicles = useMemo(() => {
    const records = vehiclesQuery.data ?? [];
    if (!query) return records;

    return records.filter((vehicle) => {
      const vehicleLabel = (vehicle.name ?? vehicle.unit_number).toLowerCase();
      return (
        vehicleLabel.includes(query) ||
        vehicle.vin.toLowerCase().includes(query) ||
        vehicle.unit_number.toLowerCase().includes(query) ||
        vehicle.status.toLowerCase().includes(query)
      );
    });
  }, [vehiclesQuery.data, query]);

  const showEmptyState = !vehiclesQuery.isLoading && (vehiclesQuery.data ?? []).length === 0;

  return (
    <div className="space-y-6">
      {canEdit ? (
        <Card className="transition-colors hover:border-primary/40">
          <CardContent className="pt-6">
            <form
              ref={formRef}
              className="grid gap-3 md:grid-cols-5"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                createMutation.mutate({
                  vehicleName: String(formData.get("vehicleName") ?? "") || undefined,
                  vin: String(formData.get("vin") ?? ""),
                  unitNumber: String(formData.get("unitNumber") ?? ""),
                  status: String(formData.get("status") ?? "active"),
                });
                event.currentTarget.reset();
              }}
            >
              <Input name="vehicleName" placeholder="Vehicle Name (optional)" data-testid="vehicle-name" />
              <Input name="vin" placeholder="VIN" required data-testid="vehicle-vin" />
              <Input name="unitNumber" placeholder="Unit number" required data-testid="vehicle-unit-number" />
              <select name="status" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue="active">
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
              <Button type="submit" disabled={createMutation.isPending} data-testid="add-vehicle-button">Add Vehicle</Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {showEmptyState ? (
        <EmptyState
          icon={Truck}
          title="No vehicles in fleet"
          description="Add your first vehicle to start route planning and maintenance scheduling."
          actionLabel={canEdit ? "Add first vehicle" : undefined}
          onAction={canEdit ? () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }) : undefined}
        />
      ) : (
        <Card className="transition-colors hover:border-primary/20">
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>VIN</TableHead>
                  <TableHead>Status</TableHead>
                  {showActions ? <TableHead className="text-right">Actions</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehiclesQuery.isLoading ? <TableLoadingRows columns={showActions ? 5 : 4} /> : null}
                {!vehiclesQuery.isLoading && vehicles.length === 0 ? (
                  <TableEmptyRow
                    columns={showActions ? 5 : 4}
                    message={query ? "No vehicles match your search." : "No vehicles available."}
                  />
                ) : null}
                {vehicles.map((vehicle) => (
                  <TableRow key={vehicle.id} className="cursor-pointer transition-colors hover:bg-muted/40">
                    <TableCell className="font-medium">{vehicle.name ?? vehicle.unit_number}</TableCell>
                    <TableCell>{vehicle.unit_number}</TableCell>
                    <TableCell>{vehicle.vin}</TableCell>
                    <TableCell>
                      <VehicleStatusBadge status={vehicle.status} />
                    </TableCell>
                    {showActions ? (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit ? (
                            <Button variant="outline" size="sm" className="hover:bg-gray-100" onClick={() => setEditingVehicle(vehicle)}>
                              <Pencil className="size-3.5" /> Edit
                            </Button>
                          ) : null}
                          {canDelete ? (
                            <Button variant="destructive" size="sm" data-testid={`delete-vehicle-${vehicle.id}`} className="hover:bg-red-600 hover:text-white" onClick={() => setDeletingVehicle(vehicle)}>
                              <Trash2 className="size-3.5" /> Delete
                            </Button>
                          ) : null}
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

      {canEdit ? (
        <Dialog open={Boolean(editingVehicle)} onOpenChange={(open) => !open && setEditingVehicle(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Vehicle</DialogTitle>
              <DialogDescription>Update vehicle details.</DialogDescription>
            </DialogHeader>
            {editingVehicle ? (
              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  const formData = new FormData(event.currentTarget);
                  updateMutation.mutate({
                    id: editingVehicle.id,
                    data: {
                      vehicleName: String(formData.get("vehicleName") ?? "") || undefined,
                      vin: String(formData.get("vin") ?? ""),
                      unitNumber: String(formData.get("unitNumber") ?? ""),
                      status: String(formData.get("status") ?? "active"),
                    },
                  });
                }}
              >
                <Input name="vehicleName" defaultValue={editingVehicle.name ?? ""} placeholder="Vehicle Name (optional)" />
                <Input name="vin" defaultValue={editingVehicle.vin} placeholder="VIN" required />
                <Input name="unitNumber" defaultValue={editingVehicle.unit_number} placeholder="Unit number" required />
                <select name="status" defaultValue={editingVehicle.status} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inactive">Inactive</option>
                </select>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditingVehicle(null)}>Cancel</Button>
                  <Button type="submit" disabled={updateMutation.isPending}>Save</Button>
                </DialogFooter>
              </form>
            ) : null}
          </DialogContent>
        </Dialog>
      ) : null}

      {canDelete ? (
        <Dialog open={Boolean(deletingVehicle)} onOpenChange={(open) => !open && setDeletingVehicle(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Vehicle</DialogTitle>
              <DialogDescription>If this vehicle is linked to trips, deletion is blocked. Use deactivate instead.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeletingVehicle(null)}>Cancel</Button>
              <Button
                variant="secondary"
                data-testid="deactivate-vehicle-button"
                disabled={deactivateMutation.isPending}
                onClick={() => {
                  if (deletingVehicle) {
                    deactivateMutation.mutate(deletingVehicle);
                  }
                }}
              >
                Deactivate Instead
              </Button>
              <Button
                variant="destructive"
                data-testid="confirm-delete-vehicle-button"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (deletingVehicle) {
                    deleteMutation.mutate(deletingVehicle.id);
                  }
                }}
              >
                Confirm Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
