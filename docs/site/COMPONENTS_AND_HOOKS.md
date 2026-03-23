# Components and Hooks

[Back to index](./README.md)

## App components

### `app/components/AdminDashboard.tsx`
- Runtime: client
- Description: Main admin control center rendered inside the admin page.
- Exports: `AdminDashboard`, `RoleConfigEntry`
- Named functions: `formatDate`, `formatDateTime`, `formatGender`, `getAuthHeaders`, `handleAppealDecision`, `handleApplyPenalty`, `handleApprove`, `handleBlockedAppealAction`, `handleGrantReputation`, `handleGrantRole`, `handleReject`, `handleRemovalDecision`, `handleSaveTagVisibility`, `handleSubmit`, `handleSuspend`, `handleUserAction`, `load`, `loadDashboardData`, `loadPenaltyTypes`, `timeAgo`
- Fetch calls: `/api/permissions/deduct-reputation`, `/api/admin/grant-role`, `/api/admin/grant-reputation`, `/api/admin/set-role-visibility`, `/api/admin/users-overview`, `/api/admin/question-removal-requests`, `/api/admin/question-deletion-appeals`, `/api/appeals/blocked-account`, `/api/admin/activity-log?limit=100`, `/api/admin/config/admin-roles`, `/api/admin/approve-user`
- Supabase tables/views: `penalty_types_config`
- Supabase RPCs: None

### `app/components/AuthModal.tsx`
- Runtime: client
- Description: Shared modal shell for switching between login and registration flows.
- Exports: `AuthModal`
- Named functions: `handleClose`, `handleModeSwitch`, `handleSubmit`, `resetForm`
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/components/AuthProvider.tsx`
- Runtime: client
- Description: Central auth context for session hydration, profile loading, permissions, and login gating.
- Exports: `AdminRoute`, `AuthProvider`, `RequireNotBlocked`, `RequirePermission`, `useAuth`
- Named functions: `AuthProvider`, `checkLoginStatus`, `clearError`, `ensureMyProfilePreload`, `fetchUserProfile`, `getInitialSession`, `getUserPermissions`, `load`, `loadUserDataInBackground`, `ping`, `refreshPermissions`, `refreshProfile`, `signIn`, `signOut`, `signUp`, `updateProfile`, `useAuth`
- Fetch calls: `/api/permissions/can-user-login`, `/api/permissions/get-user-permissions`, `/api/auth/register`, `/api/me/ping`
- Supabase tables/views: `profiles`
- Supabase RPCs: None

### `app/components/AuthStatusDisplay.tsx`
- Runtime: client
- Description: Compact component for presenting current auth or approval state.
- Exports: `AuthStatusDisplay`, `useAuthStatus`
- Named functions: `getDisplayInfo`, `getStatus`, `handleDismiss`, `useAuthStatus`
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/components/BubbleButton.tsx`
- Runtime: client
- Description: Reusable app component for bubble button.
- Exports: `BubbleButton`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/components/ClientWrapper.tsx`
- Runtime: client
- Description: Client-only wrapper for browser-dependent rendering.
- Exports: `ClientWrapper`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/components/Drawer.tsx`
- Runtime: client
- Description: Navigation drawer for mobile or condensed navigation states.
- Exports: `Drawer`
- Named functions: `fetchUnreadCount`, `handleAdminClick`, `handleMenuClick`, `handleProfileClick`, `handleSignOut`
- Fetch calls: `/api/chat/unread-count`
- Supabase tables/views: None
- Supabase RPCs: None

