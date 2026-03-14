-- Core MVP schema for fleet intelligence and compliance platform
-- Created: 2026-03-14

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  dot_number text,
  fleet_size integer,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint companies_fleet_size_non_negative check (fleet_size is null or fleet_size >= 0)
);

create table if not exists public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint company_members_role_check check (role in ('owner', 'admin', 'dispatcher', 'driver', 'viewer')),
  constraint company_members_unique unique (company_id, user_id)
);

create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null,
  employee_code text,
  first_name text not null,
  last_name text not null,
  phone text,
  license_number text not null,
  license_state text,
  license_expiry date,
  status text not null default 'active',
  hired_on date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint drivers_status_check check (status in ('active', 'inactive', 'suspended')),
  constraint drivers_unique_license unique (company_id, license_number),
  constraint drivers_unique_employee_code unique (company_id, employee_code)
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  vin text not null,
  unit_number text not null,
  license_plate text,
  make text,
  model text,
  model_year integer,
  odometer_miles numeric(12, 1) not null default 0,
  eld_device_id text,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint vehicles_status_check check (status in ('active', 'inactive', 'maintenance')),
  constraint vehicles_odometer_non_negative check (odometer_miles >= 0),
  constraint vehicles_unique_vin unique (company_id, vin),
  constraint vehicles_unique_unit_number unique (company_id, unit_number)
);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  driver_id uuid not null references public.drivers(id) on delete restrict,
  vehicle_id uuid not null references public.vehicles(id) on delete restrict,
  status text not null default 'planned',
  origin text,
  destination text,
  started_at timestamptz,
  ended_at timestamptz,
  route_miles numeric(10, 2),
  actual_miles numeric(10, 2),
  compliance_notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint trips_status_check check (status in ('planned', 'in_progress', 'completed', 'cancelled')),
  constraint trips_miles_non_negative check (
    (route_miles is null or route_miles >= 0)
    and (actual_miles is null or actual_miles >= 0)
  ),
  constraint trips_valid_time_window check (ended_at is null or started_at is null or ended_at >= started_at)
);

create table if not exists public.eld_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  driver_id uuid not null references public.drivers(id) on delete restrict,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  log_date date not null,
  duty_status text not null,
  start_time timestamptz not null,
  end_time timestamptz,
  location_lat numeric(10, 7),
  location_lng numeric(10, 7),
  engine_hours numeric(10, 2),
  odometer_miles numeric(12, 1),
  remarks text,
  source text not null default 'mobile_app',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint eld_logs_duty_status_check check (duty_status in ('off_duty', 'sleeper_berth', 'on_duty', 'driving')),
  constraint eld_logs_source_check check (source in ('mobile_app', 'eld_device', 'api_import', 'manual')),
  constraint eld_logs_time_window check (end_time is null or end_time >= start_time),
  constraint eld_logs_engine_hours_non_negative check (engine_hours is null or engine_hours >= 0),
  constraint eld_logs_odometer_non_negative check (odometer_miles is null or odometer_miles >= 0)
);

create table if not exists public.inspections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  driver_id uuid not null references public.drivers(id) on delete restrict,
  vehicle_id uuid not null references public.vehicles(id) on delete restrict,
  inspection_type text not null,
  status text not null,
  defects jsonb not null default '[]'::jsonb,
  notes text,
  inspected_at timestamptz not null default timezone('utc', now()),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint inspections_type_check check (inspection_type in ('pre_trip', 'post_trip')),
  constraint inspections_status_check check (status in ('passed', 'failed', 'resolved')),
  constraint inspections_resolve_window check (resolved_at is null or resolved_at >= inspected_at)
);

create table if not exists public.maintenance_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete restrict,
  maintenance_type text not null,
  description text,
  status text not null default 'scheduled',
  due_at date,
  completed_at date,
  odometer_miles_at_service numeric(12, 1),
  estimated_cost numeric(12, 2),
  actual_cost numeric(12, 2),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint maintenance_status_check check (status in ('scheduled', 'completed', 'overdue', 'cancelled')),
  constraint maintenance_odometer_non_negative check (odometer_miles_at_service is null or odometer_miles_at_service >= 0),
  constraint maintenance_cost_non_negative check (
    (estimated_cost is null or estimated_cost >= 0)
    and (actual_cost is null or actual_cost >= 0)
  ),
  constraint maintenance_date_window check (completed_at is null or due_at is null or completed_at >= due_at)
);

