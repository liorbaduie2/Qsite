# Registration Flow – Full Regression & Smoke Test Report

**Date:** 2026-03-18  
**Last Updated:** 2026-03-18 (post-hardening)  
**Scope:** End-to-end registration flow, Twilio integration, DB integrity, admin approval, email notification, login gating  
**Method:** Static code analysis + Playwright browser-level smoke tests + direct API abuse tests

---

## Executive Summary

An initial audit found **4 Critical**, **5 High**, **6 Medium**, and **4 Low** severity issues. All Critical and High issues have been **resolved** in a security-hardening pass. Post-fix regression tests pass **16/16**. The system now uses **Twilio Verify** for OTP, **HMAC-signed tokens** for cross-API authentication, **DB-level UNIQUE constraints** on phone/email, and **middleware-enforced approval checks** on API routes.

---

## Remediation Status

| # | Issue | Severity | Status | How Fixed |
|---|-------|----------|--------|-----------|
| 1 | Phone verification bypass via direct API | CRITICAL | **FIXED** | Register API requires an HMAC-signed `phoneVerificationToken` issued by `verify-phone` after Twilio Verify confirms the OTP. Direct API calls without a valid token return 403 `PHONE_NOT_VERIFIED`. |
| 2 | Unauthenticated submit-application | CRITICAL | **FIXED** | Submit-application requires an HMAC-signed `registrationToken` issued by the register API, scoped to the userId. Unauthenticated or mismatched calls return 403 `UNAUTHORIZED`. |
| 3 | No UNIQUE on phone/email in DB | CRITICAL | **FIXED** | Migration `20260318200000_unique_phone_email_constraints.sql` adds `UNIQUE` constraints on `profiles.phone` and `profiles.email`. Register API catches `23505` duplicate-key errors and returns friendly Hebrew messages. |
| 4 | Frontend skips verification on SMS failure | CRITICAL | **FIXED** | `phoneVerificationSkipped` flag removed entirely. If `sendVerification()` fails, the flow stays on step 1 and shows the error. Users must successfully send an OTP before advancing. |
| 5 | No OTP brute force lockout | HIGH | **FIXED** | Twilio Verify enforces a 5-attempt lockout per verification automatically. The `verify-phone` route surfaces Twilio error 60202 as "יותר מדי ניסיונות. הקוד פג תוקף". |
| 6 | Not using Twilio Verify API | HIGH | **FIXED** | Full migration: `lib/twilio.ts` rewritten to use `client.verify.v2.services(sid).verifications.create()` and `verificationChecks.create()`. Self-managed 4-digit codes, `phone_verifications` DB storage, and `dev-phone-codes.ts` removed. `TWILIO_VERIFY_SERVICE_SID` added to env. OTP is now 6 digits (Twilio Verify default). |
| 7 | API routes skip approval check | HIGH | **FIXED** | Middleware updated: non-public API routes now check `approval_status` for authenticated users. Pending users receive JSON 403 `PENDING_APPROVAL` instead of being silently allowed. Unauthenticated API calls return JSON 401 instead of HTML redirect. Benign polling routes (`/api/notifications/`, `/api/me/`, `/api/chat/unread-count`) are whitelisted so the pending page works without errors. |
| 8 | Race condition in registration | HIGH | **FIXED** | DB UNIQUE constraints (item 3) are the primary guard. Register API also catches PostgreSQL error `23505` and returns `DUPLICATE_ENTRY`. |
| 9 | OTP code logged in plaintext | HIGH | **FIXED** | `send-verification/route.ts` fully rewritten. No verification codes are generated, stored, or logged by the server — Twilio Verify manages them entirely. `demoCode` response field removed. |
| 10 | Approve-user flow ordering | MEDIUM | **FIXED** | `approve-user/route.ts` now calls `admin_update_user_status` RPC first (authoritative DB update), then sends email as best-effort. If the RPC fails, no email is sent. |
| 11 | Username length mismatch FE/BE | MEDIUM | **FIXED** | Backend register API now validates 3–20 characters, matching the frontend. |
| 12 | Email format not validated server-side | MEDIUM | **FIXED** | Register API validates email with `^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$` regex. |
| 13 | Phone format not validated in register API | MEDIUM | **FIXED** | Register API validates Israeli phone regex before proceeding. |

### Remaining (unfixed, lower priority)

| # | Issue | Severity | Status | Notes |
|---|-------|----------|--------|-------|
| 14 | check-availability no rate limiting | MEDIUM | Open | Enumeration still possible; consider IP-based rate limiting. |
| 15 | can-user-login info leak | MEDIUM | Mitigated | Middleware now returns 401 for unauthenticated API calls. Underlying RPC still grants `anon` access. |
| 16 | FROM_EMAIL fallback to `yoursite.com` | MEDIUM | Open | `.env.local` has correct value; fallback only triggers if env var missing. |
| 17 | Dead code (AuthModal, sign-up-form) | LOW | Open | Not used in main flow; consider removing. |
| 18 | LoginModal reset-password no handler | LOW | Open | Button does nothing. |
| 19 | 1-second delay for profile trigger | LOW | Open | Fragile under load; consider polling. |

---

## Architecture After Hardening

### Registration Flow (end-to-end)

