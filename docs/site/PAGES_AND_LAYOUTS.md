# Pages and Layouts

[Back to index](./README.md)

## Layouts

### `app/layout.tsx`
- Route: `/`
- Kind: layout
- Surface: Core product
- Runtime: server
- Description: Root shell that sets Hebrew RTL rendering, metadata, theme hydration, and global providers.
- Exports: `RootLayout`, `metadata`
- Named functions: `ThemeHydrationScript`, `getInitialTheme`
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/protected/layout.tsx`
- Route: `/protected`
- Kind: layout
- Surface: Starter or legacy
- Runtime: server
- Description: Layout wrapper for `/protected`.
- Exports: `ProtectedLayout`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None


## Core product

### `app/chat/[conversationId]/page.tsx`
- Route: `/chat/[conversationId]`
- Kind: page
- Surface: Core product
- Runtime: client
- Description: Conversation screen for realtime chat, read state, blocking, and reporting.
- Exports: `ChatThreadPage`
- Named functions: `fetchConversation`, `fetchMessages`, `fetchPresence`, `formatTime`, `handleBlockConfirm`, `handleReportSubmit`, `handleSend`, `onClick`, `onKeyDown`, `onVisible`
- Fetch calls: `/api/report/user`
- Supabase tables/views: None
- Supabase RPCs: None

### `app/chat/page.tsx`
- Route: `/chat`
- Kind: page
- Surface: Core product
- Runtime: client
- Description: Chat inbox for requests and conversation lists.
- Exports: `ChatPage`
- Named functions: `fetchData`, `fetchPresence`, `handleAuthAction`, `handleRespond`, `onVisible`, `timeAgo`
- Fetch calls: `/api/chat/requests`, `/api/chat/conversations`
- Supabase tables/views: None
- Supabase RPCs: None

### `app/notifications/page.tsx`
- Route: `/notifications`
- Kind: page
- Surface: Core product
- Runtime: client
- Description: Notification inbox and unread-state hub.
- Exports: `NotificationsPage`
- Named functions: `fetchNotifications`, `getTypeLabel`, `handleMarkAllRead`, `handleNotificationClick`, `handleSignOut`
- Fetch calls: `/api/notifications`
- Supabase tables/views: None
- Supabase RPCs: None

### `app/page.tsx`
- Route: `/`
- Kind: page
- Surface: Core product
- Runtime: client
- Description: Homepage that anchors question discovery and acts as the main landing surface.
- Exports: `Page`
- Named functions: `ForumHomepage`, `ProfileTestComponent`, `closeLoginModal`, `closeRegisterModal`, `handleLogin`, `handleRegister`, `handleSignOut`, `handleVote`, `loadTopQuestions`, `timeAgo`
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/profile/[username]/page.tsx`
- Route: `/profile/[username]`
- Kind: page
- Surface: Core product
- Runtime: client
- Description: Public profile page with comments, likes, and chat initiation.
- Exports: `PublicProfilePage`
- Named functions: `ReputationArc`, `animate`, `getPlaylistInfo`, `getReputationVisuals`
- Fetch calls: `/api/chat/request`
- Supabase tables/views: None
- Supabase RPCs: None

### `app/profile/page.tsx`
- Route: `/profile`
- Kind: page
- Surface: Core product
- Runtime: client
- Description: Private profile page for the signed-in user.
- Exports: `ProfilePage`
- Named functions: `ReputationArc`, `animate`, `fromHistory`, `getPlaylistInfo`, `getReputationVisuals`, `handleCancelEdit`, `handleEditToggle`, `handleInputChange`, `loadMoreComments`, `loadMoreLikers`, `loadMoreQuestions`, `loadMoreReplies`, `removeSharedFromProfile`
- Fetch calls: `/api/status/me`, `/api/auth/check-availability`
- Supabase tables/views: None
- Supabase RPCs: None

### `app/questions/[id]/page.tsx`
- Route: `/questions/[id]`
- Kind: page
- Surface: Core product
- Runtime: client
- Description: Question detail page with answers, votes, reports, and moderation actions. Includes "הצג תגיות" (Show Tags) toggle to expand/collapse tags, and tag editing in edit mode (owner or ממונה מוסמך) using catalog-only selection.
- Exports: `QuestionDetailPage`
- Named functions: `buildAnswerThreads`, `fetchAnswers`, `fetchEditTagMatches`, `fetchQuestion`, `handleAnswerVote`, `handleAuthAction`, `handleCancelEdit`, `handleClickOutside`, `handleConfirmRemove`, `handleEditTagAdd`, `handleEditTagRemove`, `handleOpenAnswerReport`, `handleOpenAnswerVoteDetails`, `handleOpenRequestRemoval`, `handleOpenVoteDetails`, `handleQuestionVote`, `handleSaveEdit`, `handleSignOut`, `handleStartEdit`, `handleSubmitAnswer`, `handleSubmitAnswerReport`, `handleSubmitReply`, `handleSubmitRequestRemoval`, `onClick`, `renderAnswerCard`, `renderReplyItem`, `renderTopLevelAnswer`, `resolveRootId`, `setVoteLoading`, `timeAgo`
- Fetch calls: `/api/report/content`
- Supabase tables/views: None
- Supabase RPCs: None

