-- PsyLattice Phase 4F: review-card source context
-- Lets review cards point to the exact Thesis document (and later other module records).

begin;

alter table public.study_collaboration_reviews
  add column if not exists source_ref text,
  add column if not exists source_label text;

create index if not exists study_collaboration_reviews_source_ref_idx
  on public.study_collaboration_reviews (study_id, source_ref)
  where source_ref is not null;

commit;
