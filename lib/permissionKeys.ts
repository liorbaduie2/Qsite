// Canonical list of management-level permissions for the admin system.
// Keys are machine-friendly; labels/descriptions come from the Excel matrix.

export type AdminRoleKey = 'owner' | 'guardian' | 'admin' | 'moderator' | 'user';

export const ADMIN_ROLE_LABELS: Record<AdminRoleKey, string> = {
  owner: 'בעלים',
  guardian: 'ממונה מוסמך',
  admin: 'שומר סף',
  moderator: 'נושא כלים',
  user: 'רגיל',
};

export type PermissionKey =
  // Content - Questions
  | 'EDIT_ANY_QUESTION'
  | 'DELETE_ANY_QUESTION'
  | 'CLOSE_QUESTION'
  | 'REOPEN_QUESTION'
  | 'LOCK_QUESTION'
  | 'PIN_QUESTION'
  | 'MOVE_QUESTION_BETWEEN_CATEGORIES'
  | 'MERGE_DUPLICATE_QUESTIONS'
  | 'VIEW_QUESTION_EDIT_HISTORY'
  | 'APPROVE_QUESTION_DELETION_REQUESTS'
  // Content - Answers
  | 'EDIT_ANY_ANSWER'
  | 'DELETE_ANY_ANSWER'
  | 'VIEW_ANSWER_EDIT_HISTORY'
  | 'ROLLBACK_ANSWER_TO_PREVIOUS_VERSION'
  // Content - Comments
  | 'DELETE_ANY_COMMENT'
  | 'LOCK_COMMENTS_ON_CONTENT'
  // User Management
  | 'EDIT_ANY_USER_PROFILE'
  | 'VIEW_SENSITIVE_USER_DATA'
  | 'SUSPEND_USER'
  | 'REMOVE_SUSPENSION'
  | 'BAN_USER'
  | 'UNBAN_USER'
  | 'RESET_USER_PASSWORD'
  | 'FORCE_LOGOUT'
  | 'IMPERSONATE_USER'
  // Roles & Permissions
  | 'ASSIGN_ROLES'
  | 'REMOVE_ROLES'
  | 'VIEW_ROLE_ASSIGNMENTS'
  // Reputation & Awards
  | 'GIVE_REPUTATION_POINTS'
  | 'REMOVE_REPUTATION_POINTS'
  | 'OVERRIDE_REPUTATION_THRESHOLDS'
  | 'GRANT_BADGES_MANUALLY'
  | 'REMOVE_BADGES'
  | 'VIEW_REPUTATION_HISTORY'
  | 'EDIT_USER_REPUTATION_DIRECTLY'
  // Moderation & Reports
  | 'ACCESS_MODERATION_QUEUE'
  | 'VIEW_REPORTS'
  | 'HANDLE_REPORTS'
  | 'REJECT_REPORTS'
  | 'ESCALATE_REPORTS'
  | 'VIEW_APPEALS'
  | 'APPROVE_APPEALS'
  | 'REJECT_APPEALS'
  | 'RESTORE_DELETED_CONTENT'
  | 'SOFT_DELETE_CONTENT'
  | 'HARD_DELETE_CONTENT'
  | 'VIEW_FLAGGED_CONTENT_LIST'
  | 'CLEAR_FLAGS_ON_CONTENT'
  | 'POST_MODERATOR_NOTES'
  // Statuses
  | 'EDIT_STATUS'
  | 'DELETE_STATUS'
  // System & Admin
  | 'ACCESS_ADMIN_DASHBOARD'
  | 'VIEW_ADMIN_DASHBOARD_ANALYTICS'
  // Logs & Auditing
  | 'VIEW_ADMIN_LOGS'
  | 'VIEW_USER_SPECIFIC_LOGS'
  | 'VIEW_SECURITY_LOGS'
  | 'VIEW_PERFORMANCE_LOGS'
  // Communication
  | 'SEND_BROADCAST_ANNOUNCEMENT';

export type PermissionCategory =
  | 'Content - Questions'
  | 'Content - Answers'
  | 'Content - Comments'
  | 'User Management'
  | 'Roles & Permissions'
  | 'Reputation & Awards'
  | 'Moderation & Reports'
  | 'Statuses'
  | 'System & Admin'
  | 'Logs & Auditing'
  | 'Communication';

