insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pet-photos',
  'pet-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Household members can view pet photos" on storage.objects;
drop policy if exists "Household members can upload pet photos" on storage.objects;

create policy "Household members can view pet photos"
on storage.objects for select
to authenticated
using (
  bucket_id = 'pet-photos'
  and (storage.foldername(storage.objects.name))[1] = 'households'
  and (storage.foldername(storage.objects.name))[3] = 'pets'
  and (storage.foldername(storage.objects.name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and (storage.foldername(storage.objects.name))[4] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and exists (
    select 1
    from public.pets p
    where p.household_id = ((storage.foldername(storage.objects.name))[2])::uuid
      and p.id = ((storage.foldername(storage.objects.name))[4])::uuid
      and public.is_household_member(p.household_id)
  )
);

create policy "Household members can upload pet photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'pet-photos'
  and (storage.foldername(storage.objects.name))[1] = 'households'
  and (storage.foldername(storage.objects.name))[3] = 'pets'
  and (storage.foldername(storage.objects.name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and (storage.foldername(storage.objects.name))[4] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and exists (
    select 1
    from public.pets p
    where p.household_id = ((storage.foldername(storage.objects.name))[2])::uuid
      and p.id = ((storage.foldername(storage.objects.name))[4])::uuid
      and public.is_household_member(p.household_id)
  )
);
