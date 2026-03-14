"use client";

import { useMemo, useRef, useState } from "react";
import { Pencil, Route, Trash2 } from "lucide-react";
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
import { TripStatusBadge } from "@/components/dashboard/status-badge";
import { TableEmptyRow, TableLoadingRows } from "@/components/dashboard/table-states";
import { EmptyState } from "@/components/dashboard/empty-state";

type Trip = {
  id: string;
  driver_id: string;
  vehicle_id: string;
  origin: string | null;
  destination: string | null;
  status: "planned" | "in_progress" | "completed" | "cancelled";
  started_at: string | null;
};
type Driver = { id: string; first_name: string; last_name: string };
type Vehicle = { id: string; unit_number: string; name?: string | null };

type TripForm = {
  driverId: string;
  vehicleId: string;
  origin: string;
  destination: string;
  status?: "planned" | "in_progress" | "completed" | "cancelled";
  startedAt?: string;
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

export function TripsClient({ companyId, initialSearch = "" }: { companyId: string; initialSearch?: string }) {
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [deletingTrip, setDeletingTrip] = useState<Trip | null>(null);

  const tripsQuery = useQuery({ queryKey: ["trips", companyId], queryFn: () => apiFetch<Trip[]>(`/api/trips?companyId=${companyId}`) });
  const driversQuery = useQuery({ queryKey: ["drivers", companyId], queryFn: () => apiFetch<Driver[]>(`/api/drivers?companyId=${companyId}`) });
  const vehiclesQuery = useQuery({ queryKey: ["vehicles", companyId], queryFn: () => apiFetch<Vehicle[]>(`/api/vehicles?companyId=${companyId}`) });

  const createMutation = useMutation({
    mutationFn: (payload: TripForm) =>
      apiFetch<Trip>("/api/trips", { method: "POST", body: JSON.stringify({ companyId, ...payload }) }),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["trips", companyId] });
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: TripForm }) =>
      apiFetch<Trip>(`/api/trips/${payload.id}?companyId=${companyId}`, {
        method: "PATCH",
        body: JSON.stringify(payload.data),
      }),
    onSuccess: () => {
      setError(null);
      setEditingTrip(null);
      queryClient.invalidateQueries({ queryKey: ["trips", companyId] });
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ deleted: boolean }>(`/api/trips/${id}?companyId=${companyId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      setError(null);
      setDeletingTrip(null);
      queryClient.invalidateQueries({ queryKey: ["trips", companyId] });
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const query = initialSearch.trim().toLowerCase();
  const trips = useMemo(() => {
    const records = tripsQuery.data ?? [];

    if (!query) {
      return records;
    }

    return records.filter((trip) => {
      return (
        (trip.origin ?? "").toLowerCase().includes(query) ||
        (trip.destination ?? "").toLowerCase().includes(query) ||
        trip.status.toLowerCase().includes(query)
      );
    });
  }, [tripsQuery.data, query]);

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

  const showEmptyState = !tripsQuery.isLoading && (tripsQuery.data ?? []).length === 0;

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
                origin: String(formData.get("origin") ?? ""),
                destination: String(formData.get("destination") ?? ""),
                status: "planned",
              });
              event.currentTarget.reset();
            }}
          >
            <select data-testid="trip-driver-select" name="driverId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
              <option value="">Driver</option>
              {(driversQuery.data ?? []).map((driver) => (
                <option key={driver.id} value={driver.id}>{driver.first_name} {driver.last_name}</option>
              ))}
            </select>
            <select data-testid="trip-vehicle-select" name="vehicleId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
              <option value="">Vehicle</option>
              {(vehiclesQuery.data ?? []).map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>{vehicle.name ?? vehicle.unit_number}</option>
              ))}
            </select>
            <Input name="origin" placeholder="Origin" required data-testid="trip-origin" />
            <Input name="destination" placeholder="Destination" required data-testid="trip-destination" />
            <Button type="submit" disabled={createMutation.isPending} data-testid="create-trip-button">Create Trip</Button>
          </form>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {showEmptyState ? (
        <EmptyState
          icon={Route}
          title="No trips created"
          description="Create a first route assignment to monitor trip progress and on-road activity."
          actionLabel="Create first trip"
          onAction={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
        />
      ) : (
        <Card className="transition-colors hover:border-primary/20">
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Origin</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tripsQuery.isLoading ? <TableLoadingRows columns={4} /> : null}
                {!tripsQuery.isLoading && trips.length === 0 ? (
                  <TableEmptyRow
                    columns={4}
                    message={query ? "No trips match your search." : "No trips available."}
                  />
                ) : null}
                {trips.map((trip) => (
                  <TableRow key={trip.id} className="transition-colors hover:bg-muted/50">
                    <TableCell className="font-medium">{trip.origin ?? "-"}</TableCell>
                    <TableCell>{trip.destination ?? "-"}</TableCell>
                    <TableCell>
                      <TripStatusBadge status={trip.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingTrip(trip)}>
                          <Pencil className="size-3.5" /> Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setDeletingTrip(trip)}>
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

      <Dialog open={Boolean(editingTrip)} onOpenChange={(open) => !open && setEditingTrip(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Trip</DialogTitle>
            <DialogDescription>Update trip assignment and status.</DialogDescription>
          </DialogHeader>
          {editingTrip ? (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                updateMutation.mutate({
                  id: editingTrip.id,
                  data: {
                    driverId: String(formData.get("driverId") ?? editingTrip.driver_id),
                    vehicleId: String(formData.get("vehicleId") ?? editingTrip.vehicle_id),
                    origin: String(formData.get("origin") ?? ""),
                    destination: String(formData.get("destination") ?? ""),
                    status: String(formData.get("status") ?? "planned") as TripForm["status"],
                    startedAt: fromDateTimeLocal(String(formData.get("startedAt") ?? "")),
                  },
                });
              }}
            >
              <select name="driverId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={editingTrip.driver_id} required>
                {(driversQuery.data ?? []).map((driver) => (
                  <option key={driver.id} value={driver.id}>{driver.first_name} {driver.last_name}</option>
                ))}
              </select>
              <select name="vehicleId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={editingTrip.vehicle_id} required>
                {(vehiclesQuery.data ?? []).map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>{vehicle.name ?? vehicle.unit_number}</option>
                ))}
              </select>
              <Input name="origin" defaultValue={editingTrip.origin ?? ""} placeholder="Origin" required />
              <Input name="destination" defaultValue={editingTrip.destination ?? ""} placeholder="Destination" required />
              <select name="status" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={editingTrip.status}>
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <Input name="startedAt" type="datetime-local" defaultValue={toDateTimeLocal(editingTrip.started_at)} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingTrip(null)}>Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending}>Save</Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deletingTrip)} onOpenChange={(open) => !open && setDeletingTrip(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Trip</DialogTitle>
            <DialogDescription>Are you sure you want to delete this record?</DialogDescription>
          </DialogHeader>
          {deletingTrip ? (
            <p className="text-sm text-muted-foreground">
              {deletingTrip.origin ?? "-"} to {deletingTrip.destination ?? "-"} | Driver: {driverLabelById.get(deletingTrip.driver_id) ?? "Unknown"} | Vehicle: {vehicleLabelById.get(deletingTrip.vehicle_id) ?? "Unknown"}
            </p>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingTrip(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deletingTrip) {
                  deleteMutation.mutate(deletingTrip.id);
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
