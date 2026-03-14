import { fail, ok } from "@/lib/api/responses";
import { requireAuth, hasCompanyAccess } from "@/lib/api/auth";
import { parseJsonBody, searchParamsToObject } from "@/lib/api/request";
import { companyQuerySchema, tripCreateSchema } from "@/lib/validations/api";

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
    .from("trips")
    .select("*")
    .eq("company_id", queryParsed.data.companyId)
    .order("created_at", { ascending: false })
    .limit(queryParsed.data.limit ?? 50);

  if (error) return fail("Failed to fetch trips", 500, error.message);
  return ok(data);
}

export async function POST(request: Request) {
  const { supabase, user } = await requireAuth();
  if (!user) return fail("Unauthorized", 401);

  const parsed = await parseJsonBody(request, tripCreateSchema);
  if (!parsed.success) return fail("Invalid payload", 400, parsed.error.flatten());

  const allowed = await hasCompanyAccess(supabase, user.id, parsed.data.companyId, { write: true });
  if (!allowed) return fail("Forbidden", 403);

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

  if (error) return fail("Failed to create trip", 500, error.message);
  return ok(data, 201);
}