### `app/components/GlobalMobileNav.tsx`
- Runtime: client
- Description: Mobile-only shell: registers the bottom navigation bar plus the primary slide-up drawer and shared menu items.
- Exports: `GlobalMobileNav`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/components/HebrewRegistration.tsx`
- Runtime: client
- Description: Custom multi-step Hebrew registration flow with phone verification and application submission.
- Exports: `HebrewRegistration`
- Named functions: `BirthGenderModal`, `calculateAge`, `checkAvailability`, `getFieldClassName`, `getFieldIndicator`, `getVerificationClassName`, `handleBirthGenderSelect`, `handleInputChange`, `handleNext`, `handleSubmitApplication`, `handleVerificationCodeChange`, `handleVerificationKeyDown`, `handleVerificationPaste`, `registerUser`, `sendVerification`, `submitApplication`, `sync`, `togglePasswordVisibility`, `useDebounce`, `verifyPhone`
- Fetch calls: `/api/auth/check-availability`, `/api/auth/send-verification`, `/api/auth/verify-phone`, `/api/auth/register`, `/api/auth/submit-application`
- Supabase tables/views: None
- Supabase RPCs: None

### `app/components/LoginModal.tsx`
- Runtime: client
- Description: Modal login form integrated into the main app shell.
- Exports: `LoginModal`
- Named functions: `handleClose`, `handleSubmit`, `handleSwitchToRegister`
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/components/LoginStatusMessage.tsx`
- Runtime: shared/server
- Description: Reusable app component for login status message.
- Exports: `LoginStatusMessage`, `LoginStatusMessageProps`
- Named functions: `getStatusConfig`
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/components/MobileNavbar.tsx`
- Runtime: client
- Description: Fixed bottom bar (menu, search/history, create, notifications, chat); uses scroll-to-top helper after push/replace navigations.
- Exports: `MobileNavbar`
- Named functions: `MobileNavCreateQuestionIcon`, `MobileNavWriteAnswerIcon`, `fetchChatUnreadCount`, `navigateFromMobileNav`, `onComposerState`, `onDrawerState`, `onHistoryState`, `onPostLockState`, `onQuestionsSearchState`
- Fetch calls: `/api/chat/unread-count`
- Supabase tables/views: None
- Supabase RPCs: None

### `app/components/MobileNavDrawer.tsx`
- Runtime: client
- Description: RTL bottom-sheet menu for core routes; closes then routes, with scroll-to-top after each navigation.
- Exports: `MobileNavDrawer`
- Named functions: `fetchUnreadCount`, `handleMenuClick`, `menuHrefMatchesCurrentPath`
- Fetch calls: `/api/chat/unread-count`
- Supabase tables/views: None
- Supabase RPCs: None

### `app/components/NavHeader.tsx`
- Runtime: client
- Description: Main app header and navigation chrome.
- Exports: `NavHeader`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/components/NewQuestionModal.tsx`
- Runtime: client
- Description: Question composer modal with tag validation and suggestion support.
- Exports: `NewQuestionModal`
- Named functions: `fetchSuggestions`, `fetchTagMatches`, `handleKeyPress`, `handleSubmit`, `handleTagInputChange`, `handleTagRemove`, `resetSuggestionState`
- Fetch calls: `/api/questions`, `/api/questions/suggest-tags`
- Supabase tables/views: None
- Supabase RPCs: None

### `app/components/NotesClient.tsx`
- Runtime: client
- Description: Starter/demo notes client retained from the original scaffold.
- Exports: `NotesClient`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/components/RegisterModal.tsx`
- Runtime: client
- Description: Modal registration entry point for the main app shell.
- Exports: `RegisterModal`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/components/ReputationArc.tsx`
- Runtime: client
- Description: Reusable app component for reputation arc.
- Exports: `ReputationArc`, `ReputationArcProps`, `getReputationVisuals`
- Named functions: `animate`
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/components/RoleBadge.tsx`
- Runtime: shared/server
- Description: Reusable role-label component for profile cards and moderation UI.
- Exports: `RoleBadge`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/components/SimpleThemeToggle.tsx`
- Runtime: client
- Description: Compact theme-mode toggle.
- Exports: `SimpleThemeToggle`
- Named functions: `getNextTheme`, `handleToggle`
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/components/ThemeProvider.tsx`
- Runtime: client
- Description: Client theme provider and persistence wrapper.
- Exports: `ThemeDebugInfo`, `ThemeProvider`, `useTheme`
- Named functions: `getEffectiveTheme`, `getGuestPreferences`, `handleChange`, `handleVisibilityChange`, `loadPreferences`, `syncPreferencesOnFocus`, `updateTheme`
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/components/ui/Skeleton.tsx`
- Runtime: client
- Description: Reusable app component for skeleton.
- Exports: `SkeletonBlock`, `SkeletonCircle`, `SkeletonText`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/components/useForcedAuthModal.ts`
- Runtime: client
- Description: Hook for forcing authentication UI when an action requires login.
- Exports: `useForcedAuthModal`
- Named functions: `closeLogin`, `closeRegister`, `handleAuthAction`
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/components/UserAvatar.tsx`
- Runtime: client
- Description: Reusable avatar component for user identity displays.
- Exports: `UserAvatar`, `UserAvatarProps`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/components/UserManagementModal.tsx`
- Runtime: client
- Description: Admin modal for role changes, suspensions, and reputation actions.
- Exports: `RoleConfigEntry`, `UserManagementModal`
- Named functions: `handleDeductReputation`, `handleGrantRole`, `handlePermanentBan`, `handleSuspendUser`
- Fetch calls: `/api/admin/grant-role`, `/api/permissions/suspend-user`, `/api/permissions/deduct-reputation`
- Supabase tables/views: `profiles`
- Supabase RPCs: None


## Hooks

### `app/hooks/useDelayedSkeleton.ts`
- Runtime: client
- Description: Custom hook for use delayed skeleton.
- Exports: `useDelayedSkeleton`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/hooks/useInfiniteScroll.ts`
- Runtime: client
- Description: Custom hook for use infinite scroll.
- Exports: `useInfiniteScroll`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `app/hooks/useNotificationsRealtime.ts`
- Runtime: client
- Description: Realtime hook for notification unread count and payload updates.
- Exports: `useNotificationsRealtime`
- Named functions: `fetchInitial`
- Fetch calls: `/api/notifications/unread-count`
- Supabase tables/views: None
- Supabase RPCs: None

