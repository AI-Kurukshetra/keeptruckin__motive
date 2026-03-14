import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getPrimaryMembership } from "@/lib/supabase/company";
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
      {membership ? <EldClient companyId={membership.companyId} /> : <NoCompanyNotice />}
    </div>
  );
}

