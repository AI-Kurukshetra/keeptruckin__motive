import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { canViewInspections } from "@/lib/permissions";
import { getPrimaryMembership } from "@/lib/supabase/company";
import { AccessDenied } from "@/components/dashboard/access-denied";
import { NoCompanyNotice } from "@/components/dashboard/no-company-notice";
import { PageHeader } from "@/components/dashboard/page-header";
import { ModulePageSkeleton } from "@/components/dashboard/page-skeleton";

const InspectionsClient = dynamic(
  () => import("./_components/inspections-client").then((module) => module.InspectionsClient),
  { loading: () => <ModulePageSkeleton /> }
);

export const metadata: Metadata = {
  title: "Inspections",
  description: "DVIR inspections and defect tracking.",
};

export default async function InspectionsPage() {
  const membership = await getPrimaryMembership();

  return (
    <div className="space-y-6">
      <PageHeader title="Inspections" description="Run and monitor pre/post trip inspections." />
      {!membership ? <NoCompanyNotice /> : null}
      {membership && !canViewInspections(membership.role) ? (
        <AccessDenied title="Inspections access denied" description="Your role cannot access inspections." />
      ) : null}
      {membership && canViewInspections(membership.role) ? <InspectionsClient companyId={membership.companyId} /> : null}
    </div>
  );
}
