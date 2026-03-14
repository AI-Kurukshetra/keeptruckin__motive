-- Ensure operational write permissions include owner/admin/dispatcher while keeping ownership tables owner-only.

-- drivers
DROP POLICY IF EXISTS drivers_modify_admin_dispatcher ON public.drivers;
DROP POLICY IF EXISTS drivers_insert_owner_admin_dispatcher ON public.drivers;
DROP POLICY IF EXISTS drivers_update_owner_admin_dispatcher ON public.drivers;
DROP POLICY IF EXISTS drivers_delete_owner_admin_dispatcher ON public.drivers;

CREATE POLICY drivers_insert_owner_admin_dispatcher
ON public.drivers
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.user_id = (SELECT auth.uid())
      AND cm.company_id = drivers.company_id
      AND cm.role IN ('owner', 'admin', 'dispatcher')
  )
);

CREATE POLICY drivers_update_owner_admin_dispatcher
ON public.drivers
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.user_id = (SELECT auth.uid())
      AND cm.company_id = drivers.company_id
      AND cm.role IN ('owner', 'admin', 'dispatcher')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.user_id = (SELECT auth.uid())
      AND cm.company_id = drivers.company_id
      AND cm.role IN ('owner', 'admin', 'dispatcher')
  )
);

CREATE POLICY drivers_delete_owner_admin_dispatcher
ON public.drivers
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.user_id = (SELECT auth.uid())
      AND cm.company_id = drivers.company_id
      AND cm.role IN ('owner', 'admin', 'dispatcher')
  )
);

-- vehicles
DROP POLICY IF EXISTS vehicles_modify_admin_dispatcher ON public.vehicles;
DROP POLICY IF EXISTS vehicles_insert_owner_admin_dispatcher ON public.vehicles;
DROP POLICY IF EXISTS vehicles_update_owner_admin_dispatcher ON public.vehicles;
DROP POLICY IF EXISTS vehicles_delete_owner_admin_dispatcher ON public.vehicles;

CREATE POLICY vehicles_insert_owner_admin_dispatcher
ON public.vehicles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.user_id = (SELECT auth.uid())
      AND cm.company_id = vehicles.company_id
      AND cm.role IN ('owner', 'admin', 'dispatcher')
  )
);

CREATE POLICY vehicles_update_owner_admin_dispatcher
ON public.vehicles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.user_id = (SELECT auth.uid())
      AND cm.company_id = vehicles.company_id
      AND cm.role IN ('owner', 'admin', 'dispatcher')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.user_id = (SELECT auth.uid())
      AND cm.company_id = vehicles.company_id
      AND cm.role IN ('owner', 'admin', 'dispatcher')
  )
);

CREATE POLICY vehicles_delete_owner_admin_dispatcher
ON public.vehicles
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.user_id = (SELECT auth.uid())
      AND cm.company_id = vehicles.company_id
      AND cm.role IN ('owner', 'admin', 'dispatcher')
  )
);

-- trips
DROP POLICY IF EXISTS trips_modify_admin_dispatcher ON public.trips;
DROP POLICY IF EXISTS trips_insert_owner_admin_dispatcher ON public.trips;
DROP POLICY IF EXISTS trips_update_owner_admin_dispatcher ON public.trips;
DROP POLICY IF EXISTS trips_delete_owner_admin_dispatcher ON public.trips;

CREATE POLICY trips_insert_owner_admin_dispatcher
ON public.trips
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.user_id = (SELECT auth.uid())
      AND cm.company_id = trips.company_id
      AND cm.role IN ('owner', 'admin', 'dispatcher')
  )
);

CREATE POLICY trips_update_owner_admin_dispatcher
ON public.trips
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.user_id = (SELECT auth.uid())
      AND cm.company_id = trips.company_id
      AND cm.role IN ('owner', 'admin', 'dispatcher')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.user_id = (SELECT auth.uid())
      AND cm.company_id = trips.company_id
      AND cm.role IN ('owner', 'admin', 'dispatcher')
  )
);

CREATE POLICY trips_delete_owner_admin_dispatcher
ON public.trips
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.user_id = (SELECT auth.uid())
      AND cm.company_id = trips.company_id
      AND cm.role IN ('owner', 'admin', 'dispatcher')
  )
);

-- maintenance_records
DROP POLICY IF EXISTS maintenance_modify_admin_dispatcher ON public.maintenance_records;
DROP POLICY IF EXISTS maintenance_insert_owner_admin_dispatcher ON public.maintenance_records;
DROP POLICY IF EXISTS maintenance_update_owner_admin_dispatcher ON public.maintenance_records;
DROP POLICY IF EXISTS maintenance_delete_owner_admin_dispatcher ON public.maintenance_records;

CREATE POLICY maintenance_insert_owner_admin_dispatcher
ON public.maintenance_records
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.user_id = (SELECT auth.uid())
      AND cm.company_id = maintenance_records.company_id
      AND cm.role IN ('owner', 'admin', 'dispatcher')
  )
);

