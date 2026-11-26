begin;

alter table public.registrations add column email text check (
  email is null or (char_length(email) between 3 and 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
);

create table public.verification_codes (
  code text primary key check (code ~ '^[A-HJ-NP-Z2-9]{8}$'),
  issued_by uuid references auth.users (id) on delete set null default auth.uid(),
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  used_at timestamptz
);

create index verification_codes_issued_idx on public.verification_codes (issued_at desc, code desc);
alter table public.verification_codes enable row level security;
revoke all on public.verification_codes from public, anon, authenticated, service_role;
grant select on public.verification_codes to authenticated;
grant insert (code) on public.verification_codes to authenticated;

create policy "Staff can read verification codes"
on public.verification_codes for select to authenticated
using (exists (select 1 from public.registration_admins where user_id = (select auth.uid())));

create policy "Staff can issue verification codes"
on public.verification_codes for insert to authenticated
with check (
  issued_by = (select auth.uid())
  and exists (select 1 from public.registration_admins where user_id = (select auth.uid()))
);

create function public.check_booth_verification(verification_code text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select case
      when used_at is not null then 'used'
      when expires_at <= statement_timestamp() then 'expired'
      else 'available'
    end
    from public.verification_codes
    where code = verification_code
  ), 'invalid');
$$;

create function public.register_verified_visitor(
  verification_code text, visitor_name text, visitor_email text, confirmation_code text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  ticket public.verification_codes%rowtype;
  redeemed_at timestamptz;
begin
  select * into ticket from public.verification_codes where code = verification_code for update;
  if not found then return 'invalid'; end if;
  if ticket.used_at is not null then return 'used'; end if;
  redeemed_at := clock_timestamp();
  if ticket.expires_at <= redeemed_at then return 'expired'; end if;

  if visitor_email is null or confirmation_code is null or confirmation_code !~ '^BIDA-[A-Z0-9]{1,7}$' then
    raise check_violation;
  end if;

  insert into public.registrations (name, email, code, interests, created_at)
  values (visitor_name, visitor_email, confirmation_code, '{}', redeemed_at);

  update public.verification_codes set used_at = redeemed_at where code = verification_code;
  return 'registered';
end;
$$;

create function public.search_booth_registrations(search_term text)
returns table (name text, code text, email text, created_at timestamptz)
language sql
stable
security invoker
set search_path = ''
as $$
  select registration.name, registration.code, registration.email, registration.created_at
  from public.registrations as registration
  cross join (select lower(btrim(search_term)) as term) as search
  where char_length(search.term) between 1 and 254
    and (
      strpos(lower(registration.name), search.term) > 0
      or strpos(lower(registration.code), search.term) > 0
      or strpos(lower(registration.email), search.term) > 0
      or strpos(to_char(registration.created_at at time zone 'Asia/Hong_Kong', 'YYYY-MM-DD HH24:MI:SS'), search.term) > 0
      or strpos(lower(to_char(registration.created_at at time zone 'Asia/Hong_Kong', 'FMDD Mon YYYY, FMHH12:MI:SS am')), search.term) > 0
    );
$$;

revoke all on function public.check_booth_verification(text), public.register_verified_visitor(text, text, text, text), public.search_booth_registrations(text) from public, anon, authenticated, service_role;
grant execute on function public.check_booth_verification(text), public.register_verified_visitor(text, text, text, text) to service_role;
grant execute on function public.search_booth_registrations(text) to authenticated;

commit;
