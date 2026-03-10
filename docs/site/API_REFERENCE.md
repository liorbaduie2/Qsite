# API Reference

[Back to index](./README.md)

## Questions and tags

### `app/api/questions/[id]/answers/[answerId]/vote/route.ts`
- Endpoint: `/api/questions/[id]/answers/[answerId]/vote`
- Domain: Questions and tags
- Methods: `POST`
- Description: Creates or updates an answer vote.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `answers`, `votes`
- Supabase RPCs: None

### `app/api/questions/[id]/answers/[answerId]/votes/route.ts`
- Endpoint: `/api/questions/[id]/answers/[answerId]/votes`
- Domain: Questions and tags
- Methods: `GET`
- Description: Route handler for `/api/questions/[id]/answers/[answerId]/votes`.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `user_roles`, `answers`, `votes`
- Supabase RPCs: None

### `app/api/questions/[id]/answers/route.ts`
- Endpoint: `/api/questions/[id]/answers`
- Domain: Questions and tags
- Methods: `GET`, `POST`
- Description: Lists or creates answers for a question.
- Named functions: `answerIds`, `formatted`
- Fetch calls: None
- Supabase tables/views: `answers`, `votes`, `questions`
- Supabase RPCs: None

### `app/api/questions/[id]/request-removal/route.ts`
- Endpoint: `/api/questions/[id]/request-removal`
- Domain: Questions and tags
- Methods: `POST`
- Description: Submits a question-removal request.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `question_removal_requests`
- Supabase RPCs: None

### `app/api/questions/[id]/route.ts`
- Endpoint: `/api/questions/[id]`
- Domain: Questions and tags
- Methods: `GET`, `PATCH`, `DELETE`
- Description: Fetches or updates a single question. PATCH accepts `title`, `content`, and `tags` (array of catalog tag names); updates question and question_tags.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `questions`, `votes`, `question_tags`
- Supabase RPCs: `update_question_with_permission`

### `app/api/questions/[id]/vote/route.ts`
- Endpoint: `/api/questions/[id]/vote`
- Domain: Questions and tags
- Methods: `POST`
- Description: Creates or updates a question vote.
- Named functions: `topQuestionIds`
- Fetch calls: None
- Supabase tables/views: `questions`, `votes`
- Supabase RPCs: None

### `app/api/questions/[id]/votes/route.ts`
- Endpoint: `/api/questions/[id]/votes`
- Domain: Questions and tags
- Methods: `GET`
- Description: Route handler for `/api/questions/[id]/votes`.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `user_roles`, `questions`, `votes`
- Supabase RPCs: None

### `app/api/questions/route.ts`
- Endpoint: `/api/questions`
- Domain: Questions and tags
- Methods: `GET`, `POST`
- Description: Lists questions and creates new questions.
- Named functions: `buildTagFeedbackRows`, `formatted`, `normalizeTagSuggestionContext`
- Fetch calls: None
- Supabase tables/views: `questions`, `votes`, `tags`, `question_tags`
- Supabase RPCs: None

### `app/api/questions/suggest-tags/route.ts`
- Endpoint: `/api/questions/suggest-tags`
- Domain: Questions and tags
- Methods: `POST`
- Description: Scores a question draft and returns suggested tags.
- Named functions: `getLegacyFallbackSuggestions`, `getLexicalCandidates`
- Fetch calls: None
- Supabase tables/views: `tags`, `questions`
- Supabase RPCs: None

### `app/api/tags/route.ts`
- Endpoint: `/api/tags`
- Domain: Questions and tags
- Methods: `GET`
- Description: Route handler for `/api/tags`.
- Named functions: `tags`
- Fetch calls: None
- Supabase tables/views: `tags`
- Supabase RPCs: None


## Profiles and social

### `app/api/profile/[username]/comments/[commentId]/route.ts`
- Endpoint: `/api/profile/[username]/comments/[commentId]`
- Domain: Profiles and social
- Methods: `DELETE`
- Description: Fetches or mutates profile-related public or private social data.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `profiles`, `profile_comments`
- Supabase RPCs: None

