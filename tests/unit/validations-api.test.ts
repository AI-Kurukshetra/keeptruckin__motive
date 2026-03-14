import { describe, expect, it } from "vitest";
import {
  alertCreateSchema,
  companyQuerySchema,
  driverCreateSchema,
  driverUpdateSchema,
  eldCreateSchema,
  safetyCreateSchema,
  tripCreateSchema,
} from "@/lib/validations/api";

describe("api validation schemas", () => {
  it("coerces query limit to a number", () => {
    const parsed = companyQuerySchema.safeParse({
      companyId: "6b2be5a3-a8db-4793-a8a7-4e5ff20f8d4c",
      limit: "25",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.limit).toBe(25);
    }
  });

  it("rejects empty driver update payload", () => {
    const parsed = driverUpdateSchema.safeParse({});

    expect(parsed.success).toBe(false);
  });

  it("accepts valid driver create payload", () => {
    const parsed = driverCreateSchema.safeParse({
      companyId: "6b2be5a3-a8db-4793-a8a7-4e5ff20f8d4c",
      firstName: "Jane",
      lastName: "Driver",
      licenseNumber: "LIC-101",
      status: "active",
    });

    expect(parsed.success).toBe(true);
  });

  it("accepts valid trip payload with ISO datetime", () => {
    const parsed = tripCreateSchema.safeParse({
      companyId: "6b2be5a3-a8db-4793-a8a7-4e5ff20f8d4c",
      driverId: "ec44fbe1-f267-419f-8f8f-c5d8e2a31f8f",
      vehicleId: "466170e2-d6e2-4589-af95-a3a8efff9cdf",
      startedAt: "2026-03-14T10:00:00+00:00",
      endedAt: "2026-03-14T12:00:00+00:00",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid ELD duty status", () => {
    const parsed = eldCreateSchema.safeParse({
      companyId: "6b2be5a3-a8db-4793-a8a7-4e5ff20f8d4c",
      driverId: "ec44fbe1-f267-419f-8f8f-c5d8e2a31f8f",
      logDate: "2026-03-14",
      dutyStatus: "resting",
      startTime: "2026-03-14T10:00:00+00:00",
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts safety event payload with metadata", () => {
    const parsed = safetyCreateSchema.safeParse({
      companyId: "6b2be5a3-a8db-4793-a8a7-4e5ff20f8d4c",
      eventType: "speeding",
      severity: 3,
      scoreImpact: 6,
      occurredAt: "2026-03-14T10:00:00+00:00",
      metadata: { source: "dashcam" },
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects alert payload with missing title", () => {
    const parsed = alertCreateSchema.safeParse({
      companyId: "6b2be5a3-a8db-4793-a8a7-4e5ff20f8d4c",
      alertType: "compliance",
      title: "",
    });

    expect(parsed.success).toBe(false);
  });
});
