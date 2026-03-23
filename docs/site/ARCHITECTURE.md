# Architecture

[Back to index](./README.md)

## App shell

- `app/layout.tsx` is the canonical root shell.
- The app uses RTL Hebrew defaults and client-side theme hydration.
- `AuthProvider` is the core session/profile/permission state container.

## Mobile UX

- Root `viewport` export (`app/layout.tsx`): `width=device-width`, `initial-scale=1`, `maximum-scale=1`, `user-scalable=no` — limits pinch-zoom (tradeoff vs accessibility) and complements form font sizing.
- `app/globals.css`: text-bearing `input` / `textarea` / `select` use a **16px minimum** (with `!important`) so iOS Safari does not auto-zoom on focus; SMS code boxes use class `otp-code-digit` for a larger size while staying above 16px.
- `lib/mobile-nav-scroll.ts` (`scrollToTopAfterMobileNav`) is invoked from `MobileNavDrawer`, `MobileNavbar`, and `GlobalMobileNav` so routes opened from the mobile shell land at the top of the page despite experimental scroll restoration.

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

- Login approval, reputation blocking, and admin permissions add a second authorization layer beyond basic auth.
- The database is part of the business-logic surface, not just persistence.
- The codebase mixes custom product code with a smaller amount of original Supabase starter scaffolding.
