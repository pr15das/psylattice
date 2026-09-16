begin;

create table if not exists public.psylattice_workshops (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  cohort_label text not null,
  possible_start_date date,
  registration_opens_at timestamptz not null,
  registration_closes_at timestamptz not null,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint psylattice_workshops_registration_window_check
    check (registration_opens_at < registration_closes_at)
);

create table if not exists public.psylattice_workshop_pricing_windows (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.psylattice_workshops(id) on delete cascade,
  label text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  amount_paise integer not null,
  created_at timestamptz not null default now(),
  constraint psylattice_workshop_pricing_window_check check (starts_at < ends_at),
  constraint psylattice_workshop_pricing_amount_check check (amount_paise > 0),
  constraint psylattice_workshop_pricing_unique_label unique (workshop_id, label)
);

create index if not exists psylattice_workshop_pricing_window_lookup_idx
  on public.psylattice_workshop_pricing_windows (workshop_id, starts_at, ends_at);

create table if not exists public.psylattice_workshop_registrations (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.psylattice_workshops(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  pricing_window_id uuid references public.psylattice_workshop_pricing_windows(id) on delete set null,
  quoted_amount_paise integer not null,
  currency text not null default 'INR',
  status text not null default 'pending_payment',

  full_name text not null,
  age smallint not null,
  contact_email text not null,
  contact_number text not null,
  current_city text not null,
  state_region text not null,
  country text not null,
  institution_name text not null,
  educational_qualification text not null,
  current_programme_course text not null,
  year_semester text,

  razorpay_order_id text,
  razorpay_payment_id text,
  payment_verified_at timestamptz,
  workshop_reference text unique,
  whatsapp_access_granted_at timestamptz,
  completed_at timestamptz,
  completed_by uuid references auth.users(id) on delete set null,
  certificate_issued_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint psylattice_workshop_registration_unique_user
    unique (workshop_id, user_id),
  constraint psylattice_workshop_registration_amount_check
    check (quoted_amount_paise > 0),
  constraint psylattice_workshop_registration_age_check
    check (age between 13 and 120),
  constraint psylattice_workshop_registration_status_check
    check (status in ('pending_payment', 'paid', 'completed', 'cancelled', 'refunded'))
);

create index if not exists psylattice_workshop_registrations_user_idx
  on public.psylattice_workshop_registrations (user_id, created_at desc);

create index if not exists psylattice_workshop_registrations_status_idx
  on public.psylattice_workshop_registrations (workshop_id, status, created_at desc);

create index if not exists psylattice_workshop_registrations_payment_idx
  on public.psylattice_workshop_registrations (razorpay_payment_id)
  where razorpay_payment_id is not null;

create or replace function public.psylattice_workshop_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists psylattice_workshops_touch_updated_at on public.psylattice_workshops;
create trigger psylattice_workshops_touch_updated_at
before update on public.psylattice_workshops
for each row execute function public.psylattice_workshop_touch_updated_at();

drop trigger if exists psylattice_workshop_registrations_touch_updated_at on public.psylattice_workshop_registrations;
create trigger psylattice_workshop_registrations_touch_updated_at
before update on public.psylattice_workshop_registrations
for each row execute function public.psylattice_workshop_touch_updated_at();

create or replace function public.psylattice_workshop_assign_reference()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.workshop_reference is null and new.status in ('paid', 'completed') then
    new.workshop_reference := 'PSY-W26-' || upper(substr(md5(random()::text || clock_timestamp()::text || new.id::text), 1, 6));
  end if;
  return new;
end;
$$;

drop trigger if exists psylattice_workshop_assign_reference on public.psylattice_workshop_registrations;
create trigger psylattice_workshop_assign_reference
before insert or update of status on public.psylattice_workshop_registrations
for each row execute function public.psylattice_workshop_assign_reference();

alter table public.psylattice_workshops enable row level security;
alter table public.psylattice_workshop_pricing_windows enable row level security;
alter table public.psylattice_workshop_registrations enable row level security;

drop policy if exists psylattice_public_workshops_read on public.psylattice_workshops;
create policy psylattice_public_workshops_read
on public.psylattice_workshops
for select
to anon, authenticated
using (is_published = true);

drop policy if exists psylattice_public_workshop_pricing_read on public.psylattice_workshop_pricing_windows;
create policy psylattice_public_workshop_pricing_read
on public.psylattice_workshop_pricing_windows
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.psylattice_workshops w
    where w.id = workshop_id
      and w.is_published = true
  )
);

drop policy if exists psylattice_workshop_registration_owner_read on public.psylattice_workshop_registrations;
create policy psylattice_workshop_registration_owner_read
on public.psylattice_workshop_registrations
for select
to authenticated
using (user_id = auth.uid());

-- Phase 8C account moderation may already be installed in the target database.
-- If it is present, make the new registration table obey the same restrictive gate.
do $$
begin
  if to_regprocedure('public.psylattice_account_is_allowed()') is not null then
    execute 'drop policy if exists psylattice_active_account_gate on public.psylattice_workshop_registrations';
    execute $policy$
      create policy psylattice_active_account_gate
      on public.psylattice_workshop_registrations
      as restrictive
      for all
      to authenticated
      using (public.psylattice_account_is_allowed())
      with check (public.psylattice_account_is_allowed())
    $policy$;
  end if;
end
$$;

revoke all on table public.psylattice_workshops from anon, authenticated;
revoke all on table public.psylattice_workshop_pricing_windows from anon, authenticated;
revoke all on table public.psylattice_workshop_registrations from anon, authenticated;

grant select on table public.psylattice_workshops to anon, authenticated;
grant select on table public.psylattice_workshop_pricing_windows to anon, authenticated;
grant select on table public.psylattice_workshop_registrations to authenticated;

insert into public.psylattice_workshops (
  slug,
  title,
  cohort_label,
  possible_start_date,
  registration_opens_at,
  registration_closes_at,
  is_published
)
values (
  'foundations-modern-psychological-research-2026',
  'Foundations of Modern Psychological Research with PsyLattice',
  'November 2026',
  date '2026-11-07',
  timestamptz '2026-09-01 00:00:00+05:30',
  timestamptz '2026-11-08 00:00:00+05:30',
  true
)
on conflict (slug) do update set
  title = excluded.title,
  cohort_label = excluded.cohort_label,
  possible_start_date = excluded.possible_start_date,
  registration_opens_at = excluded.registration_opens_at,
  registration_closes_at = excluded.registration_closes_at,
  is_published = excluded.is_published,
  updated_at = now();

with workshop as (
  select id
  from public.psylattice_workshops
  where slug = 'foundations-modern-psychological-research-2026'
)
insert into public.psylattice_workshop_pricing_windows (
  workshop_id,
  label,
  starts_at,
  ends_at,
  amount_paise
)
select workshop.id, pricing.label, pricing.starts_at, pricing.ends_at, pricing.amount_paise
from workshop
cross join (
  values
    ('Early registration', timestamptz '2026-09-01 00:00:00+05:30', timestamptz '2026-10-01 00:00:00+05:30', 29900),
    ('Standard registration', timestamptz '2026-10-01 00:00:00+05:30', timestamptz '2026-10-25 00:00:00+05:30', 39900),
    ('Final registration', timestamptz '2026-10-25 00:00:00+05:30', timestamptz '2026-11-08 00:00:00+05:30', 59900)
) as pricing(label, starts_at, ends_at, amount_paise)
on conflict (workshop_id, label) do update set
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  amount_paise = excluded.amount_paise;

commit;
