import { fail, ok } from "@/lib/api/responses";
import { requireAuth, hasCompanyAccess } from "@/lib/api/auth";
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

  const allowed = await hasCompanyAccess(supabase, user.id, queryParsed.data.companyId);
  if (!allowed) return fail("Forbidden", 403);

  const { data, error } = await supabase
    .from("inspections")
    .select("*")
    .eq("company_id", queryParsed.data.companyId)
    .order("inspected_at", { ascending: false })
    .limit(queryParsed.data.limit ?? 100);

  if (error) return fail("Failed to fetch inspections", 500, error.message);
  return ok(data);
}

export async function POST(request: Request) {
  const { supabase, user } = await requireAuth();
  if (!user) return fail("Unauthorized", 401);

  const parsed = await parseJsonBody(request, inspectionCreateSchema);
  if (!parsed.success) return fail("Invalid payload", 400, parsed.error.flatten());

  const allowed = await hasCompanyAccess(supabase, user.id, parsed.data.companyId, { write: true });
  if (!allowed) return fail("Forbidden", 403);

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

  if (error) return fail("Failed to create inspection", 500, error.message);
  return ok(data, 201);
}