### `app/api/profile/[username]/comments/route.ts`
- Endpoint: `/api/profile/[username]/comments`
- Domain: Profiles and social
- Methods: `GET`, `POST`
- Description: Fetches or mutates profile-related public or private social data.
- Named functions: `comments`
- Fetch calls: None
- Supabase tables/views: `profiles`, `profile_comments`
- Supabase RPCs: None

### `app/api/profile/[username]/counts/route.ts`
- Endpoint: `/api/profile/[username]/counts`
- Domain: Profiles and social
- Methods: `GET`
- Description: Fetches or mutates profile-related public or private social data.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `profiles`, `questions`
- Supabase RPCs: None

### `app/api/profile/[username]/like/route.ts`
- Endpoint: `/api/profile/[username]/like`
- Domain: Profiles and social
- Methods: `GET`, `POST`
- Description: Fetches or mutates profile-related public or private social data.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `profiles`, `profile_likes`
- Supabase RPCs: None

### `app/api/profile/[username]/likes/route.ts`
- Endpoint: `/api/profile/[username]/likes`
- Domain: Profiles and social
- Methods: `GET`
- Description: Fetches or mutates profile-related public or private social data.
- Named functions: `likers`
- Fetch calls: None
- Supabase tables/views: `profiles`, `profile_likes`
- Supabase RPCs: None

### `app/api/profile/[username]/preload/route.ts`
- Endpoint: `/api/profile/[username]/preload`
- Domain: Profiles and social
- Methods: `GET`
- Description: Fetches or mutates profile-related public or private social data.
- Named functions: `questions`, `replies`
- Fetch calls: None
- Supabase tables/views: `profiles`, `questions`, `answers`, `profile_likes`
- Supabase RPCs: None

### `app/api/profile/[username]/questions/route.ts`
- Endpoint: `/api/profile/[username]/questions`
- Domain: Profiles and social
- Methods: `GET`
- Description: Fetches or mutates profile-related public or private social data.
- Named functions: `questions`
- Fetch calls: None
- Supabase tables/views: `profiles`, `questions`
- Supabase RPCs: None

### `app/api/profile/[username]/replies/route.ts`
- Endpoint: `/api/profile/[username]/replies`
- Domain: Profiles and social
- Methods: `GET`
- Description: Fetches or mutates profile-related public or private social data.
- Named functions: `replies`
- Fetch calls: None
- Supabase tables/views: `profiles`, `answers`, `questions`
- Supabase RPCs: None

### `app/api/profile/[username]/route.ts`
- Endpoint: `/api/profile/[username]`
- Domain: Profiles and social
- Methods: `GET`
- Description: Fetches or mutates profile-related public or private social data.
- Named functions: `questions`
- Fetch calls: None
- Supabase tables/views: `profiles`, `user_statuses`, `questions`, `answers`
- Supabase RPCs: None


## Chat and presence

### `app/api/chat/blocked/[userId]/route.ts`
- Endpoint: `/api/chat/blocked/[userId]`
- Domain: Chat and presence
- Methods: `POST`, `DELETE`
- Description: Handles chat requests, conversations, read state, blocks, or messages.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `user_blocks`
- Supabase RPCs: None

### `app/api/chat/blocked/route.ts`
- Endpoint: `/api/chat/blocked`
- Domain: Chat and presence
- Methods: `GET`
- Description: Handles chat requests, conversations, read state, blocks, or messages.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `user_blocks`, `profiles`
- Supabase RPCs: None

### `app/api/chat/check/route.ts`
- Endpoint: `/api/chat/check`
- Domain: Chat and presence
- Methods: `GET`
- Description: Handles chat requests, conversations, read state, blocks, or messages.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `profiles`, `user_blocks`, `chat_requests`, `chat_conversations`
- Supabase RPCs: None

