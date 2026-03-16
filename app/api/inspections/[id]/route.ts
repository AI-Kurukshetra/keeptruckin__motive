import { z } from "zod";
import { fail, ok } from "@/lib/api/responses";
import { getCompanyRole, requireAuth } from "@/lib/api/auth";
import { canAccessOperationalModules } from "@/lib/permissions";
import { parseJsonBody, searchParamsToObject } from "@/lib/api/request";
import { companyQuerySchema, inspectionUpdateSchema } from "@/lib/validations/api";
import type { Json } from "@/types/supabase";

const paramsSchema = z.object({ id: z.string().uuid() });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await requireAuth();
  if (!user) return fail("Unauthorized", 401);

  const routeParams = await params;
  const parsedParams = paramsSchema.safeParse(routeParams);
  if (!parsedParams.success) return fail("Invalid inspection id", 400, parsedParams.error.flatten());

  const queryParsed = companyQuerySchema.safeParse(
    searchParamsToObject(new URL(request.url).searchParams)
  );
  if (!queryParsed.success) return fail("Invalid query", 400, queryParsed.error.flatten());

  const role = await getCompanyRole(supabase, user.id, queryParsed.data.companyId);
  if (!role || !canAccessOperationalModules(role)) return fail("Forbidden", 403);

  const parsed = await parseJsonBody(request, inspectionUpdateSchema);
  if (!parsed.success) return fail("Invalid payload", 400, parsed.error.flatten());

  const defects = parsed.data.defects ? (parsed.data.defects as Json) : undefined;

  const { data, error } = await supabase
    .from("inspections")
    .update({
      status: parsed.data.status,
      defects,
      notes: parsed.data.notes,
      resolved_at: parsed.data.resolvedAt,
      resolved_by: parsed.data.status === "resolved" ? user.id : undefined,
    })
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
  if (!parsedParams.success) return fail("Invalid inspection id", 400, parsedParams.error.flatten());

  const queryParsed = companyQuerySchema.safeParse(
    searchParamsToObject(new URL(request.url).searchParams)
  );
  if (!queryParsed.success) return fail("Invalid query", 400, queryParsed.error.flatten());

  const role = await getCompanyRole(supabase, user.id, queryParsed.data.companyId);
  if (!role || !canAccessOperationalModules(role)) return fail("Forbidden", 403);

  const { error } = await supabase
    .from("inspections")
    .delete()
    .eq("id", parsedParams.data.id)
    .eq("company_id", queryParsed.data.companyId);

  if (error) return fail(error.message, 500, error);
  return ok({ id: parsedParams.data.id, deleted: true });
}
