import { describe, expect, it } from "vitest";
import { searchParamsToObject } from "@/lib/api/request";

describe("request helpers", () => {
  it("converts URLSearchParams into plain object", () => {
    const params = new URLSearchParams();
    params.set("companyId", "6b2be5a3-a8db-4793-a8a7-4e5ff20f8d4c");
    params.set("limit", "10");

    const result = searchParamsToObject(params);

    expect(result).toEqual({
      companyId: "6b2be5a3-a8db-4793-a8a7-4e5ff20f8d4c",
      limit: "10",
    });
  });
});
