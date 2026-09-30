-- PsyLattice Workshop Pricing Update
-- New schedule:
--   ₹299 through 15 October 2026 (inclusive)
--   ₹399 from 16 October through 31 October 2026
--   ₹599 from 1 November through 7 November 2026
--
-- starts_at is inclusive; ends_at is exclusive.
-- All times are India Standard Time (+05:30).

begin;

with target_workshop as (
  select id
  from public.psylattice_workshops
  where slug = 'foundations-modern-psychological-research-2026'
),
new_windows(label, starts_at, ends_at, amount_paise) as (
  values
    (
      'Early registration',
      timestamptz '2026-09-01 00:00:00+05:30',
      timestamptz '2026-10-16 00:00:00+05:30',
      29900
    ),
    (
      'Standard registration',
      timestamptz '2026-10-16 00:00:00+05:30',
      timestamptz '2026-11-01 00:00:00+05:30',
      39900
    ),
    (
      'Final registration',
      timestamptz '2026-11-01 00:00:00+05:30',
      timestamptz '2026-11-08 00:00:00+05:30',
      59900
    )
)
update public.psylattice_workshop_pricing_windows p
set
  starts_at = nw.starts_at,
  ends_at = nw.ends_at,
  amount_paise = nw.amount_paise
from target_workshop w, new_windows nw
where p.workshop_id = w.id
  and p.label = nw.label;

commit;

select
  p.label,
  p.amount_paise,
  p.starts_at at time zone 'Asia/Kolkata' as starts_at_ist,
  p.ends_at at time zone 'Asia/Kolkata' as ends_at_ist
from public.psylattice_workshop_pricing_windows p
join public.psylattice_workshops w
  on w.id = p.workshop_id
where w.slug = 'foundations-modern-psychological-research-2026'
order by p.starts_at;
