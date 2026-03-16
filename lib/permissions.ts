export const COMPANY_ROLES = ["owner", "admin", "dispatcher", "driver", "viewer"] as const;

export type CompanyRole = (typeof COMPANY_ROLES)[number];

export function isCompanyRole(value: string): value is CompanyRole {
  return (COMPANY_ROLES as readonly string[]).includes(value);
}

export function canViewDrivers(role: CompanyRole): boolean {
  return role === "owner" || role === "admin" || role === "dispatcher" || role === "driver" || role === "viewer";
}

export function canEditDrivers(role: CompanyRole): boolean {
  return role === "owner" || role === "admin" || role === "dispatcher";
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

export function canViewAlerts(role: CompanyRole): boolean {
  return role === "owner" || role === "admin" || role === "dispatcher" || role === "viewer";
}

export function canEditAlerts(role: CompanyRole): boolean {
  return role === "owner" || role === "admin";
}

export function isDriverScopedRole(role: CompanyRole): boolean {
  return role === "driver";
}