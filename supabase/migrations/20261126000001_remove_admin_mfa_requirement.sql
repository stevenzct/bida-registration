begin;

alter policy "Admins with MFA can read registrations" on public.registrations
using (exists (select 1 from public.registration_admins where user_id = (select auth.uid())));

alter policy "Admins with MFA can read registrations" on public.registrations
rename to "Allowlisted admins can read registrations";

commit;
