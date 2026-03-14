import { describe, expect, it } from "vitest";
import {
  createCompanySchema,
  inviteMemberSchema,
  loginSchema,
  registerSchema,
} from "@/lib/validations";

describe("auth and onboarding validations", () => {
  it("accepts valid login payload", () => {
    const parsed = loginSchema.safeParse({
      email: "fleet@example.com",
      password: "secret123",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid login payload", () => {
    const parsed = loginSchema.safeParse({
      email: "not-an-email",
      password: "",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects register payload with mismatched passwords", () => {
    const parsed = registerSchema.safeParse({
      email: "fleet@example.com",
      password: "secret123",
      confirmPassword: "secret124",
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts valid company creation payload", () => {
    const parsed = createCompanySchema.safeParse({
      name: "Motive Fleet",
      dotNumber: "DOT-100",
      fleetSize: 25,
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid member invite role", () => {
    const parsed = inviteMemberSchema.safeParse({
      companyId: "6b2be5a3-a8db-4793-a8a7-4e5ff20f8d4c",
      email: "driver@example.com",
      role: "owner",
    });

    expect(parsed.success).toBe(false);
  });
});
