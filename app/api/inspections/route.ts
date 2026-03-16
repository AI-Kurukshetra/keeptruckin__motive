import { fail, ok } from "@/lib/api/responses";
import { getCompanyRole, getUserDriverIds, requireAuth } from "@/lib/api/auth";
import { canAccessOperationalModules, canViewInspections, isDriverScopedRole } from "@/lib/permissions";
import { parseJsonBody, searchParamsToObject } from "@/lib/api/request";
import { companyQuerySchema, inspectionCreateSchema } from "@/lib/validations/api";
import type { Json } from "@/types/supabase";

export async function GET(request: Request) {
  const { supabase, user } = await requireAuth();
  if (!user) return fail("Unauthorized", 401);

  const queryParsed = companyQuerySchema.safeParse(
    searchParamsToObject(new URL(request.url).searchParams)
  );
  if (!queryParsed.success) return fail("Invalid query", 400, queryParsed.error.flatten());

  const role = await getCompanyRole(supabase, user.id, queryParsed.data.companyId);
  if (!role || !canViewInspections(role)) return fail("Forbidden", 403);

  let query = supabase
    .from("inspections")
    .select("*")
    .eq("company_id", queryParsed.data.companyId)
    .order("inspected_at", { ascending: false })
    .limit(queryParsed.data.limit ?? 100);

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

  const parsed = await parseJsonBody(request, inspectionCreateSchema);
  if (!parsed.success) return fail("Invalid payload", 400, parsed.error.flatten());

  const role = await getCompanyRole(supabase, user.id, parsed.data.companyId);
  if (!role || !canAccessOperationalModules(role)) return fail("Forbidden", 403);

  const defects = (parsed.data.defects ?? []) as Json;

  const { data, error } = await supabase
    .from("inspections")
    .insert({
      company_id: parsed.data.companyId,
      driver_id: parsed.data.driverId,
      vehicle_id: parsed.data.vehicleId,
      inspection_type: parsed.data.inspectionType,
      status: parsed.data.status,
      defects,
      notes: parsed.data.notes ?? null,
      inspected_at: parsed.data.inspectedAt,
      resolved_at: parsed.data.resolvedAt ?? null,
    })
    .select("*")
    .single();

  if (error) return fail(error.message, 500, error);
  return ok(data, 201);
}
