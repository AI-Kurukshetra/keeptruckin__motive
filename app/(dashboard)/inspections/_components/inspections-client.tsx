"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import { Button } from "@/components/ui/button";
import { TableEmptyRow, TableLoadingRows } from "@/components/dashboard/table-states";

type Inspection = { id: string; inspection_type: string; status: string; inspected_at: string };
type Driver = { id: string; first_name: string; last_name: string };
type Vehicle = { id: string; unit_number: string };

export function InspectionsClient({ companyId }: { companyId: string }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

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

  const inspections = inspectionsQuery.data ?? [];

  return (
    <div className="space-y-4">
      <form
        className="grid gap-2 rounded-lg border p-4 md:grid-cols-5"
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
        <select name="driverId" className="rounded-md border p-2 text-sm" required>
          <option value="">Driver</option>
          {(driversQuery.data ?? []).map((driver) => (
            <option key={driver.id} value={driver.id}>{driver.first_name} {driver.last_name}</option>
          ))}
        </select>
        <select name="vehicleId" className="rounded-md border p-2 text-sm" required>
          <option value="">Vehicle</option>
          {(vehiclesQuery.data ?? []).map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>{vehicle.unit_number}</option>
          ))}
        </select>
        <select name="inspectionType" className="rounded-md border p-2 text-sm" defaultValue="pre_trip">
          <option value="pre_trip">Pre Trip</option>
          <option value="post_trip">Post Trip</option>
        </select>
        <select name="status" className="rounded-md border p-2 text-sm" defaultValue="passed">
          <option value="passed">Passed</option>
          <option value="failed">Failed</option>
        </select>
        <Button type="submit" disabled={createMutation.isPending}>Add Inspection</Button>
      </form>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-muted-foreground">
            <tr><th className="p-2">Type</th><th className="p-2">Status</th><th className="p-2">Time</th></tr>
          </thead>
          <tbody>
            {inspectionsQuery.isLoading ? <TableLoadingRows columns={3} /> : null}
            {!inspectionsQuery.isLoading && inspections.length === 0 ? (
              <TableEmptyRow columns={3} message="No inspections yet. Add a pre/post trip inspection above." />
            ) : null}
            {inspections.map((inspection) => (
              <tr key={inspection.id} className="border-b last:border-0">
                <td className="p-2">{inspection.inspection_type}</td>
                <td className="p-2">{inspection.status}</td>
                <td className="p-2">{new Date(inspection.inspected_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
