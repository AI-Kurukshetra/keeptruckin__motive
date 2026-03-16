import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { canViewDrivers } from "@/lib/permissions";
import { getPrimaryMembership } from "@/lib/supabase/company";
import { AccessDenied } from "@/components/dashboard/access-denied";
import { NoCompanyNotice } from "@/components/dashboard/no-company-notice";
import { PageHeader } from "@/components/dashboard/page-header";
import { ModulePageSkeleton } from "@/components/dashboard/page-skeleton";

const DriversClient = dynamic(
  () => import("./_components/drivers-client").then((module) => module.DriversClient),
  { loading: () => <ModulePageSkeleton /> }
);

export const metadata: Metadata = {
  title: "Drivers",
  description: "Manage driver records.",
};

type SearchParams = Record<string, string | string[] | undefined>;

function getParamValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function DriversPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const membership = await getPrimaryMembership();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialSearch = getParamValue(resolvedSearchParams?.search);

  return (
    <div className="space-y-6">
      <PageHeader title="Drivers" description="Create and review fleet driver records." />
      {!membership ? <NoCompanyNotice /> : null}
      {membership && !canViewDrivers(membership.role) ? (
        <AccessDenied title="Drivers access denied" description="Your role cannot access the drivers module." />
      ) : null}
      {membership && canViewDrivers(membership.role) ? (
        <DriversClient companyId={membership.companyId} initialSearch={initialSearch} role={membership.role} />
      ) : null}
    </div>
  );
}