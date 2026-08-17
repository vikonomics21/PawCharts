create extension if not exists pgcrypto;

create type household_role as enum ('owner', 'admin', 'member');
create type pet_access_role as enum ('admin', 'editor', 'viewer');
create type pet_access_status as enum ('active', 'invited', 'revoked');
create type pet_species as enum ('dog', 'cat');
create type pet_sex as enum ('male', 'female', 'unknown');
create type care_cadence as enum ('once', 'daily', 'weekly', 'monthly', 'every_8_weeks', 'yearly');
create type reminder_source as enum ('vaccine', 'medication', 'refill', 'care_event', 'measurement', 'vet_appointment', 'vet_follow_up');
create type document_record_type as enum ('vaccine_record', 'medication', 'vet_visit', 'care_event', 'measurement', 'pet');
create type log_entry_type as enum ('medication', 'care', 'vaccine', 'measurement', 'vet_visit', 'observation');
create type share_link_status as enum ('active', 'revoked');
create type share_link_type as enum ('vaccination_record');
create type vet_prep_status as enum ('open', 'addressed', 'dismissed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  first_name text,
  last_name text,
  full_name text,
  phone text,
  city text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role household_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (household_id, user_id)
);

create table public.household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  role household_role not null default 'member',
  created_by uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.pets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  species pet_species not null,
  breed text,
  sex pet_sex not null default 'unknown',
  photo_path text,
  date_of_birth date,
  approximate_age_years int,
  approximate_age_months int,
  age_is_estimated boolean not null default false,
  adoption_place text,
  adoption_date date,
  spayed_or_neutered boolean,
  microchipped boolean,
  color_markings text,
  microchip_number text,
  weight_value numeric(8, 2),
  weight_unit text not null default 'lb',
  dog_size text,
  dog_commands text,
  dog_leash_notes text,
  dog_groomer_notes text,
  cat_lifestyle text,
  cat_litter_preference text,
  cat_carrier_notes text,
  cat_declawed boolean,
  behavior_notes text,
  care_notes text,
  medical_notes text,
  known_history text,
  favorite_foods text[] not null default '{}',
  disliked_foods text[] not null default '{}',
  feeding_rules text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vet_providers (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  phone text,
  address text,
  website text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pets
add column primary_vet_provider_id uuid references public.vet_providers(id) on delete set null,
add column secondary_vet_provider_id uuid references public.vet_providers(id) on delete set null,
add column secondary_vet_role text;

create table public.pet_training_cues (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  cue text not null,
  action text not null,
  sort_order integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pet_access_members (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  email text not null,
  display_name text,
  role pet_access_role not null default 'viewer',
  status pet_access_status not null default 'invited',
  invited_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pet_id, email)
);

create table public.vaccine_definitions (
  id uuid primary key default gen_random_uuid(),
  species pet_species not null,
  name text not null,
  protects_against text not null,
  description text,
  recommended_interval_months int,
  created_at timestamptz not null default now(),
  unique (species, name)
);

create table public.vaccine_records (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  vaccine_definition_id uuid references public.vaccine_definitions(id) on delete set null,
  custom_name text,
  date_given date not null,
  expiration_date date,
  provider text,
  lot_number text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (vaccine_definition_id is not null or custom_name is not null)
);

create table public.medications (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  name text not null,
  dose text,
  frequency_label text,
  notes text,
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.medication_logs (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid references public.medications(id) on delete set null,
  pet_id uuid not null references public.pets(id) on delete cascade,
  medication_name text not null,
  dose text,
  occurred_at timestamptz not null default now(),
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.vet_visits (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  vet_provider_id uuid references public.vet_providers(id) on delete set null,
  visited_at date not null,
  provider text,
  reason text,
  notes text,
  follow_up_date date,
  total_amount_cents integer,
  currency text not null default 'USD',
  services_performed text[] not null default '{}',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vet_prep_items (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  title text not null,
  details text,
  observed_on date not null default current_date,
  status vet_prep_status not null default 'open',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.care_event_types (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households(id) on delete cascade,
  species pet_species,
  label text not null,
  is_default boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.care_events (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  care_event_type_id uuid references public.care_event_types(id) on delete set null,
  label text not null,
  occurred_at timestamptz not null default now(),
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.measurements (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  measured_at timestamptz not null default now(),
  weight_value numeric(8, 2),
  weight_unit text not null default 'lb',
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.care_routines (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  title text not null,
  source reminder_source not null,
  cadence care_cadence not null default 'once',
  next_due_date date not null,
  action_label text,
  notes text,
  dose_label text,
  refill_by_date date,
  vet_provider_id uuid references public.vet_providers(id) on delete set null,
  active boolean not null default true,
  last_completed_on date,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.observations (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  category text not null default 'other',
  title text not null,
  severity text not null default 'low',
  trigger text,
  duration text,
  medication_status text,
  notes text,
  observed_on date not null default current_date,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.log_entries (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  record_type log_entry_type not null,
  record_id uuid,
  routine_id uuid references public.care_routines(id) on delete set null,
  title text not null,
  details text,
  value text,
  original_due_date date,
  occurred_on date not null default current_date,
  completed_timing text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.reminder_rules (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  source reminder_source not null,
  source_id uuid,
  title text not null,
  due_date date not null,
  repeat_interval_days int,
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reminder_logs (
  id uuid primary key default gen_random_uuid(),
  reminder_rule_id uuid not null references public.reminder_rules(id) on delete cascade,
  completed_at timestamptz not null default now(),
  completed_by uuid references public.profiles(id) on delete set null,
  adjusted_from_date date,
  notes text
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  title text not null,
  storage_path text not null,
  content_type text,
  file_size_bytes bigint,
  document_type text,
  private_by_default boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.document_links (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  record_type document_record_type not null,
  record_id uuid not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (document_id, record_type, record_id)
);

create table public.share_links (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  label text not null default 'Vaccination record',
  link_type share_link_type not null default 'vaccination_record',
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  status share_link_status not null default 'active',
  show_owner_contact boolean not null default true,
  show_pet_photo boolean not null default true,
  show_vaccines boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table public.share_link_documents (
  share_link_id uuid not null references public.share_links(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (share_link_id, document_id)
);

create table public.share_accesses (
  id uuid primary key default gen_random_uuid(),
  share_link_id uuid not null references public.share_links(id) on delete cascade,
  accessed_at timestamptz not null default now(),
  ip_hash text,
  user_agent text
);

create index household_members_user_id_idx on public.household_members(user_id);
create index pets_household_id_idx on public.pets(household_id);
create index pets_primary_vet_provider_id_idx on public.pets(primary_vet_provider_id);
create index pets_secondary_vet_provider_id_idx on public.pets(secondary_vet_provider_id);
create index vet_providers_household_id_idx on public.vet_providers(household_id);
create index pet_training_cues_pet_id_idx on public.pet_training_cues(pet_id);
create index pet_access_members_pet_id_idx on public.pet_access_members(pet_id);
create index pet_access_members_user_id_idx on public.pet_access_members(user_id);
create index vaccine_records_pet_id_idx on public.vaccine_records(pet_id);
create index medications_pet_id_idx on public.medications(pet_id);
create index medication_logs_pet_id_idx on public.medication_logs(pet_id);
create index medication_logs_medication_id_idx on public.medication_logs(medication_id);
create index vet_visits_pet_id_idx on public.vet_visits(pet_id);
create index vet_prep_items_pet_id_idx on public.vet_prep_items(pet_id);
create index care_events_pet_id_idx on public.care_events(pet_id);
create index measurements_pet_id_idx on public.measurements(pet_id);
create index care_routines_pet_id_idx on public.care_routines(pet_id);
create index care_routines_next_due_date_idx on public.care_routines(next_due_date);
create index observations_pet_id_idx on public.observations(pet_id);
create index log_entries_pet_id_idx on public.log_entries(pet_id);
create index log_entries_record_idx on public.log_entries(record_type, record_id);
create index reminder_rules_pet_id_idx on public.reminder_rules(pet_id);
create index documents_pet_id_idx on public.documents(pet_id);
create index document_links_document_id_idx on public.document_links(document_id);
create index document_links_record_idx on public.document_links(record_type, record_id);
create index share_links_token_idx on public.share_links(token);

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invites enable row level security;
alter table public.pets enable row level security;
alter table public.vet_providers enable row level security;
alter table public.pet_training_cues enable row level security;
alter table public.pet_access_members enable row level security;
alter table public.vaccine_definitions enable row level security;
alter table public.vaccine_records enable row level security;
alter table public.medications enable row level security;
alter table public.medication_logs enable row level security;
alter table public.vet_visits enable row level security;
alter table public.vet_prep_items enable row level security;
alter table public.care_event_types enable row level security;
alter table public.care_events enable row level security;
alter table public.measurements enable row level security;
alter table public.care_routines enable row level security;
alter table public.observations enable row level security;
alter table public.log_entries enable row level security;
alter table public.reminder_rules enable row level security;
alter table public.reminder_logs enable row level security;
alter table public.documents enable row level security;
alter table public.document_links enable row level security;
alter table public.share_links enable row level security;
alter table public.share_link_documents enable row level security;
alter table public.share_accesses enable row level security;

create or replace function public.is_household_member(target_household_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household_id
      and hm.user_id = auth.uid()
  );
$$;

create or replace function public.has_household_role(target_household_id uuid, allowed_roles household_role[])
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household_id
      and hm.user_id = auth.uid()
      and hm.role = any(allowed_roles)
  );
$$;

create or replace function public.pet_household_id(target_pet_id uuid)
returns uuid
language sql
security definer
set search_path = public
as $$
  select household_id from public.pets where id = target_pet_id;
$$;

create or replace function public.record_belongs_to_pet(
  target_record_type document_record_type,
  target_record_id uuid,
  target_pet_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  case target_record_type
    when 'vaccine_record' then
      return exists (
        select 1 from public.vaccine_records vr
        where vr.id = target_record_id and vr.pet_id = target_pet_id
      );
    when 'medication' then
      return exists (
        select 1 from public.medications m
        where m.id = target_record_id and m.pet_id = target_pet_id
      )
      or exists (
        select 1 from public.medication_logs ml
        where ml.id = target_record_id and ml.pet_id = target_pet_id
      );
    when 'vet_visit' then
      return exists (
        select 1 from public.vet_visits vv
        where vv.id = target_record_id and vv.pet_id = target_pet_id
      );
    when 'care_event' then
      return exists (
        select 1 from public.care_events ce
        where ce.id = target_record_id and ce.pet_id = target_pet_id
      );
    when 'measurement' then
      return exists (
        select 1 from public.measurements ms
        where ms.id = target_record_id and ms.pet_id = target_pet_id
      );
    when 'pet' then
      return target_record_id = target_pet_id;
    else
      return false;
  end case;
end;
$$;

create policy "Users can view own profile"
on public.profiles for select
using (id = auth.uid());

create policy "Users can update own profile"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "Members can view households"
on public.households for select
using (public.is_household_member(id));

create policy "Authenticated users can create households"
on public.households for insert
with check (created_by = auth.uid());

create policy "Owners can update households"
on public.households for update
using (public.has_household_role(id, array['owner']::household_role[]))
with check (public.has_household_role(id, array['owner']::household_role[]));

create policy "Members can view household memberships"
on public.household_members for select
using (public.is_household_member(household_id));

create policy "Owners can manage household memberships"
on public.household_members for all
using (public.has_household_role(household_id, array['owner']::household_role[]))
with check (public.has_household_role(household_id, array['owner']::household_role[]));

create policy "Owners and admins can manage invites"
on public.household_invites for all
using (public.has_household_role(household_id, array['owner','admin']::household_role[]))
with check (public.has_household_role(household_id, array['owner','admin']::household_role[]));

create policy "Members can view pets"
on public.pets for select
using (public.is_household_member(household_id));

create policy "Owners and admins can manage pets"
on public.pets for all
using (public.has_household_role(household_id, array['owner','admin']::household_role[]))
with check (public.has_household_role(household_id, array['owner','admin']::household_role[]));

create policy "Members can view vet providers"
on public.vet_providers for select
using (public.is_household_member(household_id));

create policy "Owners and admins can manage vet providers"
on public.vet_providers for all
using (public.has_household_role(household_id, array['owner','admin']::household_role[]))
with check (public.has_household_role(household_id, array['owner','admin']::household_role[]));

create policy "Members can manage pet training cues"
on public.pet_training_cues for all
using (public.is_household_member(public.pet_household_id(pet_id)))
with check (public.is_household_member(public.pet_household_id(pet_id)));

create policy "Members can view pet access"
on public.pet_access_members for select
using (public.is_household_member(public.pet_household_id(pet_id)));

create policy "Owners and admins can manage pet access"
on public.pet_access_members for all
using (public.has_household_role(public.pet_household_id(pet_id), array['owner','admin']::household_role[]))
with check (public.has_household_role(public.pet_household_id(pet_id), array['owner','admin']::household_role[]));

create policy "Vaccine definitions are readable"
on public.vaccine_definitions for select
to authenticated
using (true);

create policy "Members can manage vaccine records"
on public.vaccine_records for all
using (public.is_household_member(public.pet_household_id(pet_id)))
with check (public.is_household_member(public.pet_household_id(pet_id)));

create policy "Members can manage medications"
on public.medications for all
using (public.is_household_member(public.pet_household_id(pet_id)))
with check (public.is_household_member(public.pet_household_id(pet_id)));

create policy "Members can manage medication logs"
on public.medication_logs for all
using (public.is_household_member(public.pet_household_id(pet_id)))
with check (public.is_household_member(public.pet_household_id(pet_id)));

create policy "Members can manage vet visits"
on public.vet_visits for all
using (public.is_household_member(public.pet_household_id(pet_id)))
with check (public.is_household_member(public.pet_household_id(pet_id)));

create policy "Members can manage vet prep items"
on public.vet_prep_items for all
using (public.is_household_member(public.pet_household_id(pet_id)))
with check (public.is_household_member(public.pet_household_id(pet_id)));

create policy "Default care event types are readable"
on public.care_event_types for select
using (household_id is null or public.is_household_member(household_id));

create policy "Members can manage household care event types"
on public.care_event_types for all
using (household_id is not null and public.is_household_member(household_id))
with check (household_id is not null and public.is_household_member(household_id));

create policy "Members can manage care events"
on public.care_events for all
using (public.is_household_member(public.pet_household_id(pet_id)))
with check (public.is_household_member(public.pet_household_id(pet_id)));

create policy "Members can manage measurements"
on public.measurements for all
using (public.is_household_member(public.pet_household_id(pet_id)))
with check (public.is_household_member(public.pet_household_id(pet_id)));

create policy "Members can manage care routines"
on public.care_routines for all
using (public.is_household_member(public.pet_household_id(pet_id)))
with check (public.is_household_member(public.pet_household_id(pet_id)));

create policy "Members can manage observations"
on public.observations for all
using (public.is_household_member(public.pet_household_id(pet_id)))
with check (public.is_household_member(public.pet_household_id(pet_id)));

create policy "Members can manage log entries"
on public.log_entries for all
using (public.is_household_member(public.pet_household_id(pet_id)))
with check (public.is_household_member(public.pet_household_id(pet_id)));

create policy "Members can manage reminder rules"
on public.reminder_rules for all
using (public.is_household_member(public.pet_household_id(pet_id)))
with check (public.is_household_member(public.pet_household_id(pet_id)));

create policy "Members can manage reminder logs"
on public.reminder_logs for all
using (
  exists (
    select 1
    from public.reminder_rules rr
    where rr.id = reminder_rule_id
      and public.is_household_member(public.pet_household_id(rr.pet_id))
  )
)
with check (
  exists (
    select 1
    from public.reminder_rules rr
    where rr.id = reminder_rule_id
      and public.is_household_member(public.pet_household_id(rr.pet_id))
  )
);

create policy "Members can manage documents"
on public.documents for all
using (public.is_household_member(public.pet_household_id(pet_id)))
with check (public.is_household_member(public.pet_household_id(pet_id)));

create policy "Members can view document links"
on public.document_links for select
using (
  exists (
    select 1
    from public.documents d
    where d.id = document_id
      and public.is_household_member(public.pet_household_id(d.pet_id))
  )
);

create policy "Members can manage document links"
on public.document_links for all
using (
  exists (
    select 1
    from public.documents d
    where d.id = document_id
      and public.is_household_member(public.pet_household_id(d.pet_id))
      and public.record_belongs_to_pet(record_type, record_id, d.pet_id)
  )
)
with check (
  exists (
    select 1
    from public.documents d
    where d.id = document_id
      and public.is_household_member(public.pet_household_id(d.pet_id))
      and public.record_belongs_to_pet(record_type, record_id, d.pet_id)
  )
);

create policy "Members can manage share links"
on public.share_links for all
using (public.is_household_member(public.pet_household_id(pet_id)))
with check (public.is_household_member(public.pet_household_id(pet_id)));

create policy "Members can manage shared documents"
on public.share_link_documents for all
using (
  exists (
    select 1
    from public.share_links sl
    where sl.id = share_link_id
      and public.is_household_member(public.pet_household_id(sl.pet_id))
  )
)
with check (
  exists (
    select 1
    from public.share_links sl
    where sl.id = share_link_id
      and public.is_household_member(public.pet_household_id(sl.pet_id))
  )
);

create policy "Share accesses can be inserted publicly"
on public.share_accesses for insert
to anon
with check (
  exists (
    select 1
    from public.share_links sl
    where sl.id = share_link_id
      and sl.status = 'active'
  )
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'first_name', split_part(new.raw_user_meta_data ->> 'full_name', ' ', 1)),
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
    set email = excluded.email,
        first_name = excluded.first_name,
        last_name = excluded.last_name,
        full_name = excluded.full_name,
        avatar_url = excluded.avatar_url,
        updated_at = now();

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.public_share_payload(share_token text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'share_link_id', sl.id,
    'label', sl.label,
    'link_type', sl.link_type,
    'created_at', sl.created_at,
    'show_owner_contact', sl.show_owner_contact,
    'owner', case
      when sl.show_owner_contact then (
        select jsonb_build_object(
          'first_name', pr.first_name,
          'last_name', pr.last_name,
          'email', pr.email,
          'phone', pr.phone,
          'city', pr.city
        )
        from public.profiles pr
        where pr.id = sl.created_by
      )
      else null
    end,
    'pet', jsonb_build_object(
      'name', p.name,
      'species', p.species,
      'breed', p.breed,
      'sex', p.sex,
      'photo_path', case when sl.show_pet_photo then p.photo_path else null end,
      'date_of_birth', p.date_of_birth,
      'approximate_age_years', p.approximate_age_years,
      'approximate_age_months', p.approximate_age_months,
      'age_is_estimated', p.age_is_estimated
    ),
    'vaccines', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'name', coalesce(vd.name, vr.custom_name),
          'protects_against', vd.protects_against,
          'date_given', vr.date_given,
          'expiration_date', vr.expiration_date,
          'provider', vr.provider,
          'notes', vr.notes
        )
        order by vr.expiration_date nulls last, vr.date_given desc
      )
      from public.vaccine_records vr
      left join public.vaccine_definitions vd on vd.id = vr.vaccine_definition_id
      where vr.pet_id = p.id
        and sl.show_vaccines
    ), '[]'::jsonb),
    'documents', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', d.id,
          'title', d.title,
          'document_type', d.document_type,
          'content_type', d.content_type,
          'storage_path', d.storage_path
        )
        order by d.created_at desc
      )
      from public.share_link_documents sld
      join public.documents d on d.id = sld.document_id
      where sld.share_link_id = sl.id
    ), '[]'::jsonb)
  )
  from public.share_links sl
  join public.pets p on p.id = sl.pet_id
  where sl.token = share_token
    and sl.status = 'active'
  limit 1;
$$;

grant execute on function public.public_share_payload(text) to anon, authenticated;

insert into public.vaccine_definitions (species, name, protects_against, description, recommended_interval_months)
values
  ('dog', 'Rabies', 'Rabies virus', 'Required for most travel, boarding, and licensing.', 36),
  ('dog', 'DHPP', 'Distemper, hepatitis, parainfluenza, and parvovirus', 'Core combination vaccine for dogs.', 12),
  ('dog', 'Bordetella', 'Kennel cough', 'Commonly required for boarding, daycare, and grooming.', 12),
  ('cat', 'Rabies', 'Rabies virus', 'Required in many areas and often needed for travel.', 36),
  ('cat', 'FVRCP', 'Feline viral rhinotracheitis, calicivirus, and panleukopenia', 'Core combination vaccine for cats.', 12),
  ('cat', 'FeLV', 'Feline leukemia virus', 'Often recommended for outdoor cats or cats with exposure risk.', 12)
on conflict (species, name) do nothing;
