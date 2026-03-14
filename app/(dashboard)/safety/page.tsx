import type { Metadata } from "next";
import { getPrimaryMembership } from "@/lib/supabase/company";
import { NoCompanyNotice } from "@/components/dashboard/no-company-notice";
import { PageHeader } from "@/components/dashboard/page-header";
import { SafetyClient } from "./_components/safety-client";

export const metadata: Metadata = {
  title: "Safety",
  description: "Safety events and scoring.",
};

export default async function SafetyPage() {
  const membership = await getPrimaryMembership();

  return (
    <div className="space-y-6">
      <PageHeader title="Safety" description="Track safety events and monitor fleet safety score." />
      {membership ? <SafetyClient companyId={membership.companyId} /> : <NoCompanyNotice />}
    </div>
  );
}

