alter table public.pets
add column if not exists archived_at timestamptz,
add column if not exists archived_reason text
  check (archived_reason is null or archived_reason in ('passed-away', 'no-longer-owned', 'other')),
add column if not exists archived_notes text;

create index if not exists pets_household_active_idx
on public.pets(household_id, created_at)
where archived_at is null;

create index if not exists pets_household_archived_idx
on public.pets(household_id, archived_at)
where archived_at is not null;
