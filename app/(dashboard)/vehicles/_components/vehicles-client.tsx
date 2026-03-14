"use client";

import { useMemo, useRef, useState } from "react";
import { Pencil, Trash2, Truck } from "lucide-react";
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
import { VehicleStatusBadge } from "@/components/dashboard/status-badge";
import { TableEmptyRow, TableLoadingRows } from "@/components/dashboard/table-states";
import { EmptyState } from "@/components/dashboard/empty-state";

type Vehicle = { id: string; name?: string | null; vin: string; unit_number: string; status: string };

type VehicleForm = { vehicleName?: string; vin: string; unitNumber: string; status?: string };

export function VehiclesClient({ companyId, initialSearch = "" }: { companyId: string; initialSearch?: string }) {
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);

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
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["vehicles", companyId] });
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: VehicleForm }) =>
      apiFetch<Vehicle>(`/api/vehicles/${payload.id}?companyId=${companyId}`, {
        method: "PATCH",
        body: JSON.stringify(payload.data),
      }),
    onSuccess: () => {
      setError(null);
      setEditingVehicle(null);
      queryClient.invalidateQueries({ queryKey: ["vehicles", companyId] });
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ deleted: boolean }>(`/api/vehicles/${id}?companyId=${companyId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      setError(null);
      setDeletingVehicle(null);
      queryClient.invalidateQueries({ queryKey: ["vehicles", companyId] });
    },
    onError: (mutationError: Error) => setError(mutationError.message),
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

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {showEmptyState ? (
        <EmptyState
          icon={Truck}
          title="No vehicles in fleet"
          description="Add your first vehicle to start route planning and maintenance scheduling."
          actionLabel="Add first vehicle"
          onAction={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehiclesQuery.isLoading ? <TableLoadingRows columns={5} /> : null}
                {!vehiclesQuery.isLoading && vehicles.length === 0 ? (
                  <TableEmptyRow
                    columns={5}
                    message={query ? "No vehicles match your search." : "No vehicles available."}
                  />
                ) : null}
                {vehicles.map((vehicle) => (
                  <TableRow key={vehicle.id} className="cursor-pointer transition-colors hover:bg-muted/50">
                    <TableCell className="font-medium">{vehicle.name ?? vehicle.unit_number}</TableCell>
                    <TableCell>{vehicle.unit_number}</TableCell>
                    <TableCell>{vehicle.vin}</TableCell>
                    <TableCell>
                      <VehicleStatusBadge status={vehicle.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingVehicle(vehicle)}>
                          <Pencil className="size-3.5" /> Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setDeletingVehicle(vehicle)}>
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

      <Dialog open={Boolean(deletingVehicle)} onOpenChange={(open) => !open && setDeletingVehicle(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Vehicle</DialogTitle>
            <DialogDescription>Are you sure you want to delete this record?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingVehicle(null)}>Cancel</Button>
            <Button
              variant="destructive"
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
    </div>
  );
}
