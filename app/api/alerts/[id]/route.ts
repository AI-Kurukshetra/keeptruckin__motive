import { z } from "zod";
import { fail, ok } from "@/lib/api/responses";
import { requireAuth, hasCompanyAccess } from "@/lib/api/auth";
import { parseJsonBody, searchParamsToObject } from "@/lib/api/request";
import { alertUpdateSchema, companyQuerySchema } from "@/lib/validations/api";

const paramsSchema = z.object({ id: z.string().uuid() });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await requireAuth();
  if (!user) return fail("Unauthorized", 401);

  const routeParams = await params;
  const parsedParams = paramsSchema.safeParse(routeParams);
  if (!parsedParams.success) return fail("Invalid alert id", 400, parsedParams.error.flatten());

  const queryParsed = companyQuerySchema.safeParse(
    searchParamsToObject(new URL(request.url).searchParams)
  );
  if (!queryParsed.success) return fail("Invalid query", 400, queryParsed.error.flatten());

  const allowed = await hasCompanyAccess(supabase, user.id, queryParsed.data.companyId, { write: true });
  if (!allowed) return fail("Forbidden", 403);

  const parsed = await parseJsonBody(request, alertUpdateSchema);
  if (!parsed.success) return fail("Invalid payload", 400, parsed.error.flatten());

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("alerts")
    .update({
      status: parsed.data.status,
      acknowledged_at: parsed.data.status === "acknowledged" ? now : undefined,
      acknowledged_by: parsed.data.status === "acknowledged" ? user.id : undefined,
      resolved_at: parsed.data.status === "resolved" ? now : undefined,
      resolved_by: parsed.data.status === "resolved" ? user.id : undefined,
    })
    .eq("id", parsedParams.data.id)
    .eq("company_id", queryParsed.data.companyId)
    .select("*")
    .single();

  if (error) return fail("Failed to update alert", 500, error.message);
  return ok(data);
}
