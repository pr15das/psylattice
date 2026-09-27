-- PsyLattice Phase 4G: controlled shared Thesis editing
-- Collaborators with BOTH Thesis access and can_edit can save changes through
-- the server API. Every save snapshots the previous owner document first.
--
-- Direct authenticated-user table UPDATE access is NOT granted.

begin;

create table if not exists public.study_collaboration_document_edits (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.research_studies(id) on delete cascade,
  document_id uuid not null references public.research_writing_documents(id) on delete cascade,
  editor_user_id uuid not null references auth.users(id) on delete cascade,
  editor_email text not null,
  editor_role text not null,
  document_title text not null,
  previous_content_html text not null default '',
  previous_content_text text not null default '',
  previous_updated_at timestamptz,
  saved_updated_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists study_collaboration_document_edits_doc_created_idx
  on public.study_collaboration_document_edits (document_id, created_at desc);

create index if not exists study_collaboration_document_edits_study_created_idx
  on public.study_collaboration_document_edits (study_id, created_at desc);

alter table public.study_collaboration_document_edits enable row level security;

drop policy if exists "study_collaboration_document_edits_owner_select"
  on public.study_collaboration_document_edits;
create policy "study_collaboration_document_edits_owner_select"
on public.study_collaboration_document_edits
for select
to authenticated
using (public.psylattice_is_study_owner(study_id));

-- Server-only mutation path. service_role still passes through explicit API
-- permission checks before it touches an owner document.
grant select, insert
on table public.study_collaboration_document_edits
to service_role;

grant select, update
on table public.research_writing_documents
to service_role;

commit;
