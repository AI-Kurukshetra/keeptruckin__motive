"use client";

import { useMemo, useRef, useState } from "react";
import { BookUser, Pencil, Trash2 } from "lucide-react";
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

type EldLog = {
  id: string;
  driver_id: string;
  log_date: string;
  duty_status: "off_duty" | "sleeper_berth" | "on_duty" | "driving";
  start_time: string;
  remarks: string | null;
};

type Driver = { id: string; first_name: string; last_name: string };

type EldForm = {
  driverId?: string;
  logDate?: string;
  dutyStatus?: "off_duty" | "sleeper_berth" | "on_duty" | "driving";
  startTime?: string;
  remarks?: string;
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

export function EldClient({ companyId }: { companyId: string }) {
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingLog, setEditingLog] = useState<EldLog | null>(null);
  const [deletingLog, setDeletingLog] = useState<EldLog | null>(null);

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

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: EldForm }) =>
      apiFetch<EldLog>(`/api/eld/${payload.id}?companyId=${companyId}`, {
        method: "PATCH",
        body: JSON.stringify(payload.data),
      }),
    onSuccess: () => {
      setError(null);
      setEditingLog(null);
      queryClient.invalidateQueries({ queryKey: ["eld", companyId] });
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ deleted: boolean }>(`/api/eld/${id}?companyId=${companyId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      setError(null);
      setDeletingLog(null);
      queryClient.invalidateQueries({ queryKey: ["eld", companyId] });
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const logs = logsQuery.data ?? [];

  const driverLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const driver of driversQuery.data ?? []) {
      map.set(driver.id, `${driver.first_name} ${driver.last_name}`);
    }
    return map;
  }, [driversQuery.data]);

  const showEmptyState = !logsQuery.isLoading && logs.length === 0;

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
                logDate: String(formData.get("logDate") ?? ""),
                dutyStatus: String(formData.get("dutyStatus") ?? "on_duty"),
                startTime: new Date(String(formData.get("startTime") ?? "")).toISOString(),
              });
              event.currentTarget.reset();
            }}
          >
            <select name="driverId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
              <option value="">Driver</option>
              {(driversQuery.data ?? []).map((driver) => (
                <option key={driver.id} value={driver.id}>{driver.first_name} {driver.last_name}</option>
              ))}
            </select>
            <Input name="logDate" type="date" required />
            <select name="dutyStatus" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue="on_duty">
              <option value="off_duty">Off Duty</option>
              <option value="sleeper_berth">Sleeper</option>
              <option value="on_duty">On Duty</option>
              <option value="driving">Driving</option>
            </select>
            <Input name="startTime" type="datetime-local" required />
            <Button type="submit" disabled={createMutation.isPending}>Add Log</Button>
          </form>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {showEmptyState ? (
        <EmptyState
          icon={BookUser}
          title="No ELD logs yet"
          description="Capture your first duty-status entry to begin compliance logging."
          actionLabel="Add first log"
          onAction={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
        />
      ) : (
        <Card className="transition-colors hover:border-primary/20">
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Duty</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logsQuery.isLoading ? <TableLoadingRows columns={4} /> : null}
                {!logsQuery.isLoading && logs.length === 0 ? (
                  <TableEmptyRow columns={4} message="No ELD logs yet. Add an HOS log above." />
                ) : null}
                {logs.map((log) => (
                  <TableRow key={log.id} className="transition-colors hover:bg-muted/40">
                    <TableCell>{log.log_date}</TableCell>
                    <TableCell>{log.duty_status}</TableCell>
                    <TableCell>{new Date(log.start_time).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" className="hover:bg-gray-100" onClick={() => setEditingLog(log)}>
                          <Pencil className="size-3.5" /> Edit
                        </Button>
                        <Button variant="destructive" size="sm" className="hover:bg-red-600 hover:text-white" onClick={() => setDeletingLog(log)}>
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

      <Dialog open={Boolean(editingLog)} onOpenChange={(open) => !open && setEditingLog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit ELD Log</DialogTitle>
            <DialogDescription>Update duty status and timing details.</DialogDescription>
          </DialogHeader>
          {editingLog ? (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                updateMutation.mutate({
                  id: editingLog.id,
                  data: {
                    driverId: String(formData.get("driverId") ?? editingLog.driver_id),
                    logDate: String(formData.get("logDate") ?? editingLog.log_date),
                    dutyStatus: String(formData.get("dutyStatus") ?? "on_duty") as EldForm["dutyStatus"],
                    startTime: fromDateTimeLocal(String(formData.get("startTime") ?? "")),
                    remarks: String(formData.get("remarks") ?? "") || undefined,
                  },
                });
              }}
            >
              <select name="driverId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={editingLog.driver_id} required>
                {(driversQuery.data ?? []).map((driver) => (
                  <option key={driver.id} value={driver.id}>{driver.first_name} {driver.last_name}</option>
                ))}
              </select>
              <Input name="logDate" type="date" defaultValue={editingLog.log_date} required />
              <select name="dutyStatus" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={editingLog.duty_status}>
                <option value="off_duty">Off Duty</option>
                <option value="sleeper_berth">Sleeper</option>
                <option value="on_duty">On Duty</option>
                <option value="driving">Driving</option>
              </select>
              <Input name="startTime" type="datetime-local" defaultValue={toDateTimeLocal(editingLog.start_time)} required />
              <Input name="remarks" defaultValue={editingLog.remarks ?? ""} placeholder="Remarks (optional)" />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingLog(null)}>Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending}>Save</Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deletingLog)} onOpenChange={(open) => !open && setDeletingLog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete ELD Log</DialogTitle>
            <DialogDescription>Are you sure you want to delete this record?</DialogDescription>
          </DialogHeader>
          {deletingLog ? (
            <p className="text-sm text-muted-foreground">
              Driver: {driverLabelById.get(deletingLog.driver_id) ?? "Unknown"} | {deletingLog.log_date}
            </p>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingLog(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deletingLog) {
                  deleteMutation.mutate(deletingLog.id);
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

