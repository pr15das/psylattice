-- PsyLattice: study-scoped Thesis Builder documents
-- Recreated for source control after the equivalent schema change was
-- already applied directly to the production Supabase database.
--
-- IMPORTANT:
-- - This migration does NOT backfill existing documents.
-- - Existing Thesis Builder documents remain unlinked (study_id = NULL)
--   until the researcher links them to a study.
-- - One study may have many Thesis Builder documents.
-- - A document may only link to a study owned by the same user.

begin;

-- 1) Add nullable study link.
alter table public.research_writing_documents
  add column if not exists study_id uuid;

comment on column public.research_writing_documents.study_id is
  'Optional study linked to this Thesis Builder document. Multiple documents may link to the same study.';

-- 2) Add FK to research_studies, but only if an equivalent FK does not
--    already exist. ON DELETE SET NULL preserves the writing document if
--    its study is deleted.
do $$
declare
  study_attnum smallint;
begin
  select a.attnum
    into study_attnum
  from pg_attribute a
  where a.attrelid = 'public.research_writing_documents'::regclass
    and a.attname = 'study_id'
    and not a.attisdropped;

  if study_attnum is null then
    raise exception 'research_writing_documents.study_id does not exist';
  end if;

  if not exists (
    select 1
    from pg_constraint c
    where c.contype = 'f'
      and c.conrelid = 'public.research_writing_documents'::regclass
      and c.confrelid = 'public.research_studies'::regclass
      and study_attnum = any (c.conkey)
  ) then
    alter table public.research_writing_documents
      add constraint research_writing_documents_study_id_fkey
      foreign key (study_id)
      references public.research_studies(id)
      on delete set null;
  end if;
end
$$;

-- 3) Fast owner + study lookups for Thesis Builder and Research Assistant.
create index if not exists research_writing_documents_owner_study_updated_idx
  on public.research_writing_documents
  (owner_user_id, study_id, updated_at desc);

-- 4) Prevent a Thesis Builder document from being linked to another
--    researcher's study.
create or replace function public.psylattice_validate_writing_document_study_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.study_id is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.research_studies s
    where s.id = new.study_id
      and s.owner_user_id = new.owner_user_id
  ) then
    raise exception
      'Thesis Builder documents may only be linked to a study owned by the same researcher.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists research_writing_documents_validate_study_owner
  on public.research_writing_documents;

create trigger research_writing_documents_validate_study_owner
before insert or update of study_id, owner_user_id
on public.research_writing_documents
for each row
execute function public.psylattice_validate_writing_document_study_owner();

commit;
