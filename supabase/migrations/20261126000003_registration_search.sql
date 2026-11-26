begin;

create function public.search_registrations(search_term text)
returns table (name text, code text, interests text[], created_at timestamptz)
language sql
stable
security invoker
set search_path = ''
as $$
  select registration.name, registration.code, registration.interests, registration.created_at
  from public.registrations as registration
  cross join (select lower(btrim(search_term)) as term) as search
  where char_length(search.term) between 1 and 100
    and (
      strpos(lower(registration.name), search.term) > 0
      or strpos(lower(registration.code), search.term) > 0
      or strpos(lower(array_to_string(registration.interests, ', ')), search.term) > 0
    );
$$;

revoke all on function public.search_registrations(text) from public, anon, authenticated, service_role;
grant execute on function public.search_registrations(text) to authenticated;

commit;
