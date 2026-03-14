"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TableEmptyRow, TableLoadingRows } from "@/components/dashboard/table-states";

type SafetyEvent = { id: string; event_type: string; severity: number; occurred_at: string };
type SafetyScore = { totalEvents: number; totalScoreImpact: number; averageSeverity: number; safetyScore: number };

export function SafetyClient({ companyId }: { companyId: string }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const eventsQuery = useQuery({ queryKey: ["safety-events", companyId], queryFn: () => apiFetch<SafetyEvent[]>(`/api/safety?companyId=${companyId}`) });
  const scoreQuery = useQuery({ queryKey: ["safety-score", companyId], queryFn: () => apiFetch<SafetyScore>(`/api/safety/score?companyId=${companyId}`) });

  const createMutation = useMutation({
    mutationFn: (payload: { eventType: string; severity: number; occurredAt: string; scoreImpact: number }) =>
      apiFetch<SafetyEvent>("/api/safety", { method: "POST", body: JSON.stringify({ companyId, ...payload }) }),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["safety-events", companyId] });
      queryClient.invalidateQueries({ queryKey: ["safety-score", companyId] });
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const eventTypeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const event of eventsQuery.data ?? []) {
      counts.set(event.event_type, (counts.get(event.event_type) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([type, value]) => ({ type, value }));
  }, [eventsQuery.data]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4">
        {scoreQuery.isLoading ? <Skeleton className="h-14 w-full" /> : (
          <>
            <p className="text-sm text-muted-foreground">Safety Score</p>
            <p className="text-2xl font-semibold">{scoreQuery.data?.safetyScore ?? 0}</p>
            <p className="text-xs text-muted-foreground">
              Events: {scoreQuery.data?.totalEvents ?? 0} | Avg severity: {scoreQuery.data?.averageSeverity ?? 0}
            </p>
          </>
        )}
      </div>

      <div className="rounded-lg border p-4 space-y-2">
        <p className="text-sm font-medium">Safety Event Distribution</p>
        {eventsQuery.isLoading ? <Skeleton className="h-24 w-full" /> : null}
        {!eventsQuery.isLoading && eventTypeCounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No safety events logged yet.</p>
        ) : null}
        {eventTypeCounts.map((row) => {
          const max = Math.max(...eventTypeCounts.map((item) => item.value), 1);
          return (
            <div key={row.type} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="capitalize">{row.type.replaceAll("_", " ")}</span>
                <span>{row.value}</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${(row.value / max) * 100}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <form
        className="grid gap-2 rounded-lg border p-4 md:grid-cols-5"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          createMutation.mutate({
            eventType: String(formData.get("eventType") ?? "speeding"),
            severity: Number(formData.get("severity") ?? 1),
            scoreImpact: Number(formData.get("scoreImpact") ?? 0),
            occurredAt: new Date(String(formData.get("occurredAt") ?? "")).toISOString(),
          });
          event.currentTarget.reset();
        }}
      >
        <select name="eventType" className="rounded-md border p-2 text-sm" defaultValue="speeding">
          <option value="speeding">Speeding</option>
          <option value="harsh_braking">Harsh Braking</option>
          <option value="rapid_acceleration">Rapid Acceleration</option>
          <option value="other">Other</option>
        </select>
        <input name="severity" type="number" min="1" max="5" defaultValue="3" className="rounded-md border p-2 text-sm" required />
        <input name="scoreImpact" type="number" defaultValue="5" className="rounded-md border p-2 text-sm" required />
        <input name="occurredAt" type="datetime-local" className="rounded-md border p-2 text-sm" required />
        <Button type="submit" disabled={createMutation.isPending}>Log Event</Button>
      </form>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-muted-foreground"><tr><th className="p-2">Type</th><th className="p-2">Severity</th><th className="p-2">Time</th></tr></thead>
          <tbody>
            {eventsQuery.isLoading ? <TableLoadingRows columns={3} /> : null}
            {!eventsQuery.isLoading && (eventsQuery.data ?? []).length === 0 ? <TableEmptyRow columns={3} message="No safety events yet." /> : null}
            {(eventsQuery.data ?? []).map((event) => (
              <tr key={event.id} className="border-b last:border-0">
                <td className="p-2 capitalize">{event.event_type.replaceAll("_", " ")}</td>
                <td className="p-2">{event.severity}</td>
                <td className="p-2">{new Date(event.occurred_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
