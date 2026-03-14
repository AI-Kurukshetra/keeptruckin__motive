import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getPrimaryMembership } from "@/lib/supabase/company";
import { NoCompanyNotice } from "@/components/dashboard/no-company-notice";
import { PageHeader } from "@/components/dashboard/page-header";
import { ModulePageSkeleton } from "@/components/dashboard/page-skeleton";

const MaintenanceClient = dynamic(
  () => import("./_components/maintenance-client").then((module) => module.MaintenanceClient),
  { ssr: false, loading: () => <ModulePageSkeleton /> }
);

export const metadata: Metadata = {
  title: "Maintenance",
  description: "Maintenance schedule and tracking.",
};

export default async function MaintenancePage() {
  const membership = await getPrimaryMembership();

  return (
    <div className="space-y-6">
      <PageHeader title="Maintenance" description="Schedule preventive and corrective maintenance." />
      {membership ? <MaintenanceClient companyId={membership.companyId} /> : <NoCompanyNotice />}
    </div>
  );
}
