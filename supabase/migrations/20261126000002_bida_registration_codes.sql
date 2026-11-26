begin;

alter table public.registrations
  drop constraint registrations_code_check,
  add constraint registrations_code_check check (code ~ '^(BIDA|DEMO)-[A-Z0-9]{1,7}$');

commit;
