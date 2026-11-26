# BIDA Hong Kong booth registration

This project is the registration site for the BIDA booth in Hong Kong on 6 December 2026. Visitors open BIDA and show it to booth staff, who issue a verification code. The visitor enters that code, registers with their full name and email address, and can save a PNG of their confirmation reference. Shared registrations appear in a private Supabase-backed admin dashboard.

## Tech stack

| Layer | Technology | Used for |
| --- | --- | --- |
| Runtime and package manager | Node.js 22 or newer, npm | Builds and serves the app. `package-lock.json` pins dependencies. |
| Web framework | Next.js 16.4.6 App Router and Turbopack | Pages, server rendering, server actions, route handlers, and development builds. |
| UI and language | React 19.3.1 and TypeScript 7.0.2 | Interactive registration, session-aware admin views, and type checking. |
| Styling | Tailwind CSS 4.3.5 with PostCSS | Responsive styling with a locally bundled Inter font. |
| Hosted backend | Supabase Postgres, Data API, and Auth | Shared records, staff sign-in, and Row Level Security (RLS). |
| Supabase clients | `@supabase/supabase-js` 2.119.2 and `@supabase/ssr` 0.12.7 | Server-side writes and cookie-based admin sessions. |
| Browser APIs | `sessionStorage`, Web Crypto, and Canvas | Tab-local tickets, demo code generation, and PNG export. |

## Local setup

Use Node.js **22 or newer** and npm. The project has been tested on Node.js 24.21.0 with npm 11.19.0. Run these commands from the repository root. In Windows PowerShell, use `npm.cmd` in place of `npm` if your execution policy blocks `npm.ps1`.

```sh
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). For the browser-only demo, use `BDADE2M7` to unlock the form, then enter a sample name and email. Keep the landing page and confirmation in the same tab so the ticket can read the registration. To select another local port, run `npm run dev -- --port 3061` and use the URL printed by Next.js.

| Mode | Use it for | What to expect |
| --- | --- | --- |
| `demo` (default) | UI development and local testing | Codes and records stay in the current browser tab. The admin dashboard is unavailable. |
| `supabase` | Shared registration and admin testing | The server writes records to the configured Supabase project. Allowlisted staff can view them at `/admin`. |

### Scripts

| Command | Purpose |
| --- | --- |
| `npm ci` | Install the versions in `package-lock.json`. |
| `npm run dev` | Start the development server with live updates. |
| `npm run typecheck` | Check TypeScript without emitting JavaScript. |
| `npm run build` | Compile the production app and check TypeScript. |
| `npm run start` | Serve the production build. Run `npm run build` first. |

To test a production build, stop the development server and run the following commands in order.

```sh
npm run typecheck
npm run build
npm run start
```

The production server also defaults to port 3000. For a Node.js deployment, install dependencies, build the app, and run `npm run start` on the port required by the host.

## Supabase setup

1. Create a Supabase project. Apply the [database migrations](supabase/migrations/) in filename order. They create the registration, staff allowlist, and verification-code tables and configure their permissions and Row Level Security (RLS).
2. Enable the Data API for the project, keep automatic grants for new tables disabled, and disable public sign-ups in Supabase Auth. The migrations define the grants and RLS policies the app needs. Set up staff access as described below.

3. Copy [`.env.example`](.env.example) to `.env.local` and fill in the Supabase project URL and both API keys. Set the same variables in the hosting platform when deploying. Keep `SUPABASE_SECRET_KEY` in server-side environment settings.

   | Variable | Value |
   | --- | --- |
   | `BIDA_REGISTRATION_MODE` | `supabase` for shared storage, or `demo` for browser-only registration. An unset value defaults to demo. |
   | `SUPABASE_URL` | The project URL from Supabase. |
   | `SUPABASE_PUBLISHABLE_KEY` | The publishable key used with the admin's authenticated session. |
   | `SUPABASE_SECRET_KEY` | The secret key the server uses to insert registrations. |
   | `BIDA_APP_STORE_URL` | Optional official `https://apps.apple.com/…/id…` URL. The iPhone badge shows download information until this is set. |

4. Restart the app, sign in at `/admin` with the allowlisted user's email and password, and click **Issue verification code**. Enter it on the visitor page in another tab, submit a sample name and email address, and check that the new row and **Used** status appear on the dashboard.

### Admin accounts

The existing `bida-registration` Supabase project has an admin account for **`bida-admin1@gmail.com`**. Use the password provided by the project owner through a secure channel. This account is provisioned in that Supabase project. A fresh project needs its own Auth user and allowlist entry.

1. In **Supabase → Authentication → Users**, create a user for the staff member and copy their UID.
2. In the SQL Editor, insert that UID into the admin allowlist.

   ```sql
   insert into public.registration_admins (user_id)
   values ('REPLACE_WITH_AUTH_USER_UUID')
   on conflict (user_id) do nothing;
   ```

3. Have the staff member sign in through `/admin` with their email and password. To revoke dashboard access, remove the matching row from `public.registration_admins`. This takes effect on subsequent requests.

