begin;

create table public.registration_admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create table public.registrations (
  code text primary key check (code ~ '^DEMO-[A-Z0-9]{1,7}$'),
  name text not null check (char_length(name) between 1 and 100 and name = btrim(name) and name !~ '[[:cntrl:]]'),
  interests text[] not null check (
    cardinality(interests) <= 6 and array_position(interests, null) is null and
    interests <@ array['Spin Wheel', 'Quick Quiz', 'App Demo', 'Photo Wall', 'Scan & Discover', 'Feedback Wall']::text[]
  ),
  created_at timestamptz not null default now()
);

create index registrations_created_code_idx on public.registrations (created_at desc, code desc);

alter table public.registration_admins enable row level security;
alter table public.registrations enable row level security;

revoke all on table public.registration_admins, public.registrations from public, anon, authenticated, service_role;
grant select on public.registration_admins to authenticated;
grant select on public.registrations to authenticated;
grant insert (name, code, interests) on public.registrations to service_role;

create policy "Users can check their own admin membership"
on public.registration_admins for select to authenticated
using (user_id = (select auth.uid()));

create policy "Admins with MFA can read registrations"
on public.registrations for select to authenticated
using (
  (select auth.jwt() ->> 'aal') = 'aal2'
  and exists (select 1 from public.registration_admins where user_id = (select auth.uid()))
);

commit;