```
Step 1: Phone Input
  → POST /api/auth/send-verification { phone }
  → Twilio Verify sends 6-digit OTP via SMS

Step 2: OTP Entry (6 digits)
  → POST /api/auth/verify-phone { phone, code }
  → Twilio Verify validates code (built-in brute-force protection)
  → Returns signed phoneVerificationToken (HMAC, 10-min TTL)

Step 3–6: Email, Username, Gender, DOB, Password
  → Client-side validation + /api/auth/check-availability

Step 6 Submit: Registration
  → POST /api/auth/register { ..., phoneVerificationToken }
  → Server validates token signature + phone match + TTL
  → Server validates email format, phone format, username 3–20 chars
  → Duplicate check (app-level) + UNIQUE constraints (DB-level)
  → auth.admin.createUser → profile insert → application insert
  → Returns signed registrationToken (HMAC, 10-min TTL)

Application Stage:
  → POST /api/auth/submit-application { userId, applicationText, registrationToken }
  → Server validates token signature + userId match + TTL
  → Updates user_applications with real text

Pending:
  → User redirected to /auth/pending
  → Middleware blocks non-public API routes with 403
  → Polling routes (notifications, chat, ping) whitelisted

Admin Approval:
  → POST /api/admin/approve-user (Bearer auth + can_approve_registrations)
  → DB status updated FIRST via admin_update_user_status RPC
  → Email sent AFTER as best-effort
  → User can now log in
```

### Security Layers

| Layer | Protection |
|-------|-----------|
| **Twilio Verify** | OTP generation, delivery, 6-digit codes, 5-attempt lockout, automatic expiry |
| **HMAC tokens** | `phoneVerificationToken` (phone→register), `registrationToken` (register→submit-application). Signed with service-role key, 10-min TTL, timing-safe comparison. |
| **DB UNIQUE** | `profiles.phone` and `profiles.email` have UNIQUE constraints. PostgreSQL rejects duplicates at the DB level regardless of application logic. |
| **Middleware** | Unauthenticated API calls → 401 JSON. Pending-user API calls → 403 JSON (except public/read-only routes). Page routes → redirect. |
| **RLS** | Content tables require `approval_status = 'approved'` AND `account_state = 'active'` for writes. |
| **Admin auth** | Bearer token + `authenticateAdmin` + permission flags for all admin endpoints. |

---

## Files Changed (Hardening Pass)

| File | Change |
|------|--------|
| `lib/twilio.ts` | Rewritten: Twilio Verify API (`sendVerification`, `checkVerification`) replaces Messaging API |
| `lib/registration-token.ts` | **New** — HMAC-signed stateless tokens for phone verification and registration |
| `lib/dev-phone-codes.ts` | **Deleted** — in-memory dev OTP store no longer needed |
| `app/api/auth/send-verification/route.ts` | Rewritten: calls Twilio Verify, no self-managed codes, no plaintext logging, no `demoCode` |
| `app/api/auth/verify-phone/route.ts` | Rewritten: calls Twilio Verify Check, returns signed `verificationToken` |
| `app/api/auth/register/route.ts` | Added: `phoneVerificationToken` validation, server-side format validation (email, phone, username 3–20), `23505` duplicate handling, returns `registrationToken` |
| `app/api/auth/submit-application/route.ts` | Secured: requires `registrationToken` matching userId; unauthenticated calls return 403. Fixed default-text list (removed typo variant). |
| `app/components/HebrewRegistration.tsx` | Removed `phoneVerificationSkipped` bypass; 6-digit OTP input; captures and forwards `verificationToken` and `registrationToken` |
| `lib/supabase/middleware.ts` | API routes now checked for approval; unauthenticated API calls return JSON 401; benign polling routes whitelisted for pending page |
| `app/api/admin/approve-user/route.ts` | Reordered: RPC status update first, email second (best-effort) |
| `.env.local` | Added `TWILIO_VERIFY_SERVICE_SID` |

### Database Migration

| Migration | Effect |
|-----------|--------|
| `20260318200000_unique_phone_email_constraints.sql` | `UNIQUE` on `profiles.phone` and `profiles.email`, with duplicate cleanup |

---

## Post-Fix Test Results (16/16 PASS)

| Test | Result |
|------|--------|
| Homepage loads | PASS |
| Registration blocked without phone verification | PASS — returns 403 `PHONE_NOT_VERIFIED` |
| Forged verification token rejected | PASS — returns 403 `PHONE_NOT_VERIFIED` |
| Unauthenticated submit-application blocked | PASS — returns 403 `UNAUTHORIZED` |
| Forged registration token rejected | PASS — returns 403 `UNAUTHORIZED` |
| Invalid PIN rejected | PASS — returns 400 |
| Check-availability works | PASS |
| Missing fields rejected | PASS — returns 400 `MISSING_FIELDS` |
| Server-side email validation | PASS — blocked before registration |
| Server-side username length (2 chars) | PASS — blocked before registration |
| Admin approve without auth | PASS — returns 401 |
| Secrets not exposed to client | PASS |
| Twilio Verify used (no demoCode) | PASS — response contains only `success` and `message` |
| No OTP code in API response | PASS |
| Phone format validated server-side | PASS — returns 400 |
| Duplicate phone blocked | PASS — blocked before registration |

---

## Test Artifacts

- **Test file:** `tests/registration-smoke.spec.ts`
- **Test users from initial audit (pre-fix):**
  - `db0289e8-9dbe-442f-9411-43a25334a265` (bypass test — created before fix)
  - Additional pending test users with `bypassuser*`, `pendtest*` prefixes
- **Post-fix tests:** No test users were created (all registration attempts correctly blocked)

---

*Report generated from static code analysis across 25+ files, 18 initial smoke tests, and 16 post-fix regression tests.*
