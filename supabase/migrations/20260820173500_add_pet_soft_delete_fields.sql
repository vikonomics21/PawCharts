alter table public.pets
add column if not exists deleted_at timestamptz,
add column if not exists deleted_reason text,
add column if not exists deleted_notes text;

create index if not exists pets_household_not_deleted_idx
on public.pets(household_id, created_at)
where deleted_at is null;

create index if not exists pets_household_deleted_idx
on public.pets(household_id, deleted_at)
where deleted_at is not null;