### `app/questions/page.tsx`
- Route: `/questions`
- Kind: page
- Surface: Core product
- Runtime: client
- Description: Question index with search, sort, filters, and question-creation entry points. Each question card has a "הצג תגיות" (Show Tags) toggle to expand/collapse tags.
- Exports: `QuestionsPage`
- Named functions: `QuestionsPage`, `fetchQuestions`, `handleNewQuestion`, `handleSignOut`, `handleVote`, `onClick`, `onKeyDown`, `timeAgo`
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/status/page.tsx`
- Route: `/status`
- Kind: page
- Surface: Core product
- Runtime: client
- Description: Status feed for short-form posting, starring, sharing, and replies.
- Exports: `StatusPage`
- Named functions: `cooldownRemaining`, `fetchFeed`, `fetchMe`, `handleNewStatus`, `handlePost`, `handleSignOut`, `openAdminStars`, `timeAgo`, `toggleShare`, `toggleStar`
- Fetch calls: `/api/status`, `/api/status/me`
- Supabase tables/views: None
- Supabase RPCs: None


## Auth and onboarding

### `app/auth/error/page.tsx`
- Route: `/auth/error`
- Kind: page
- Surface: Auth and onboarding
- Runtime: server
- Description: Page implementation for `/auth/error`.
- Exports: `Page`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/auth/forgot-password/page.tsx`
- Route: `/auth/forgot-password`
- Kind: page
- Surface: Auth and onboarding
- Runtime: server
- Description: Page implementation for `/auth/forgot-password`.
- Exports: `Page`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/auth/login/page.tsx`
- Route: `/auth/login`
- Kind: page
- Surface: Auth and onboarding
- Runtime: client
- Description: Page implementation for `/auth/login`.
- Exports: `LoginPage`
- Named functions: `handleSubmit`
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/auth/pending/page.tsx`
- Route: `/auth/pending`
- Kind: page
- Surface: Auth and onboarding
- Runtime: client
- Description: Page implementation for `/auth/pending`.
- Exports: `PendingPage`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/auth/sign-up-success/page.tsx`
- Route: `/auth/sign-up-success`
- Kind: page
- Surface: Auth and onboarding
- Runtime: server
- Description: Page implementation for `/auth/sign-up-success`.
- Exports: `Page`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/auth/sign-up/page.tsx`
- Route: `/auth/sign-up`
- Kind: page
- Surface: Auth and onboarding
- Runtime: server
- Description: Page implementation for `/auth/sign-up`.
- Exports: `Page`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/auth/update-password/page.tsx`
- Route: `/auth/update-password`
- Kind: page
- Surface: Auth and onboarding
- Runtime: server
- Description: Page implementation for `/auth/update-password`.
- Exports: `Page`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None


## Admin and moderation

### `app/admin/page.tsx`
- Route: `/admin`
- Kind: page
- Surface: Admin and moderation
- Runtime: client
- Description: Primary admin dashboard for approvals, moderation, and user oversight.
- Exports: `AdminPage`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/admin/permissions/page.tsx`
- Route: `/admin/permissions`
- Kind: page
- Surface: Admin and moderation
- Runtime: client
- Description: Admin policy and permissions configuration surface.
- Exports: `PermissionsMatrixPage`
- Named functions: `PermissionsMatrixInner`, `handleSave`, `load`, `toggle`, `updateDraft`
- Fetch calls: `/api/admin/config/permissions-matrix`, `/api/admin/config/admin-roles`
- Supabase tables/views: None
- Supabase RPCs: None


## Account and settings

### `app/account/blocked/page.tsx`
- Route: `/account/blocked`
- Kind: page
- Surface: Account and settings
- Runtime: client
- Description: Page implementation for `/account/blocked`.
- Exports: `BlockedAccountPage`
- Named functions: `handleAppeal`, `handleLogout`
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/appeal/question-deletion/page.tsx`
- Route: `/appeal/question-deletion`
- Kind: page
- Surface: Account and settings
- Runtime: client
- Description: Page implementation for `/appeal/question-deletion`.
- Exports: `AppealQuestionDeletionPage`
- Named functions: `AppealQuestionDeletionContent`, `handleSubmit`
- Fetch calls: `/api/appeals/question-deletion`
- Supabase tables/views: None
- Supabase RPCs: None

### `app/settings/page.tsx`
- Route: `/settings`
- Kind: page
- Surface: Account and settings
- Runtime: client
- Description: Page implementation for `/settings`.
- Exports: `SettingsPage`
- Named functions: `fetchBlocked`, `handleUnblock`
- Fetch calls: `/api/chat/blocked`
- Supabase tables/views: None
- Supabase RPCs: None


## Placeholder

### `app/discussions/page.tsx`
- Route: `/discussions`
- Kind: page
- Surface: Placeholder
- Runtime: client
- Description: Page implementation for `/discussions`.
- Exports: `DiscussionsPage`
- Named functions: `handleSignOut`
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/stories/page.tsx`
- Route: `/stories`
- Kind: page
- Surface: Placeholder
- Runtime: client
- Description: Page implementation for `/stories`.
- Exports: `StoriesPage`
- Named functions: `handleSignOut`
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None


## Starter or legacy

### `app/protected/page.tsx`
- Route: `/protected`
- Kind: page
- Surface: Starter or legacy
- Runtime: server
- Description: Page implementation for `/protected`.
- Exports: `ProtectedPage`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None


## Non-API route handlers

### `app/auth/confirm/route.ts`
- Route: `/auth/confirm`
- Kind: route
- Surface: Auth and onboarding
- Runtime: server
- Description: Route handler for `/auth/confirm`.
- Exports: `GET`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None
