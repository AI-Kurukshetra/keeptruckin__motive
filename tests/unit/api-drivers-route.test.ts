import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireAuth = vi.fn();
const mockHasCompanyAccess = vi.fn();

vi.mock("@/lib/api/auth", () => ({
  requireAuth: mockRequireAuth,
  hasCompanyAccess: mockHasCompanyAccess,
}));

describe("drivers route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is missing", async () => {
    mockRequireAuth.mockResolvedValue({
      supabase: {},
      user: null,
    });

    const { GET } = await import("@/app/api/drivers/route");
    const response = await GET(
      new Request("http://localhost/api/drivers?companyId=6b2be5a3-a8db-4793-a8a7-4e5ff20f8d4c")
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error.message).toBe("Unauthorized");
  });

  it("returns 400 for invalid post payload", async () => {
    mockRequireAuth.mockResolvedValue({
      supabase: {},
      user: { id: "ec44fbe1-f267-419f-8f8f-c5d8e2a31f8f" },
    });
    mockHasCompanyAccess.mockResolvedValue(true);

    const { POST } = await import("@/app/api/drivers/route");
    const response = await POST(
      new Request("http://localhost/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: "not-a-uuid" }),
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.message).toBe("Invalid payload");
  });
});
