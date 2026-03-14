import { fail, ok } from "@/lib/api/responses";
import { requireAuth, hasCompanyAccess } from "@/lib/api/auth";
import { parseJsonBody, searchParamsToObject } from "@/lib/api/request";
import { companyQuerySchema, safetyCreateSchema } from "@/lib/validations/api";
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
    .from("safety_events")
    .select("*")
    .eq("company_id", queryParsed.data.companyId)
    .order("occurred_at", { ascending: false })
    .limit(queryParsed.data.limit ?? 100);

  if (error) return fail(error.message, 500, error);
  return ok(data);
}

export async function POST(request: Request) {
  const { supabase, user } = await requireAuth();
  if (!user) return fail("Unauthorized", 401);

  const parsed = await parseJsonBody(request, safetyCreateSchema);
  if (!parsed.success) return fail("Invalid payload", 400, parsed.error.flatten());

  const allowed = await hasCompanyAccess(supabase, user.id, parsed.data.companyId, { write: true });
  if (!allowed) return fail("Forbidden", 403);

  const metadata = (parsed.data.metadata ?? {}) as Json;

  const { data, error } = await supabase
    .from("safety_events")
    .insert({
      company_id: parsed.data.companyId,
      driver_id: parsed.data.driverId ?? null,
      vehicle_id: parsed.data.vehicleId ?? null,
      event_type: parsed.data.eventType,
      severity: parsed.data.severity,
      score_impact: parsed.data.scoreImpact ?? 0,
      occurred_at: parsed.data.occurredAt,
      location_lat: parsed.data.locationLat ?? null,
      location_lng: parsed.data.locationLng ?? null,
      metadata,
    })
    .select("*")
    .single();

  if (error) return fail(error.message, 500, error);
  return ok(data, 201);
}

