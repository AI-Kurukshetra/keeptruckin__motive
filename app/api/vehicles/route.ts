import { fail, ok } from "@/lib/api/responses";
import { requireAuth, hasCompanyAccess } from "@/lib/api/auth";
import { parseJsonBody, searchParamsToObject } from "@/lib/api/request";
import { companyQuerySchema, vehicleCreateSchema } from "@/lib/validations/api";

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
    .from("vehicles")
    .select("*")
    .eq("company_id", queryParsed.data.companyId)
    .order("created_at", { ascending: false })
    .limit(queryParsed.data.limit ?? 50);

  if (error) return fail("Failed to fetch vehicles", 500, error.message);
  return ok(data);
}

export async function POST(request: Request) {
  const { supabase, user } = await requireAuth();
  if (!user) return fail("Unauthorized", 401);

  const parsed = await parseJsonBody(request, vehicleCreateSchema);
  if (!parsed.success) return fail("Invalid payload", 400, parsed.error.flatten());

  const allowed = await hasCompanyAccess(supabase, user.id, parsed.data.companyId, { write: true });
  if (!allowed) return fail("Forbidden", 403);

  const baseInsert = {
    company_id: parsed.data.companyId,
    unit_number: parsed.data.unitNumber,
    vin: parsed.data.vin,
    license_plate: parsed.data.licensePlate ?? null,
    make: parsed.data.make ?? null,
    model: parsed.data.model ?? null,
    model_year: parsed.data.modelYear ?? null,
    odometer_miles: parsed.data.odometerMiles ?? 0,
    eld_device_id: parsed.data.eldDeviceId ?? null,
    status: parsed.data.status ?? "active",
  };

  const insertWithName = {
    ...baseInsert,
    name: parsed.data.vehicleName ?? null,
  };

  const firstAttempt = await supabase.from("vehicles").insert(insertWithName).select("*").single();

  // Compatibility fallback: some environments may not yet have vehicles.name column.
  if (firstAttempt.error?.code === "42703") {
    const fallbackAttempt = await supabase.from("vehicles").insert(baseInsert).select("*").single();
    if (fallbackAttempt.error) return fail("Failed to create vehicle", 500, fallbackAttempt.error.message);
    return ok(fallbackAttempt.data, 201);
  }

  if (firstAttempt.error) return fail("Failed to create vehicle", 500, firstAttempt.error.message);
  return ok(firstAttempt.data, 201);
}
