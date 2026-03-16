import { fail, ok } from "@/lib/api/responses";
import { getCompanyRole, getUserDriverIds, requireAuth } from "@/lib/api/auth";
import { canViewSafety, isDriverScopedRole } from "@/lib/permissions";
import { searchParamsToObject } from "@/lib/api/request";
import { companyQuerySchema } from "@/lib/validations/api";

export async function GET(request: Request) {
  const { supabase, user } = await requireAuth();
  if (!user) return fail("Unauthorized", 401);

  const queryParsed = companyQuerySchema.safeParse(
    searchParamsToObject(new URL(request.url).searchParams)
  );
  if (!queryParsed.success) return fail("Invalid query", 400, queryParsed.error.flatten());

  const role = await getCompanyRole(supabase, user.id, queryParsed.data.companyId);
  if (!role || !canViewSafety(role)) return fail("Forbidden", 403);

  let query = supabase
    .from("safety_events")
    .select("severity, score_impact")
    .eq("company_id", queryParsed.data.companyId)
    .limit(queryParsed.data.limit ?? 500);

  if (isDriverScopedRole(role)) {
    const driverIds = await getUserDriverIds(supabase, queryParsed.data.companyId, user.id);
    if (driverIds.length === 0) {
      return ok({
        totalEvents: 0,
        totalScoreImpact: 0,
        averageSeverity: 0,
        safetyScore: 100,
      });
    }

    query = query.in("driver_id", driverIds);
  }

  const { data, error } = await query;

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
