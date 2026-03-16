export const COMPANY_ROLES = ["owner", "admin", "dispatcher", "driver", "viewer"] as const;

export type CompanyRole = (typeof COMPANY_ROLES)[number];

type MembershipRoleLookup = {
  user_id: string;
  role: string;
  company_id?: string;
};

export function isCompanyRole(value: string): value is CompanyRole {
  return (COMPANY_ROLES as readonly string[]).includes(value);
}

// Pure helper for role extraction from loaded membership rows.
export function getUserRole(
  userId: string,
  memberships: MembershipRoleLookup[],
  companyId?: string
): CompanyRole | null {
  const membership = memberships.find((item) => {
    if (item.user_id !== userId) return false;
    if (!companyId) return true;
    return item.company_id === companyId;
  });

  if (!membership || !isCompanyRole(membership.role)) {
    return null;
  }

  return membership.role;
}

export function canViewDrivers(role: CompanyRole): boolean {
  return role === "owner" || role === "admin" || role === "dispatcher" || role === "driver" || role === "viewer";
}

export function canEditDrivers(role: CompanyRole): boolean {
  return role === "owner" || role === "admin" || role === "dispatcher";
}

export function canCreateDrivers(role: CompanyRole): boolean {
  return canEditDrivers(role);
}

export function canDeleteDrivers(role: CompanyRole): boolean {
  return role === "owner" || role === "admin";
}

export function canViewVehicles(role: CompanyRole): boolean {
  return role === "owner" || role === "admin" || role === "dispatcher" || role === "viewer";
}

export function canEditVehicles(role: CompanyRole): boolean {
  return role === "owner" || role === "admin" || role === "dispatcher";
}

export function canDeleteVehicles(role: CompanyRole): boolean {
  return role === "owner" || role === "admin";
}

export function canViewTrips(role: CompanyRole): boolean {
  return role === "owner" || role === "admin" || role === "dispatcher" || role === "driver" || role === "viewer";
}

export function canCreateTrips(role: CompanyRole): boolean {
  return role === "owner" || role === "admin" || role === "dispatcher";
}

export function canEditTrips(role: CompanyRole): boolean {
  return role === "owner" || role === "admin" || role === "dispatcher";
}

export function canDeleteTrips(role: CompanyRole): boolean {
  return role === "owner" || role === "admin";
}

export function canViewEld(role: CompanyRole): boolean {
  return role !== "viewer";
}

export function canViewInspections(role: CompanyRole): boolean {
  return role === "owner" || role === "admin" || role === "dispatcher" || role === "driver";
}

export function canViewMaintenance(role: CompanyRole): boolean {
  return role === "owner" || role === "admin" || role === "dispatcher";
}

export function canViewSafety(role: CompanyRole): boolean {
  return role === "owner" || role === "admin" || role === "dispatcher" || role === "driver";
}

export function canViewAlerts(role: CompanyRole): boolean {
  return role === "owner" || role === "admin" || role === "dispatcher" || role === "viewer";
}

export function canEditAlerts(role: CompanyRole): boolean {
  return role === "owner" || role === "admin";
}

export function canAccessOperationalModules(role: CompanyRole): boolean {
  return role === "owner" || role === "admin" || role === "dispatcher";
}

export function isDriverScopedRole(role: CompanyRole): boolean {
  return role === "driver";
}
