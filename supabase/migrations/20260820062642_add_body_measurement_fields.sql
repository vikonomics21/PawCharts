alter table public.measurements
  add column if not exists body_length_value numeric(8, 2),
  add column if not exists body_length_unit text not null default 'in',
  add column if not exists height_value numeric(8, 2),
  add column if not exists height_unit text not null default 'in',
  add column if not exists collar_circumference_value numeric(8, 2),
  add column if not exists collar_circumference_unit text not null default 'in',
  add column if not exists chest_circumference_value numeric(8, 2),
  add column if not exists chest_circumference_unit text not null default 'in';
