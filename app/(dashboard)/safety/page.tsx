import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getPrimaryMembership } from "@/lib/supabase/company";
import { NoCompanyNotice } from "@/components/dashboard/no-company-notice";
import { PageHeader } from "@/components/dashboard/page-header";
import { ModulePageSkeleton } from "@/components/dashboard/page-skeleton";

const SafetyClient = dynamic(
  () => import("./_components/safety-client").then((module) => module.SafetyClient),
  { loading: () => <ModulePageSkeleton /> }
);

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

