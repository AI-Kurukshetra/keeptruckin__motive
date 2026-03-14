"use client";

import { useMemo, useRef, useState } from "react";
import { Pencil, Trash2, UserPlus } from "lucide-react";
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
import { TableEmptyRow, TableLoadingRows } from "@/components/dashboard/table-states";
import { EmptyState } from "@/components/dashboard/empty-state";

type Driver = {
  id: string;
  first_name: string;
  last_name: string;
  license_number: string;
  status: string;
};

export function DriversClient({ companyId, initialSearch = "" }: { companyId: string; initialSearch?: string }) {
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [deletingDriver, setDeletingDriver] = useState<Driver | null>(null);

  const driversQuery = useQuery({
    queryKey: ["drivers", companyId],
    queryFn: () => apiFetch<Driver[]>(`/api/drivers?companyId=${companyId}`),
  });

  const createMutation = useMutation({
    mutationFn: (payload: { firstName: string; lastName: string; licenseNumber: string }) =>
      apiFetch<Driver>("/api/drivers", {
        method: "POST",
        body: JSON.stringify({ companyId, ...payload }),
      }),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["drivers", companyId] });
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; firstName: string; lastName: string; licenseNumber: string; status: string }) =>
      apiFetch<Driver>(`/api/drivers/${payload.id}?companyId=${companyId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      setError(null);
      setEditingDriver(null);
      queryClient.invalidateQueries({ queryKey: ["drivers", companyId] });
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ deleted: boolean }>(`/api/drivers/${id}?companyId=${companyId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      setError(null);
      setDeletingDriver(null);
      queryClient.invalidateQueries({ queryKey: ["drivers", companyId] });
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const query = initialSearch.trim().toLowerCase();
  const drivers = useMemo(() => {
    const records = driversQuery.data ?? [];

    if (!query) {
      return records;
    }

    return records.filter((driver) => {
      const fullName = `${driver.first_name} ${driver.last_name}`.toLowerCase();
      return (
        fullName.includes(query) ||
        driver.license_number.toLowerCase().includes(query) ||
        driver.status.toLowerCase().includes(query)
      );
    });
  }, [driversQuery.data, query]);

  const showEmptyState = !driversQuery.isLoading && (driversQuery.data ?? []).length === 0;

  return (
    <div className="space-y-6">
      <Card className="transition-colors hover:border-primary/40">
        <CardContent className="pt-6">
          <form
            ref={formRef}
            className="grid gap-3 md:grid-cols-4"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              createMutation.mutate({
                firstName: String(formData.get("firstName") ?? ""),
                lastName: String(formData.get("lastName") ?? ""),
                licenseNumber: String(formData.get("licenseNumber") ?? ""),
              });
              event.currentTarget.reset();
            }}
          >
            <Input name="firstName" placeholder="First name" required data-testid="driver-first-name" />
            <Input name="lastName" placeholder="Last name" required data-testid="driver-last-name" />
            <Input name="licenseNumber" placeholder="License number" required data-testid="driver-license" />
            <Button type="submit" disabled={createMutation.isPending} data-testid="add-driver-button">Add Driver</Button>
          </form>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {showEmptyState ? (
        <EmptyState
          icon={UserPlus}
          title="No drivers added"
          description="Start by adding your first driver profile to begin assignment planning."
          actionLabel="Add first driver"
          onAction={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
        />
      ) : (
        <Card className="transition-colors hover:border-primary/20">
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {driversQuery.isLoading ? <TableLoadingRows columns={4} /> : null}
                {!driversQuery.isLoading && drivers.length === 0 ? (
                  <TableEmptyRow
                    columns={4}
                    message={query ? "No drivers match your search." : "No drivers available."}
                  />
                ) : null}
                {drivers.map((driver) => (
                  <TableRow key={driver.id} className="cursor-pointer transition-colors hover:bg-muted/50">
                    <TableCell className="font-medium">{driver.first_name} {driver.last_name}</TableCell>
                    <TableCell>{driver.license_number}</TableCell>
                    <TableCell className="capitalize">{driver.status}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingDriver(driver)}>
                          <Pencil className="size-3.5" /> Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setDeletingDriver(driver)}>
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

      <Dialog open={Boolean(editingDriver)} onOpenChange={(open) => !open && setEditingDriver(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Driver</DialogTitle>
            <DialogDescription>Update driver details.</DialogDescription>
          </DialogHeader>
          {editingDriver ? (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                updateMutation.mutate({
                  id: editingDriver.id,
                  firstName: String(formData.get("firstName") ?? ""),
                  lastName: String(formData.get("lastName") ?? ""),
                  licenseNumber: String(formData.get("licenseNumber") ?? ""),
                  status: String(formData.get("status") ?? "active"),
                });
              }}
            >
              <Input name="firstName" defaultValue={editingDriver.first_name} required />
              <Input name="lastName" defaultValue={editingDriver.last_name} required />
              <Input name="licenseNumber" defaultValue={editingDriver.license_number} required />
              <select name="status" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={editingDriver.status}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingDriver(null)}>Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending}>Save</Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deletingDriver)} onOpenChange={(open) => !open && setDeletingDriver(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Driver</DialogTitle>
            <DialogDescription>Are you sure you want to delete this record?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingDriver(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deletingDriver) {
                  deleteMutation.mutate(deletingDriver.id);
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
