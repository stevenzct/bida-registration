begin;

alter table public.verification_codes
  drop constraint verification_codes_code_check,
  add constraint verification_codes_code_check check (code ~ '^(BIDA-[0-9]{4}|[A-HJ-NP-Z2-9]{8})$');

-- Allow a rolling deploy of the older app. Numeric codes are issued by the server only.
alter policy "Staff can issue verification codes"
on public.verification_codes
with check (
  code ~ '^[A-HJ-NP-Z2-9]{8}$'
  and issued_by = (select auth.uid())
  and exists (select 1 from public.registration_admins where user_id = (select auth.uid()))
);

create function public.issue_booth_verification_code(staff_user_id uuid)
returns table (code text, expires_at timestamptz)
language sql
security definer
set search_path = ''
as $$
  insert into public.verification_codes as issued (code, issued_by)
  select candidate.code, staff_user_id
  from generate_series(0, 9999) as number
  cross join lateral (select 'BIDA-' || lpad(number::text, 4, '0') as code) as candidate
  where exists (select 1 from public.registration_admins where user_id = staff_user_id)
    and not exists (select 1 from public.verification_codes where verification_codes.code = candidate.code)
  -- PostgreSQL generates each random UUID from its cryptographically secure random source.
  order by gen_random_uuid()
  limit 1
  on conflict on constraint verification_codes_pkey do nothing
  returning issued.code, issued.expires_at;
$$;

revoke all on function public.issue_booth_verification_code(uuid) from public, anon, authenticated, service_role;
grant execute on function public.issue_booth_verification_code(uuid) to service_role;

create table public.booth_verification_limits (
  source_key text primary key,
  request_window_at timestamptz not null,
  requests integer not null default 0,
  last_failed_at timestamptz,
  failures integer not null default 0
);

create index booth_verification_limits_window_idx on public.booth_verification_limits (request_window_at);
alter table public.booth_verification_limits enable row level security;
revoke all on public.booth_verification_limits from public, anon, authenticated, service_role;

create function public.attempt_booth_verification(
  verification_code text, attempt_source text, visitor_name text default null,
  visitor_email text default null, confirmation_code text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  limits public.booth_verification_limits%rowtype;
  attempted_at timestamptz;
  result text;
begin
  if attempt_source is null or attempt_source !~ '^[0-9a-f]{64}$' then
    raise invalid_parameter_value;
  end if;

  -- Clear stale counters in small batches without waiting on another request's locks.
  delete from public.booth_verification_limits where source_key in (
    select source_key from public.booth_verification_limits
    where request_window_at < statement_timestamp() - interval '1 day'
    order by request_window_at
    limit 20 for update skip locked
  );

  insert into public.booth_verification_limits (source_key, request_window_at)
  values (attempt_source, statement_timestamp()) on conflict do nothing;

  -- Serialize both endpoints per source so concurrent requests share the same attempt budget.
  select * into limits from public.booth_verification_limits where source_key = attempt_source for update;
  attempted_at := clock_timestamp();

  if limits.request_window_at <= attempted_at - interval '1 minute' then
    limits.request_window_at := attempted_at;
    limits.requests := 0;
  end if;
  if limits.last_failed_at <= attempted_at - interval '10 minutes' then
    limits.last_failed_at := null;
    limits.failures := 0;
  end if;
  if limits.requests >= 30 or limits.failures >= 5 then
    return 'rate_limited';
  end if;

  if confirmation_code is null then
    result := public.check_booth_verification(verification_code);
  else
    result := public.register_verified_visitor(verification_code, visitor_name, visitor_email, confirmation_code);
  end if;

  if result in ('invalid', 'used', 'expired') then
    limits.last_failed_at := attempted_at;
    limits.failures := limits.failures + 1;
  end if;

  update public.booth_verification_limits
  set request_window_at = limits.request_window_at, requests = limits.requests + 1,
      last_failed_at = limits.last_failed_at, failures = limits.failures
  where source_key = attempt_source;

  return result;
end;
$$;

revoke all on function public.attempt_booth_verification(text, text, text, text, text) from public, anon, authenticated, service_role;
grant execute on function public.attempt_booth_verification(text, text, text, text, text) to service_role;

commit;
