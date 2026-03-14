import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getPrimaryMembership } from "@/lib/supabase/company";
import { NoCompanyNotice } from "@/components/dashboard/no-company-notice";
import { PageHeader } from "@/components/dashboard/page-header";
import { ModulePageSkeleton } from "@/components/dashboard/page-skeleton";

const AlertsClient = dynamic(
  () => import("./_components/alerts-client").then((module) => module.AlertsClient),
  { ssr: false, loading: () => <ModulePageSkeleton /> }
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
      {membership ? <AlertsClient companyId={membership.companyId} /> : <NoCompanyNotice />}
    </div>
  );
}