Store staff passwords and `SUPABASE_SECRET_KEY` in approved credential storage. `.env.local` is ignored by Git. Use `.env.example` as the template for variable names, and keep actual credentials out of source control.

### How the admin dashboard works

After checking the open BIDA app, staff click **Issue verification code** and share the eight-character code with that visitor. Codes expire after 10 minutes, and the dashboard shows recent codes as **Available**, **Used**, or **Expired**. The dashboard displays 50 registrations per page, newest first, with timestamps shown in Hong Kong time (UTC+8). Search matches a partial name, email, reference, or registration time. **Clear** restores the full list. The dashboard checks for updates every five seconds while visible and preserves the active search.

Supabase Auth checks the email and password. The server and database RLS both check the user's UID against `registration_admins`. The admin session is stored in HTTP-only cookies and refreshed for `/admin` through [`proxy.ts`](proxy.ts).

### Deployment

For an upgrade from the original flow, apply `20261126000004_staff_verification.sql` first and deploy the updated app. Once that release is active, apply `20261126000005_require_verified_registration.sql` to disable legacy direct writes. The public Vercel Production deployment requires shared mode. Run the visitor and admin checks below against the deployed URL.

Before public launch, serve the app over HTTPS, keep `/admin` responses out of any CDN or proxy cache, and configure host-level rate limits for `/api/verification`, `/api/registrations`, and `/admin` sign-in. Use individual admin accounts, store project secrets in the host's secret manager, and decide how long attendee records should be kept. [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys) · [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)

## Routes

| URL | Behavior |
| --- | --- |
| `/` | Shows the landing page, store badges, and registration form. |
| `/#download` | Jumps to the hero and store badges. The confirmation screen links here. |
| `/#join` | Jumps to the registration form. Missing or unknown confirmation codes return here. |
| `/registered#BIDA-…` | Displays a confirmation when the code belongs to a record in the current session. |
| `/admin` | Shows sign-in or the private registrations table in shared mode. |
| `POST /api/verification` | Checks a staff-issued code without using it. |
| `POST /api/registrations` | Validates the visitor fields and uses the staff code as part of saving the registration. |
| `/index.html`, `/registered.html` | Redirect to `/` and `/registered` on the Next.js server for compatibility with the original URLs. |

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
│   ├── layout.tsx
│   ├── page.tsx
│   ├── registration-code.ts
│   ├── registration-form.tsx
│   ├── registration-session.ts
│   ├── store-buttons.tsx
│   └── verification-code.ts
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
│       └── 20261126000005_require_verified_registration.sql
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

| Path | Responsibility |
| --- | --- |
| [`app/layout.tsx`](app/layout.tsx) | Root layout, title, and icon. |
| [`app/page.tsx`](app/page.tsx) | Server-rendered landing page, including the hero and capabilities panel. |
| [`app/registration-form.tsx`](app/registration-form.tsx) | Visitor code verification and name and email submission. |
| [`app/registration-session.ts`](app/registration-session.ts) | Maintains tab-local ticket access and generates codes in demo mode. |
| [`app/api/registrations/route.ts`](app/api/registrations/route.ts) | Validates visitor input and inserts registrations using a server-side Supabase key. |
| [`app/admin/`](app/admin/) | Staff sign-in, code issuance, and paginated registrations table. |
| [`proxy.ts`](proxy.ts) | Refreshes Supabase sessions for admin routes. |
| [`app/store-buttons.tsx`](app/store-buttons.tsx) | Store badges, the App Store preview dialog, and the mobile navigation bar. |
| [`app/registered/page.tsx`](app/registered/page.tsx) | Confirmation route metadata and static ticket content. |
| [`app/registered/registration-ticket.tsx`](app/registered/registration-ticket.tsx) | Client Component that validates the code from the URL fragment and handles ticket actions. |
| [`app/registered/ticket-image.ts`](app/registered/ticket-image.ts) | Draws the confirmation PNG with Canvas and starts the download. |
| [`app/globals.css`](app/globals.css) | Tailwind CSS theme and breakpoints, local Inter font, hero overlay, and scalloped ticket edge. |
| [`assets/`](assets/) | Shared images and bundled Inter font. See the [Inter license](assets/fonts/OFL-1.1.txt). |

## Registration and PNG export

The form reveals full name and email after verification. The server validates the staff code again during submission and locks the code row so two visitors cannot use it at the same time. It saves the registration and marks the code used in one transaction. New confirmation references start with `BIDA-`, and existing `DEMO-` references remain valid. The browser stores the reference in `sessionStorage` under `bida-hk-demo-v1` before opening the confirmation.

The value is a JSON array using the original field names. `interests` and `checked` are kept as empty arrays for new registrations. The ticket does not need the visitor’s email address in browser storage.

```json
[
  {
    "name": "Sample Visitor",
    "code": "BIDA-ABC123",
    "interests": [],
    "checked": [],
    "created": "2026-12-06T02:00:00.000Z"
  }
]
```

