import type { Metadata } from "next";
import { getPrimaryMembership } from "@/lib/supabase/company";
import { NoCompanyNotice } from "@/components/dashboard/no-company-notice";
import { PageHeader } from "@/components/dashboard/page-header";
import { AlertsClient } from "./_components/alerts-client";

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

