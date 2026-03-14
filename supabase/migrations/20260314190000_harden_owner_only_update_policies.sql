-- Harden company/member update RBAC to owner-only.

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

drop policy if exists companies_update_admin on public.companies;
drop policy if exists companies_update_owner on public.companies;

create policy companies_update_owner
on public.companies
for update
using (public.has_company_role(id, array['owner']))
with check (public.has_company_role(id, array['owner']));
