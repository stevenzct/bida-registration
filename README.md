# BIDA Hong Kong booth registration

This is the download and registration site for the BIDA Hong Kong booth on **6 December 2026**. Visitors download BIDA, show the open app to booth staff, and enter a staff-issued verification code. After verification, they provide a name and email, review the booth policies, and receive a downloadable confirmation. Staff issue codes and view shared registrations at `/admin`.

- [Quick start](#quick-start)
- [Set up shared registration](#set-up-shared-registration)
- [How the app works](#how-the-app-works)
- [API reference](#api-reference)
- [Project structure](#project-structure)
- [Code map](#code-map)
- [Deployment](#deployment)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Quick start

Use Node.js **22 or newer** and npm. The repo has been tested with Node.js 24.21.0 and npm 11.19.0. If PowerShell blocks `npm.ps1`, use `npm.cmd` in the commands below.

```sh
npm ci
npm run dev
```

Open [http://localhost:3000/#join](http://localhost:3000/#join). A fresh checkout runs in demo mode without Supabase credentials. Enter **0529** or paste **BIDA-0529**, then click **Verify and continue**. Enter a sample name and email, open the checkbox, and select **Agree and continue**. Click **Complete registration**, then try **Save image** on the ticket. Keep the form and ticket in the same tab.

If your checkout already has a Supabase configuration, set `BIDA_REGISTRATION_MODE=demo` in `.env.local` and restart Next.js to run the demo. The committed [`.env.example`](.env.example) is a template for shared mode.

| Mode | Where data goes | When to use it |
| --- | --- | --- |
| `demo` or unset | The form uses the fixed code `BIDA-0529` and stores the ticket in the current browser tab. | Visitor UI work and local demos. Staff issuance and the dashboard require shared mode. |
| `supabase` | The server stores registrations in the configured Supabase project. The ticket is also saved to the current browser tab. | End-to-end testing with staff accounts and hosted deployments. |

| Command | What it runs |
| --- | --- |
| `npm ci` | Install pinned dependencies from `package-lock.json`. |
| `npm run dev` | Start the Next.js dev server on port 3000. To change the port, run `npm run dev -- --port 3061`. |
| `npm run typecheck` | Run TypeScript without emitting files. |
| `npm run build` | Build the production app and run TypeScript checks. |
| `npm run start` | Serve the completed production build. |

## Set up shared registration

### 1. Prepare a Supabase project

Use a separate development or staging project for staff and visitor test data. Enable its Data API, keep automatic grants for new tables disabled, and disable public Auth sign-ups. The [repository migrations](supabase/migrations/) define the app's tables, functions, grants, and Row Level Security (RLS).

Run migrations in filename order on a fresh project. If the target already has migrations recorded, preview what is pending before applying changes. With Supabase CLI v3, authenticate with `npx supabase@3.4.0 login` if needed, then replace `YOUR_PROJECT_REF` with the ref for the intended project.

```sh
npx supabase@3.4.0 migration list --remote=YOUR_PROJECT_REF
npx supabase@3.4.0 db push --remote=YOUR_PROJECT_REF --dry-run --skip-vault
npx supabase@3.4.0 db push --remote=YOUR_PROJECT_REF --skip-vault
```

The CLI displays the target and pending files. It records applied migrations so subsequent pushes can skip them. For projects managed through the SQL Editor, apply each pending file once in order and reconcile any existing migration history before switching workflows. [Supabase migration workflow](https://supabase.com/docs/guides/local-development/cli-workflows)

### 2. Set the app environment

Copy [`.env.example`](.env.example) to `.env.local` if your local environment file does not exist yet. Use the Supabase URL, publishable key, and secret key from the same project. Restart Next.js after editing the file.

| Variable | Purpose |
| --- | --- |
| `BIDA_REGISTRATION_MODE` | Set to `supabase` to enable real code verification, shared writes, and the staff dashboard. |
| `SUPABASE_URL` | Supabase project URL, for example `https://YOUR_PROJECT_REF.supabase.co`. |
| `SUPABASE_PUBLISHABLE_KEY` | Used with the authenticated staff session for Auth and RLS-protected reads. |
| `SUPABASE_SECRET_KEY` | Server-only key used for staff code issuance, registration RPCs, and rate-limit keys. |
| `BIDA_APP_STORE_URL` | Optional official `https://apps.apple.com/…/id…` URL. Without it, the iPhone badge opens a download-information dialog. |
| `BIDA_PRIVACY_CONTACT_NAME` | Optional public contact name or job title. When an address is set, the default name is `BIDA Booth Registration Lead`. |
| `BIDA_PRIVACY_CONTACT_ADDRESS` | Optional public mailing address displayed in the Data Privacy Notice. Without it, the notice directs visitors to the booth team. |
| `BIDA_TRUSTED_CLIENT_IP_HEADER` | Optional header name for shared mode behind a non-Vercel reverse proxy. The proxy must overwrite it with a single client IP. See [Rate limiting](#rate-limiting). |

Keep `SUPABASE_SECRET_KEY` in local or hosting secret storage and out of client code. `.env.local` is ignored by Git. The optional variables above can be added directly to it. [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys)

### 3. Provision a staff account

1. In the target Supabase project's **Authentication → Users**, create or locate the staff account and copy its Auth user ID.
2. Run the following in the project's SQL Editor, replacing the placeholder with that ID.

   ```sql
   insert into public.registration_admins (user_id)
   values ('REPLACE_WITH_AUTH_USER_UUID')
   on conflict (user_id) do nothing;
   ```
3. Sign in at [http://localhost:3000/admin](http://localhost:3000/admin) with that account. Click **Issue verification code**, copy the code, and complete registration from a separate visitor tab. The dashboard should show the new registration and mark the code **Used**.

Dashboard access is scoped to the current Supabase project. To revoke a staff member's dashboard access, remove their row from `public.registration_admins`. Membership is checked on subsequent requests. Work with the project owner to obtain access to existing hosted environments.

## How the app works

### Visitor and staff flow

1. An allowlisted staff member checks the visitor's open BIDA app. **Issue verification code** calls a Next.js server action that checks the signed-in user, then invokes the server-only `issue_booth_verification_code` database function. **Copy code** copies the full code, including `BIDA-`.
2. The visitor enters the four digits after the fixed prefix. The form supports numeric keyboards, leading zeros, focus advance, backspace navigation, and pasting either `0529` or `BIDA-0529`. **Have an older code?** accepts previously issued eight-character codes for the remainder of their original validity.
3. **Verify and continue** checks the code's availability. The green **Code verified** banner, name and email fields, checkbox, and policy links appear on the verified form. **Change code** starts the verification step again and clears the current agreement.
4. The checkbox opens **Please review and agree**. Both legal documents can be opened from either the form or the popup. **Agree and continue** checks the box and returns to the form. **Disagree** keeps the details in the form and leaves submission blocked. The registration API requires the JSON boolean `acceptedRegistrationTerms: true`.
5. **Complete registration** rechecks the verification code and, in one database transaction, locks the code row, saves the registration, and marks the code used. Parallel submissions with the same code can only succeed once. The response supplies a separate confirmation reference for the ticket.

### Verification codes and confirmation references

| Value | Example | Lifecycle |
| --- | --- | --- |
| Staff verification code | `BIDA-0529` | Four decimal digits. PostgreSQL selects an unused value with its secure random source. The code expires after 10 minutes and is consumed only by a successful registration. Issued values stay reserved, giving each database 10,000 numeric code values. |
| Confirmation reference | `BIDA-ABC123` | A separately generated reference with one to seven uppercase base-36 characters. The visitor uses it to display and save the ticket. Older `DEMO-` references remain valid in existing session records. |

### Rate limiting

The shared-mode endpoints use the same database counters, so attempts through verification and registration count together. Each source gets up to 30 requests in a one-minute window. After five failed code checks or redemptions, the source is blocked until 10 minutes have elapsed since its last failure. A valid-format code reported as invalid, expired, or used counts as a failure. The API returns `429` while blocked.

On Vercel the app uses `x-vercel-forwarded-for`. On other hosts, set `BIDA_TRUSTED_CLIENT_IP_HEADER` to a header the reverse proxy overwrites and route client traffic through that proxy. IPv4 addresses are grouped individually and IPv6 addresses by `/64`. Missing or invalid addresses share a fallback bucket. The database stores a keyed hash of the source and removes stale counter rows in small batches during requests. [Vercel request headers](https://vercel.com/docs/headers/request-headers)

### Admin access and data

Supabase Auth verifies staff credentials. The server checks the staff allowlist and RLS restricts database reads to eligible users. The staff session uses HTTP-only, SameSite=Lax cookies and secure cookies in production. [`proxy.ts`](proxy.ts) refreshes the session for admin routes, which use `Cache-Control: private, no-store`.

The dashboard shows the 10 latest verification codes with **Available**, **Used**, or **Expired** status. Registrations are newest first, 50 per page, in Hong Kong time (UTC+8). Search matches a partial name, email, reference, or registration time. **Clear** resets the search. The dashboard refreshes every five seconds while visible and retains the current search.

### Confirmation ticket

After registration, the form writes a tab-local record into `sessionStorage` under `bida-hk-demo-v1` and navigates to `/registered#<reference>`. Each record contains the visitor's name, reference, and local creation time, plus empty `interests` and `checked` arrays for compatibility with the original site. In shared mode the email and authoritative registration time are stored in Supabase.

The ticket reads the URL fragment and looks up the reference in the current tab. Reloading in the same tab and origin works while the record is present. A missing or unknown reference redirects to `/#join`. To reset test tickets, delete `bida-hk-demo-v1` from DevTools under **Application → Session Storage** for the app's origin.

**Save image** draws a 960 × 690 PNG using Canvas, the bundled BIDA logo, and Inter. It downloads `<reference>.png`. Update [`ticket-image.ts`](app/registered/ticket-image.ts) when changing wording or artwork printed on the image.

## API reference

The following examples are for shared mode. Replace the example code with an unused staff code from your development project. Both endpoints accept JSON objects with `Content-Type: application/json` and a maximum body size of 4,096 bytes. Browser submissions must be same-origin when `Sec-Fetch-Site` is present.

### `POST /api/verification`

Checks a staff code without consuming it. Send the four digits as a string to preserve leading zeros, or use the full prefixed code. Previously issued eight-character codes follow their original expiration and single-use rules.

```json
{
  "code": "0529"
}
```

| HTTP status | Response |
| --- | --- |
| `200` | A JSON `status` of `available`, `expired`, `used`, or `invalid` for a well-formed code. |
| `400` | `{"status":"invalid"}` when the code is missing or malformed. A malformed JSON request has an empty response body. |
| `429` | `{"status":"rate_limited"}`. |
| `503` | Empty body when shared registration is unavailable or the database check fails. |

### `POST /api/registrations`

Redeems a valid staff code and creates a registration. The server trims input and requires a name of up to 100 characters and an email address of up to 254 characters. The accepted code formats are the same as for verification.

```json
{
  "name": "Sample Visitor",
  "email": "visitor@example.com",
  "verificationCode": "BIDA-0529",
  "acceptedRegistrationTerms": true
}
```

| HTTP status | Response |
| --- | --- |
| `201` | `{"code":"BIDA-ABC123"}` with the confirmation reference. |
| `400` | JSON `status` of `invalid`, `invalid_details`, or `consent_required`. A malformed JSON request has an empty response body. |
| `409` | `{"status":"used"}` if this code already registered a visitor. |
| `410` | `{"status":"expired"}`. |
| `429` | `{"status":"rate_limited"}`. |
| `503` | Empty body when shared registration is unavailable or the write fails. |

Both endpoints can also return an empty `403` for a disallowed browser origin, `413` for an oversized request, or `415` for an unsupported content type.

## Project structure

```text
bida-registration/
├── app/
│   ├── admin/
│   │   ├── actions.ts
│   │   ├── auth-forms.tsx
│   │   ├── live-registration-updates.tsx
│   │   ├── page.tsx
│   │   ├── registration-list.tsx
│   │   ├── registration-search.tsx
│   │   └── verification-panel.tsx
│   ├── api/
│   │   ├── registrations/route.ts
│   │   └── verification/route.ts
│   ├── registered/
│   │   ├── page.tsx
│   │   ├── registration-ticket.tsx
│   │   └── ticket-image.ts
│   ├── globals.css
│   ├── icon.png
│   ├── layout.tsx
│   ├── page.tsx
│   ├── registration-code.ts
│   ├── registration-form.tsx
│   ├── registration-policies.tsx
│   ├── registration-session.ts
│   ├── store-buttons.tsx
│   ├── verification-code.ts
│   └── verification-input.tsx
├── assets/
│   ├── fonts/
│   │   ├── inter-offline.css
│   │   ├── inter.woff2
│   │   └── OFL-1.1.txt
│   └── images/
├── lib/
│   ├── registration-request.ts
│   └── supabase/
│       ├── admin.ts
│       └── config.ts
├── supabase/
│   └── migrations/
│       ├── 20261126000000_registrations.sql
│       ├── 20261126000001_remove_admin_mfa_requirement.sql
│       ├── 20261126000002_bida_registration_codes.sql
│       ├── 20261126000003_registration_search.sql
│       ├── 20261126000004_staff_verification.sql
│       ├── 20261126000005_require_verified_registration.sql
│       └── 20261127000000_numeric_booth_verification.sql
├── .env.example
├── .gitignore
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── proxy.ts
├── README.md
└── tsconfig.json
```

## Code map

The stack is Next.js App Router with Turbopack, React, TypeScript, Tailwind CSS, and Supabase Postgres and Auth. See [`package.json`](package.json) for dependency ranges and [`package-lock.json`](package-lock.json) for the pinned versions.

### App routes

| Route | Purpose |
| --- | --- |
| `/`, `/#download`, `/#join` | Public landing page, store badges, and verification and registration form. |
| `/registered#<reference>` | Shows the confirmation for the matching browser-session record. |
| `/admin` | Staff sign-in and dashboard. Search and pagination use the `q` and `page` query parameters. |
| `POST /api/verification`, `POST /api/registrations` | Shared-mode code check and registration submission. |
| `/index.html`, `/registered.html` | Compatibility redirects to `/` and `/registered`. |

### Files to change

| Task | Start here |
| --- | --- |
| Edit the landing page, event copy, or app store links | [`app/page.tsx`](app/page.tsx), [`app/store-buttons.tsx`](app/store-buttons.tsx) |
| Change code entry or supported code formats | [`app/verification-input.tsx`](app/verification-input.tsx), [`app/verification-code.ts`](app/verification-code.ts) |
| Change registration fields, consent behavior, or error messages | [`app/registration-form.tsx`](app/registration-form.tsx), [`app/api/registrations/route.ts`](app/api/registrations/route.ts) |
| Edit the Terms and Conditions, Data Privacy Notice, or popup | [`app/registration-policies.tsx`](app/registration-policies.tsx) |
| Change API request validation, service client, or rate-limit key | [`lib/registration-request.ts`](lib/registration-request.ts), [`app/api/verification/route.ts`](app/api/verification/route.ts) |
| Change staff auth, code issuance, or dashboard behavior | [`lib/supabase/admin.ts`](lib/supabase/admin.ts), [`app/admin/actions.ts`](app/admin/actions.ts), [`app/admin/`](app/admin/) |
| Change ticket storage, rendering, or export | [`app/registration-session.ts`](app/registration-session.ts), [`app/registered/`](app/registered/) |
| Change theme, breakpoints, fonts, or images | [`app/globals.css`](app/globals.css), [`assets/`](assets/) |

The landing page uses a wide hero above 700 px wide and 500 px high, and a compact hero in landscape at 500 px high or less. The fixed mobile navigation is hidden from 701 px. The ticket stacks its buttons up to 340 px. Event wording is also used in the ticket export, policy text, and some branded artwork. See the [bundled Inter font license](assets/fonts/OFL-1.1.txt).

### Database objects

| Object | Responsibility |
| --- | --- |
| `public.registrations` | Confirmation reference, name, email, server creation time, and legacy interests. Earlier rows can have a null email. |
| `public.registration_admins` | Auth user IDs allowlisted for staff access. |
| `public.verification_codes` | Code, issuer, issuance time, expiry, and redemption time. The code is the primary key. |
| `public.booth_verification_limits` | Per-source attempt and failure counters shared by both public endpoints. |
| `public.issue_booth_verification_code(uuid)` | Generates an unused numeric code for an allowlisted staff user. |
| `public.attempt_booth_verification(...)` | Enforces the shared limit and calls the code check or redemption function. |
| `public.check_booth_verification(text)` | Returns a code's status. |
| `public.register_verified_visitor(...)` | Saves a registration and consumes the staff code atomically. |
| `public.search_booth_registrations(text)` | Searches rows using the staff session and table RLS. |

## Deployment

1. Configure the intended hosted environment with `BIDA_REGISTRATION_MODE=supabase`, keys from the matching Supabase project, and the public privacy contact for the event. The fixed demo code is suppressed in Vercel Production.
2. Preview and apply any missing migrations to that project before deploying the app. For an existing staff-code deployment, [`20261127000000_numeric_booth_verification.sql`](supabase/migrations/20261127000000_numeric_booth_verification.sql) must be in place before the current app's issue, verify, and submit paths can work. The migration supports the prior eight-character format during rollout.
3. Deploy the Next.js app. For a standard Node host, install with `npm ci`, build with `npm run build`, and serve with `npm run start`. Use HTTPS for public access and staff clipboard support, and keep admin responses private.
4. Run the shared-mode smoke test on the deployed URL with the intended environment. Confirm the target, staff visibility, a numeric code and its use, dashboard updates, and the downloaded ticket.

For a system still running the original pre-verification write path, [`20261126000004_staff_verification.sql`](supabase/migrations/20261126000004_staff_verification.sql) adds staff verification. Retire the original app before applying [`20261126000005_require_verified_registration.sql`](supabase/migrations/20261126000005_require_verified_registration.sql), which revokes its direct-write grant.

## Testing

Run the repository checks before releasing changes.

```sh
npm run typecheck
npm run build
```

Manual checks cover the interactions between the browser, staff session, and database.

| Area | Check |
| --- | --- |
| Verification entry | Test four typed digits and full-code paste, a leading zero, backspace navigation, and refusal of letters or extra digits. If testing legacy compatibility, use an unexpired eight-character code from the test database. |
| Consent | Confirm policy controls appear only after verification. Open each policy, return to the popup, and test **Disagree** and **Agree and continue**. A decline keeps the entered details and blocks submit. Agreement checks the box. Try submitting with and without consent. |
| Staff and shared write | Sign out to verify the sign-in gate. Sign in with an allowlisted account, click **Issue verification code** and **Copy code**, and complete registration in a visitor tab. Check that the dashboard shows the new row and the code as **Used**. |
| Code states | Try a well-formed unknown code, an expired code, and a used code. In a development environment, submit a single valid code concurrently to verify one successful redemption, and exercise both endpoints to check their shared rate limit. |
| Ticket | Reload in the original tab, test an unknown reference, save the image, match its filename and printed reference, and check the **Download BIDA** button. |
| Responsive and stores | Test at 320, 375, 768, and 1440 px plus a short landscape viewport. Check the consent popup, hero crop, mobile navigation, and ticket. Verify Google Play opens its listing and the App Store badge opens its listing or the configured preview. |
| Admin search | Search a newly created fixture by name, email, reference, and Hong Kong timestamp. Confirm **Clear**, paging, and refresh with an active search. |

For comparison with the original static site, open `index.html` in a separate checkout of the original commit.

```sh
git worktree add --detach ../bida-registration-reference 1dd4b2bfcde6abc0877d4d24a276e062d17087b3
```

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| `BIDA-0529` works in one environment only | It is the demo code. Shared mode requires a code issued from that environment's staff dashboard. |
| `/admin` says shared registration must be configured | Check `BIDA_REGISTRATION_MODE`, the URL, and the publishable key, then restart Next.js. |
| Staff Auth works but dashboard access is denied | Confirm the Auth user ID is in `public.registration_admins` in the same project. |
| **Issue verification code** fails, or the Data API returns `PGRST202` for an RPC | Check that the app uses the intended project and that its numeric-code migration is applied. Check the server secret key and confirm the required functions are present using the query below. |
| Verification works but registration is rejected | Check that name and email are valid, the request sends `acceptedRegistrationTerms: true`, and the code is still unused and unexpired at submission. |
| Visitors are getting `429` unexpectedly | Check the trusted client IP header and where requests originate. Shared Wi-Fi, proxies, or a missing trusted address can group visitors into one limit. |
| Registrations are missing from the dashboard | Confirm both views use the same Supabase project. Keep the dashboard visible and clear any active search. Demo registrations stay in the browser tab. |
| Confirmation redirects to registration | Open the ticket in the same tab and origin that submitted the form. Check the URL fragment and `bida-hk-demo-v1` in Session Storage. |
| Copy or PNG download fails | Check browser clipboard or download permissions. Clipboard access needs a secure context. For PNG export, check that the bundled font and logo load. |

To check the two functions added by the numeric-code migration without issuing a code, run this in the intended project's SQL Editor. Both columns should show a function signature.

```sql
select
  to_regprocedure('public.issue_booth_verification_code(uuid)') as issuer,
  to_regprocedure('public.attempt_booth_verification(text,text,text,text,text)') as verification;
```
