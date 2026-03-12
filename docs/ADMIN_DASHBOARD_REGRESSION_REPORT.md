# Admin Panel Dashboard — Regression & Security Hardening Report

**Date:** 2026-03-12  
**Status:** All critical, high, medium, and low issues **FIXED**.

---

## Summary of Changes

### New: Shared Admin Auth Helper (`lib/admin-auth.ts`)

A centralized helper provides consistent Bearer-token authentication and permission resolution for all admin API routes:

- `authenticateAdmin(request)` — validates JWT, resolves `get_user_admin_permissions`
- `requireAdminPermission(request, key)` — authenticate + require a specific permission flag
- `requireOwner(request)` — authenticate + require owner role
- `isAdminAuth(result)` — type guard for success vs. error response

All admin APIs now import from this helper instead of duplicating auth logic.

---

### 1. get-user-permissions API (CRITICAL — FIXED)

**File:** `app/api/permissions/get-user-permissions/route.ts`

- **Before:** No authentication; accepted any `userId` in body from anyone.
- **After:**
  - Requires Bearer token (JWT) via `Authorization` header.
  - Validates caller identity via `supabase.auth.getUser(token)`.
  - Authorization: caller can only request **their own** `userId`, unless caller is `owner` or `guardian` (admin exception).
  - Removed hardcoded owner fallback (`25928cfa-...` / `lior@gmail.com`).

### 2. AdminRoute — Hardcoded Owner Removed (MEDIUM — FIXED)

**File:** `app/components/AuthProvider.tsx`

- **Before:** AdminRoute and `getUserPermissions` contained hardcoded owner ID (`25928cfa-123a-4b66-935c-8ffff11d5d09`) and email (`lior@gmail.com`).
- **After:**
  - All hardcoded owner references **removed** from runtime code.
  - Owner identity is now resolved purely from the database (`user_roles` table) and `get_user_admin_permissions` RPC.
  - `OWNER_USER_ID` env var added to `.env.local` and `.env.example` for documentation (not used in runtime logic — DB is the source of truth).
  - AdminRoute simplified: checks `userPermissions.role === "owner"` or `can_view_user_list` — no special-case IDs.

### 3. Standardized Admin API Authentication (HIGH — FIXED)

**Before:** Mix of Bearer token and cookie/session auth across admin APIs.  
**After:** All admin APIs use Bearer token via the shared `admin-auth.ts` helper.

Routes converted from cookie (`createClient`/server) to Bearer (`getAdminClient` + shared helper):

| Route | Auth method before | Auth method after |
|-------|-------------------|-------------------|
| `/api/admin/activity-log` | Cookie (server) | Bearer + `requireOwner` |
| `/api/admin/question-removal-requests` | Cookie (server) | Bearer + `authenticateAdmin` |
| `/api/admin/question-deletion-appeals` | Cookie (server) | Bearer + `requireOwner` |
| `/api/admin/question-removal-requests/[id]` | Cookie (server) | Bearer + `authenticateAdmin` |
| `/api/admin/question-deletion-appeals/[id]/decision` | Cookie (server) | Bearer + `requireOwner` |
| `/api/admin/approve-user` | None (body `adminId`) | Bearer + `authenticateAdmin` + `can_approve_registrations` |
| `/api/admin/apply-penalty` | Bearer (no perm check) | Bearer + `authenticateAdmin` + `can_deduct_reputation` |
| `/api/admin/set-account-state` | Bearer (body `adminId` for logs) | Bearer + `authenticateAdmin` (derive ID from token) |
| `/api/stats/admin` | Cookie + `is_moderator` | Bearer + `authenticateAdmin` + `can_view_user_list` |
| `/api/admin/users-overview` | Bearer (already OK) | Bearer + `requireAdminPermission('can_view_user_list')` |

Routes that were already using Bearer correctly (unchanged):

- `/api/admin/grant-role` — owner only
- `/api/admin/revoke-role` — owner only
- `/api/admin/set-role-visibility` — owner only
- `/api/admin/grant-reputation` — owner only
- `/api/admin/config/admin-roles` — owner only
- `/api/admin/config/permissions-matrix` — owner only
- `/api/admin/config/reputation-permissions` — owner only
- `/api/admin/config/milestones` — owner only
- `/api/admin/config/penalties` — owner only
- `/api/admin/check-milestones` — admin only

### 4. RPCs Secured (CRITICAL — FIXED)

**Migration:** `20260312120000_secure_admin_rpcs_and_views.sql`

| RPC / View | Fix applied |
|-----------|-------------|
| `get_admin_dashboard_stats` | Now calls `get_user_admin_permissions(admin_id)` and requires `can_approve_registrations` or `owner` role before returning data. Returns zeros on permission failure. |
| `get_pending_applications` | Same: requires `can_approve_registrations` or `owner`. Returns empty set on permission failure. |
| `apply_penalty` | Now calls `get_user_admin_permissions(admin_user_id)` and requires `can_deduct_reputation`. Also enforces `max_reputation_deduction` limit (owner is unlimited). |
| `admin_user_overview` view | `REVOKE SELECT FROM anon` — no longer accessible to unauthenticated users. |
| `get_admin_dashboard_stats` function | `REVOKE ALL FROM anon` — only `authenticated` and `service_role` can call. |

