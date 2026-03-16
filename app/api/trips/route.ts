import { fail, ok } from "@/lib/api/responses";
import { getCompanyRole, requireAuth } from "@/lib/api/auth";
import { canCreateTrips, canViewTrips, isDriverScopedRole } from "@/lib/permissions";
import { parseJsonBody, searchParamsToObject } from "@/lib/api/request";
import { companyQuerySchema, tripCreateSchema } from "@/lib/validations/api";

async function getUserDriverIds(supabase: Awaited<ReturnType<typeof requireAuth>>["supabase"], companyId: string, userId: string) {
  const { data, error } = await supabase
    .from("drivers")
    .select("id")
    .eq("company_id", companyId)
    .eq("auth_user_id", userId);

  if (error || !data) {
    return [];
  }

  return data.map((driver) => driver.id);
}

export async function GET(request: Request) {
  const { supabase, user } = await requireAuth();
  if (!user) return fail("Unauthorized", 401);

  const queryParsed = companyQuerySchema.safeParse(
    searchParamsToObject(new URL(request.url).searchParams)
  );
  if (!queryParsed.success) return fail("Invalid query", 400, queryParsed.error.flatten());

  const role = await getCompanyRole(supabase, user.id, queryParsed.data.companyId);
  if (!role || !canViewTrips(role)) return fail("Forbidden", 403);

  let query = supabase
    .from("trips")
    .select("*")
    .eq("company_id", queryParsed.data.companyId)
    .order("created_at", { ascending: false })
    .limit(queryParsed.data.limit ?? 50);

  if (isDriverScopedRole(role)) {
    const driverIds = await getUserDriverIds(supabase, queryParsed.data.companyId, user.id);
    if (driverIds.length === 0) return ok([]);
    query = query.in("driver_id", driverIds);
  }

  const { data, error } = await query;

  if (error) return fail(error.message, 500, error);
  return ok(data);
}

export async function POST(request: Request) {
  const { supabase, user } = await requireAuth();
  if (!user) return fail("Unauthorized", 401);

  const parsed = await parseJsonBody(request, tripCreateSchema);
  if (!parsed.success) return fail("Invalid payload", 400, parsed.error.flatten());

  const role = await getCompanyRole(supabase, user.id, parsed.data.companyId);
  if (!role || !canCreateTrips(role)) return fail("Forbidden", 403);

  const { data, error } = await supabase
    .from("trips")
    .insert({
      company_id: parsed.data.companyId,
      driver_id: parsed.data.driverId,
      vehicle_id: parsed.data.vehicleId,
      status: parsed.data.status ?? "planned",
      origin: parsed.data.origin ?? null,
      destination: parsed.data.destination ?? null,
      started_at: parsed.data.startedAt ?? null,
      ended_at: parsed.data.endedAt ?? null,
      route_miles: parsed.data.routeMiles ?? null,
      actual_miles: parsed.data.actualMiles ?? null,
      compliance_notes: parsed.data.complianceNotes ?? null,
      created_by: user.id,
    })
    .select("*")
    .single();

  if (error) return fail(error.message, 500, error);
  return ok(data, 201);
}