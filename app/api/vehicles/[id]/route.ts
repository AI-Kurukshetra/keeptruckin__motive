import type { PostgrestError } from "@supabase/supabase-js";
import { z } from "zod";
import { fail, ok } from "@/lib/api/responses";
import { requireAuth, hasCompanyAccess } from "@/lib/api/auth";
import { parseJsonBody, searchParamsToObject } from "@/lib/api/request";
import { companyQuerySchema, vehicleUpdateSchema } from "@/lib/validations/api";

const paramsSchema = z.object({ id: z.string().uuid() });

function failWithDbError(error: PostgrestError, status = 500) {
  return fail(error.message ?? "Database error", status, {
    code: error.code ?? null,
    details: error.details ?? null,
    hint: error.hint ?? null,
  });
}

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

  if (error) return failWithDbError(error, 404);
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

  const basePayload = {
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

  const payloadWithName = {
    ...basePayload,
    name: parsed.data.vehicleName,
  };

  const firstAttempt = await supabase
    .from("vehicles")
    .update(payloadWithName)
    .eq("id", parsedParams.data.id)
    .eq("company_id", queryParsed.data.companyId)
    .select("*")
    .single();

  if (firstAttempt.error?.code === "42703") {
    const fallbackAttempt = await supabase
      .from("vehicles")
      .update(basePayload)
      .eq("id", parsedParams.data.id)
      .eq("company_id", queryParsed.data.companyId)
      .select("*")
      .single();

    if (fallbackAttempt.error) return failWithDbError(fallbackAttempt.error);
    return ok(fallbackAttempt.data);
  }

  if (firstAttempt.error) return failWithDbError(firstAttempt.error);
  return ok(firstAttempt.data);
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

  if (error) return failWithDbError(error);
  return ok({ id: parsedParams.data.id, deleted: true });
}
