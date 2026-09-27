-- PsyLattice Phase 4B: collaboration access context
-- Adds secure, reusable access-resolution functions without widening access
-- to participant-level research tables yet.

begin;

create or replace function public.psylattice_my_study_access()
returns table (
  study_id uuid,
  title text,
  status text,
  owner_user_id uuid,
  access_type text,
  role text,
  permissions jsonb,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select auth.uid() as user_id
  ),
  owned as (
    select
      s.id as study_id,
      s.title,
      s.status,
      s.owner_user_id,
      'owner'::text as access_type,
      'owner'::text as role,
      jsonb_build_object(
        'study_builder', true,
        'recruitment', true,
        'participants', true,
        'data_explorer', true,
        'analysis', true,
        'thesis', true,
        'study_health', true,
        'exports', true,
        'can_edit', true,
        'can_comment', true,
        'can_review', true,
        'manage_team', true
      ) as permissions,
      s.updated_at
    from public.research_studies s, me
    where s.owner_user_id = me.user_id
  ),
  shared as (
    select
      s.id as study_id,
      s.title,
      s.status,
      s.owner_user_id,
      'collaborator'::text as access_type,
      c.role,
      c.permissions,
      greatest(s.updated_at, c.updated_at) as updated_at
    from public.study_collaborators c
    join public.research_studies s on s.id = c.study_id
    cross join me
    where c.user_id = me.user_id
      and c.status = 'active'
  )
  select * from owned
  union all
  select * from shared
  order by updated_at desc;
$$;

create or replace function public.psylattice_study_access_context(
  p_study_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_study public.research_studies%rowtype;
  v_member public.study_collaborators%rowtype;
begin
  if v_user_id is null then
    return jsonb_build_object(
      'ok', false,
      'allowed', false,
      'error', 'Not authenticated.'
    );
  end if;

  select *
    into v_study
  from public.research_studies
  where id = p_study_id;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'allowed', false,
      'error', 'Study not found.'
    );
  end if;

  if v_study.owner_user_id = v_user_id then
    return jsonb_build_object(
      'ok', true,
      'allowed', true,
      'access_type', 'owner',
      'role', 'owner',
      'study_id', v_study.id,
      'study_title', v_study.title,
      'owner_user_id', v_study.owner_user_id,
      'study_status', v_study.status,
      'permissions', jsonb_build_object(
        'study_builder', true,
        'recruitment', true,
        'participants', true,
        'data_explorer', true,
        'analysis', true,
        'thesis', true,
        'study_health', true,
        'exports', true,
        'can_edit', true,
        'can_comment', true,
        'can_review', true,
        'manage_team', true
      )
    );
  end if;

  select *
    into v_member
  from public.study_collaborators
  where study_id = p_study_id
    and user_id = v_user_id
    and status = 'active'
  limit 1;

  if not found then
    return jsonb_build_object(
      'ok', true,
      'allowed', false,
      'study_id', v_study.id,
      'study_title', v_study.title,
      'error', 'You do not have access to this study.'
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'allowed', true,
    'access_type', 'collaborator',
    'role', v_member.role,
    'study_id', v_study.id,
    'study_title', v_study.title,
    'owner_user_id', v_study.owner_user_id,
    'study_status', v_study.status,
    'permissions', v_member.permissions
  );
end;
$$;

revoke all on function public.psylattice_my_study_access() from public;
revoke all on function public.psylattice_study_access_context(uuid) from public;

grant execute on function public.psylattice_my_study_access() to authenticated;
grant execute on function public.psylattice_study_access_context(uuid) to authenticated;

commit;
