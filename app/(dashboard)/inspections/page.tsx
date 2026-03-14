import type { Metadata } from "next";
import { getPrimaryMembership } from "@/lib/supabase/company";
import { NoCompanyNotice } from "@/components/dashboard/no-company-notice";
import { PageHeader } from "@/components/dashboard/page-header";
import { InspectionsClient } from "./_components/inspections-client";

export const metadata: Metadata = {
  title: "Inspections",
  description: "DVIR inspections and defect tracking.",
};

export default async function InspectionsPage() {
  const membership = await getPrimaryMembership();

  return (
    <div className="space-y-6">
      <PageHeader title="Inspections" description="Run and monitor pre/post trip inspections." />
      {membership ? <InspectionsClient companyId={membership.companyId} /> : <NoCompanyNotice />}
    </div>
  );
}

