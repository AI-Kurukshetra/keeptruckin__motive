import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { canViewEld } from "@/lib/permissions";
import { getPrimaryMembership } from "@/lib/supabase/company";
import { AccessDenied } from "@/components/dashboard/access-denied";
import { NoCompanyNotice } from "@/components/dashboard/no-company-notice";
import { PageHeader } from "@/components/dashboard/page-header";
import { ModulePageSkeleton } from "@/components/dashboard/page-skeleton";

const EldClient = dynamic(
  () => import("./_components/eld-client").then((module) => module.EldClient),
  { loading: () => <ModulePageSkeleton /> }
);

export const metadata: Metadata = {
  title: "ELD",
  description: "Manage ELD logs.",
};

export default async function EldPage() {
  const membership = await getPrimaryMembership();

  return (
    <div className="space-y-6">
      <PageHeader title="ELD Logs" description="Capture and review duty status logs." />
      {!membership ? <NoCompanyNotice /> : null}
      {membership && !canViewEld(membership.role) ? (
        <AccessDenied title="ELD access denied" description="Your role cannot access ELD logs." />
      ) : null}
      {membership && canViewEld(membership.role) ? <EldClient companyId={membership.companyId} /> : null}
    </div>
  );
}