### `app/api/chat/conversations/[id]/messages/route.ts`
- Endpoint: `/api/chat/conversations/[id]/messages`
- Domain: Chat and presence
- Methods: `GET`, `POST`
- Description: Handles chat requests, conversations, read state, blocks, or messages.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `chat_conversations`, `user_blocks`, `chat_messages`
- Supabase RPCs: None

### `app/api/chat/conversations/[id]/read/route.ts`
- Endpoint: `/api/chat/conversations/[id]/read`
- Domain: Chat and presence
- Methods: `POST`
- Description: Handles chat requests, conversations, read state, blocks, or messages.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `chat_conversations`, `chat_conversation_read_state`
- Supabase RPCs: None

### `app/api/chat/conversations/[id]/route.ts`
- Endpoint: `/api/chat/conversations/[id]`
- Domain: Chat and presence
- Methods: `GET`
- Description: Handles chat requests, conversations, read state, blocks, or messages.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `chat_conversations`, `user_blocks`, `profiles`
- Supabase RPCs: None

### `app/api/chat/conversations/route.ts`
- Endpoint: `/api/chat/conversations`
- Domain: Chat and presence
- Methods: `GET`
- Description: Handles chat requests, conversations, read state, blocks, or messages.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `chat_conversations`, `profiles`, `chat_messages`, `chat_conversation_read_state`
- Supabase RPCs: None

### `app/api/chat/request/route.ts`
- Endpoint: `/api/chat/request`
- Domain: Chat and presence
- Methods: `POST`
- Description: Handles chat requests, conversations, read state, blocks, or messages.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `profiles`, `user_blocks`, `chat_requests`
- Supabase RPCs: None

### `app/api/chat/requests/[id]/respond/route.ts`
- Endpoint: `/api/chat/requests/[id]/respond`
- Domain: Chat and presence
- Methods: `POST`
- Description: Handles chat requests, conversations, read state, blocks, or messages.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `chat_requests`, `user_blocks`, `chat_conversations`
- Supabase RPCs: None

### `app/api/chat/requests/route.ts`
- Endpoint: `/api/chat/requests`
- Domain: Chat and presence
- Methods: `GET`
- Description: Handles chat requests, conversations, read state, blocks, or messages.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `chat_requests`, `profiles`
- Supabase RPCs: None

### `app/api/chat/unread-count/route.ts`
- Endpoint: `/api/chat/unread-count`
- Domain: Chat and presence
- Methods: `GET`
- Description: Handles chat requests, conversations, read state, blocks, or messages.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `chat_conversations`, `chat_messages`, `chat_conversation_read_state`
- Supabase RPCs: None

### `app/api/me/ping/route.ts`
- Endpoint: `/api/me/ping`
- Domain: Chat and presence
- Methods: `POST`
- Description: Route handler for `/api/me/ping`.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `profiles`
- Supabase RPCs: None

### `app/api/presence/route.ts`
- Endpoint: `/api/presence`
- Domain: Chat and presence
- Methods: `GET`
- Description: Route handler for `/api/presence`.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `profiles`
- Supabase RPCs: None


## Statuses and notifications

### `app/api/notifications/[id]/read/route.ts`
- Endpoint: `/api/notifications/[id]/read`
- Domain: Statuses and notifications
- Methods: `PATCH`
- Description: Reads notifications, unread counts, or mark-read actions.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `notifications`
- Supabase RPCs: None

### `app/api/notifications/route.ts`
- Endpoint: `/api/notifications`
- Domain: Statuses and notifications
- Methods: `GET`, `PATCH`
- Description: Reads notifications, unread counts, or mark-read actions.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `notifications`
- Supabase RPCs: None

### `app/api/notifications/unread-count/route.ts`
- Endpoint: `/api/notifications/unread-count`
- Domain: Statuses and notifications
- Methods: `GET`
- Description: Reads notifications, unread counts, or mark-read actions.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `notifications`
- Supabase RPCs: None

