-- PsyLattice Phase 4D: Collaboration Review Manager
-- Review cards are visible to the study owner and every active collaborator.
-- Any active collaborator (including Viewer) can create a review card.
-- Only the study owner can resolve, reopen or dismiss a card.

begin;

create table if not exists public.study_collaboration_reviews (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.research_studies(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  author_email text not null,
  author_role text not null,
  title text not null,
  body text not null,
  category text not null default 'general'
    check (
      category in (
        'general',
        'study_design',
        'recruitment',
        'participants',
        'data',
        'analysis',
        'writing',
        'study_health',
        'ethics'
      )
    ),
  priority text not null default 'normal'
    check (priority in ('normal', 'important', 'urgent')),
  status text not null default 'open'
    check (status in ('open', 'resolved', 'dismissed')),
  source_screen text,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists study_collaboration_reviews_study_status_created_idx
  on public.study_collaboration_reviews (study_id, status, created_at desc);

create index if not exists study_collaboration_reviews_author_idx
  on public.study_collaboration_reviews (author_user_id, created_at desc);

drop trigger if exists study_collaboration_reviews_touch_updated_at
  on public.study_collaboration_reviews;

create trigger study_collaboration_reviews_touch_updated_at
before update on public.study_collaboration_reviews
for each row
execute function public.psylattice_collaboration_touch_updated_at();

alter table public.study_collaboration_reviews enable row level security;

drop policy if exists "study_collaboration_reviews_select_team"
  on public.study_collaboration_reviews;
create policy "study_collaboration_reviews_select_team"
on public.study_collaboration_reviews
for select
to authenticated
using (
  public.psylattice_is_study_owner(study_id)
  or public.psylattice_is_active_study_collaborator(study_id)
);

drop policy if exists "study_collaboration_reviews_insert_team"
  on public.study_collaboration_reviews;
create policy "study_collaboration_reviews_insert_team"
on public.study_collaboration_reviews
for insert
to authenticated
with check (
  author_user_id = auth.uid()
  and (
    public.psylattice_is_study_owner(study_id)
    or public.psylattice_is_active_study_collaborator(study_id)
  )
);

drop policy if exists "study_collaboration_reviews_update_owner"
  on public.study_collaboration_reviews;
create policy "study_collaboration_reviews_update_owner"
on public.study_collaboration_reviews
for update
to authenticated
using (public.psylattice_is_study_owner(study_id))
with check (public.psylattice_is_study_owner(study_id));

grant select, insert, update
on table public.study_collaboration_reviews
to authenticated;

commit;
