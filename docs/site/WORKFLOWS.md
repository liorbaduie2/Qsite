# Workflows

[Back to index](./README.md)

## Auth and onboarding

Login is handled in the app shell, while registration is a custom multi-step flow with availability checks, phone verification, account creation, and admin approval.

Key files:
- `app/components/AuthProvider.tsx`
- `app/components/HebrewRegistration.tsx`
- `app/components/LoginModal.tsx`
- `app/components/RegisterModal.tsx`
- `app/api/auth/register/route.ts`
- `app/api/auth/send-verification/route.ts`
- `app/api/auth/verify-phone/route.ts`
- `app/api/auth/submit-application/route.ts`
- `app/api/admin/approve-user/route.ts`

## Questions and answers

Questions are discovered on the home and question-index routes, created through a modal workflow, and managed in detail pages that support answers, voting, reporting, and removal requests. Tags are shown via a "הצג תגיות" (Show Tags) toggle on both the question list cards and the detail page. Question owners and ממונה מוסמך (guardian) can edit tags when editing a question; tag selection uses the catalog only (no custom tags).

Key files:
- `app/page.tsx`
- `app/questions/page.tsx`
- `app/questions/[id]/page.tsx`
- `app/components/NewQuestionModal.tsx`
- `app/api/questions/route.ts`
- `app/api/questions/[id]/route.ts` (GET, PATCH with tags, DELETE)
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

Chat is request-based and tied into blocking, reporting, unread state, and presence. Admin flows span approvals, moderation queues, permission management, and appeals.

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
