-- Harden membership update RBAC: only company owners can update membership rows.
-- This replaces previous owner/admin update policy with owner-only checks.

drop policy if exists company_members_update_owner_admin on public.company_members;

create policy company_members_update_owner_admin
on public.company_members
for update
using (
  exists (
    select 1
    from public.company_members cm
    where cm.user_id = (select auth.uid())
      and cm.company_id = company_members.company_id
      and cm.role = 'owner'
  )
)
with check (
  exists (
    select 1
    from public.company_members cm
    where cm.user_id = (select auth.uid())
      and cm.company_id = company_members.company_id
      and cm.role = 'owner'
  )
);
