"use client";

import { useMemo, useState } from "react";
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
import { TableEmptyRow, TableLoadingRows } from "@/components/dashboard/table-states";

type Driver = {
  id: string;
  first_name: string;
  last_name: string;
  license_number: string;
  status: string;
};

export function DriversClient({ companyId, initialSearch = "" }: { companyId: string; initialSearch?: string }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <form
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

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>License</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {driversQuery.isLoading ? <TableLoadingRows columns={3} /> : null}
              {!driversQuery.isLoading && drivers.length === 0 ? (
                <TableEmptyRow
                  columns={3}
                  message={query ? "No drivers match your search." : "No drivers yet. Add your first driver above."}
                />
              ) : null}
              {drivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell className="font-medium">{driver.first_name} {driver.last_name}</TableCell>
                  <TableCell>{driver.license_number}</TableCell>
                  <TableCell className="capitalize">{driver.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


