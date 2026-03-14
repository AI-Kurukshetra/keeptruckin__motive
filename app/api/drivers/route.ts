import { fail, ok } from "@/lib/api/responses";
import { requireAuth, hasCompanyAccess } from "@/lib/api/auth";
import { parseJsonBody, searchParamsToObject } from "@/lib/api/request";
import { companyQuerySchema, driverCreateSchema } from "@/lib/validations/api";

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
    .from("drivers")
    .select("*")
    .eq("company_id", queryParsed.data.companyId)
    .order("created_at", { ascending: false })
    .limit(queryParsed.data.limit ?? 50);

  if (error) return fail(error.message, 500, error);
  return ok(data);
}

export async function POST(request: Request) {
  const { supabase, user } = await requireAuth();
  if (!user) return fail("Unauthorized", 401);

  const parsed = await parseJsonBody(request, driverCreateSchema);
  if (!parsed.success) return fail("Invalid payload", 400, parsed.error.flatten());

  const allowed = await hasCompanyAccess(supabase, user.id, parsed.data.companyId, { write: true });
  if (!allowed) return fail("Forbidden", 403);

  const { data, error } = await supabase
    .from("drivers")
    .insert({
      company_id: parsed.data.companyId,
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      license_number: parsed.data.licenseNumber,
      employee_code: parsed.data.employeeCode ?? null,
      phone: parsed.data.phone ?? null,
      license_state: parsed.data.licenseState ?? null,
      license_expiry: parsed.data.licenseExpiry ?? null,
      hired_on: parsed.data.hiredOn ?? null,
      status: parsed.data.status ?? "active",
    })
    .select("*")
    .single();

  if (error) return fail(error.message, 500, error);
  return ok(data, 201);
}

