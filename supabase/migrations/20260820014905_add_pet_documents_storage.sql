insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pet-documents',
  'pet-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Household members can view pet documents"
on storage.objects for select
to authenticated
using (
  bucket_id = 'pet-documents'
  and (storage.foldername(name))[1] = 'households'
  and (storage.foldername(name))[3] = 'pets'
  and (storage.foldername(name))[5] = 'documents'
  and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and (storage.foldername(name))[4] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and exists (
    select 1
    from public.pets p
    where p.household_id = ((storage.foldername(name))[2])::uuid
      and p.id = ((storage.foldername(name))[4])::uuid
      and public.is_household_member(p.household_id)
  )
);

create policy "Household members can upload pet documents"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'pet-documents'
  and (storage.foldername(name))[1] = 'households'
  and (storage.foldername(name))[3] = 'pets'
  and (storage.foldername(name))[5] = 'documents'
  and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and (storage.foldername(name))[4] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and exists (
    select 1
    from public.pets p
    where p.household_id = ((storage.foldername(name))[2])::uuid
      and p.id = ((storage.foldername(name))[4])::uuid
      and public.is_household_member(p.household_id)
  )
);

create policy "Household members can delete pet documents"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'pet-documents'
  and (storage.foldername(name))[1] = 'households'
  and (storage.foldername(name))[3] = 'pets'
  and (storage.foldername(name))[5] = 'documents'
  and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and (storage.foldername(name))[4] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and exists (
    select 1
    from public.pets p
    where p.household_id = ((storage.foldername(name))[2])::uuid
      and p.id = ((storage.foldername(name))[4])::uuid
      and public.is_household_member(p.household_id)
  )
);