export interface PermissionDefinition {
  key: PermissionKey;
  category: PermissionCategory;
  label: string;
  description: string;
}

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // Content - Questions
  {
    key: 'EDIT_ANY_QUESTION',
    category: 'Content - Questions',
    label: 'Edit any question',
    description: 'Allows editing any question regardless of owner.',
  },
  {
    key: 'DELETE_ANY_QUESTION',
    category: 'Content - Questions',
    label: 'Delete any question',
    description: 'Allows deleting any question regardless of owner.',
  },
  {
    key: 'CLOSE_QUESTION',
    category: 'Content - Questions',
    label: 'Close question',
    description: 'Allows marking a question as closed to new answers.',
  },
  {
    key: 'REOPEN_QUESTION',
    category: 'Content - Questions',
    label: 'Reopen question',
    description: 'Allows reopening previously closed questions.',
  },
  {
    key: 'LOCK_QUESTION',
    category: 'Content - Questions',
    label: 'Lock question (no new answers/comments)',
    description:
      'Prevents new answers and comments on a specific question while keeping it visible.',
  },
  {
    key: 'PIN_QUESTION',
    category: 'Content - Questions',
    label: 'Pin / feature question',
    description:
      'Allows pinning or featuring a question at the top of lists.',
  },
  {
    key: 'MOVE_QUESTION_BETWEEN_CATEGORIES',
    category: 'Content - Questions',
    label: 'Move question between categories/sections',
    description:
      'Allows changing the category/section a question belongs to.',
  },
  {
    key: 'MERGE_DUPLICATE_QUESTIONS',
    category: 'Content - Questions',
    label: 'Merge duplicate questions',
    description:
      'Allows merging duplicate questions into a single canonical one.',
  },
  {
    key: 'VIEW_QUESTION_EDIT_HISTORY',
    category: 'Content - Questions',
    label: 'View question edit history',
    description:
      'Allows viewing the full historical changes made to a question.',
  },
  {
    key: 'APPROVE_QUESTION_DELETION_REQUESTS',
    category: 'Content - Questions',
    label: 'Approve question deletion requests',
    description:
      'Allows approving or denying deletion requests for questions.',
  },
  // Content - Answers
  {
    key: 'EDIT_ANY_ANSWER',
    category: 'Content - Answers',
    label: 'Edit any answer',
    description: 'Allows editing any answer regardless of owner.',
  },
  {
    key: 'DELETE_ANY_ANSWER',
    category: 'Content - Answers',
    label: 'Delete any answer',
    description: 'Allows deleting any answer regardless of owner.',
  },
  {
    key: 'VIEW_ANSWER_EDIT_HISTORY',
    category: 'Content - Answers',
    label: 'View answer edit history',
    description: 'Allows viewing historical changes for answers.',
  },
  {
    key: 'ROLLBACK_ANSWER_TO_PREVIOUS_VERSION',
    category: 'Content - Answers',
    label: 'Rollback answer to previous version',
    description: 'Allows restoring an answer to a previous version.',
  },
  // Content - Comments
  {
    key: 'DELETE_ANY_COMMENT',
    category: 'Content - Comments',
    label: 'Delete any comment',
    description: 'Allows deleting any comment regardless of owner.',
  },
  {
    key: 'LOCK_COMMENTS_ON_CONTENT',
    category: 'Content - Comments',
    label: 'Lock comments on specific content',
    description:
      'Prevents new comments on a specific question or answer.',
  },
  // User Management
  {
    key: 'EDIT_ANY_USER_PROFILE',
    category: 'User Management',
    label: 'Edit any user profile',
    description:
      "Allows editing other users' profiles (name, bio, etc.).",
  },
  {
    key: 'VIEW_SENSITIVE_USER_DATA',
    category: 'User Management',
    label: 'View sensitive user data (email, IP)',
    description:
      'Allows viewing private fields such as email addresses and IP logs.',
  },
  {
    key: 'SUSPEND_USER',
    category: 'User Management',
    label: 'Suspend user',
    description:
      'Temporarily disables a user’s ability to interact on the site.',
  },
  {
    key: 'REMOVE_SUSPENSION',
    category: 'User Management',
    label: 'Remove suspension',
    description: 'Lifts a previously applied user suspension.',
  },
  {
    key: 'BAN_USER',
    category: 'User Management',
    label: 'Ban user',
    description:
      'Permanently prevents a user from accessing the site (account-level ban).',
  },
  {
    key: 'UNBAN_USER',
    category: 'User Management',
    label: 'Unban user',
    description:
      'Removes an existing ban and restores account access.',
  },
  {
    key: 'RESET_USER_PASSWORD',
    category: 'User Management',
    label: 'Reset user password',
    description:
      'Allows initiating or forcing a password reset for a user.',
  },
  {
    key: 'FORCE_LOGOUT',
    category: 'User Management',
    label: 'Force logout / invalidate sessions',
    description:
      'Logs a user out from all active sessions and devices.',
  },
  {
    key: 'IMPERSONATE_USER',
    category: 'User Management',
    label: 'Impersonate user (login as)',
    description:
      'Allows temporarily acting as another user for support/debugging.',
  },
  // Roles & Permissions
  {
    key: 'ASSIGN_ROLES',
    category: 'Roles & Permissions',
    label: 'Assign roles',
    description: 'Allows attaching one or more roles to a user.',
  },
  {
    key: 'REMOVE_ROLES',
    category: 'Roles & Permissions',
    label: 'Remove roles',
    description: 'Allows removing roles from a user.',
  },
  {
    key: 'VIEW_ROLE_ASSIGNMENTS',
    category: 'Roles & Permissions',
    label: 'View role assignments',
    description:
      'Allows seeing which roles and permissions each user has.',
  },
  // Reputation & Awards
  {
    key: 'GIVE_REPUTATION_POINTS',
    category: 'Reputation & Awards',
    label: 'Give reputation points',
    description:
      'Allows granting reputation points to a user (beyond automatic rules).',
  },
  {
    key: 'REMOVE_REPUTATION_POINTS',
    category: 'Reputation & Awards',
    label: 'Remove reputation points',
    description:
      'Allows deducting reputation points from a user.',
  },
  {
    key: 'OVERRIDE_REPUTATION_THRESHOLDS',
    category: 'Reputation & Awards',
    label: 'Override reputation thresholds',
    description:
      'Allows bypassing normal reputation requirements for specific actions or users.',
  },
  {
    key: 'GRANT_BADGES_MANUALLY',
    category: 'Reputation & Awards',
    label: 'Grant badges/achievements manually',
    description:
      'Allows assigning badges or achievements directly to a user.',
  },
  {
    key: 'REMOVE_BADGES',
    category: 'Reputation & Awards',
    label: 'Remove badges/achievements',
    description:
      'Allows revoking previously awarded badges or achievements.',
  },
  {
    key: 'VIEW_REPUTATION_HISTORY',
    category: 'Reputation & Awards',
    label: 'View reputation history for user',
    description:
      'Allows viewing a detailed log of reputation changes for a user.',
  },
  {
    key: 'EDIT_USER_REPUTATION_DIRECTLY',
    category: 'Reputation & Awards',
    label: 'Edit user reputation directly (set value)',
    description:
      'Allows setting a user’s total reputation to a specific value.',
  },
  // Moderation & Reports
  {
    key: 'ACCESS_MODERATION_QUEUE',
    category: 'Moderation & Reports',
    label: 'Access moderation queue',
    description:
      'Allows viewing the list of items pending moderator review.',
  },
  {
    key: 'VIEW_REPORTS',
    category: 'Moderation & Reports',
    label: 'View reports',
    description:
      'Allows seeing abuse reports and flags submitted by users.',
  },
  {
    key: 'HANDLE_REPORTS',
    category: 'Moderation & Reports',
    label: 'Handle reports',
    description:
      'Allows processing reports by taking actions on reported content or users.',
  },
  {
    key: 'REJECT_REPORTS',
    category: 'Moderation & Reports',
    label: 'Reject reports',
    description:
      'Marks a report as invalid or not actionable.',
  },
  {
    key: 'ESCALATE_REPORTS',
    category: 'Moderation & Reports',
    label: 'Escalate reports',
    description:
      'Allows escalating a report to higher-privilege roles or external review.',
  },
  {
    key: 'VIEW_APPEALS',
    category: 'Moderation & Reports',
    label: 'View appeals',
    description:
      'Allows viewing user appeals against previous moderation actions.',
  },
  {
    key: 'APPROVE_APPEALS',
    category: 'Moderation & Reports',
    label: 'Approve appeals',
    description:
      'Reverses or adjusts a moderation decision based on an appeal.',
  },
  {
    key: 'REJECT_APPEALS',
    category: 'Moderation & Reports',
    label: 'Reject appeals',
    description:
      'Confirms that the original moderation decision stands.',
  },
  {
    key: 'RESTORE_DELETED_CONTENT',
    category: 'Moderation & Reports',
    label: 'Restore deleted content',
    description:
      'Allows restoring soft-deleted questions, answers, or comments.',
  },
  {
    key: 'SOFT_DELETE_CONTENT',
    category: 'Moderation & Reports',
    label: 'Soft-delete content',
    description:
      'Marks content as deleted while keeping it restorable.',
  },
  {
    key: 'HARD_DELETE_CONTENT',
    category: 'Moderation & Reports',
    label: 'Hard-delete content (irreversible)',
    description:
      'Permanently removes content with no restore option.',
  },
  {
    key: 'VIEW_FLAGGED_CONTENT_LIST',
    category: 'Moderation & Reports',
    label: 'View flagged content list',
    description:
      'Allows viewing a list of all currently flagged items.',
  },
  {
    key: 'CLEAR_FLAGS_ON_CONTENT',
    category: 'Moderation & Reports',
    label: 'Clear flags on content',
    description:
      'Removes flags from content after moderation is complete.',
  },
  {
    key: 'POST_MODERATOR_NOTES',
    category: 'Moderation & Reports',
    label: 'Post moderator notes on users/content',
    description:
      'Allows adding internal-only notes visible to moderators or admins.',
  },
  // Statuses
  {
    key: 'EDIT_STATUS',
    category: 'Statuses',
    label: 'Edit status',
    description: 'Allows editing existing status messages.',
  },
  {
    key: 'DELETE_STATUS',
    category: 'Statuses',
    label: 'Delete status',
    description: 'Allows deleting status messages.',
  },
  // System & Admin
  {
    key: 'ACCESS_ADMIN_DASHBOARD',
    category: 'System & Admin',
    label: 'Access admin dashboard',
    description: 'Allows entering the admin dashboard area.',
  },
  {
    key: 'VIEW_ADMIN_DASHBOARD_ANALYTICS',
    category: 'System & Admin',
    label: 'View admin dashboard analytics',
    description:
      'Allows viewing analytics, charts, and KPIs in the admin area.',
  },
  // Logs & Auditing
  {
    key: 'VIEW_ADMIN_LOGS',
    category: 'Logs & Auditing',
    label: 'View admin logs',
    description:
      'Allows viewing logs related to admin actions and events.',
  },
  {
    key: 'VIEW_USER_SPECIFIC_LOGS',
    category: 'Logs & Auditing',
    label: 'View user-specific logs',
    description:
      'Allows viewing logs filtered to a specific user.',
  },
  {
    key: 'VIEW_SECURITY_LOGS',
    category: 'Logs & Auditing',
    label: 'View security logs',
    description:
      'Allows viewing authentication, authorization, and security-related events.',
  },
  {
    key: 'VIEW_PERFORMANCE_LOGS',
    category: 'Logs & Auditing',
    label: 'View performance logs/metrics',
    description:
      'Allows viewing performance metrics and error rates.',
  },
  // Communication
  {
    key: 'SEND_BROADCAST_ANNOUNCEMENT',
    category: 'Communication',
    label: 'Send broadcast announcement',
    description:
      'Allows sending a global announcement to many or all users.',
  },
];

export const ALL_PERMISSION_KEYS: PermissionKey[] = PERMISSION_DEFINITIONS.map(
  (p) => p.key,
);

