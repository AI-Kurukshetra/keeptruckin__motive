import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../types/supabase";

type SupabaseClient = ReturnType<typeof createClient<Database>>;

const BASE_TIME = "2026-02-10T08:00:00.000Z";

const COMPANY = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Atlas Freight Logistics",
  dot_number: "DOT742991",
  fleet_size: 12,
};

const DRIVERS = [
  {
    id: "11111111-1111-4111-8111-111111111101",
    first_name: "John",
    last_name: "Carter",
    license_number: "TX-AF-30111",
    license_state: "TX",
    hired_on: "2022-02-14",
    status: "active",
    employee_code: "DRV-001",
  },
  {
    id: "11111111-1111-4111-8111-111111111102",
    first_name: "Miguel",
    last_name: "Alvarez",
    license_number: "GA-AF-30112",
    license_state: "GA",
    hired_on: "2021-11-03",
    status: "active",
    employee_code: "DRV-002",
  },
  {
    id: "11111111-1111-4111-8111-111111111103",
    first_name: "Sarah",
    last_name: "Mitchell",
    license_number: "IL-AF-30113",
    license_state: "IL",
    hired_on: "2020-08-19",
    status: "active",
    employee_code: "DRV-003",
  },
  {
    id: "11111111-1111-4111-8111-111111111104",
    first_name: "Priya",
    last_name: "Nair",
    license_number: "CA-AF-30114",
    license_state: "CA",
    hired_on: "2023-01-08",
    status: "active",
    employee_code: "DRV-004",
  },
  {
    id: "11111111-1111-4111-8111-111111111105",
    first_name: "David",
    last_name: "O'Connor",
    license_number: "CO-AF-30115",
    license_state: "CO",
    hired_on: "2019-05-27",
    status: "active",
    employee_code: "DRV-005",
  },
  {
    id: "11111111-1111-4111-8111-111111111106",
    first_name: "Chen",
    last_name: "Wei",
    license_number: "WA-AF-30116",
    license_state: "WA",
    hired_on: "2022-07-11",
    status: "active",
    employee_code: "DRV-006",
  },
  {
    id: "11111111-1111-4111-8111-111111111107",
    first_name: "Carlos",
    last_name: "Mendes",
    license_number: "TN-AF-30117",
    license_state: "TN",
    hired_on: "2021-03-22",
    status: "active",
    employee_code: "DRV-007",
  },
  {
    id: "11111111-1111-4111-8111-111111111108",
    first_name: "Ahmed",
    last_name: "Hassan",
    license_number: "MO-AF-30118",
    license_state: "MO",
    hired_on: "2020-12-01",
    status: "active",
    employee_code: "DRV-008",
  },
] as const;

const VEHICLES = [
  {
    id: "11111111-1111-4111-8111-111111111121",
    unit_number: "101",
    make: "Freightliner",
    model: "Cascadia",
    model_year: 2022,
    vin: "1FUJGLDR5NSAA1011",
    license_plate: "TX-ATL-101",
    odometer_miles: 184220,
    status: "active",
  },
  {
    id: "11111111-1111-4111-8111-111111111122",
    unit_number: "102",
    make: "Volvo",
    model: "VNL 760",
    model_year: 2021,
    vin: "4V4NC9EH7MNAA1022",
    license_plate: "GA-ATL-102",
    odometer_miles: 219880,
    status: "active",
  },
  {
    id: "11111111-1111-4111-8111-111111111123",
    unit_number: "103",
    make: "Kenworth",
    model: "T680",
    model_year: 2023,
    vin: "1XKYDP9X7PJAA1033",
    license_plate: "IL-ATL-103",
    odometer_miles: 102340,
    status: "active",
  },
  {
    id: "11111111-1111-4111-8111-111111111124",
    unit_number: "104",
    make: "Peterbilt",
    model: "579",
    model_year: 2020,
    vin: "1XPBDP9X0LDAA1044",
    license_plate: "CA-ATL-104",
    odometer_miles: 268710,
    status: "maintenance",
  },
  {
    id: "11111111-1111-4111-8111-111111111125",
    unit_number: "105",
    make: "Freightliner",
    model: "Cascadia",
    model_year: 2021,
    vin: "3AKJHHDR9MSAA1055",
    license_plate: "CO-ATL-105",
    odometer_miles: 201455,
    status: "active",
  },
  {
    id: "11111111-1111-4111-8111-111111111126",
    unit_number: "106",
    make: "Volvo",
    model: "VNL 860",
    model_year: 2022,
    vin: "4V4NC9EH1NNAA1066",
    license_plate: "WA-ATL-106",
    odometer_miles: 149930,
    status: "active",
  },
] as const;

