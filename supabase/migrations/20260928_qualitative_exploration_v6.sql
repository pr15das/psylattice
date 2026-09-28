-- PsyLattice Qualitative Exploration V6
-- Global search collections, explicit qualitative relationships, project history,
-- and visualization-supporting metadata. Text/media ingestion capabilities are unchanged.

begin;

create table if not exists public.qualitative_sets (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  study_id uuid not null references public.research_studies(id) on delete cascade,
  name text not null,
  description text,
  color text not null default '#06b6d4',
  status text not null default 'active'
    check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists qualitative_sets_unique_name_idx
  on public.qualitative_sets (owner_user_id, study_id, lower(name))
  where status = 'active';

create index if not exists qualitative_sets_study_idx
  on public.qualitative_sets (owner_user_id, study_id, updated_at desc);

create table if not exists public.qualitative_set_items (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  study_id uuid not null references public.research_studies(id) on delete cascade,
  set_id uuid not null references public.qualitative_sets(id) on delete cascade,
  item_type text not null check (item_type in ('case', 'source')),
  item_id uuid not null,
  created_at timestamptz not null default now(),
  unique (set_id, item_type, item_id)
);

create index if not exists qualitative_set_items_study_idx
  on public.qualitative_set_items
  (owner_user_id, study_id, set_id, item_type, item_id);

create table if not exists public.qualitative_relationships (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  study_id uuid not null references public.research_studies(id) on delete cascade,
  from_type text not null
    check (from_type in ('case', 'source', 'code', 'theme', 'memo', 'coding', 'annotation')),
  from_id uuid not null,
  to_type text not null
    check (to_type in ('case', 'source', 'code', 'theme', 'memo', 'coding', 'annotation')),
  to_id uuid not null,
  relationship_type text not null default 'relates_to'
    check (
      relationship_type in (
        'relates_to',
        'supports',
        'contradicts',
        'precedes',
        'explains',
        'causes',
        'custom'
      )
    ),
  custom_label text,
  note text,
  created_by_user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint qualitative_relationship_not_self_check
    check (not (from_type = to_type and from_id = to_id))
);

create index if not exists qualitative_relationships_study_idx
  on public.qualitative_relationships
  (owner_user_id, study_id, created_at desc);

create index if not exists qualitative_relationships_from_idx
  on public.qualitative_relationships
  (study_id, from_type, from_id);

create index if not exists qualitative_relationships_to_idx
  on public.qualitative_relationships
  (study_id, to_type, to_id);

create table if not exists public.qualitative_audit_log (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  study_id uuid not null references public.research_studies(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action_type text not null,
  entity_type text not null,
  entity_id uuid,
  summary text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists qualitative_audit_log_study_idx
  on public.qualitative_audit_log
  (owner_user_id, study_id, created_at desc);

create index if not exists qualitative_audit_log_entity_idx
  on public.qualitative_audit_log
  (study_id, entity_type, entity_id, created_at desc);

-- Touch timestamps using the qualitative updated_at helper installed by the foundation.
drop trigger if exists qualitative_sets_touch_updated_at
  on public.qualitative_sets;
create trigger qualitative_sets_touch_updated_at
before update on public.qualitative_sets
for each row execute function public.psylattice_touch_qualitative_updated_at();

drop trigger if exists qualitative_relationships_touch_updated_at
  on public.qualitative_relationships;
create trigger qualitative_relationships_touch_updated_at
before update on public.qualitative_relationships
for each row execute function public.psylattice_touch_qualitative_updated_at();

create or replace function public.psylattice_validate_qualitative_set()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.research_studies s
    where s.id = new.study_id
      and s.owner_user_id = new.owner_user_id
  ) then
    raise exception 'Qualitative sets must belong to a study owned by the same researcher.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists qualitative_sets_validate_links
  on public.qualitative_sets;
create trigger qualitative_sets_validate_links
before insert or update of owner_user_id, study_id
on public.qualitative_sets
for each row execute function public.psylattice_validate_qualitative_set();

create or replace function public.psylattice_validate_qualitative_set_item()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.qualitative_sets s
    where s.id = new.set_id
      and s.study_id = new.study_id
      and s.owner_user_id = new.owner_user_id
      and s.status = 'active'
  ) then
    raise exception 'Set items must belong to an active set in the same qualitative study.'
      using errcode = '23514';
  end if;

  if new.item_type = 'case' and not exists (
    select 1
    from public.qualitative_cases qc
    where qc.id = new.item_id
      and qc.study_id = new.study_id
      and qc.owner_user_id = new.owner_user_id
  ) then
    raise exception 'The selected qualitative case is not part of this study.'
      using errcode = '23514';
  end if;

  if new.item_type = 'source' and not exists (
    select 1
    from public.qualitative_sources qs
    where qs.id = new.item_id
      and qs.study_id = new.study_id
      and qs.owner_user_id = new.owner_user_id
  ) then
    raise exception 'The selected qualitative source is not part of this study.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists qualitative_set_items_validate_links
  on public.qualitative_set_items;
create trigger qualitative_set_items_validate_links
before insert or update of owner_user_id, study_id, set_id, item_type, item_id
on public.qualitative_set_items
for each row execute function public.psylattice_validate_qualitative_set_item();


create or replace function public.psylattice_audit_qualitative_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  row_data jsonb;
  owner_id uuid;
  study uuid;
  entity uuid;
  operation_name text;
  entity_name text;
  label text;
begin
  row_data := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  owner_id := nullif(row_data ->> 'owner_user_id', '')::uuid;
  study := nullif(row_data ->> 'study_id', '')::uuid;
  entity := nullif(row_data ->> 'id', '')::uuid;

  if owner_id is null or study is null then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  operation_name := lower(tg_op);
  entity_name := case tg_table_name
    when 'qualitative_cases' then 'case'
    when 'qualitative_sources' then 'source'
    when 'qualitative_codes' then 'code'
    when 'qualitative_codings' then 'coding'
    when 'qualitative_memos' then 'memo'
    when 'qualitative_annotations' then 'annotation'
    when 'qualitative_themes' then 'theme'
    when 'qualitative_theme_codes' then 'theme_code'
    when 'qualitative_framework_summaries' then 'framework_summary'
    when 'qualitative_reconciliations' then 'reconciliation'
    when 'qualitative_code_merge_history' then 'code_merge'
    else tg_table_name
  end;

  label := coalesce(
    nullif(row_data ->> 'name', ''),
    nullif(row_data ->> 'title', ''),
    nullif(row_data ->> 'case_key', ''),
    entity_name
  );

  insert into public.qualitative_audit_log (
    owner_user_id,
    study_id,
    actor_user_id,
    action_type,
    entity_type,
    entity_id,
    summary,
    details
  ) values (
    owner_id,
    study,
    coalesce(auth.uid(), owner_id),
    entity_name || '_' || operation_name,
    entity_name,
    entity,
    case tg_op
      when 'INSERT' then 'Created ' || entity_name || ' “' || left(label, 180) || '”.'
      when 'UPDATE' then 'Updated ' || entity_name || ' “' || left(label, 180) || '”.'
      when 'DELETE' then 'Deleted ' || entity_name || ' “' || left(label, 180) || '”.'
      else initcap(tg_op) || ' ' || entity_name || '.'
    end,
    jsonb_build_object(
      'table', tg_table_name,
      'operation', tg_op,
      'label', left(label, 180)
    )
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

-- Core qualitative project history. Large transcript bodies are deliberately not
-- copied into the audit log; only the entity/action metadata above is stored.
do $$
declare
  table_name text;
  trigger_name text;
begin
  foreach table_name in array array[
    'qualitative_cases',
    'qualitative_sources',
    'qualitative_codes',
    'qualitative_codings',
    'qualitative_memos',
    'qualitative_annotations',
    'qualitative_themes',
    'qualitative_theme_codes',
    'qualitative_framework_summaries',
    'qualitative_reconciliations',
    'qualitative_code_merge_history'
  ]
  loop
    trigger_name := table_name || '_audit_change';
    execute format('drop trigger if exists %I on public.%I', trigger_name, table_name);
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function public.psylattice_audit_qualitative_change()',
      trigger_name,
      table_name
    );
  end loop;
end;
$$;

alter table public.qualitative_sets enable row level security;
alter table public.qualitative_set_items enable row level security;
alter table public.qualitative_relationships enable row level security;
alter table public.qualitative_audit_log enable row level security;

drop policy if exists qualitative_sets_owner_all on public.qualitative_sets;
create policy qualitative_sets_owner_all
on public.qualitative_sets
for all to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists qualitative_set_items_owner_all on public.qualitative_set_items;
create policy qualitative_set_items_owner_all
on public.qualitative_set_items
for all to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists qualitative_relationships_owner_all on public.qualitative_relationships;
create policy qualitative_relationships_owner_all
on public.qualitative_relationships
for all to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists qualitative_audit_log_owner_select on public.qualitative_audit_log;
create policy qualitative_audit_log_owner_select
on public.qualitative_audit_log
for select to authenticated
using (owner_user_id = auth.uid());

grant select, insert, update, delete
on table
  public.qualitative_sets,
  public.qualitative_set_items,
  public.qualitative_relationships
to authenticated, service_role;

grant select, insert
on table public.qualitative_audit_log
to authenticated, service_role;

commit;
