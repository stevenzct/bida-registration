# BIDA Hong Kong booth registration

This project is the demo registration site for the BIDA booth in Hong Kong on 6 December 2026. Visitors can choose optional activities, enter a name, and save a PNG of their confirmation code. The app uses Next.js App Router, React, TypeScript, and Tailwind CSS. Registration and image export run in the browser, with no backend, database, or environment variables required. The Google Play and App Store badges open preview dialogs.

## Local setup

Use Node.js **20.9 or newer** and npm. The migration was verified with Node.js 24.21.0 and npm 11.19.0. Run these commands from the repository root. In Windows PowerShell, use `npm.cmd` in place of `npm` if your execution policy blocks `npm.ps1`.

```sh
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and use a sample name such as `Sample Visitor`. Keep the landing page and confirmation in the same tab so the ticket can read the registration. To select another local port, run `npm run dev -- --port 3061` and use the URL printed by Next.js.

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

## Routes

| URL | Behavior |
| --- | --- |
| `/` | Shows the landing page, store previews, and registration form. |
| `/#download` | Jumps to the hero and store badges. The confirmation screen links here. |
| `/#join` | Jumps to the registration form. Missing or unknown confirmation codes return here. |
| `/registered#DEMO-…` | Displays a confirmation when the code belongs to a record in the current session. |
| `/index.html`, `/registered.html` | Redirect to `/` and `/registered` on the Next.js server for compatibility with the original URLs. |

## Project structure

```text
bida-registration/
├── app/
│   ├── registered/
│   │   ├── page.tsx
│   │   ├── registration-ticket.tsx
│   │   └── ticket-image.ts
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── registration-form.tsx
│   ├── registration-session.ts
│   └── store-buttons.tsx
├── assets/
│   ├── fonts/
│   │   ├── inter-offline.css
│   │   ├── inter.woff2
│   │   └── OFL-1.1.txt
│   └── images/
├── .gitignore
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── README.md
└── tsconfig.json
```

| Path | Responsibility |
| --- | --- |
| [`app/layout.tsx`](app/layout.tsx) | Root layout, title, and icon. |
| [`app/page.tsx`](app/page.tsx) | Server-rendered landing page, including the hero and capabilities panel. |
| [`app/registration-form.tsx`](app/registration-form.tsx) | Client Component for activity selection, name validation, and submission. |
| [`app/registration-session.ts`](app/registration-session.ts) | Reads and writes the registration array and generates codes. |
| [`app/store-buttons.tsx`](app/store-buttons.tsx) | Client Components for store preview dialogs and the mobile navigation bar. |
| [`app/registered/page.tsx`](app/registered/page.tsx) | Confirmation route metadata and static ticket content. |
| [`app/registered/registration-ticket.tsx`](app/registered/registration-ticket.tsx) | Client Component that validates the code from the URL fragment and handles ticket actions. |
| [`app/registered/ticket-image.ts`](app/registered/ticket-image.ts) | Draws the confirmation PNG with Canvas and starts the download. |
| [`app/globals.css`](app/globals.css) | Tailwind CSS theme and breakpoints, local Inter font, hero overlay, and scalloped ticket edge. |
| [`assets/`](assets/) | Shared images and bundled Inter font. See the [Inter license](assets/fonts/OFL-1.1.txt). |

## Registration and PNG export

The form trims the name, rejects blank input, and accepts up to 100 characters. Activities are optional. On submission, the app generates a `DEMO-` code using browser randomness, checks for a collision against the current session, and appends the record to `sessionStorage` under `bida-hk-demo-v1` before navigating to the confirmation route.

The value is a JSON array using the original field names. `interests` contains the selected activity labels, `checked` is initialized as an empty array for compatibility, and `created` is an ISO timestamp in UTC.

```json
[
  {
    "name": "Sample Visitor",
    "code": "DEMO-ABC123",
    "interests": ["Spin Wheel", "Quick Quiz"],
    "checked": [],
    "created": "2026-12-06T02:00:00.000Z"
  }
]
```

The confirmation route reads the code from the URL fragment in the browser. Reloading in the same tab and origin preserves access while the record is present. A copied URL depends on the destination tab having the matching session record. To reset local test data, delete `bida-hk-demo-v1` in DevTools under **Application → Session Storage** for the current origin.

**Save code image** loads the bundled Inter font and BIDA logo, then renders a 960 × 690 PNG named `<code>.png`. The exported image uses its own Canvas layout. Update `ticket-image.ts` when changing wording, artwork, or typography that also appears in the download. Changes to the on-screen ticket alone affect only the page.

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
2. Open both store badges and verify the title and preview copy. Close one dialog with **Close** and the other with **Escape**. At mobile widths, scroll past the badges and verify that the bottom navigation appears and that input focus hides it.
3. Try submitting an empty or whitespace-only name. Confirm the validation message and input focus. Register with a sample name and selected activities, then repeat with no selections. Inspect the session storage array and confirm that each ticket matches its stored code.
4. Reload the confirmation in the same tab and verify that the code remains visible. Try an unknown code and verify that it returns to `/#join`.
5. Save the ticket image and open the resulting PNG. Check that the filename and printed code match the confirmation, then click **Download BIDA** and verify that the page returns to `/#download`.

If the app reports a storage error, check that browser session storage is available for the origin and that `bida-hk-demo-v1` contains valid JSON. If the PNG fails to save, check that downloads are allowed and that the bundled logo and font load in the browser's Network panel.
