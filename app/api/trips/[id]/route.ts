import { z } from "zod";
import { fail, ok } from "@/lib/api/responses";
import { getCompanyRole, requireAuth } from "@/lib/api/auth";
import { canDeleteTrips, canEditTrips, canViewTrips, isDriverScopedRole } from "@/lib/permissions";
import { parseJsonBody, searchParamsToObject } from "@/lib/api/request";
import { companyQuerySchema, tripUpdateSchema } from "@/lib/validations/api";

const paramsSchema = z.object({ id: z.string().uuid() });

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await requireAuth();
  if (!user) return fail("Unauthorized", 401);

  const routeParams = await params;
  const parsedParams = paramsSchema.safeParse(routeParams);
  if (!parsedParams.success) return fail("Invalid trip id", 400, parsedParams.error.flatten());

  const queryParsed = companyQuerySchema.safeParse(
    searchParamsToObject(new URL(request.url).searchParams)
  );
  if (!queryParsed.success) return fail("Invalid query", 400, queryParsed.error.flatten());

  const role = await getCompanyRole(supabase, user.id, queryParsed.data.companyId);
  if (!role || !canViewTrips(role)) return fail("Forbidden", 403);

  let query = supabase
    .from("trips")
    .select("*")
    .eq("id", parsedParams.data.id)
    .eq("company_id", queryParsed.data.companyId);

  if (isDriverScopedRole(role)) {
    const driverIds = await getUserDriverIds(supabase, queryParsed.data.companyId, user.id);
    if (driverIds.length === 0) return fail("Trip not found", 404);
    query = query.in("driver_id", driverIds);
  }

  const { data, error } = await query.single();

  if (error) return fail("Trip not found", 404, error.message);
  return ok(data);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await requireAuth();
  if (!user) return fail("Unauthorized", 401);

  const routeParams = await params;
  const parsedParams = paramsSchema.safeParse(routeParams);
  if (!parsedParams.success) return fail("Invalid trip id", 400, parsedParams.error.flatten());

  const queryParsed = companyQuerySchema.safeParse(
    searchParamsToObject(new URL(request.url).searchParams)
  );
  if (!queryParsed.success) return fail("Invalid query", 400, queryParsed.error.flatten());

  const role = await getCompanyRole(supabase, user.id, queryParsed.data.companyId);
  if (!role || !canEditTrips(role)) return fail("Forbidden", 403);

  const parsed = await parseJsonBody(request, tripUpdateSchema);
  if (!parsed.success) return fail("Invalid payload", 400, parsed.error.flatten());

  const payload = {
    driver_id: parsed.data.driverId,
    vehicle_id: parsed.data.vehicleId,
    status: parsed.data.status,
    origin: parsed.data.origin,
    destination: parsed.data.destination,
    started_at: parsed.data.startedAt,
    ended_at: parsed.data.endedAt,
    route_miles: parsed.data.routeMiles,
    actual_miles: parsed.data.actualMiles,
    compliance_notes: parsed.data.complianceNotes,
  };

  const { data, error } = await supabase
    .from("trips")
    .update(payload)
    .eq("id", parsedParams.data.id)
    .eq("company_id", queryParsed.data.companyId)
    .select("*")
    .single();

  if (error) return fail(error.message, 500, error);
  return ok(data);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await requireAuth();
  if (!user) return fail("Unauthorized", 401);

  const routeParams = await params;
  const parsedParams = paramsSchema.safeParse(routeParams);
  if (!parsedParams.success) return fail("Invalid trip id", 400, parsedParams.error.flatten());

  const queryParsed = companyQuerySchema.safeParse(
    searchParamsToObject(new URL(request.url).searchParams)
  );
  if (!queryParsed.success) return fail("Invalid query", 400, queryParsed.error.flatten());

  const role = await getCompanyRole(supabase, user.id, queryParsed.data.companyId);
  if (!role || !canDeleteTrips(role)) return fail("Forbidden", 403);

  const { error } = await supabase
    .from("trips")
    .delete()
    .eq("id", parsedParams.data.id)
    .eq("company_id", queryParsed.data.companyId);

  if (error) return fail(error.message, 500, error);
  return ok({ id: parsedParams.data.id, deleted: true });
}