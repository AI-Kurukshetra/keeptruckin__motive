import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireAuth = vi.fn();
const mockHasCompanyAccess = vi.fn();

vi.mock("@/lib/api/auth", () => ({
  requireAuth: mockRequireAuth,
  hasCompanyAccess: mockHasCompanyAccess,
}));

describe("item routes unauthorized and validation coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("drivers/[id] PATCH returns 400 for invalid id", async () => {
    mockRequireAuth.mockResolvedValue({ supabase: {}, user: { id: "u1" } });

    const { PATCH } = await import("@/app/api/drivers/[id]/route");
    const response = await PATCH(
      new Request("http://localhost/api/drivers/bad?companyId=6b2be5a3-a8db-4793-a8a7-4e5ff20f8d4c", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      }),
      { params: Promise.resolve({ id: "bad" }) }
    );

    expect(response.status).toBe(400);
  });

  it("alerts/[id] PATCH returns 401 when user missing", async () => {
    mockRequireAuth.mockResolvedValue({ supabase: {}, user: null });

    const { PATCH } = await import("@/app/api/alerts/[id]/route");
    const response = await PATCH(
      new Request("http://localhost/api/alerts/11111111-1111-1111-1111-111111111111?companyId=6b2be5a3-a8db-4793-a8a7-4e5ff20f8d4c", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      }),
      { params: Promise.resolve({ id: "11111111-1111-1111-1111-111111111111" }) }
    );

    expect(response.status).toBe(401);
  });

  it("maintenance/[id] PATCH returns 403 when access denied", async () => {
    mockRequireAuth.mockResolvedValue({
      supabase: {},
      user: { id: "ec44fbe1-f267-419f-8f8f-c5d8e2a31f8f" },
    });
    mockHasCompanyAccess.mockResolvedValue(false);

    const { PATCH } = await import("@/app/api/maintenance/[id]/route");
    const response = await PATCH(
      new Request("http://localhost/api/maintenance/11111111-1111-1111-1111-111111111111?companyId=6b2be5a3-a8db-4793-a8a7-4e5ff20f8d4c", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      }),
      { params: Promise.resolve({ id: "11111111-1111-1111-1111-111111111111" }) }
    );

    expect(response.status).toBe(403);
  });

  it("inspections/[id] PATCH returns 400 on empty payload", async () => {
    mockRequireAuth.mockResolvedValue({
      supabase: {},
      user: { id: "ec44fbe1-f267-419f-8f8f-c5d8e2a31f8f" },
    });
    mockHasCompanyAccess.mockResolvedValue(true);

    const { PATCH } = await import("@/app/api/inspections/[id]/route");
    const response = await PATCH(
      new Request("http://localhost/api/inspections/11111111-1111-1111-1111-111111111111?companyId=6b2be5a3-a8db-4793-a8a7-4e5ff20f8d4c", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ id: "11111111-1111-1111-1111-111111111111" }) }
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.message).toBe("Invalid payload");
  });
});
