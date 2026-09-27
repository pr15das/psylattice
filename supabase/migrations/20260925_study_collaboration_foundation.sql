-- PsyLattice Phase 4A: study collaboration + supervisor foundation
-- Safe to run once in Supabase SQL Editor. The statements are written to be
-- re-runnable where practical, but this migration should still be treated as
-- a schema migration and committed to source control.
--
-- Scope of Phase 4A:
--   * study-scoped collaborators
--   * email-bound invitations
--   * roles + module permission flags
--   * suspend/revoke support
--   * collaboration activity log
--   * secure invite acceptance by the signed-in email
--
-- This migration DOES NOT yet widen the RLS policies of every research table.
-- Shared access to Study Builder / Analysis / Thesis / participant data is
-- enabled module-by-module in the next collaboration step.

begin;

create table if not exists public.study_collaborators (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.research_studies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  role text not null default 'viewer'
    check (role in ('supervisor', 'researcher', 'analyst', 'viewer')),
  permissions jsonb not null default '{}'::jsonb,
  status text not null default 'active'
    check (status in ('active', 'suspended', 'revoked')),
  invited_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (study_id, user_id)
);

create table if not exists public.study_collaboration_invites (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.research_studies(id) on delete cascade,
  study_title text not null default 'Untitled study',
  email text not null,
  role text not null default 'viewer'
    check (role in ('supervisor', 'researcher', 'analyst', 'viewer')),
  permissions jsonb not null default '{}'::jsonb,
  token_hash text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'revoked', 'expired')),
  invited_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_collaboration_activity (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.research_studies(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_user_id uuid references auth.users(id) on delete set null,
  target_email text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists study_collaboration_invites_pending_email_idx
  on public.study_collaboration_invites (study_id, lower(email))
  where status = 'pending';

create index if not exists study_collaborators_user_status_idx
  on public.study_collaborators (user_id, status, study_id);

create index if not exists study_collaborators_study_status_idx
  on public.study_collaborators (study_id, status, updated_at desc);

create index if not exists study_collaboration_invites_email_status_idx
  on public.study_collaboration_invites (lower(email), status, expires_at);

create index if not exists study_collaboration_activity_study_created_idx
  on public.study_collaboration_activity (study_id, created_at desc);

create or replace function public.psylattice_collaboration_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists study_collaborators_touch_updated_at
  on public.study_collaborators;
create trigger study_collaborators_touch_updated_at
before update on public.study_collaborators
for each row execute function public.psylattice_collaboration_touch_updated_at();

drop trigger if exists study_collaboration_invites_touch_updated_at
  on public.study_collaboration_invites;
create trigger study_collaboration_invites_touch_updated_at
before update on public.study_collaboration_invites
for each row execute function public.psylattice_collaboration_touch_updated_at();

create or replace function public.psylattice_is_study_owner(
  p_study_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.research_studies s
    where s.id = p_study_id
      and s.owner_user_id = p_user_id
  );
$$;

create or replace function public.psylattice_is_active_study_collaborator(
  p_study_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.study_collaborators c
    where c.study_id = p_study_id
      and c.user_id = p_user_id
      and c.status = 'active'
  );
$$;

create or replace function public.psylattice_study_has_permission(
  p_study_id uuid,
  p_permission text,
  p_user_id uuid default auth.uid()
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_user_id is null or p_study_id is null then
    return false;
  end if;

  if public.psylattice_is_study_owner(p_study_id, p_user_id) then
    return true;
  end if;

  return exists (
    select 1
    from public.study_collaborators c
    where c.study_id = p_study_id
      and c.user_id = p_user_id
      and c.status = 'active'
      and c.permissions @> jsonb_build_object(p_permission, true)
  );
end;
$$;

create or replace function public.psylattice_accept_study_invite_id(
  p_invite_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
  v_display_name text := nullif(
    trim(
      coalesce(
        auth.jwt() -> 'user_metadata' ->> 'full_name',
        auth.jwt() -> 'user_metadata' ->> 'name',
        ''
      )
    ),
    ''
  );
  v_invite public.study_collaboration_invites%rowtype;
  v_owner_id uuid;
begin
  if v_user_id is null then
    return jsonb_build_object(
      'ok', false,
      'error', 'Please sign in before accepting this invitation.'
    );
  end if;

  if v_email = '' then
    return jsonb_build_object(
      'ok', false,
      'error', 'Your signed-in account does not expose a verified email address.'
    );
  end if;

  select *
    into v_invite
  from public.study_collaboration_invites
  where id = p_invite_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'This invitation could not be found.');
  end if;

  if v_invite.status <> 'pending' then
    return jsonb_build_object('ok', false, 'error', 'This invitation is no longer pending.');
  end if;

  if v_invite.expires_at <= now() then
    update public.study_collaboration_invites
    set status = 'expired'
    where id = v_invite.id;

    return jsonb_build_object('ok', false, 'error', 'This invitation has expired.');
  end if;

  if lower(trim(v_invite.email)) <> v_email then
    return jsonb_build_object(
      'ok', false,
      'error', 'This invitation was sent to a different email address.'
    );
  end if;

  select owner_user_id
    into v_owner_id
  from public.research_studies
  where id = v_invite.study_id;

  if v_owner_id is null then
    return jsonb_build_object('ok', false, 'error', 'The invited study no longer exists.');
  end if;

  if v_owner_id = v_user_id then
    return jsonb_build_object(
      'ok', false,
      'error', 'The study owner cannot also join as a collaborator.'
    );
  end if;

  insert into public.study_collaborators (
    study_id,
    user_id,
    email,
    display_name,
    role,
    permissions,
    status,
    invited_by,
    accepted_at
  )
  values (
    v_invite.study_id,
    v_user_id,
    v_email,
    v_display_name,
    v_invite.role,
    v_invite.permissions,
    'active',
    v_invite.invited_by,
    now()
  )
  on conflict (study_id, user_id)
  do update set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, public.study_collaborators.display_name),
    role = excluded.role,
    permissions = excluded.permissions,
    status = 'active',
    invited_by = excluded.invited_by,
    accepted_at = now(),
    updated_at = now();

  update public.study_collaboration_invites
  set
    status = 'accepted',
    accepted_at = now()
  where id = v_invite.id;

  insert into public.study_collaboration_activity (
    study_id,
    actor_user_id,
    action,
    target_user_id,
    target_email,
    metadata
  )
  values (
    v_invite.study_id,
    v_user_id,
    'invite_accepted',
    v_user_id,
    v_email,
    jsonb_build_object('role', v_invite.role, 'invite_id', v_invite.id)
  );

  return jsonb_build_object(
    'ok', true,
    'study_id', v_invite.study_id,
    'study_title', v_invite.study_title,
    'role', v_invite.role
  );
end;
$$;

create or replace function public.psylattice_accept_study_invite(
  p_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_email text := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
  v_invite_id uuid;
begin
  if auth.uid() is null then
    return jsonb_build_object(
      'ok', false,
      'error', 'Please sign in before accepting this invitation.'
    );
  end if;

  if nullif(trim(coalesce(p_token, '')), '') is null then
    return jsonb_build_object('ok', false, 'error', 'The invitation token is missing.');
  end if;

  select i.id
    into v_invite_id
  from public.study_collaboration_invites i
  where i.token_hash = encode(digest(p_token, 'sha256'), 'hex')
    and i.status = 'pending'
    and i.expires_at > now()
    and lower(trim(i.email)) = v_email
  limit 1;

  if v_invite_id is null then
    return jsonb_build_object(
      'ok', false,
      'error', 'This invitation is invalid, expired, or belongs to another email address.'
    );
  end if;

  return public.psylattice_accept_study_invite_id(v_invite_id);
end;
$$;

alter table public.study_collaborators enable row level security;
alter table public.study_collaboration_invites enable row level security;
alter table public.study_collaboration_activity enable row level security;

drop policy if exists "study_collaborators_select_owner_or_self"
  on public.study_collaborators;
create policy "study_collaborators_select_owner_or_self"
on public.study_collaborators
for select
to authenticated
using (
  public.psylattice_is_study_owner(study_id)
  or user_id = auth.uid()
);

drop policy if exists "study_collaborators_insert_owner"
  on public.study_collaborators;
create policy "study_collaborators_insert_owner"
on public.study_collaborators
for insert
to authenticated
with check (public.psylattice_is_study_owner(study_id));

drop policy if exists "study_collaborators_update_owner"
  on public.study_collaborators;
create policy "study_collaborators_update_owner"
on public.study_collaborators
for update
to authenticated
using (public.psylattice_is_study_owner(study_id))
with check (public.psylattice_is_study_owner(study_id));

drop policy if exists "study_collaborators_delete_owner"
  on public.study_collaborators;
create policy "study_collaborators_delete_owner"
on public.study_collaborators
for delete
to authenticated
using (public.psylattice_is_study_owner(study_id));

drop policy if exists "study_collaboration_invites_select_owner_or_recipient"
  on public.study_collaboration_invites;
create policy "study_collaboration_invites_select_owner_or_recipient"
on public.study_collaboration_invites
for select
to authenticated
using (
  public.psylattice_is_study_owner(study_id)
  or lower(trim(email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
);

drop policy if exists "study_collaboration_invites_insert_owner"
  on public.study_collaboration_invites;
create policy "study_collaboration_invites_insert_owner"
on public.study_collaboration_invites
for insert
to authenticated
with check (
  public.psylattice_is_study_owner(study_id)
  and invited_by = auth.uid()
);

drop policy if exists "study_collaboration_invites_update_owner"
  on public.study_collaboration_invites;
create policy "study_collaboration_invites_update_owner"
on public.study_collaboration_invites
for update
to authenticated
using (public.psylattice_is_study_owner(study_id))
with check (public.psylattice_is_study_owner(study_id));

drop policy if exists "study_collaboration_invites_delete_owner"
  on public.study_collaboration_invites;
create policy "study_collaboration_invites_delete_owner"
on public.study_collaboration_invites
for delete
to authenticated
using (public.psylattice_is_study_owner(study_id));

drop policy if exists "study_collaboration_activity_select_owner"
  on public.study_collaboration_activity;
create policy "study_collaboration_activity_select_owner"
on public.study_collaboration_activity
for select
to authenticated
using (public.psylattice_is_study_owner(study_id));

drop policy if exists "study_collaboration_activity_insert_owner"
  on public.study_collaboration_activity;
create policy "study_collaboration_activity_insert_owner"
on public.study_collaboration_activity
for insert
to authenticated
with check (
  public.psylattice_is_study_owner(study_id)
  and actor_user_id = auth.uid()
);

revoke all on function public.psylattice_is_study_owner(uuid, uuid) from public;
revoke all on function public.psylattice_is_active_study_collaborator(uuid, uuid) from public;
revoke all on function public.psylattice_study_has_permission(uuid, text, uuid) from public;
revoke all on function public.psylattice_accept_study_invite_id(uuid) from public;
revoke all on function public.psylattice_accept_study_invite(text) from public;

grant execute on function public.psylattice_is_study_owner(uuid, uuid) to authenticated;
grant execute on function public.psylattice_is_active_study_collaborator(uuid, uuid) to authenticated;
grant execute on function public.psylattice_study_has_permission(uuid, text, uuid) to authenticated;
grant execute on function public.psylattice_accept_study_invite_id(uuid) to authenticated;
grant execute on function public.psylattice_accept_study_invite(text) to authenticated;

commit;
