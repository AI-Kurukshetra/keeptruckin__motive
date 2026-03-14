import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api/fetcher";

describe("apiFetch", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns data on successful response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: { id: "1", name: "ok" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const data = await apiFetch<{ id: string; name: string }>("/api/example");

    expect(data).toEqual({ id: "1", name: "ok" });
  });

  it("throws payload error message on failed response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "Forbidden" } }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(apiFetch("/api/example")).rejects.toThrow("Forbidden");
  });

  it("throws fallback message when response body is not json", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("plain error", {
        status: 500,
      })
    );

    await expect(apiFetch("/api/example")).rejects.toThrow("Request failed");
  });
});