The confirmation route reads the code from the URL fragment in the browser. Reloading in the same tab and origin preserves access while the record is present. A copied URL depends on the destination tab having the matching session record. To reset local test data, delete `bida-hk-demo-v1` in DevTools under **Application → Session Storage** for the current origin.

**Save confirmation image** loads the bundled Inter font and BIDA logo, then renders a 960 × 690 PNG named `<code>.png`. Update `ticket-image.ts` when changing wording, artwork, or typography that also appears in the download.

### Shared registration API

`POST /api/verification` takes `{"code":"BDADE2M7"}` and returns `available`, `expired`, `used`, or `invalid` in the `status` field. `POST /api/registrations` accepts JSON with a full name, email address, and staff verification code.

```json
{
  "name": "Sample Visitor",
  "email": "visitor@example.com",
  "verificationCode": "BDADE2M7"
}
```

A successful registration returns `201` with `{"code":"BIDA-ABC123"}`. The endpoint returns `400` for invalid input, `409` for an already-used staff code, `410` for an expired code, and `503` when shared registration is unavailable or the write fails. Use a development Supabase project for scripted submissions.

### Database objects

| Object | Responsibility |
| --- | --- |
| `public.registrations` | Stores the confirmation reference, name, email, and server timestamp. Earlier records may have an unavailable email. |
| `public.registration_admins` | Stores the Supabase Auth user IDs allowed to read registrations. |
| `public.verification_codes` | Stores issued codes, their issuer, expiration, and usage time. |
| `public.register_verified_visitor(...)` | Uses the staff code and inserts the registration atomically. |
| `public.search_booth_registrations(search_term)` | Searches names, email addresses, references, and Hong Kong registration times under RLS. |

## Responsive styles and assets

Most layout and typography styles live in mobile-first Tailwind utilities in the components. `app/globals.css` defines the breakpoints used by the original design.

| Condition | Layout change |
| --- | --- |
| Width above 700 px and height above 500 px | The hero uses a wide aspect ratio and a centered cover crop. |
| Landscape and height of 500 px or less | The hero uses a compact two-column layout and adjusts the crop. |
| Width from 701 px | The fixed mobile navigation is hidden. |
| Width above 340 px | The two confirmation actions appear side by side. |

The app imports original raster assets from `assets/images/` and loads `assets/fonts/inter.woff2` locally. For event copy changes, check the page components, Canvas export, and branded artwork, since some of the copy is baked into the images.

## Original site reference

The original static site is preserved in Git at commit `1dd4b2bfcde6abc0877d4d24a276e062d17087b3`. To compare it with the Next.js app, check it out in a separate directory from the repository root.

```sh
git worktree add --detach ../bida-registration-reference 1dd4b2bfcde6abc0877d4d24a276e062d17087b3
```

Open `index.html` in that checkout in Chrome or Edge, or serve the checkout with a separate local HTTP server. Submit the original form to open its confirmation page. Keep each version’s registration and confirmation in the same browser tab.

## Manual regression checks

1. Compare the Next.js app and the original reference at **375 px**, **768 px**, and **1440 px** in responsive mode. Check hero crops, typography, spacing, images, and the scalloped ticket edge. Look for horizontal overflow. Also check a narrow 320 px viewport for stacked ticket buttons and a short landscape viewport such as 844 × 390 for the compact hero.
2. Click the Google Play badge and confirm it opens the [Google Play listing](https://play.google.com/store/apps/details?id=com.payso.ofw). Open the App Store badge, check the preview copy, and test both **Close** and **Escape**. At mobile widths, scroll past the badges and verify that the bottom navigation appears and that input focus hides it.
3. Enter an invalid code and confirm the form stays locked. Verify a valid code, check that an invalid name or email can be corrected, then complete registration. Try the same staff code again and check that it is rejected.
4. Reload the confirmation in the same tab and verify that the code remains visible. Try an unknown code and verify that it returns to `/#join`.
5. Save the ticket image and open the resulting PNG. Check that the filename and printed code match the confirmation, then click **Download BIDA** and verify that the page returns to `/#download`.
6. In shared mode, verify that a signed-out user sees the admin sign-in screen. Sign in with an allowlisted account, register from a separate tab, then return to the dashboard. Check that the new row appears, and verify search and **Clear** on a phone-sized viewport and on desktop.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| `/admin` says shared registration must be configured | Set `BIDA_REGISTRATION_MODE=supabase`, confirm the project URL and keys, and restart Next.js. |
| Staff can authenticate but cannot open the dashboard | Check that the Auth UID is allowlisted in the same project used by the app. |
| Search or staff code issuance fails | Confirm that `20261126000004_staff_verification.sql` was applied to the configured project. |
| New registrations are missing from the dashboard | Confirm the visitor app is in shared mode and both views use the same project. Open the dashboard tab to resume automatic updates. Demo records stay in their original tabs. |
| The confirmation redirects to registration | Use the same tab and origin that submitted the form. Check that `bida-hk-demo-v1` is available and contains valid JSON. |
| The PNG fails to save | Check browser download permissions and confirm that the bundled logo and Inter font load. |
