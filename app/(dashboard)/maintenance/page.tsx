import type { Metadata } from "next";
import { getPrimaryMembership } from "@/lib/supabase/company";
import { NoCompanyNotice } from "@/components/dashboard/no-company-notice";
import { PageHeader } from "@/components/dashboard/page-header";
import { MaintenanceClient } from "./_components/maintenance-client";

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

