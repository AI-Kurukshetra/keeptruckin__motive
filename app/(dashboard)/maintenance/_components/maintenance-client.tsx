"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import { Button } from "@/components/ui/button";
import { TableEmptyRow, TableLoadingRows } from "@/components/dashboard/table-states";

type Maintenance = { id: string; maintenance_type: string; status: string; due_at: string | null };
type Vehicle = { id: string; unit_number: string };

export function MaintenanceClient({ companyId }: { companyId: string }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

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

  const maintenance = maintenanceQuery.data ?? [];

  return (
    <div className="space-y-4">
      <form
        className="grid gap-2 rounded-lg border p-4 md:grid-cols-4"
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
        <select name="vehicleId" className="rounded-md border p-2 text-sm" required>
          <option value="">Vehicle</option>
          {(vehiclesQuery.data ?? []).map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>{vehicle.unit_number}</option>
          ))}
        </select>
        <input name="maintenanceType" className="rounded-md border p-2 text-sm" placeholder="Maintenance type" required />
        <input name="dueAt" type="date" className="rounded-md border p-2 text-sm" required />
        <Button type="submit" disabled={createMutation.isPending}>Schedule</Button>
      </form>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-muted-foreground">
            <tr><th className="p-2">Type</th><th className="p-2">Status</th><th className="p-2">Due</th></tr>
          </thead>
          <tbody>
            {maintenanceQuery.isLoading ? <TableLoadingRows columns={3} /> : null}
            {!maintenanceQuery.isLoading && maintenance.length === 0 ? (
              <TableEmptyRow columns={3} message="No maintenance records yet. Schedule your first maintenance item." />
            ) : null}
            {maintenance.map((record) => (
              <tr key={record.id} className="border-b last:border-0">
                <td className="p-2">{record.maintenance_type}</td>
                <td className="p-2 capitalize">{record.status}</td>
                <td className="p-2">{record.due_at ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
