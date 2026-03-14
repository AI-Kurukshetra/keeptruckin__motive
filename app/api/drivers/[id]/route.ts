import { z } from "zod";
import { fail, ok } from "@/lib/api/responses";
import { requireAuth, hasCompanyAccess } from "@/lib/api/auth";
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

  const allowed = await hasCompanyAccess(supabase, user.id, queryParsed.data.companyId);
  if (!allowed) return fail("Forbidden", 403);

  const { data, error } = await supabase
    .from("drivers")
    .select("*")
    .eq("id", parsedParams.data.id)
    .eq("company_id", queryParsed.data.companyId)
    .single();

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

  const allowed = await hasCompanyAccess(supabase, user.id, queryParsed.data.companyId, { write: true });
  if (!allowed) return fail("Forbidden", 403);

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

  if (error) return fail("Failed to update driver", 500, error.message);
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

  const allowed = await hasCompanyAccess(supabase, user.id, queryParsed.data.companyId, { write: true });
  if (!allowed) return fail("Forbidden", 403);

  const { error } = await supabase
    .from("drivers")
    .delete()
    .eq("id", parsedParams.data.id)
    .eq("company_id", queryParsed.data.companyId);

  if (error) return fail("Failed to delete driver", 500, error.message);
  return ok({ id: parsedParams.data.id, deleted: true });
}
