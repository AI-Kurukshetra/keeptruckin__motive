"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import { Button } from "@/components/ui/button";
import { TableEmptyRow, TableLoadingRows } from "@/components/dashboard/table-states";

type EldLog = { id: string; log_date: string; duty_status: string; start_time: string };
type Driver = { id: string; first_name: string; last_name: string };

export function EldClient({ companyId }: { companyId: string }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const logsQuery = useQuery({ queryKey: ["eld", companyId], queryFn: () => apiFetch<EldLog[]>(`/api/eld?companyId=${companyId}`) });
  const driversQuery = useQuery({ queryKey: ["drivers", companyId], queryFn: () => apiFetch<Driver[]>(`/api/drivers?companyId=${companyId}`) });

  const createMutation = useMutation({
    mutationFn: (payload: { driverId: string; logDate: string; dutyStatus: string; startTime: string }) =>
      apiFetch<EldLog>("/api/eld", { method: "POST", body: JSON.stringify({ companyId, ...payload }) }),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["eld", companyId] });
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const logs = logsQuery.data ?? [];

  return (
    <div className="space-y-4">
      <form
        className="grid gap-2 rounded-lg border p-4 md:grid-cols-5"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          createMutation.mutate({
            driverId: String(formData.get("driverId") ?? ""),
            logDate: String(formData.get("logDate") ?? ""),
            dutyStatus: String(formData.get("dutyStatus") ?? "on_duty"),
            startTime: new Date(String(formData.get("startTime") ?? "")).toISOString(),
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
        <input name="logDate" type="date" className="rounded-md border p-2 text-sm" required />
        <select name="dutyStatus" className="rounded-md border p-2 text-sm" defaultValue="on_duty">
          <option value="off_duty">Off Duty</option>
          <option value="sleeper_berth">Sleeper</option>
          <option value="on_duty">On Duty</option>
          <option value="driving">Driving</option>
        </select>
        <input name="startTime" type="datetime-local" className="rounded-md border p-2 text-sm" required />
        <Button type="submit" disabled={createMutation.isPending}>Add Log</Button>
      </form>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-muted-foreground">
            <tr><th className="p-2">Date</th><th className="p-2">Duty</th><th className="p-2">Start</th></tr>
          </thead>
          <tbody>
            {logsQuery.isLoading ? <TableLoadingRows columns={3} /> : null}
            {!logsQuery.isLoading && logs.length === 0 ? (
              <TableEmptyRow columns={3} message="No ELD logs yet. Add an HOS log above." />
            ) : null}
            {logs.map((log) => (
              <tr key={log.id} className="border-b last:border-0">
                <td className="p-2">{log.log_date}</td>
                <td className="p-2">{log.duty_status}</td>
                <td className="p-2">{new Date(log.start_time).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