const TRIP_ROUTES = [
  ["Dallas", "Houston"],
  ["Atlanta", "Miami"],
  ["Chicago", "Detroit"],
  ["Los Angeles", "Phoenix"],
  ["Denver", "Salt Lake City"],
  ["Seattle", "Portland"],
  ["Nashville", "Memphis"],
  ["Kansas City", "St. Louis"],
  ["Dallas", "Atlanta"],
  ["Phoenix", "Las Vegas"],
] as const;

const ALERT_TEMPLATES = [
  {
    title: "Harsh braking detected",
    alert_type: "safety",
    severity: "high",
    status: "open",
    related_entity_type: "trip",
  },
  {
    title: "Engine maintenance overdue",
    alert_type: "maintenance",
    severity: "critical",
    status: "open",
    related_entity_type: "vehicle",
  },
  {
    title: "Driver exceeded HOS limit",
    alert_type: "compliance",
    severity: "high",
    status: "acknowledged",
    related_entity_type: "driver",
  },
  {
    title: "Tire pressure warning",
    alert_type: "vehicle_health",
    severity: "medium",
    status: "open",
    related_entity_type: "vehicle",
  },
] as const;

const ROLE_USERS = [
  { role: "owner", email: "owner.atlas@example.com", password: "Password123!" },
  { role: "admin", email: "admin.atlas@example.com", password: "Password123!" },
  { role: "dispatcher", email: "dispatcher.atlas@example.com", password: "Password123!" },
  { role: "driver", email: "driver.atlas@example.com", password: "Password123!" },
  { role: "viewer", email: "viewer.atlas@example.com", password: "Password123!" },
] as const;

type RoleUser = (typeof ROLE_USERS)[number];

function loadDotEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const idx = trimmed.indexOf("=");
    if (idx === -1) {
      continue;
    }

    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function assertEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

type QueryRow = { id: string };

type QueryLike = {
  eq: (column: string, value: string) => QueryLike;
  is: (column: string, value: null) => QueryLike;
  maybeSingle: () => Promise<{ data: QueryRow | null; error: { message: string } | null }>;
};

async function findSingleBy(
  supabase: SupabaseClient,
  table: keyof Database["public"]["Tables"],
  filters: Record<string, string | null>
): Promise<QueryRow | null> {
  let query = supabase.from(table).select("id").limit(1) as unknown as QueryLike;

  for (const [key, value] of Object.entries(filters)) {
    query = value === null ? query.is(key, null) : query.eq(key, value);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    throw new Error(`Query failed for ${String(table)}: ${error.message}`);
  }

  return data;
}

