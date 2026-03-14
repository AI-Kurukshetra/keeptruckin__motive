"use client";

import { useMemo, useRef, useState } from "react";
import { Truck } from "lucide-react";
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
import { VehicleStatusBadge } from "@/components/dashboard/status-badge";
import { TableEmptyRow, TableLoadingRows } from "@/components/dashboard/table-states";
import { EmptyState } from "@/components/dashboard/empty-state";

type Vehicle = { id: string; vin: string; unit_number: string; status: string };

export function VehiclesClient({ companyId, initialSearch = "" }: { companyId: string; initialSearch?: string }) {
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const vehiclesQuery = useQuery({
    queryKey: ["vehicles", companyId],
    queryFn: () => apiFetch<Vehicle[]>(`/api/vehicles?companyId=${companyId}`),
  });

  const createMutation = useMutation({
    mutationFn: (payload: { vin: string; unitNumber: string }) =>
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

  const query = initialSearch.trim().toLowerCase();
  const vehicles = useMemo(() => {
    const records = vehiclesQuery.data ?? [];

    if (!query) {
      return records;
    }

    return records.filter((vehicle) => {
      return (
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
            className="grid gap-3 md:grid-cols-3"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              createMutation.mutate({
                vin: String(formData.get("vin") ?? ""),
                unitNumber: String(formData.get("unitNumber") ?? ""),
              });
              event.currentTarget.reset();
            }}
          >
            <Input name="vin" placeholder="VIN" required data-testid="vehicle-vin" />
            <Input name="unitNumber" placeholder="Unit number" required data-testid="vehicle-unit-number" />
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
                  <TableHead>Unit</TableHead>
                  <TableHead>VIN</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehiclesQuery.isLoading ? <TableLoadingRows columns={3} /> : null}
                {!vehiclesQuery.isLoading && vehicles.length === 0 ? (
                  <TableEmptyRow
                    columns={3}
                    message={query ? "No vehicles match your search." : "No vehicles available."}
                  />
                ) : null}
                {vehicles.map((vehicle) => (
                  <TableRow key={vehicle.id} className="transition-colors hover:bg-muted/30">
                    <TableCell className="font-medium">{vehicle.unit_number}</TableCell>
                    <TableCell>{vehicle.vin}</TableCell>
                    <TableCell>
                      <VehicleStatusBadge status={vehicle.status} />
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
