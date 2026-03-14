-- Restore operational write permissions (owner/admin/dispatcher) for core operational tables.

drop policy if exists drivers_modify_admin_dispatcher on public.drivers;
create policy drivers_modify_admin_dispatcher
on public.drivers
for all
using (
  exists (
    select 1
    from public.company_members cm
    where cm.user_id = (select auth.uid())
      and cm.company_id = drivers.company_id
      and cm.role in ('owner', 'admin', 'dispatcher')
  )
)
with check (
  exists (
    select 1
    from public.company_members cm
    where cm.user_id = (select auth.uid())
      and cm.company_id = drivers.company_id
      and cm.role in ('owner', 'admin', 'dispatcher')
  )
);

drop policy if exists vehicles_modify_admin_dispatcher on public.vehicles;
create policy vehicles_modify_admin_dispatcher
on public.vehicles
for all
using (
  exists (
    select 1
    from public.company_members cm
    where cm.user_id = (select auth.uid())
      and cm.company_id = vehicles.company_id
      and cm.role in ('owner', 'admin', 'dispatcher')
  )
)
with check (
  exists (
    select 1
    from public.company_members cm
    where cm.user_id = (select auth.uid())
      and cm.company_id = vehicles.company_id
      and cm.role in ('owner', 'admin', 'dispatcher')
  )
);

drop policy if exists trips_modify_admin_dispatcher on public.trips;
create policy trips_modify_admin_dispatcher
on public.trips
for all
using (
  exists (
    select 1
    from public.company_members cm
    where cm.user_id = (select auth.uid())
      and cm.company_id = trips.company_id
      and cm.role in ('owner', 'admin', 'dispatcher')
  )
)
with check (
  exists (
    select 1
    from public.company_members cm
    where cm.user_id = (select auth.uid())
      and cm.company_id = trips.company_id
      and cm.role in ('owner', 'admin', 'dispatcher')
  )
);

drop policy if exists maintenance_modify_admin_dispatcher on public.maintenance_records;
create policy maintenance_modify_admin_dispatcher
on public.maintenance_records
for all
using (
  exists (
    select 1
    from public.company_members cm
    where cm.user_id = (select auth.uid())
      and cm.company_id = maintenance_records.company_id
      and cm.role in ('owner', 'admin', 'dispatcher')
  )
)
with check (
  exists (
    select 1
    from public.company_members cm
    where cm.user_id = (select auth.uid())
      and cm.company_id = maintenance_records.company_id
      and cm.role in ('owner', 'admin', 'dispatcher')
  )
);

drop policy if exists inspections_modify_admin_dispatcher on public.inspections;
create policy inspections_modify_admin_dispatcher
on public.inspections
for all
using (
  exists (
    select 1
    from public.company_members cm
    where cm.user_id = (select auth.uid())
      and cm.company_id = inspections.company_id
      and cm.role in ('owner', 'admin', 'dispatcher')
  )
)
with check (
  exists (
    select 1
    from public.company_members cm
    where cm.user_id = (select auth.uid())
      and cm.company_id = inspections.company_id
      and cm.role in ('owner', 'admin', 'dispatcher')
  )
);

drop policy if exists safety_events_modify_admin_dispatcher on public.safety_events;
create policy safety_events_modify_admin_dispatcher
on public.safety_events
for all
using (
  exists (
    select 1
    from public.company_members cm
    where cm.user_id = (select auth.uid())
      and cm.company_id = safety_events.company_id
      and cm.role in ('owner', 'admin', 'dispatcher')
  )
)
with check (
  exists (
    select 1
    from public.company_members cm
    where cm.user_id = (select auth.uid())
      and cm.company_id = safety_events.company_id
      and cm.role in ('owner', 'admin', 'dispatcher')
  )
);

drop policy if exists eld_logs_modify_admin_dispatcher on public.eld_logs;
create policy eld_logs_modify_admin_dispatcher
on public.eld_logs
for all
using (
  exists (
    select 1
    from public.company_members cm
    where cm.user_id = (select auth.uid())
      and cm.company_id = eld_logs.company_id
      and cm.role in ('owner', 'admin', 'dispatcher')
  )
)
with check (
  exists (
    select 1
    from public.company_members cm
    where cm.user_id = (select auth.uid())
      and cm.company_id = eld_logs.company_id
      and cm.role in ('owner', 'admin', 'dispatcher')
  )
);
