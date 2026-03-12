# Qsite App -- Regression Check Report

**Date:** 2026-03-12
**Scope:** Code-level audit, doc-vs-code comparison, and implementation of the `account_state` architecture.

---

## 1. Changes implemented (account_state architecture)

### Database migration (`20260312100000_account_state_architecture.sql`)
- Added `account_state` column to `profiles`: `'active'` | `'suspended'` | `'blocked'`, default `'active'`
- Backfilled existing data: `reputation_blocked` / `banned` / `suspended` statuses migrated to `account_state`
- Updated `enforce_reputation_limits`: when reputation hits 0, sets `account_state = 'blocked'`; when restored above 0, sets back to `'active'`
- Updated `can_user_login` RPC: blocked and suspended users **can** log in (`can_login: true`); returns `account_state` field; only `pending` / `rejected` prevent login
- Added `auto_expire_suspensions` function: called on login to auto-restore expired suspensions
- Updated `handle_new_user` trigger: includes `account_state = 'active'` and `reputation = 50`
- Updated all RLS policies: `account_state = 'active'` replaces `reputation > 0`

### Backend enforcement
- **New helper** (`lib/account-state.ts`): `requireActiveAccount()` checks `account_state` before any write operation
- **23 write API routes** updated with `account_state` enforcement:
  - Default: only `active` users can write
  - Appeals: `active` and `blocked` (blocked users can appeal)
  - Notifications mark-read: all states
  - Chat mark-read: `active` and `suspended`
- **New admin API** (`/api/admin/set-account-state`): allows admins to change `account_state` directly
- **suspend-user API**: now also sets `account_state = 'suspended'`
- **approve-user API**: now also sets `account_state = 'active'` on approval

### Ghosting (content hiding for blocked users)
- **7 content-serving GET APIs** updated to filter out blocked users' content:
  - `GET /api/questions` -- excludes questions by blocked authors
  - `GET /api/questions/[id]` -- returns 404 if author is blocked
  - `GET /api/questions/[id]/answers` -- excludes answers by blocked authors
  - `GET /api/status` -- excludes statuses by blocked users
  - `GET /api/status/[id]/replies` -- excludes replies by blocked users
  - `GET /api/profile/[username]` -- returns 404 for blocked profiles
  - `GET /api/profile/[username]/comments` -- excludes comments by blocked authors
- Admin APIs (under `/api/admin/`) are NOT filtered, so admins can still see all content

### Frontend
- **AuthProvider** updated:
  - Profile interface includes `account_state`
  - Context exposes `accountState` and `isReadOnly`
  - `useEffect` automatically redirects blocked users to `/account/blocked`
  - `LoginStatusResult` includes `account_state` field
  - `RequireNotBlocked` updated to use `accountState`
- **`/account/blocked` page** updated: uses `accountState` instead of old `loginStatus` checks; non-blocked users are redirected away
- **`LoginStatusMessage`** simplified: removed `suspended` / `banned` / `reputation_blocked` statuses (handled via `account_state` now)
- **Registration**: manual profile insert now includes `reputation: 50` and `account_state: 'active'`

---

## 2. Account state architecture summary

| State | Can login | Can browse | Can write | Content visible | Redirect |
|-------|-----------|------------|-----------|-----------------|----------|
| `active` | Yes | Yes | Yes | Yes | None |
| `suspended` | Yes | Yes (read-only) | No (403) | Yes | None |
| `blocked` | Yes | No | No (403) | No (ghosted) | `/account/blocked` |

- Reputation is purely a number; it does not directly control access
- When reputation = 0, `enforce_reputation_limits` sets `account_state = 'blocked'`
- When reputation goes above 0 (admin grants), `enforce_reputation_limits` restores `account_state = 'active'`
- Admin can directly change `account_state` via `/api/admin/set-account-state`

---

## 3. Remaining items and recommendations

### Registration reputation
- `handle_new_user` trigger sets `reputation = 50` (confirmed in DB)
- Manual profile creation in `/api/auth/register` now also sets `reputation: 50`
- New users can never start with reputation 0

### Suspended read-only mode
- Backend enforces write prevention via `requireActiveAccount` on all write APIs
- Frontend exposes `isReadOnly` from `useAuth()` for UI components to disable write controls
- Recommendation: update UI components (question create button, status post form, chat send, vote buttons, etc.) to check `isReadOnly` and show visual feedback

### Hardcoded owner
- Owner fallback (`25928cfa-...` / `lior@gmail.com`) remains in AuthProvider and get-user-permissions
- Recommendation: move to environment variable for maintainability

### Testing
- No automated tests exist; recommend adding smoke tests for:
  - Login as active/suspended/blocked users
  - Write API rejection for suspended and blocked
  - Ghosting verification (blocked user's content hidden)
  - Admin account_state changes
  - Reputation 0 auto-block trigger

### Documentation
- Run `npm run docs:generate` to refresh generated docs after these changes