### `app/hooks/usePresenceTick.ts`
- Runtime: client
- Description: Presence heartbeat hook for active-user tracking.
- Exports: `usePresenceTick`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None


## Starter and shared components

### `components/auth-button.tsx`
- Runtime: shared/server
- Description: Starter/shared component for auth button.
- Exports: `AuthButton`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `components/deploy-button.tsx`
- Runtime: shared/server
- Description: Starter/shared component for deploy button.
- Exports: `DeployButton`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `components/env-var-warning.tsx`
- Runtime: shared/server
- Description: Starter/shared component for env var warning.
- Exports: `EnvVarWarning`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `components/forgot-password-form.tsx`
- Runtime: client
- Description: Starter/shared component for forgot password form.
- Exports: `ForgotPasswordForm`
- Named functions: `handleForgotPassword`
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `components/hero.tsx`
- Runtime: shared/server
- Description: Starter/shared component for hero.
- Exports: `Hero`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `components/login-form.tsx`
- Runtime: client
- Description: Starter/shared component for login form.
- Exports: `LoginForm`
- Named functions: `handleLogin`
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `components/logout-button.tsx`
- Runtime: client
- Description: Starter/shared component for logout button.
- Exports: `LogoutButton`
- Named functions: `logout`
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `components/next-logo.tsx`
- Runtime: shared/server
- Description: Starter/shared component for next logo.
- Exports: `NextLogo`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `components/sign-up-form.tsx`
- Runtime: client
- Description: Starter/shared component for sign up form.
- Exports: `SignUpForm`
- Named functions: `handleSignUp`
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `components/supabase-logo.tsx`
- Runtime: shared/server
- Description: Starter/shared component for supabase logo.
- Exports: `SupabaseLogo`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `components/theme-switcher.tsx`
- Runtime: client
- Description: Starter/shared component for theme switcher.
- Exports: None
- Named functions: `ThemeSwitcher`
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `components/tutorial/code-block.tsx`
- Runtime: client
- Description: Starter tutorial helper for code block.
- Exports: `CodeBlock`
- Named functions: `CheckIcon`, `CopyIcon`, `copy`
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `components/tutorial/connect-supabase-steps.tsx`
- Runtime: shared/server
- Description: Starter tutorial helper for connect supabase steps.
- Exports: `ConnectSupabaseSteps`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `components/tutorial/fetch-data-steps.tsx`
- Runtime: shared/server
- Description: Starter tutorial helper for fetch data steps.
- Exports: `FetchDataSteps`, `Page`
- Named functions: `getData`
- Fetch calls: None
- Supabase tables/views: `notes`
- Supabase RPCs: None

### `components/tutorial/sign-up-user-steps.tsx`
- Runtime: shared/server
- Description: Starter tutorial helper for sign up user steps.
- Exports: `SignUpUserSteps`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `components/tutorial/tutorial-step.tsx`
- Runtime: shared/server
- Description: Starter tutorial helper for tutorial step.
- Exports: `TutorialStep`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `components/ui/badge.tsx`
- Runtime: shared/server
- Description: Shared UI primitive for badge.
- Exports: `BadgeProps`
- Named functions: `Badge`
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `components/ui/button.tsx`
- Runtime: shared/server
- Description: Shared UI primitive for button.
- Exports: `ButtonProps`
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `components/ui/card.tsx`
- Runtime: shared/server
- Description: Shared UI primitive for card.
- Exports: None
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `components/ui/checkbox.tsx`
- Runtime: client
- Description: Shared UI primitive for checkbox.
- Exports: None
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `components/ui/dropdown-menu.tsx`
- Runtime: client
- Description: Shared UI primitive for dropdown menu.
- Exports: None
- Named functions: `DropdownMenuShortcut`
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `components/ui/input.tsx`
- Runtime: shared/server
- Description: Shared UI primitive for input.
- Exports: None
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `components/ui/label.tsx`
- Runtime: client
- Description: Shared UI primitive for label.
- Exports: None
- Named functions: None
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

### `components/update-password-form.tsx`
- Runtime: client
- Description: Starter/shared component for update password form.
- Exports: `UpdatePasswordForm`
- Named functions: `handleForgotPassword`
- Fetch calls: None
- Supabase tables/views: None
- Supabase RPCs: None

