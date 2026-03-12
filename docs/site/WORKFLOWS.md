# Workflows

[Back to index](./README.md)

## Auth and onboarding

Login is handled in the app shell, while registration is a custom multi-step flow with availability checks, phone verification, account creation, and admin approval. New users start with 50 reputation and `account_state = active` (enforced in DB trigger and register API).

**Account state (post-approval):** `profiles.account_state` controls access: `active` (full access), `suspended` (read-only; write APIs return 403), `blocked` (can log in but are redirected to `/account/blocked`; all their content is hidden from public—ghosting). Blocked users can submit appeals **in-app** via a form on `/account/blocked`; appeals are stored in `blocked_account_appeals` (no email). Only the **owner** can view and manage these appeals in the admin dashboard (tab "ערעורי חסימה"): mark as reviewed/resolved or unblock the user. When reputation hits 0, the DB sets `account_state = blocked`; when an admin restores reputation above 0, it becomes `active` again.

Key files:
- `app/components/AuthProvider.tsx` (exposes `accountState`, `isReadOnly`; redirects blocked users to `/account/blocked`)
- `app/components/HebrewRegistration.tsx`
- `app/components/LoginModal.tsx`
- `app/components/RegisterModal.tsx`
- `app/api/auth/register/route.ts`
- `app/api/auth/send-verification/route.ts`
- `app/api/auth/verify-phone/route.ts`
- `app/api/auth/submit-application/route.ts`
- `app/api/admin/approve-user/route.ts` (sets `account_state = active` on approve)
- `app/api/admin/set-account-state/route.ts` (admin sets `account_state` directly)
- `lib/account-state.ts` (`requireActiveAccount` used by write APIs to enforce active/suspended/blocked)

## Questions and answers

Questions are discovered on the home and question-index routes, created through a modal workflow, and managed in detail pages that support answers, voting, reporting, and removal requests.

Key files:
- `app/page.tsx`
- `app/questions/page.tsx`
- `app/questions/[id]/page.tsx`
- `app/components/NewQuestionModal.tsx`
- `app/api/questions/route.ts`
- `app/api/questions/[id]/answers/route.ts`
- `app/api/questions/[id]/vote/route.ts`
- `app/api/questions/[id]/request-removal/route.ts`
- `lib/tag-matching.ts`

## Statuses, profiles, and notifications

The app has a lighter-weight status feed, public and private profile views, and a notification layer that connects activity across features.

Key files:
- `app/status/page.tsx`
- `app/profile/page.tsx`
- `app/profile/[username]/page.tsx`
- `app/notifications/page.tsx`
- `app/hooks/useNotificationsRealtime.ts`
- `app/api/status/route.ts`
- `app/api/profile/[username]/route.ts`
- `app/api/notifications/route.ts`
- `lib/notifications.ts`

## Chat, moderation, and admin

Chat is request-based and tied into blocking, reporting, unread state, and presence. Admin flows span approvals, moderation queues, permission management, and appeals. Admins can set a user's `account_state` (active/suspended/blocked) via `/api/admin/set-account-state`; suspend-user and approve-user APIs also update `account_state`. **Blocked-account appeals** are submitted in-app (no email); only the owner sees them in the admin panel ("ערעורי חסימה") and can mark reviewed/resolved or unblock the user via `/api/appeals/blocked-account` (POST submit, GET list) and `/api/appeals/blocked-account/[id]` (PATCH status/unblock).

Key files:
- `app/chat/page.tsx`
- `app/chat/[conversationId]/page.tsx`
- `app/admin/page.tsx`
- `app/admin/permissions/page.tsx`
- `app/components/AdminDashboard.tsx`
- `app/api/chat/request/route.ts`
- `app/api/chat/conversations/[id]/messages/route.ts`
- `app/api/report/content/route.ts`
- `app/api/admin/question-deletion-appeals/[id]/decision/route.ts`
- `app/api/admin/set-account-state/route.ts`
- `app/api/appeals/blocked-account/route.ts` (POST submit, GET list owner-only)
- `app/api/appeals/blocked-account/[id]/route.ts` (PATCH status/unblock owner-only)
