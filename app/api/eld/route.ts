import { fail, ok } from "@/lib/api/responses";
import { requireAuth, hasCompanyAccess } from "@/lib/api/auth";
import { parseJsonBody, searchParamsToObject } from "@/lib/api/request";
import { companyQuerySchema, eldCreateSchema } from "@/lib/validations/api";

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
    .from("eld_logs")
    .select("*")
    .eq("company_id", queryParsed.data.companyId)
    .order("start_time", { ascending: false })
    .limit(queryParsed.data.limit ?? 100);

  if (error) return fail(error.message, 500, error);
  return ok(data);
}

export async function POST(request: Request) {
  const { supabase, user } = await requireAuth();
  if (!user) return fail("Unauthorized", 401);

  const parsed = await parseJsonBody(request, eldCreateSchema);
  if (!parsed.success) return fail("Invalid payload", 400, parsed.error.flatten());

  const allowed = await hasCompanyAccess(supabase, user.id, parsed.data.companyId, { write: true });
  if (!allowed) return fail("Forbidden", 403);

  const { data, error } = await supabase
    .from("eld_logs")
    .insert({
      company_id: parsed.data.companyId,
      driver_id: parsed.data.driverId,
      vehicle_id: parsed.data.vehicleId ?? null,
      log_date: parsed.data.logDate,
      duty_status: parsed.data.dutyStatus,
      start_time: parsed.data.startTime,
      end_time: parsed.data.endTime ?? null,
      location_lat: parsed.data.locationLat ?? null,
      location_lng: parsed.data.locationLng ?? null,
      engine_hours: parsed.data.engineHours ?? null,
      odometer_miles: parsed.data.odometerMiles ?? null,
      remarks: parsed.data.remarks ?? null,
      source: parsed.data.source ?? "api_import",
    })
    .select("*")
    .single();

  if (error) return fail(error.message, 500, error);
  return ok(data, 201);
}

