import { z } from "zod";

const uuidSchema = z.string().uuid();
const isoDatetimeSchema = z.string().datetime({ offset: true });
const isoDateSchema = z.string().date();

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export const companyQuerySchema = z.object({
  companyId: uuidSchema,
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export const driverCreateSchema = z.object({
  companyId: uuidSchema,
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  licenseNumber: z.string().min(1),
  employeeCode: z.string().optional(),
  phone: z.string().optional(),
  licenseState: z.string().optional(),
  licenseExpiry: isoDateSchema.optional(),
  hiredOn: isoDateSchema.optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
});

export const driverUpdateSchema = driverCreateSchema
  .omit({ companyId: true, firstName: true, lastName: true, licenseNumber: true })
  .extend({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    licenseNumber: z.string().min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "No fields provided for update");

export const vehicleCreateSchema = z.object({
  companyId: uuidSchema,
  vin: z.string().min(1),
  unitNumber: z.string().min(1),
  licensePlate: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  modelYear: z.coerce.number().int().min(1900).max(3000).optional(),
  odometerMiles: z.coerce.number().min(0).optional(),
  eldDeviceId: z.string().optional(),
  status: z.enum(["active", "inactive", "maintenance"]).optional(),
});

export const vehicleUpdateSchema = vehicleCreateSchema
  .omit({ companyId: true, vin: true, unitNumber: true })
  .extend({
    vin: z.string().min(1).optional(),
    unitNumber: z.string().min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "No fields provided for update");

export const tripCreateSchema = z.object({
  companyId: uuidSchema,
  driverId: uuidSchema,
  vehicleId: uuidSchema,
  status: z.enum(["planned", "in_progress", "completed", "cancelled"]).optional(),
  origin: z.string().optional(),
  destination: z.string().optional(),
  startedAt: isoDatetimeSchema.optional(),
  endedAt: isoDatetimeSchema.optional(),
  routeMiles: z.coerce.number().min(0).optional(),
  actualMiles: z.coerce.number().min(0).optional(),
  complianceNotes: z.string().optional(),
});

export const tripUpdateSchema = tripCreateSchema
  .omit({ companyId: true, driverId: true, vehicleId: true })
  .extend({
    driverId: uuidSchema.optional(),
    vehicleId: uuidSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "No fields provided for update");

export const eldCreateSchema = z.object({
  companyId: uuidSchema,
  driverId: uuidSchema,
  vehicleId: uuidSchema.optional().nullable(),
  logDate: isoDateSchema,
  dutyStatus: z.enum(["off_duty", "sleeper_berth", "on_duty", "driving"]),
  startTime: isoDatetimeSchema,
  endTime: isoDatetimeSchema.optional().nullable(),
  locationLat: z.coerce.number().min(-90).max(90).optional().nullable(),
  locationLng: z.coerce.number().min(-180).max(180).optional().nullable(),
  engineHours: z.coerce.number().min(0).optional().nullable(),
  odometerMiles: z.coerce.number().min(0).optional().nullable(),
  remarks: z.string().optional(),
  source: z.enum(["mobile_app", "eld_device", "api_import", "manual"]).optional(),
});

export const inspectionCreateSchema = z.object({
  companyId: uuidSchema,
  driverId: uuidSchema,
  vehicleId: uuidSchema,
  inspectionType: z.enum(["pre_trip", "post_trip"]),
  status: z.enum(["passed", "failed", "resolved"]),
  defects: z.array(z.unknown()).optional(),
  notes: z.string().optional(),
  inspectedAt: isoDatetimeSchema.optional(),
  resolvedAt: isoDatetimeSchema.optional().nullable(),
});

export const inspectionUpdateSchema = z
  .object({
    status: z.enum(["passed", "failed", "resolved"]).optional(),
    defects: z.array(z.unknown()).optional(),
    notes: z.string().optional(),
    resolvedAt: isoDatetimeSchema.optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, "No fields provided for update");

export const maintenanceCreateSchema = z.object({
  companyId: uuidSchema,
  vehicleId: uuidSchema,
  maintenanceType: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["scheduled", "completed", "overdue", "cancelled"]).optional(),
  dueAt: isoDateSchema.optional(),
  completedAt: isoDateSchema.optional().nullable(),
  odometerMilesAtService: z.coerce.number().min(0).optional().nullable(),
  estimatedCost: z.coerce.number().min(0).optional().nullable(),
  actualCost: z.coerce.number().min(0).optional().nullable(),
});

export const maintenanceUpdateSchema = z
  .object({
    maintenanceType: z.string().min(1).optional(),
    description: z.string().optional(),
    status: z.enum(["scheduled", "completed", "overdue", "cancelled"]).optional(),
    dueAt: isoDateSchema.optional(),
    completedAt: isoDateSchema.optional().nullable(),
    odometerMilesAtService: z.coerce.number().min(0).optional().nullable(),
    estimatedCost: z.coerce.number().min(0).optional().nullable(),
    actualCost: z.coerce.number().min(0).optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, "No fields provided for update");

export const safetyCreateSchema = z.object({
  companyId: uuidSchema,
  driverId: uuidSchema.optional().nullable(),
  vehicleId: uuidSchema.optional().nullable(),
  eventType: z.enum([
    "speeding",
    "harsh_braking",
    "rapid_acceleration",
    "hard_cornering",
    "idling",
    "collision_risk",
    "phone_usage",
    "other",
  ]),
  severity: z.coerce.number().int().min(1).max(5),
  scoreImpact: z.coerce.number().int().optional(),
  occurredAt: isoDatetimeSchema,
  locationLat: z.coerce.number().min(-90).max(90).optional().nullable(),
  locationLng: z.coerce.number().min(-180).max(180).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const alertCreateSchema = z.object({
  companyId: uuidSchema,
  alertType: z.string().min(1),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  status: z.enum(["open", "acknowledged", "resolved"]).optional(),
  title: z.string().min(1),
  message: z.string().optional(),
  relatedEntityType: z.string().optional(),
  relatedEntityId: uuidSchema.optional().nullable(),
});

export const alertUpdateSchema = z
  .object({
    status: z.enum(["open", "acknowledged", "resolved"]),
  })
  .refine((data) => Object.keys(data).length > 0, "No fields provided for update");