### `app/api/status/[id]/replies/route.ts`
- Endpoint: `/api/status/[id]/replies`
- Domain: Statuses and notifications
- Methods: `GET`, `POST`
- Description: Handles status feed reads, writes, replies, stars, or shares.
- Named functions: `formatted`
- Fetch calls: None
- Supabase tables/views: `user_statuses`, `status_replies`
- Supabase RPCs: None

### `app/api/status/[id]/share/route.ts`
- Endpoint: `/api/status/[id]/share`
- Domain: Statuses and notifications
- Methods: `PATCH`
- Description: Handles status feed reads, writes, replies, stars, or shares.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `user_statuses`
- Supabase RPCs: None

### `app/api/status/[id]/star/route.ts`
- Endpoint: `/api/status/[id]/star`
- Domain: Statuses and notifications
- Methods: `POST`
- Description: Handles status feed reads, writes, replies, stars, or shares.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `user_statuses`, `status_stars`
- Supabase RPCs: None

### `app/api/status/me/route.ts`
- Endpoint: `/api/status/me`
- Domain: Statuses and notifications
- Methods: `GET`
- Description: Handles status feed reads, writes, replies, stars, or shares.
- Named functions: `history`
- Fetch calls: None
- Supabase tables/views: `user_statuses`
- Supabase RPCs: None

### `app/api/status/route.ts`
- Endpoint: `/api/status`
- Domain: Statuses and notifications
- Methods: `GET`, `POST`
- Description: Route handler for `/api/status`.
- Named functions: `feed`, `nonLegendary`, `statusIds`
- Fetch calls: None
- Supabase tables/views: `user_statuses`, `status_stars`
- Supabase RPCs: None


## Auth and onboarding

### `app/api/auth/check-availability/route.ts`
- Endpoint: `/api/auth/check-availability`
- Domain: Auth and onboarding
- Methods: `POST`
- Description: Handles custom registration, verification, or onboarding steps.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/api/auth/register/route.ts`
- Endpoint: `/api/auth/register`
- Domain: Auth and onboarding
- Methods: `POST`
- Description: Handles custom registration, verification, or onboarding steps.
- Named functions: `calculateAge`
- Fetch calls: None
- Supabase tables/views: `profiles`, `user_applications`
- Supabase RPCs: None

### `app/api/auth/send-verification/route.ts`
- Endpoint: `/api/auth/send-verification`
- Domain: Auth and onboarding
- Methods: `POST`
- Description: Handles custom registration, verification, or onboarding steps.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/api/auth/submit-application/route.ts`
- Endpoint: `/api/auth/submit-application`
- Domain: Auth and onboarding
- Methods: `POST`, `GET`
- Description: Handles custom registration, verification, or onboarding steps.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `user_applications`
- Supabase RPCs: None

### `app/api/auth/verify-phone/route.ts`
- Endpoint: `/api/auth/verify-phone`
- Domain: Auth and onboarding
- Methods: `POST`
- Description: Handles custom registration, verification, or onboarding steps.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None


## Permissions and admin

### `app/api/admin/activity-log/route.ts`
- Endpoint: `/api/admin/activity-log`
- Domain: Permissions and admin
- Methods: `GET`
- Description: Handles admin policy, user management, permissions, or moderation actions.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `admin_activity_log`, `profiles`
- Supabase RPCs: None

### `app/api/admin/apply-penalty/route.ts`
- Endpoint: `/api/admin/apply-penalty`
- Domain: Permissions and admin
- Methods: `POST`
- Description: Handles admin policy, user management, permissions, or moderation actions.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/api/admin/approve-user/route.ts`
- Endpoint: `/api/admin/approve-user`
- Domain: Permissions and admin
- Methods: `POST`
- Description: Handles admin policy, user management, permissions, or moderation actions.
- Named functions: `getResend`, `sendApprovalEmail`, `sendRejectionEmail`
- Fetch calls: None
- Supabase tables/views: `profiles`
- Supabase RPCs: None

### `app/api/admin/check-milestones/route.ts`
- Endpoint: `/api/admin/check-milestones`
- Domain: Permissions and admin
- Methods: `POST`
- Description: Handles admin policy, user management, permissions, or moderation actions.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/api/admin/config/admin-roles/route.ts`
- Endpoint: `/api/admin/config/admin-roles`
- Domain: Permissions and admin
- Methods: `GET`, `PUT`
- Description: Handles admin policy, user management, permissions, or moderation actions.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `user_roles`, `admin_roles_config`
- Supabase RPCs: None

