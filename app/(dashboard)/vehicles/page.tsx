import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { canViewVehicles } from "@/lib/permissions";
import { getPrimaryMembership } from "@/lib/supabase/company";
import { AccessDenied } from "@/components/dashboard/access-denied";
import { NoCompanyNotice } from "@/components/dashboard/no-company-notice";
import { PageHeader } from "@/components/dashboard/page-header";
import { ModulePageSkeleton } from "@/components/dashboard/page-skeleton";

const VehiclesClient = dynamic(
  () => import("./_components/vehicles-client").then((module) => module.VehiclesClient),
  { loading: () => <ModulePageSkeleton /> }
);

export const metadata: Metadata = {
  title: "Vehicles",
  description: "Manage vehicle records.",
};

type SearchParams = Record<string, string | string[] | undefined>;

function getParamValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const membership = await getPrimaryMembership();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialSearch = getParamValue(resolvedSearchParams?.search);

  return (
    <div className="space-y-6">
      <PageHeader title="Vehicles" description="Track your fleet vehicles and status." />
      {!membership ? <NoCompanyNotice /> : null}
      {membership && !canViewVehicles(membership.role) ? (
        <AccessDenied title="Vehicles access denied" description="Your role cannot access the vehicles module." />
      ) : null}
      {membership && canViewVehicles(membership.role) ? (
        <VehiclesClient companyId={membership.companyId} initialSearch={initialSearch} role={membership.role} />
      ) : null}
    </div>
  );
}