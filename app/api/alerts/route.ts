import { fail, ok } from "@/lib/api/responses";
import { getCompanyRole, requireAuth } from "@/lib/api/auth";
import { canEditAlerts, canViewAlerts } from "@/lib/permissions";
import { parseJsonBody, searchParamsToObject } from "@/lib/api/request";
import { alertCreateSchema, companyQuerySchema } from "@/lib/validations/api";

export async function GET(request: Request) {
  const { supabase, user } = await requireAuth();
  if (!user) return fail("Unauthorized", 401);

  const queryParsed = companyQuerySchema.safeParse(
    searchParamsToObject(new URL(request.url).searchParams)
  );
  if (!queryParsed.success) return fail("Invalid query", 400, queryParsed.error.flatten());

  const role = await getCompanyRole(supabase, user.id, queryParsed.data.companyId);
  if (!role || !canViewAlerts(role)) return fail("Forbidden", 403);

  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("company_id", queryParsed.data.companyId)
    .order("triggered_at", { ascending: false })
    .limit(queryParsed.data.limit ?? 100);

  if (error) return fail("Failed to fetch alerts", 500, error.message);
  return ok(data);
}

export async function POST(request: Request) {
  const { supabase, user } = await requireAuth();
  if (!user) return fail("Unauthorized", 401);

  const parsed = await parseJsonBody(request, alertCreateSchema);
  if (!parsed.success) return fail("Invalid payload", 400, parsed.error.flatten());

  const role = await getCompanyRole(supabase, user.id, parsed.data.companyId);
  if (!role || !canEditAlerts(role)) return fail("Forbidden", 403);

  const { data, error } = await supabase
    .from("alerts")
    .insert({
      company_id: parsed.data.companyId,
      alert_type: parsed.data.alertType,
      severity: parsed.data.severity ?? "medium",
      status: parsed.data.status ?? "open",
      title: parsed.data.title,
      message: parsed.data.message ?? null,
      related_entity_type: parsed.data.relatedEntityType ?? null,
      related_entity_id: parsed.data.relatedEntityId ?? null,
    })
    .select("*")
    .single();

  if (error) return fail("Failed to create alert", 500, error.message);
  return ok(data, 201);
}