### `app/api/admin/config/milestones/route.ts`
- Endpoint: `/api/admin/config/milestones`
- Domain: Permissions and admin
- Methods: `GET`, `PUT`
- Description: Handles admin policy, user management, permissions, or moderation actions.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `user_roles`, `reputation_milestones`
- Supabase RPCs: None

### `app/api/admin/config/penalties/route.ts`
- Endpoint: `/api/admin/config/penalties`
- Domain: Permissions and admin
- Methods: `GET`
- Description: Handles admin policy, user management, permissions, or moderation actions.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `user_roles`, `penalty_types_config`
- Supabase RPCs: None

### `app/api/admin/config/permissions-matrix/route.ts`
- Endpoint: `/api/admin/config/permissions-matrix`
- Domain: Permissions and admin
- Methods: `GET`, `PUT`
- Description: Handles admin policy, user management, permissions, or moderation actions.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `user_roles`, `role_permission_matrix`
- Supabase RPCs: None

### `app/api/admin/config/reputation-permissions/route.ts`
- Endpoint: `/api/admin/config/reputation-permissions`
- Domain: Permissions and admin
- Methods: `GET`, `PUT`
- Description: Handles admin policy, user management, permissions, or moderation actions.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `user_roles`, `reputation_permissions_config`
- Supabase RPCs: None

### `app/api/admin/grant-reputation/route.ts`
- Endpoint: `/api/admin/grant-reputation`
- Domain: Permissions and admin
- Methods: `POST`
- Description: Handles admin policy, user management, permissions, or moderation actions.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `user_roles`
- Supabase RPCs: None

### `app/api/admin/grant-role/route.ts`
- Endpoint: `/api/admin/grant-role`
- Domain: Permissions and admin
- Methods: `POST`
- Description: Handles admin policy, user management, permissions, or moderation actions.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `user_roles`, `admin_activity_log`
- Supabase RPCs: None

