import { z } from "zod";
import { fail, ok } from "@/lib/api/responses";
import { getCompanyRole, requireAuth } from "@/lib/api/auth";
import { canDeleteDrivers, canEditDrivers, canViewDrivers, isDriverScopedRole } from "@/lib/permissions";
import { parseJsonBody, searchParamsToObject } from "@/lib/api/request";
import { companyQuerySchema, driverUpdateSchema } from "@/lib/validations/api";

const paramsSchema = z.object({ id: z.string().uuid() });

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await requireAuth();
  if (!user) return fail("Unauthorized", 401);

  const routeParams = await params;
  const parsedParams = paramsSchema.safeParse(routeParams);
  if (!parsedParams.success) return fail("Invalid driver id", 400, parsedParams.error.flatten());

  const queryParsed = companyQuerySchema.safeParse(
    searchParamsToObject(new URL(request.url).searchParams)
  );
  if (!queryParsed.success) return fail("Invalid query", 400, queryParsed.error.flatten());

  const role = await getCompanyRole(supabase, user.id, queryParsed.data.companyId);
  if (!role || !canViewDrivers(role)) return fail("Forbidden", 403);

  let query = supabase
    .from("drivers")
    .select("*")
    .eq("id", parsedParams.data.id)
    .eq("company_id", queryParsed.data.companyId);

  if (isDriverScopedRole(role)) {
    query = query.eq("auth_user_id", user.id);
  }

  const { data, error } = await query.single();

  if (error) return fail("Driver not found", 404, error.message);
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
  if (!parsedParams.success) return fail("Invalid driver id", 400, parsedParams.error.flatten());

  const queryParsed = companyQuerySchema.safeParse(
    searchParamsToObject(new URL(request.url).searchParams)
  );
  if (!queryParsed.success) return fail("Invalid query", 400, queryParsed.error.flatten());

  const role = await getCompanyRole(supabase, user.id, queryParsed.data.companyId);
  if (!role || !canEditDrivers(role)) return fail("Forbidden", 403);

  const parsed = await parseJsonBody(request, driverUpdateSchema);
  if (!parsed.success) return fail("Invalid payload", 400, parsed.error.flatten());

  const payload = {
    first_name: parsed.data.firstName,
    last_name: parsed.data.lastName,
    license_number: parsed.data.licenseNumber,
    employee_code: parsed.data.employeeCode,
    phone: parsed.data.phone,
    license_state: parsed.data.licenseState,
    license_expiry: parsed.data.licenseExpiry,
    hired_on: parsed.data.hiredOn,
    status: parsed.data.status,
  };

  const { data, error } = await supabase
    .from("drivers")
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
  if (!parsedParams.success) return fail("Invalid driver id", 400, parsedParams.error.flatten());

  const queryParsed = companyQuerySchema.safeParse(
    searchParamsToObject(new URL(request.url).searchParams)
  );
  if (!queryParsed.success) return fail("Invalid query", 400, queryParsed.error.flatten());

  const role = await getCompanyRole(supabase, user.id, queryParsed.data.companyId);
  if (!role || !canDeleteDrivers(role)) return fail("Forbidden", 403);

  const { data: referencedTrip, error: tripRefError } = await supabase
    .from("trips")
    .select("id")
    .eq("company_id", queryParsed.data.companyId)
    .eq("driver_id", parsedParams.data.id)
    .limit(1)
    .maybeSingle();

  if (tripRefError) return fail(tripRefError.message, 500, tripRefError);

  if (referencedTrip) {
    return fail(
      "Driver cannot be deleted because it is assigned to existing trips. Deactivate the driver instead.",
      409,
      { code: "HAS_REFERENCED_TRIPS" }
    );
  }

  const { error } = await supabase
    .from("drivers")
    .delete()
    .eq("id", parsedParams.data.id)
    .eq("company_id", queryParsed.data.companyId);

  if (error) return fail("Failed to delete driver", 500, error);
  return ok({ id: parsedParams.data.id, deleted: true });
}