create table if not exists public.safety_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  driver_id uuid references public.drivers(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  event_type text not null,
  severity smallint not null,
  score_impact integer not null default 0,
  occurred_at timestamptz not null,
  location_lat numeric(10, 7),
  location_lng numeric(10, 7),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint safety_events_type_check check (
    event_type in ('speeding', 'harsh_braking', 'rapid_acceleration', 'hard_cornering', 'idling', 'collision_risk', 'phone_usage', 'other')
  ),
  constraint safety_events_severity_check check (severity between 1 and 5)
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  alert_type text not null,
  severity text not null default 'medium',
  status text not null default 'open',
  title text not null,
  message text,
  related_entity_type text,
  related_entity_id uuid,
  triggered_at timestamptz not null default timezone('utc', now()),
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  acknowledged_by uuid references auth.users(id) on delete set null,
  resolved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint alerts_severity_check check (severity in ('low', 'medium', 'high', 'critical')),
  constraint alerts_status_check check (status in ('open', 'acknowledged', 'resolved')),
  constraint alerts_time_window check (
    (acknowledged_at is null or acknowledged_at >= triggered_at)
    and (resolved_at is null or resolved_at >= triggered_at)
  )
);

create index if not exists idx_company_members_user_id on public.company_members (user_id);
create index if not exists idx_company_members_company_role on public.company_members (company_id, role);

create index if not exists idx_drivers_company_id on public.drivers (company_id);
create index if not exists idx_drivers_auth_user_id on public.drivers (auth_user_id);

create index if not exists idx_vehicles_company_id on public.vehicles (company_id);
create index if not exists idx_vehicles_status on public.vehicles (company_id, status);

create index if not exists idx_trips_company_id on public.trips (company_id);
create index if not exists idx_trips_driver_id on public.trips (driver_id);
create index if not exists idx_trips_vehicle_id on public.trips (vehicle_id);
create index if not exists idx_trips_status on public.trips (company_id, status);
create index if not exists idx_trips_started_at on public.trips (started_at desc);

create index if not exists idx_eld_logs_company_id on public.eld_logs (company_id);
create index if not exists idx_eld_logs_driver_id on public.eld_logs (driver_id);
create index if not exists idx_eld_logs_log_date on public.eld_logs (log_date desc);
create index if not exists idx_eld_logs_start_time on public.eld_logs (start_time desc);

create index if not exists idx_inspections_company_id on public.inspections (company_id);
create index if not exists idx_inspections_vehicle_id on public.inspections (vehicle_id);
create index if not exists idx_inspections_inspected_at on public.inspections (inspected_at desc);

create index if not exists idx_maintenance_company_id on public.maintenance_records (company_id);
create index if not exists idx_maintenance_vehicle_id on public.maintenance_records (vehicle_id);
create index if not exists idx_maintenance_status on public.maintenance_records (company_id, status);
create index if not exists idx_maintenance_due_at on public.maintenance_records (due_at);

create index if not exists idx_safety_events_company_id on public.safety_events (company_id);
create index if not exists idx_safety_events_driver_id on public.safety_events (driver_id);
create index if not exists idx_safety_events_occurred_at on public.safety_events (occurred_at desc);

create index if not exists idx_alerts_company_id on public.alerts (company_id);
create index if not exists idx_alerts_status on public.alerts (company_id, status);
create index if not exists idx_alerts_triggered_at on public.alerts (triggered_at desc);

create trigger trg_companies_updated_at
before update on public.companies
for each row execute function public.set_updated_at();

create trigger trg_drivers_updated_at
before update on public.drivers
for each row execute function public.set_updated_at();

create trigger trg_vehicles_updated_at
before update on public.vehicles
for each row execute function public.set_updated_at();

create trigger trg_trips_updated_at
before update on public.trips
for each row execute function public.set_updated_at();

create trigger trg_eld_logs_updated_at
before update on public.eld_logs
for each row execute function public.set_updated_at();

create trigger trg_inspections_updated_at
before update on public.inspections
for each row execute function public.set_updated_at();

create trigger trg_maintenance_records_updated_at
before update on public.maintenance_records
for each row execute function public.set_updated_at();

create trigger trg_alerts_updated_at
before update on public.alerts
for each row execute function public.set_updated_at();

create or replace function public.has_company_role(target_company_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_members cm
    where cm.company_id = target_company_id
      and cm.user_id = (select auth.uid())
      and cm.role = any (allowed_roles)
  );
$$;

create or replace function public.handle_company_insert_add_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.created_by is not null then
    insert into public.company_members (company_id, user_id, role)
    values (new.id, new.created_by, 'owner')
    on conflict (company_id, user_id) do nothing;
  end if;

  return new;
end;
$$;

create trigger trg_companies_add_owner
after insert on public.companies
for each row execute function public.handle_company_insert_add_owner();

alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.drivers enable row level security;
alter table public.vehicles enable row level security;
alter table public.trips enable row level security;
alter table public.eld_logs enable row level security;
alter table public.inspections enable row level security;
alter table public.maintenance_records enable row level security;
alter table public.safety_events enable row level security;
alter table public.alerts enable row level security;

create policy companies_select_member
on public.companies
for select
using (public.has_company_role(id, array['owner', 'admin', 'dispatcher', 'driver', 'viewer']));

create policy companies_insert_authenticated
on public.companies
for insert
to authenticated
with check (created_by = (select auth.uid()));

create policy companies_update_admin
on public.companies
for update
using (public.has_company_role(id, array['owner', 'admin']))
with check (public.has_company_role(id, array['owner', 'admin']));

create policy companies_delete_owner
on public.companies
for delete
using (public.has_company_role(id, array['owner']));

create policy company_members_select_member
on public.company_members
for select
using (public.has_company_role(company_id, array['owner', 'admin', 'dispatcher', 'driver', 'viewer']));

create policy company_members_insert_owner_admin
on public.company_members
for insert
with check (public.has_company_role(company_id, array['owner', 'admin']));

create policy company_members_update_owner_admin
on public.company_members
for update
using (public.has_company_role(company_id, array['owner', 'admin']))
with check (public.has_company_role(company_id, array['owner', 'admin']));

create policy company_members_delete_owner_admin
on public.company_members
for delete
using (public.has_company_role(company_id, array['owner', 'admin']));

create policy drivers_select_member
on public.drivers
for select
using (public.has_company_role(company_id, array['owner', 'admin', 'dispatcher', 'driver', 'viewer']));

create policy drivers_modify_admin_dispatcher
on public.drivers
for all
using (public.has_company_role(company_id, array['owner', 'admin', 'dispatcher']))
with check (public.has_company_role(company_id, array['owner', 'admin', 'dispatcher']));

create policy vehicles_select_member
on public.vehicles
for select
using (public.has_company_role(company_id, array['owner', 'admin', 'dispatcher', 'driver', 'viewer']));

create policy vehicles_modify_admin_dispatcher
on public.vehicles
for all
using (public.has_company_role(company_id, array['owner', 'admin', 'dispatcher']))
with check (public.has_company_role(company_id, array['owner', 'admin', 'dispatcher']));

create policy trips_select_member
on public.trips
for select
using (public.has_company_role(company_id, array['owner', 'admin', 'dispatcher', 'driver', 'viewer']));

create policy trips_modify_admin_dispatcher
on public.trips
for all
using (public.has_company_role(company_id, array['owner', 'admin', 'dispatcher']))
with check (public.has_company_role(company_id, array['owner', 'admin', 'dispatcher']));

create policy eld_logs_select_member
on public.eld_logs
for select
using (public.has_company_role(company_id, array['owner', 'admin', 'dispatcher', 'driver', 'viewer']));

create policy eld_logs_modify_admin_dispatcher
on public.eld_logs
for all
using (public.has_company_role(company_id, array['owner', 'admin', 'dispatcher']))
with check (public.has_company_role(company_id, array['owner', 'admin', 'dispatcher']));

create policy inspections_select_member
on public.inspections
for select
using (public.has_company_role(company_id, array['owner', 'admin', 'dispatcher', 'driver', 'viewer']));

create policy inspections_modify_admin_dispatcher
on public.inspections
for all
using (public.has_company_role(company_id, array['owner', 'admin', 'dispatcher']))
with check (public.has_company_role(company_id, array['owner', 'admin', 'dispatcher']));

create policy maintenance_select_member
on public.maintenance_records
for select
using (public.has_company_role(company_id, array['owner', 'admin', 'dispatcher', 'driver', 'viewer']));

create policy maintenance_modify_admin_dispatcher
on public.maintenance_records
for all
using (public.has_company_role(company_id, array['owner', 'admin', 'dispatcher']))
with check (public.has_company_role(company_id, array['owner', 'admin', 'dispatcher']));

create policy safety_events_select_member
on public.safety_events
for select
using (public.has_company_role(company_id, array['owner', 'admin', 'dispatcher', 'driver', 'viewer']));

create policy safety_events_modify_admin_dispatcher
on public.safety_events
for all
using (public.has_company_role(company_id, array['owner', 'admin', 'dispatcher']))
with check (public.has_company_role(company_id, array['owner', 'admin', 'dispatcher']));

create policy alerts_select_member
on public.alerts
for select
using (public.has_company_role(company_id, array['owner', 'admin', 'dispatcher', 'driver', 'viewer']));

create policy alerts_modify_admin_dispatcher
on public.alerts
for all
using (public.has_company_role(company_id, array['owner', 'admin', 'dispatcher']))
with check (public.has_company_role(company_id, array['owner', 'admin', 'dispatcher']));
