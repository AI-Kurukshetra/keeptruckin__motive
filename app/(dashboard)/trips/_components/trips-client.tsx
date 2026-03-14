"use client";

import { useMemo, useRef, useState } from "react";
import { Route } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { TripStatusBadge } from "@/components/dashboard/status-badge";
import { TableEmptyRow, TableLoadingRows } from "@/components/dashboard/table-states";
import { EmptyState } from "@/components/dashboard/empty-state";

type Trip = { id: string; origin: string | null; destination: string | null; status: "planned" | "in_progress" | "completed" | "cancelled" };
type Driver = { id: string; first_name: string; last_name: string };
type Vehicle = { id: string; unit_number: string };

export function TripsClient({ companyId, initialSearch = "" }: { companyId: string; initialSearch?: string }) {
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tripsQuery = useQuery({ queryKey: ["trips", companyId], queryFn: () => apiFetch<Trip[]>(`/api/trips?companyId=${companyId}`) });
  const driversQuery = useQuery({ queryKey: ["drivers", companyId], queryFn: () => apiFetch<Driver[]>(`/api/drivers?companyId=${companyId}`) });
  const vehiclesQuery = useQuery({ queryKey: ["vehicles", companyId], queryFn: () => apiFetch<Vehicle[]>(`/api/vehicles?companyId=${companyId}`) });

  const createMutation = useMutation({
    mutationFn: (payload: { driverId: string; vehicleId: string; origin: string; destination: string }) =>
      apiFetch<Trip>("/api/trips", { method: "POST", body: JSON.stringify({ companyId, ...payload }) }),
    onSuccess: () => {
      setError(null);
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
                <option key={vehicle.id} value={vehicle.id}>{vehicle.unit_number}</option>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {tripsQuery.isLoading ? <TableLoadingRows columns={3} /> : null}
                {!tripsQuery.isLoading && trips.length === 0 ? (
                  <TableEmptyRow
                    columns={3}
                    message={query ? "No trips match your search." : "No trips available."}
                  />
                ) : null}
                {trips.map((trip) => (
                  <TableRow key={trip.id} className="transition-colors hover:bg-muted/30">
                    <TableCell className="font-medium">{trip.origin ?? "-"}</TableCell>
                    <TableCell>{trip.destination ?? "-"}</TableCell>
                    <TableCell>
                      <TripStatusBadge status={trip.status} />
                    </TableCell>
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
