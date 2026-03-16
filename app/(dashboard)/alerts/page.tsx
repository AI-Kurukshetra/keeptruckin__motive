import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { canViewAlerts } from "@/lib/permissions";
import { getPrimaryMembership } from "@/lib/supabase/company";
import { AccessDenied } from "@/components/dashboard/access-denied";
import { NoCompanyNotice } from "@/components/dashboard/no-company-notice";
import { PageHeader } from "@/components/dashboard/page-header";
import { ModulePageSkeleton } from "@/components/dashboard/page-skeleton";

const AlertsClient = dynamic(
  () => import("./_components/alerts-client").then((module) => module.AlertsClient),
  { loading: () => <ModulePageSkeleton /> }
);

export const metadata: Metadata = {
  title: "Alerts",
  description: "Alerts center for acknowledgement and resolution.",
};

export default async function AlertsPage() {
  const membership = await getPrimaryMembership();

  return (
    <div className="space-y-6">
      <PageHeader title="Alerts" description="Monitor, acknowledge, and resolve operational alerts." />
      {!membership ? <NoCompanyNotice /> : null}
      {membership && !canViewAlerts(membership.role) ? (
        <AccessDenied title="Alerts access denied" description="Your role cannot access the alerts module." />
      ) : null}
      {membership && canViewAlerts(membership.role) ? <AlertsClient companyId={membership.companyId} role={membership.role} /> : null}
    </div>
  );
}