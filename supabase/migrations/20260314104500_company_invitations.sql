-- Onboarding invitations for role-aware company member enrollment
-- Created: 2026-03-14

create extension if not exists "citext";

create table if not exists public.company_invitations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  email citext not null,
  role text not null,
  status text not null default 'pending',
  invite_token uuid not null default gen_random_uuid(),
  invited_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null default timezone('utc', now()) + interval '7 days',
  accepted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint company_invitations_role_check check (role in ('admin', 'dispatcher', 'driver', 'viewer')),
  constraint company_invitations_status_check check (status in ('pending', 'accepted', 'revoked', 'expired')),
  constraint company_invitations_time_window check (accepted_at is null or accepted_at >= created_at),
  constraint company_invitations_unique_token unique (invite_token)
);

create index if not exists idx_company_invitations_company_id
  on public.company_invitations (company_id);

create index if not exists idx_company_invitations_email
  on public.company_invitations (email);

create index if not exists idx_company_invitations_status
  on public.company_invitations (company_id, status);

create index if not exists idx_company_invitations_expires_at
  on public.company_invitations (expires_at);

create trigger trg_company_invitations_updated_at
before update on public.company_invitations
for each row execute function public.set_updated_at();

alter table public.company_invitations enable row level security;

create policy company_invitations_select_member
on public.company_invitations
for select
using (public.has_company_role(company_id, array['owner', 'admin', 'dispatcher', 'viewer']));

create policy company_invitations_insert_owner_admin
on public.company_invitations
for insert
with check (public.has_company_role(company_id, array['owner', 'admin']));

create policy company_invitations_update_owner_admin
on public.company_invitations
for update
using (public.has_company_role(company_id, array['owner', 'admin']))
with check (public.has_company_role(company_id, array['owner', 'admin']));

create policy company_invitations_delete_owner_admin
on public.company_invitations
for delete
using (public.has_company_role(company_id, array['owner', 'admin']));