### `app/api/admin/question-deletion-appeals/[id]/decision/route.ts`
- Endpoint: `/api/admin/question-deletion-appeals/[id]/decision`
- Domain: Permissions and admin
- Methods: `POST`
- Description: Handles admin policy, user management, permissions, or moderation actions.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/api/admin/question-deletion-appeals/route.ts`
- Endpoint: `/api/admin/question-deletion-appeals`
- Domain: Permissions and admin
- Methods: `GET`
- Description: Handles admin policy, user management, permissions, or moderation actions.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `question_deletion_appeals`, `admin_activity_log`, `profiles`
- Supabase RPCs: None

### `app/api/admin/question-removal-requests/[id]/route.ts`
- Endpoint: `/api/admin/question-removal-requests/[id]`
- Domain: Permissions and admin
- Methods: `POST`
- Description: Handles admin policy, user management, permissions, or moderation actions.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `question_removal_requests`
- Supabase RPCs: None

### `app/api/admin/question-removal-requests/route.ts`
- Endpoint: `/api/admin/question-removal-requests`
- Domain: Permissions and admin
- Methods: `GET`
- Description: Handles admin policy, user management, permissions, or moderation actions.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `question_removal_requests`, `questions`, `profiles`
- Supabase RPCs: None

### `app/api/admin/revoke-role/route.ts`
- Endpoint: `/api/admin/revoke-role`
- Domain: Permissions and admin
- Methods: `DELETE`
- Description: Handles admin policy, user management, permissions, or moderation actions.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `user_roles`, `admin_activity_log`
- Supabase RPCs: None

### `app/api/admin/set-role-visibility/route.ts`
- Endpoint: `/api/admin/set-role-visibility`
- Domain: Permissions and admin
- Methods: `POST`
- Description: Handles admin policy, user management, permissions, or moderation actions.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `user_roles`, `admin_activity_log`
- Supabase RPCs: None

### `app/api/admin/status/[id]/stars/route.ts`
- Endpoint: `/api/admin/status/[id]/stars`
- Domain: Permissions and admin
- Methods: `GET`
- Description: Handles admin policy, user management, permissions, or moderation actions.
- Named functions: `users`
- Fetch calls: None
- Supabase tables/views: `profiles`, `user_statuses`, `status_stars`
- Supabase RPCs: None

### `app/api/admin/users-overview/route.ts`
- Endpoint: `/api/admin/users-overview`
- Domain: Permissions and admin
- Methods: `GET`
- Description: Handles admin policy, user management, permissions, or moderation actions.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `complete_user_overview`
- Supabase RPCs: None

### `app/api/permissions/can-user-login/route.ts`
- Endpoint: `/api/permissions/can-user-login`
- Domain: Permissions and admin
- Methods: `POST`
- Description: Handles admin policy, user management, permissions, or moderation actions.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/api/permissions/deduct-reputation/route.ts`
- Endpoint: `/api/permissions/deduct-reputation`
- Domain: Permissions and admin
- Methods: `POST`
- Description: Handles admin policy, user management, permissions, or moderation actions.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/api/permissions/get-user-permissions/route.ts`
- Endpoint: `/api/permissions/get-user-permissions`
- Domain: Permissions and admin
- Methods: `POST`
- Description: Handles admin policy, user management, permissions, or moderation actions.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `user_roles`, `admin_roles_config`
- Supabase RPCs: None

### `app/api/permissions/get-user-role-hebrew/route.ts`
- Endpoint: `/api/permissions/get-user-role-hebrew`
- Domain: Permissions and admin
- Methods: `GET`, `POST`
- Description: Handles admin policy, user management, permissions, or moderation actions.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/api/permissions/suspend-user/route.ts`
- Endpoint: `/api/permissions/suspend-user`
- Domain: Permissions and admin
- Methods: `POST`
- Description: Handles admin policy, user management, permissions, or moderation actions.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None


## Moderation and appeals

### `app/api/appeals/question-deletion/route.ts`
- Endpoint: `/api/appeals/question-deletion`
- Domain: Moderation and appeals
- Methods: `POST`
- Description: Handles reporting, removal requests, or appeal workflows.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/api/report/content/route.ts`
- Endpoint: `/api/report/content`
- Domain: Moderation and appeals
- Methods: `POST`
- Description: Handles reporting, removal requests, or appeal workflows.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `answers`, `questions`, `content_reports`
- Supabase RPCs: None

### `app/api/report/user/route.ts`
- Endpoint: `/api/report/user`
- Domain: Moderation and appeals
- Methods: `POST`
- Description: Handles reporting, removal requests, or appeal workflows.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `user_reports`
- Supabase RPCs: None


## Operations and setup

### `app/api/cron/weekly-maintenance/route.ts`
- Endpoint: `/api/cron/weekly-maintenance`
- Domain: Operations and setup
- Methods: `POST`
- Description: Operational or setup endpoint.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: `weekly_maintenance`

### `app/api/setup/first-owner/route.ts`
- Endpoint: `/api/setup/first-owner`
- Domain: Operations and setup
- Methods: `POST`
- Description: Operational or setup endpoint.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `user_roles`, `profiles`
- Supabase RPCs: None

### `app/api/stats/admin/route.ts`
- Endpoint: `/api/stats/admin`
- Domain: Operations and setup
- Methods: `GET`
- Description: Operational or setup endpoint.
- Named functions: None
- Fetch calls: None
- Supabase tables/views: `profiles`
- Supabase RPCs: None

