import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCompanyAction, inviteMemberAction } from "@/app/actions/onboarding";
import { DashboardPageSkeleton } from "@/components/dashboard/page-skeleton";

const DashboardOverviewClient = dynamic(
  () => import("./_components/overview-client").then((module) => module.DashboardOverviewClient),
  {
    loading: () => <DashboardPageSkeleton />,
  }
);

type SearchParams = Record<string, string | string[] | undefined>;

export const metadata: Metadata = {
  title: "Dashboard Home",
  description: "Overview of fleet activity and compliance.",
};

type DashboardPageProps = {
  searchParams?: Promise<SearchParams>;
};

function getParamValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function getMessageText(message: string | null): string | null {
  if (message === "company_created") {
    return "Company created successfully.";
  }

  if (message === "invite_created") {
    return "Invitation created successfully.";
  }

  return null;
}

function getErrorText(error: string | null): string | null {
  if (error === "invalid_company_input") {
    return "Enter a valid company name and optional fleet details.";
  }

  if (error === "company_create_failed") {
    return "Could not create company. Please try again.";
  }

  if (error === "invalid_invite_input") {
    return "Enter a valid invite email and role.";
  }

  if (error === "invite_not_allowed") {
    return "Only owner/admin can invite members for this company.";
  }

  if (error === "invite_failed") {
    return "Could not create invitation. Please try again.";
  }

  return null;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const supabase = await createClient();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const message = getMessageText(getParamValue(resolvedSearchParams?.message));
  const error = getErrorText(getParamValue(resolvedSearchParams?.error));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: memberships } = await supabase
    .from("company_members")
    .select("company_id, role, companies(name)")
    .eq("user_id", user?.id ?? "");

  const primaryMembership = memberships?.[0];
  const canInvite = primaryMembership
    ? primaryMembership.role === "owner" || primaryMembership.role === "admin"
    : false;

  const inviteRoleOptions = primaryMembership?.role === "owner"
    ? ["admin", "dispatcher", "driver", "viewer"]
    : ["dispatcher", "driver", "viewer"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Manage company setup and team access.</p>
      </div>

      {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {primaryMembership ? <DashboardOverviewClient companyId={primaryMembership.company_id} /> : null}

      {!primaryMembership ? (
        <Card>
          <CardHeader>
            <CardTitle>Create Company</CardTitle>
            <CardDescription>Create your first fleet company to start onboarding.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createCompanyAction} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name</Label>
                <Input id="name" name="name" required data-testid="company-name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dotNumber">DOT Number (Optional)</Label>
                <Input id="dotNumber" name="dotNumber" data-testid="company-dot-number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fleetSize">Fleet Size (Optional)</Label>
                <Input id="fleetSize" name="fleetSize" type="number" min="0" step="1" data-testid="company-fleet-size" />
              </div>
              <Button type="submit" data-testid="create-company-submit">Create Company</Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Company Access</CardTitle>
            <CardDescription>
              Signed in as {primaryMembership.role} at {primaryMembership.companies?.name ?? "Company"}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {canInvite ? (
              <form action={inviteMemberAction} className="space-y-6">
                <input type="hidden" name="companyId" value={primaryMembership.company_id} />
                <div className="space-y-2">
                  <Label htmlFor="inviteEmail">Invite Email</Label>
                  <Input id="inviteEmail" name="email" type="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inviteRole">Role</Label>
                  <select
                    id="inviteRole"
                    name="role"
                    className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none"
                    defaultValue="driver"
                  >
                    {inviteRoleOptions.map((roleOption) => (
                      <option key={roleOption} value={roleOption}>
                        {roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <Button type="submit">Create Invitation</Button>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground">
                You can view company data, but only owner/admin can invite new members.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
