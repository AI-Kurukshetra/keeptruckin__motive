import { fail, ok } from "@/lib/api/responses";
import { requireAuth, hasCompanyAccess } from "@/lib/api/auth";
import { searchParamsToObject } from "@/lib/api/request";
import { companyQuerySchema } from "@/lib/validations/api";

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
    .from("safety_events")
    .select("severity, score_impact")
    .eq("company_id", queryParsed.data.companyId)
    .limit(queryParsed.data.limit ?? 500);

  if (error) return fail("Failed to compute safety score", 500, error.message);

  const totalEvents = data.length;
  const scoreImpact = data.reduce((acc, item) => acc + item.score_impact, 0);
  const avgSeverity = totalEvents === 0 ? 0 : data.reduce((acc, item) => acc + item.severity, 0) / totalEvents;

  return ok({
    totalEvents,
    totalScoreImpact: scoreImpact,
    averageSeverity: Number(avgSeverity.toFixed(2)),
    safetyScore: Math.max(0, 100 - scoreImpact),
  });
}
