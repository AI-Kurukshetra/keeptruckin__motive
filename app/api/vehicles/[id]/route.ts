import { z } from "zod";
import { fail, ok } from "@/lib/api/responses";
import { requireAuth, hasCompanyAccess } from "@/lib/api/auth";
import { parseJsonBody, searchParamsToObject } from "@/lib/api/request";
import { companyQuerySchema, vehicleUpdateSchema } from "@/lib/validations/api";

const paramsSchema = z.object({ id: z.string().uuid() });

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await requireAuth();
  if (!user) return fail("Unauthorized", 401);

  const routeParams = await params;
  const parsedParams = paramsSchema.safeParse(routeParams);
  if (!parsedParams.success) return fail("Invalid vehicle id", 400, parsedParams.error.flatten());

  const queryParsed = companyQuerySchema.safeParse(
    searchParamsToObject(new URL(request.url).searchParams)
  );
  if (!queryParsed.success) return fail("Invalid query", 400, queryParsed.error.flatten());

  const allowed = await hasCompanyAccess(supabase, user.id, queryParsed.data.companyId);
  if (!allowed) return fail("Forbidden", 403);

  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", parsedParams.data.id)
    .eq("company_id", queryParsed.data.companyId)
    .single();

  if (error) return fail("Vehicle not found", 404, error.message);
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
  if (!parsedParams.success) return fail("Invalid vehicle id", 400, parsedParams.error.flatten());

  const queryParsed = companyQuerySchema.safeParse(
    searchParamsToObject(new URL(request.url).searchParams)
  );
  if (!queryParsed.success) return fail("Invalid query", 400, queryParsed.error.flatten());

  const allowed = await hasCompanyAccess(supabase, user.id, queryParsed.data.companyId, { write: true });
  if (!allowed) return fail("Forbidden", 403);

  const parsed = await parseJsonBody(request, vehicleUpdateSchema);
  if (!parsed.success) return fail("Invalid payload", 400, parsed.error.flatten());

  const payload = {
    vin: parsed.data.vin,
    unit_number: parsed.data.unitNumber,
    license_plate: parsed.data.licensePlate,
    make: parsed.data.make,
    model: parsed.data.model,
    model_year: parsed.data.modelYear,
    odometer_miles: parsed.data.odometerMiles,
    eld_device_id: parsed.data.eldDeviceId,
    status: parsed.data.status,
  };

  const { data, error } = await supabase
    .from("vehicles")
    .update(payload)
    .eq("id", parsedParams.data.id)
    .eq("company_id", queryParsed.data.companyId)
    .select("*")
    .single();

  if (error) return fail("Failed to update vehicle", 500, error.message);
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
  if (!parsedParams.success) return fail("Invalid vehicle id", 400, parsedParams.error.flatten());

  const queryParsed = companyQuerySchema.safeParse(
    searchParamsToObject(new URL(request.url).searchParams)
  );
  if (!queryParsed.success) return fail("Invalid query", 400, queryParsed.error.flatten());

  const allowed = await hasCompanyAccess(supabase, user.id, queryParsed.data.companyId, { write: true });
  if (!allowed) return fail("Forbidden", 403);

  const { error } = await supabase
    .from("vehicles")
    .delete()
    .eq("id", parsedParams.data.id)
    .eq("company_id", queryParsed.data.companyId);

  if (error) return fail("Failed to delete vehicle", 500, error.message);
  return ok({ id: parsedParams.data.id, deleted: true });
}
