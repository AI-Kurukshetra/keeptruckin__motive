import { fail, ok } from "@/lib/api/responses";
import { requireAuth, hasCompanyAccess } from "@/lib/api/auth";
import { parseJsonBody, searchParamsToObject } from "@/lib/api/request";
import { companyQuerySchema, maintenanceCreateSchema } from "@/lib/validations/api";

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
    .from("maintenance_records")
    .select("*")
    .eq("company_id", queryParsed.data.companyId)
    .order("created_at", { ascending: false })
    .limit(queryParsed.data.limit ?? 100);

  if (error) return fail("Failed to fetch maintenance records", 500, error.message);
  return ok(data);
}

export async function POST(request: Request) {
  const { supabase, user } = await requireAuth();
  if (!user) return fail("Unauthorized", 401);

  const parsed = await parseJsonBody(request, maintenanceCreateSchema);
  if (!parsed.success) return fail("Invalid payload", 400, parsed.error.flatten());

  const allowed = await hasCompanyAccess(supabase, user.id, parsed.data.companyId, { write: true });
  if (!allowed) return fail("Forbidden", 403);

  const { data, error } = await supabase
    .from("maintenance_records")
    .insert({
      company_id: parsed.data.companyId,
      vehicle_id: parsed.data.vehicleId,
      maintenance_type: parsed.data.maintenanceType,
      description: parsed.data.description ?? null,
      status: parsed.data.status ?? "scheduled",
      due_at: parsed.data.dueAt ?? null,
      completed_at: parsed.data.completedAt ?? null,
      odometer_miles_at_service: parsed.data.odometerMilesAtService ?? null,
      estimated_cost: parsed.data.estimatedCost ?? null,
      actual_cost: parsed.data.actualCost ?? null,
      created_by: user.id,
    })
    .select("*")
    .single();

  if (error) return fail("Failed to create maintenance record", 500, error.message);
  return ok(data, 201);
}