CREATE POLICY maintenance_update_owner_admin_dispatcher
ON public.maintenance_records
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.user_id = (SELECT auth.uid())
      AND cm.company_id = maintenance_records.company_id
      AND cm.role IN ('owner', 'admin', 'dispatcher')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.user_id = (SELECT auth.uid())
      AND cm.company_id = maintenance_records.company_id
      AND cm.role IN ('owner', 'admin', 'dispatcher')
  )
);

CREATE POLICY maintenance_delete_owner_admin_dispatcher
ON public.maintenance_records
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.user_id = (SELECT auth.uid())
      AND cm.company_id = maintenance_records.company_id
      AND cm.role IN ('owner', 'admin', 'dispatcher')
  )
);

-- inspections
DROP POLICY IF EXISTS inspections_modify_admin_dispatcher ON public.inspections;
DROP POLICY IF EXISTS inspections_insert_owner_admin_dispatcher ON public.inspections;
DROP POLICY IF EXISTS inspections_update_owner_admin_dispatcher ON public.inspections;
DROP POLICY IF EXISTS inspections_delete_owner_admin_dispatcher ON public.inspections;

CREATE POLICY inspections_insert_owner_admin_dispatcher
ON public.inspections
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.user_id = (SELECT auth.uid())
      AND cm.company_id = inspections.company_id
      AND cm.role IN ('owner', 'admin', 'dispatcher')
  )
);

CREATE POLICY inspections_update_owner_admin_dispatcher
ON public.inspections
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.user_id = (SELECT auth.uid())
      AND cm.company_id = inspections.company_id
      AND cm.role IN ('owner', 'admin', 'dispatcher')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.user_id = (SELECT auth.uid())
      AND cm.company_id = inspections.company_id
      AND cm.role IN ('owner', 'admin', 'dispatcher')
  )
);

CREATE POLICY inspections_delete_owner_admin_dispatcher
ON public.inspections
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.user_id = (SELECT auth.uid())
      AND cm.company_id = inspections.company_id
      AND cm.role IN ('owner', 'admin', 'dispatcher')
  )
);

-- safety_events
DROP POLICY IF EXISTS safety_events_modify_admin_dispatcher ON public.safety_events;
DROP POLICY IF EXISTS safety_events_insert_owner_admin_dispatcher ON public.safety_events;
DROP POLICY IF EXISTS safety_events_update_owner_admin_dispatcher ON public.safety_events;
DROP POLICY IF EXISTS safety_events_delete_owner_admin_dispatcher ON public.safety_events;

CREATE POLICY safety_events_insert_owner_admin_dispatcher
ON public.safety_events
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.user_id = (SELECT auth.uid())
      AND cm.company_id = safety_events.company_id
      AND cm.role IN ('owner', 'admin', 'dispatcher')
  )
);

CREATE POLICY safety_events_update_owner_admin_dispatcher
ON public.safety_events
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.user_id = (SELECT auth.uid())
      AND cm.company_id = safety_events.company_id
      AND cm.role IN ('owner', 'admin', 'dispatcher')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.user_id = (SELECT auth.uid())
      AND cm.company_id = safety_events.company_id
      AND cm.role IN ('owner', 'admin', 'dispatcher')
  )
);

CREATE POLICY safety_events_delete_owner_admin_dispatcher
ON public.safety_events
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.user_id = (SELECT auth.uid())
      AND cm.company_id = safety_events.company_id
      AND cm.role IN ('owner', 'admin', 'dispatcher')
  )
);

-- eld_logs
DROP POLICY IF EXISTS eld_logs_modify_admin_dispatcher ON public.eld_logs;
DROP POLICY IF EXISTS eld_logs_insert_owner_admin_dispatcher ON public.eld_logs;
DROP POLICY IF EXISTS eld_logs_update_owner_admin_dispatcher ON public.eld_logs;
DROP POLICY IF EXISTS eld_logs_delete_owner_admin_dispatcher ON public.eld_logs;

CREATE POLICY eld_logs_insert_owner_admin_dispatcher
ON public.eld_logs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.user_id = (SELECT auth.uid())
      AND cm.company_id = eld_logs.company_id
      AND cm.role IN ('owner', 'admin', 'dispatcher')
  )
);

CREATE POLICY eld_logs_update_owner_admin_dispatcher
ON public.eld_logs
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.user_id = (SELECT auth.uid())
      AND cm.company_id = eld_logs.company_id
      AND cm.role IN ('owner', 'admin', 'dispatcher')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.user_id = (SELECT auth.uid())
      AND cm.company_id = eld_logs.company_id
      AND cm.role IN ('owner', 'admin', 'dispatcher')
  )
);

CREATE POLICY eld_logs_delete_owner_admin_dispatcher
ON public.eld_logs
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.user_id = (SELECT auth.uid())
      AND cm.company_id = eld_logs.company_id
      AND cm.role IN ('owner', 'admin', 'dispatcher')
  )
);