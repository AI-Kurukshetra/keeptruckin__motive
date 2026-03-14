import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireAuth = vi.fn();
const mockHasCompanyAccess = vi.fn();

vi.mock("@/lib/api/auth", () => ({
  requireAuth: mockRequireAuth,
  hasCompanyAccess: mockHasCompanyAccess,
}));

describe("safety routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated on safety list", async () => {
    mockRequireAuth.mockResolvedValue({ supabase: {}, user: null });

    const { GET } = await import("@/app/api/safety/route");
    const response = await GET(
      new Request("http://localhost/api/safety?companyId=6b2be5a3-a8db-4793-a8a7-4e5ff20f8d4c")
    );

    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid safety event payload", async () => {
    mockRequireAuth.mockResolvedValue({
      supabase: {},
      user: { id: "ec44fbe1-f267-419f-8f8f-c5d8e2a31f8f" },
    });
    mockHasCompanyAccess.mockResolvedValue(true);

    const { POST } = await import("@/app/api/safety/route");
    const response = await POST(
      new Request("http://localhost/api/safety", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: "bad-id" }),
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.message).toBe("Invalid payload");
  });

  it("returns 401 when unauthenticated on safety score", async () => {
    mockRequireAuth.mockResolvedValue({ supabase: {}, user: null });

    const { GET } = await import("@/app/api/safety/score/route");
    const response = await GET(
      new Request("http://localhost/api/safety/score?companyId=6b2be5a3-a8db-4793-a8a7-4e5ff20f8d4c")
    );

    expect(response.status).toBe(401);
  });
});
