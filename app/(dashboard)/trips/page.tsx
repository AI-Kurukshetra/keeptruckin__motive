import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getPrimaryMembership } from "@/lib/supabase/company";
import { NoCompanyNotice } from "@/components/dashboard/no-company-notice";
import { PageHeader } from "@/components/dashboard/page-header";
import { ModulePageSkeleton } from "@/components/dashboard/page-skeleton";

const TripsClient = dynamic(
  () => import("./_components/trips-client").then((module) => module.TripsClient),
  { ssr: false, loading: () => <ModulePageSkeleton /> }
);

export const metadata: Metadata = {
  title: "Trips",
  description: "Plan and monitor trips.",
};

type SearchParams = Record<string, string | string[] | undefined>;

function getParamValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function TripsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const membership = await getPrimaryMembership();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialSearch = getParamValue(resolvedSearchParams?.search);

  return (
    <div className="space-y-6">
      <PageHeader title="Trips" description="Manage route assignments and trip progress." />
      {membership ? <TripsClient companyId={membership.companyId} initialSearch={initialSearch} /> : <NoCompanyNotice />}
    </div>
  );
}
