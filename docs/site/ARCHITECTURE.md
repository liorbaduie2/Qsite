# Architecture

[Back to index](./README.md)

## App shell

- `app/layout.tsx` is the canonical root shell.
- The app uses RTL Hebrew defaults and client-side theme hydration.
- `AuthProvider` is the core session/profile/permission state container.

## Product surface

- Core product pages: 9
- Auth and onboarding pages: 7
- Admin and moderation pages: 2
- API route files: 78
- Database tables discovered from migrations: 42

## Data flow

- Most features follow: page/component -> `/api/*` route handler -> Supabase query or SQL RPC.
- Some client-only flows talk to Supabase directly for session, profile, or preference work.
- Notifications and other cross-user writes rely on service-role access in controlled helper modules.

## Important architectural traits

- Login approval, reputation blocking, and admin permissions add a second authorization layer beyond basic auth. Post-approval access is governed by `profiles.account_state` (active/suspended/blocked); blocked users are redirected to `/account/blocked` and can submit in-app appeals (no email); only the owner manages appeals in the admin dashboard.
- The database is part of the business-logic surface, not just persistence.
- The codebase mixes custom product code with a smaller amount of original Supabase starter scaffolding.