async function seed() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run seed in production environment.");
  }

  loadDotEnvFile(path.join(process.cwd(), ".env.local"));

  const supabaseUrl = assertEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = assertEnv("SUPABASE_SERVICE_ROLE_KEY");
  const seedBase = new Date(BASE_TIME).getTime();

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .upsert(
      {
        id: COMPANY.id,
        name: COMPANY.name,
        dot_number: COMPANY.dot_number,
        fleet_size: COMPANY.fleet_size,
      },
      { onConflict: "id" }
    )
    .select("id")
    .single();

  if (companyError || !company) {
    throw new Error(
      `Company upsert failed: ${companyError?.message ?? "unknown error"}`
    );
  }

  const companyId = company.id;

  const { data: usersPage, error: usersError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (usersError) {
    throw new Error(`Auth users list failed: ${usersError.message}`);
  }

  const authUserIdByRole = new Map<RoleUser["role"], string>();

  for (const roleUser of ROLE_USERS) {
    const existing = usersPage.users.find(
      (user) => (user.email ?? "").toLowerCase() === roleUser.email.toLowerCase()
    );

    if (existing) {
      const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
        password: roleUser.password,
        email_confirm: true,
      });
      if (updateError) {
        throw new Error(`Auth user update failed (${roleUser.email}): ${updateError.message}`);
      }
      authUserIdByRole.set(roleUser.role, existing.id);
      continue;
    }

    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: roleUser.email,
      password: roleUser.password,
      email_confirm: true,
    });

    if (createError || !created.user) {
      throw new Error(
        `Auth user create failed (${roleUser.email}): ${createError?.message ?? "unknown"}`
      );
    }

    authUserIdByRole.set(roleUser.role, created.user.id);
  }

  const { error: membersError } = await supabase.from("company_members").upsert(
    ROLE_USERS.map((roleUser) => ({
      company_id: companyId,
      user_id: authUserIdByRole.get(roleUser.role)!,
      role: roleUser.role,
    })),
    { onConflict: "company_id,user_id" }
  );

  if (membersError) {
    throw new Error(`Company members upsert failed: ${membersError.message}`);
  }

  const ownerUserId = authUserIdByRole.get("owner");
  if (ownerUserId) {
    const { error: companyOwnerError } = await supabase
      .from("companies")
      .update({ created_by: ownerUserId })
      .eq("id", companyId);
    if (companyOwnerError) {
      throw new Error(`Company owner update failed: ${companyOwnerError.message}`);
    }
  }

  const { error: driversError } = await supabase.from("drivers").upsert(
    DRIVERS.map((driver) => ({
      company_id: companyId,
      ...driver,
    })),
    { onConflict: "id" }
  );

  if (driversError) {
    throw new Error(`Drivers upsert failed: ${driversError.message}`);
  }

  const { data: drivers, error: driverFetchError } = await supabase
    .from("drivers")
    .select("id, license_number")
    .eq("company_id", companyId)
    .in(
      "license_number",
      DRIVERS.map((driver) => driver.license_number)
    );

  if (driverFetchError || !drivers || drivers.length !== DRIVERS.length) {
    throw new Error(
      `Driver fetch failed: ${driverFetchError?.message ?? "missing driver rows"}`
    );
  }

  const driverByLicense = new Map(
    drivers.map((driver) => [driver.license_number, driver.id])
  );

  const driverAuthUserId = authUserIdByRole.get("driver");
  const seededDriverId = driverByLicense.get("TX-AF-30111");
  if (driverAuthUserId && seededDriverId) {
    const { error: driverAuthError } = await supabase
      .from("drivers")
      .update({ auth_user_id: driverAuthUserId })
      .eq("id", seededDriverId);

    if (driverAuthError) {
      throw new Error(`Driver auth link failed: ${driverAuthError.message}`);
    }
  }

  const { error: vehiclesError } = await supabase.from("vehicles").upsert(
    VEHICLES.map((vehicle) => ({
      company_id: companyId,
      ...vehicle,
    })),
    { onConflict: "id" }
  );

  if (vehiclesError) {
    throw new Error(`Vehicles upsert failed: ${vehiclesError.message}`);
  }

  const { data: vehicles, error: vehicleFetchError } = await supabase
    .from("vehicles")
    .select("id, vin")
    .eq("company_id", companyId)
    .in(
      "vin",
      VEHICLES.map((vehicle) => vehicle.vin)
    );

  if (vehicleFetchError || !vehicles || vehicles.length !== VEHICLES.length) {
    throw new Error(
      `Vehicle fetch failed: ${vehicleFetchError?.message ?? "missing vehicle rows"}`
    );
  }

  const vehicleByVin = new Map(vehicles.map((vehicle) => [vehicle.vin, vehicle.id]));

  const tripsSeed = TRIP_ROUTES.map(([origin, destination], index) => {
    const driver = DRIVERS[index % DRIVERS.length];
    const vehicle = VEHICLES[index % VEHICLES.length];
    const startedAt = new Date(seedBase + index * 1000 * 60 * 60 * 6).toISOString();
    const status =
      index % 3 === 0 ? "completed" : index % 3 === 1 ? "in_progress" : "planned";

    return {
      company_id: companyId,
      driver_id: driverByLicense.get(driver.license_number)!,
      vehicle_id: vehicleByVin.get(vehicle.vin)!,
      origin,
      destination,
      started_at: startedAt,
      status,
      route_miles: 220 + index * 17,
      actual_miles: status === "completed" ? 230 + index * 16 : null,
      compliance_notes: `seed:trip-${index + 1}`,
    };
  });

  const tripIds: string[] = [];
  for (const trip of tripsSeed) {
    const existing = await findSingleBy(supabase, "trips", {
      company_id: trip.company_id,
      compliance_notes: trip.compliance_notes,
    });

    if (existing) {
      tripIds.push(existing.id);
      continue;
    }

    const { data, error } = await supabase
      .from("trips")
      .insert(trip)
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(
        `Trip insert failed (${trip.compliance_notes}): ${error?.message ?? "unknown"}`
      );
    }

    tripIds.push(data.id);
  }

  for (let index = 0; index < ALERT_TEMPLATES.length; index += 1) {
    const alertTemplate = ALERT_TEMPLATES[index];
    const relatedEntityId =
      alertTemplate.related_entity_type === "trip"
        ? tripIds[index % tripIds.length]
        : alertTemplate.related_entity_type === "driver"
          ? tripsSeed[index % tripsSeed.length].driver_id
          : tripsSeed[index % tripsSeed.length].vehicle_id;

    const existing = await findSingleBy(supabase, "alerts", {
      company_id: companyId,
      title: alertTemplate.title,
      related_entity_id: relatedEntityId,
    });

    if (existing) {
      continue;
    }

    const { error } = await supabase.from("alerts").insert({
      company_id: companyId,
      title: alertTemplate.title,
      alert_type: alertTemplate.alert_type,
      message: `Seed alert: ${alertTemplate.title}`,
      severity: alertTemplate.severity,
      status: alertTemplate.status,
      related_entity_type: alertTemplate.related_entity_type,
      related_entity_id: relatedEntityId,
      triggered_at: new Date(seedBase + index * 1000 * 60 * 25).toISOString(),
    });

    if (error) {
      throw new Error(`Alert insert failed (${alertTemplate.title}): ${error.message}`);
    }
  }

  const safetyEvents = Array.from({ length: 6 }).map((_, index) => {
    const trip = tripsSeed[index % tripsSeed.length];

    return {
      company_id: companyId,
      driver_id: trip.driver_id,
      vehicle_id: trip.vehicle_id,
      event_type:
        index % 3 === 0
          ? "harsh_braking"
          : index % 3 === 1
            ? "speeding"
            : "rapid_acceleration",
      severity: (index % 3) + 2,
      score_impact: -(index % 4 + 2),
      occurred_at: new Date(seedBase + index * 1000 * 60 * 40).toISOString(),
      metadata: {
        source: "seed",
        trip_id: tripIds[index % tripIds.length],
      },
    };
  });

  for (const [index, event] of safetyEvents.entries()) {
    const existing = await findSingleBy(supabase, "safety_events", {
      company_id: event.company_id,
      event_type: event.event_type,
      occurred_at: event.occurred_at,
    });

    if (existing) {
      continue;
    }

    const { error } = await supabase.from("safety_events").insert(event);
    if (error) {
      throw new Error(`Safety event insert failed (#${index + 1}): ${error.message}`);
    }
  }

  const maintenanceRecords = [
    {
      maintenance_type: "engine_service",
      description: "Quarterly engine diagnostics and oil change",
      dueDays: 3,
    },
    {
      maintenance_type: "brake_inspection",
      description: "Brake pad and air line inspection",
      dueDays: 7,
    },
    {
      maintenance_type: "tire_rotation",
      description: "Drive axle tire rotation and pressure calibration",
      dueDays: 12,
    },
    {
      maintenance_type: "dpf_cleaning",
      description: "DPF regeneration check and emissions service",
      dueDays: 18,
    },
  ] as const;

  for (const [index, template] of maintenanceRecords.entries()) {
    const vehicle = VEHICLES[index % VEHICLES.length];
    const vehicleId = vehicleByVin.get(vehicle.vin)!;

    const existing = await findSingleBy(supabase, "maintenance_records", {
      company_id: companyId,
      vehicle_id: vehicleId,
      maintenance_type: template.maintenance_type,
    });

    if (existing) {
      continue;
    }

    const { error } = await supabase.from("maintenance_records").insert({
      company_id: companyId,
      vehicle_id: vehicleId,
      maintenance_type: template.maintenance_type,
      description: template.description,
      due_at: new Date(seedBase + template.dueDays * 24 * 60 * 60 * 1000).toISOString(),
      status: "scheduled",
      estimated_cost: 350 + index * 90,
      odometer_miles_at_service: vehicle.odometer_miles + (index + 1) * 500,
    });

    if (error) {
      throw new Error(`Maintenance insert failed (${template.maintenance_type}): ${error.message}`);
    }
  }

  const [companiesRes, driversRes, vehiclesRes, tripsRes, alertsRes] = await Promise.all([
    supabase
      .from("companies")
      .select("id", { count: "exact", head: true })
      .eq("id", companyId),
    supabase
      .from("drivers")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId),
    supabase
      .from("vehicles")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId),
    supabase
      .from("trips")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId),
    supabase
      .from("alerts")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId),
  ]);

  console.log("Seed complete:");
  console.log(`Companies: ${companiesRes.count ?? 0}`);
  console.log(`Drivers: ${driversRes.count ?? 0}`);
  console.log(`Vehicles: ${vehiclesRes.count ?? 0}`);
  console.log(`Trips: ${tripsRes.count ?? 0}`);
  console.log(`Alerts: ${alertsRes.count ?? 0}`);
}

seed().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown seed error";
  console.error("Seed failed:", message);
  process.exit(1);
});




