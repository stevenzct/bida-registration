begin;

revoke insert (name, code, interests) on public.registrations from service_role;

commit;