### 5. approve-user API (CRITICAL — FIXED)

**File:** `app/api/admin/approve-user/route.ts`

- **Before:** No auth; trusted body's `adminId`; checked legacy `is_moderator` on profiles.
- **After:**
  - Requires Bearer token.
  - Derives admin ID from authenticated session (ignores body's `adminId`).
  - Checks `can_approve_registrations` via `get_user_admin_permissions`.

### 6. apply-penalty API (CRITICAL — FIXED)

**File:** `app/api/admin/apply-penalty/route.ts`

- **Before:** Validated JWT but did not check `can_deduct_reputation`.
- **After:**
  - Requires `can_deduct_reputation` via shared auth helper.
  - RPC also enforces the same check (defense in depth).
  - RPC now enforces `max_reputation_deduction` limit per admin role.

### 7. Legacy Stats API (HIGH — FIXED)

**File:** `app/api/stats/admin/route.ts`

- **Before:** Used `getSession()` (cookie) + checked `profiles.is_moderator`/`is_verified`.
- **After:** Uses Bearer + `authenticateAdmin` + requires `can_view_user_list`.

### 8. Dashboard: No Direct View Access (CRITICAL — FIXED)

**File:** `app/components/AdminDashboard.tsx`

- **Before:** Dashboard called `supabase.from('admin_user_overview').select('*')` directly from the browser client.
- **After:** Dashboard calls `/api/admin/users-overview` API (which validates Bearer token and checks `can_view_user_list`).

### 9. Dashboard: Bearer Tokens on All Fetches (HIGH — FIXED)

**File:** `app/components/AdminDashboard.tsx`

- Added `getAuthHeaders()` helper that resolves session and returns `{ Authorization: 'Bearer ...' }`.
- All `fetch()` calls in `loadDashboardData`, `handleApprove`, `handleReject`, `handleRemovalDecision`, `handleAppealDecision`, and `handleBlockedAppealAction` now use this helper.
- Removed `adminId` from approve/reject request bodies (server derives it from token).

### 10. set-account-state API (LOW — FIXED)

**File:** `app/api/admin/set-account-state/route.ts`

- Now uses shared auth helper and derives `actor_id` from authenticated token instead of body's `adminId`.

---

## Files Changed

| File | Change |
|------|--------|
| `lib/admin-auth.ts` | **New** — shared admin auth helper |
| `app/api/permissions/get-user-permissions/route.ts` | Auth required, restrict to own userId |
| `app/components/AuthProvider.tsx` | Remove hardcoded owner ID/email |
| `app/api/admin/approve-user/route.ts` | Auth + can_approve_registrations |
| `app/api/admin/apply-penalty/route.ts` | Auth + can_deduct_reputation |
| `app/api/admin/activity-log/route.ts` | Cookie → Bearer, requireOwner |
| `app/api/admin/question-removal-requests/route.ts` | Cookie → Bearer |
| `app/api/admin/question-removal-requests/[id]/route.ts` | Cookie → Bearer |
| `app/api/admin/question-deletion-appeals/route.ts` | Cookie → Bearer, requireOwner |
| `app/api/admin/question-deletion-appeals/[id]/decision/route.ts` | Cookie → Bearer, requireOwner |
| `app/api/admin/set-account-state/route.ts` | Use shared helper, derive admin from token |
| `app/api/admin/users-overview/route.ts` | Use shared helper |
| `app/api/stats/admin/route.ts` | Rewritten: Bearer + permission system |
| `app/components/AdminDashboard.tsx` | Bearer on all fetches, API for user list |
| `.env.local` | Added `OWNER_USER_ID` |
| `.env.example` | Added `OWNER_USER_ID` placeholder |
| `supabase/migrations/20260312120000_secure_admin_rpcs_and_views.sql` | Secure RPCs + restrict view |

---

## Permission Matrix (Reference)

Defined in `lib/permissionKeys.ts`. Roles: `owner` > `guardian` > `admin` > `moderator` > `user`.

| Capability | owner | guardian | admin | moderator | user |
|-----------|-------|----------|-------|-----------|------|
| Access admin dashboard | Yes | Yes | Yes | No | No |
| View user list | Yes | Yes | Yes | No | No |
| Approve registrations | Yes | Yes | No | No | No |
| Suspend user | Yes | Yes | Yes | No | No |
| Block user | Yes | Yes | Yes | No | No |
| Permanent ban | Yes | No | No | No | No |
| Deduct reputation | Yes | Yes | Yes | No | No |
| Grant/revoke roles | Yes | No | No | No | No |
| View activity log | Yes | No | No | No | No |
| Manage permissions matrix | Yes | No | No | No | No |
| Question removal requests | Yes | Yes | No | No | No |
| Question deletion appeals | Yes | No | No | No | No |
| Blocked account appeals | Yes | No | No | No | No |
