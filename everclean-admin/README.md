# EverClean Admin (Next.js)

Source for the staff/admin console deployed at
`https://everclean-admin.vercel.app`.

This is a standalone Next.js app, intentionally separate from the customer-facing
Next.js app in the repo root (`/app`) and from the Express API in `/api-server`.
The customer app redirects users with the `ADMIN` role to the Vercel URL above
(see `app/page.tsx`, `app/dashboard/layout.tsx`, `app/pro/layout.tsx`).

## Why it lives in this repo

Keeping it here lets us share types/contracts with the API server and iterate on
admin features (booking creation, address-cache savings dashboard, etc.) in the
same PRs that touch backend routes.

## Why it's excluded from the Replit deploy

The Replit deployment only runs the Express API (`cd api-server && node server.mjs`).
This folder is listed in `.replitignore` and `.dockerignore` so its `node_modules`
and `.next` output don't bloat the Replit build. It is built and deployed
separately on Vercel.

## Local development

```bash
cd everclean-admin
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_URL` in `.env.local` to point at the API you want to hit.

## Do not delete

A previous cleanup task flagged this directory as "leftover scaffolding". It is
not — it contains the live admin pages (`app/page.tsx`, `app/new-booking`,
`app/address-cache`). Two sibling scratch folders (`everclean-admin-clean/` and
`everclean-client/`) have already been removed.
