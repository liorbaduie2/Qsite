# Data Model

[Back to index](./README.md)

The migration directory is the current source of truth for database structure and DB-side business logic.

## Inventory counts

- Tables: 41
- Views: 2
- SQL functions: 39
- Triggers: 10

## Tables

- `admin_activity_log`
- `admin_roles_config`
- `answers`
- `bookmarks`
- `chat_conversation_read_state`
- `chat_conversations`
- `chat_messages`
- `chat_requests`
- `messages`
- `notes`
- `notifications`
- `penalty_types_config`
- `permission_logs`
- `phone_verifications`
- `profile_comments`
- `profile_likes`
- `profiles`
- `question_deletion_appeals`
- `question_embeddings`
- `question_removal_requests`
- `question_tags`
- `questions`
- `reputation_actions`
- `reputation_milestones`
- `reputation_permissions_config`
- `role_permission_matrix`
- `status_replies`
- `status_stars`
- `system_logs`
- `tag_embeddings`
- `tag_feedback_stats`
- `tags`
- `user_applications`
- `user_blocks`
- `user_follows`
- `user_preferences`
- `user_reports`
- `user_roles`
- `user_statuses`
- `user_suspensions`
- `votes`

## Views

- `admin_user_overview`
- `complete_user_overview`

## SQL functions

- `admin_deduct_reputation`
- `admin_update_user_status`
- `apply_monthly_reputation_bonus`
- `apply_monthly_reputation_penalties`
- `apply_penalty`
- `can_change_username`
- `can_user_login`
- `check_and_award_milestones`
- `delete_question_as_admin`
- `enforce_reputation_limits`
- `enforce_username_change_cooldown`
- `get_admin_dashboard_stats`
- `get_pending_applications`
- `get_user_admin_permissions`
- `get_user_all_permissions`
- `get_user_reputation_permissions`
- `handle_appeal_decision`
- `handle_new_user`
- `increment_question_views`
- `log_admin_activity`
- `match_similar_tagged_questions`
- `match_tag_candidates`
- `modify_reputation`
- `owner_grant_role`
- `owner_revoke_role`
- `record_tag_feedback_batch`
- `restore_question_after_appeal`
- `search_tags_autocomplete`
- `submit_question_deletion_appeal`
- `suspend_user`
- `sync_tag_search_document`
- `trg_profile_likes_count`
- `trg_profiles_reputation_enforce`
- `update_answer_votes_count`
- `update_question_replies_count`
- `update_question_votes_count`
- `update_question_with_permission`
- `update_status_stars_count`
- `weekly_maintenance`

## Triggers

- `on_answer_change`
- `on_auth_user_created`
- `on_status_star_change`
- `on_vote_answer_change`
- `on_vote_question_change`
- `trg_enforce_username_change_cooldown`
- `trg_profile_likes_count_del`
- `trg_profile_likes_count_ins`
- `trg_profiles_reputation_enforce`
- `trg_tags_search_document`

## Migration timeline

### `supabase/migrations/20260219174828_extensions.sql`
- Tables added or changed in file: None
- Views added or changed in file: None
- SQL functions added or changed in file: None
- Triggers added or changed in file: None

### `supabase/migrations/20260219194859_complete_migration.sql`
- Tables added or changed in file: `profiles`, `questions`, `answers`, `tags`, `question_tags`, `votes`, `bookmarks`, `notifications`, `user_follows`, `notes`, `messages`, `admin_roles_config`, `user_roles`, `user_applications`, `user_preferences`, `penalty_types_config`, `reputation_permissions_config`, `reputation_milestones`, `user_suspensions`, `reputation_actions`, `permission_logs`
- Views added or changed in file: `admin_user_overview`, `complete_user_overview`
- SQL functions added or changed in file: `enforce_reputation_limits`, `trg_profiles_reputation_enforce`, `modify_reputation`, `handle_new_user`, `increment_question_views`, `update_answer_votes_count`, `update_question_votes_count`, `update_question_replies_count`, `can_user_login`, `get_user_admin_permissions`, `get_user_all_permissions`, `get_admin_dashboard_stats`, `get_pending_applications`, `admin_update_user_status`, `apply_penalty`, `admin_deduct_reputation`, `owner_grant_role`, `owner_revoke_role`, `suspend_user`, `check_and_award_milestones`, `weekly_maintenance`, `apply_monthly_reputation_bonus`, `apply_monthly_reputation_penalties`
- Triggers added or changed in file: `trg_profiles_reputation_enforce`, `on_auth_user_created`, `on_answer_change`, `on_vote_answer_change`, `on_vote_question_change`

### `supabase/migrations/20260220162945_phone_verifications.sql`
- Tables added or changed in file: None
- Views added or changed in file: None
- SQL functions added or changed in file: None
- Triggers added or changed in file: None

### `supabase/migrations/20260220163000_phone_verifications.sql`
- Tables added or changed in file: `phone_verifications`
- Views added or changed in file: None
- SQL functions added or changed in file: None
- Triggers added or changed in file: None

### `supabase/migrations/20260220180000_user_statuses.sql`
- Tables added or changed in file: `user_statuses`, `status_stars`
- Views added or changed in file: None
- SQL functions added or changed in file: `update_status_stars_count`
- Triggers added or changed in file: `on_status_star_change`

### `supabase/migrations/20260220200000_status_stars_and_legendary.sql`
- Tables added or changed in file: None
- Views added or changed in file: None
- SQL functions added or changed in file: `update_status_stars_count`
- Triggers added or changed in file: None

### `supabase/migrations/20260220210000_realtime_user_statuses.sql`
- Tables added or changed in file: None
- Views added or changed in file: None
- SQL functions added or changed in file: None
- Triggers added or changed in file: None

### `supabase/migrations/20260220220000_chat_system.sql`
- Tables added or changed in file: `user_blocks`, `chat_requests`, `chat_conversations`, `chat_messages`
- Views added or changed in file: None
- SQL functions added or changed in file: None
- Triggers added or changed in file: None

### `supabase/migrations/20260220230000_chat_messages_realtime.sql`
- Tables added or changed in file: None
- Views added or changed in file: None
- SQL functions added or changed in file: None
- Triggers added or changed in file: None

### `supabase/migrations/20260220240000_chat_read_state.sql`
- Tables added or changed in file: `chat_conversation_read_state`
- Views added or changed in file: None
- SQL functions added or changed in file: None
- Triggers added or changed in file: None

### `supabase/migrations/20260222100000_user_reports.sql`
- Tables added or changed in file: `user_reports`
- Views added or changed in file: None
- SQL functions added or changed in file: None
- Triggers added or changed in file: None

### `supabase/migrations/20260224120000_zero_reputation_enforce.sql`
- Tables added or changed in file: None
- Views added or changed in file: None
- SQL functions added or changed in file: `trg_profiles_reputation_enforce`, `can_user_login`
- Triggers added or changed in file: `trg_profiles_reputation_enforce`

### `supabase/migrations/20260224170000_enforce_reputation_limits_function.sql`
- Tables added or changed in file: None
- Views added or changed in file: None
- SQL functions added or changed in file: `enforce_reputation_limits`
- Triggers added or changed in file: None

### `supabase/migrations/20260224180000_owner_grant_bypass_daily_cap.sql`
- Tables added or changed in file: None
- Views added or changed in file: None
- SQL functions added or changed in file: `modify_reputation`
- Triggers added or changed in file: None

### `supabase/migrations/20260224190000_reputation_actions_current_total.sql`
- Tables added or changed in file: None
- Views added or changed in file: None
- SQL functions added or changed in file: None
- Triggers added or changed in file: None

### `supabase/migrations/20260224200000_reputation_actions_metadata.sql`
- Tables added or changed in file: None
- Views added or changed in file: None
- SQL functions added or changed in file: None
- Triggers added or changed in file: None

### `supabase/migrations/20260301100000_notifications_and_status_replies.sql`
- Tables added or changed in file: `status_replies`
- Views added or changed in file: None
- SQL functions added or changed in file: None
- Triggers added or changed in file: None

### `supabase/migrations/20260301110000_question_removal_and_notification.sql`
- Tables added or changed in file: `question_removal_requests`
- Views added or changed in file: None
- SQL functions added or changed in file: `update_question_with_permission`, `delete_question_as_admin`
- Triggers added or changed in file: None

### `supabase/migrations/20260302120000_question_soft_delete_appeals_activity_log.sql`
- Tables added or changed in file: `admin_activity_log`, `question_deletion_appeals`
- Views added or changed in file: None
- SQL functions added or changed in file: `delete_question_as_admin`, `restore_question_after_appeal`, `handle_appeal_decision`, `submit_question_deletion_appeal`, `log_admin_activity`, `update_question_with_permission`
- Triggers added or changed in file: None

### `supabase/migrations/20260302130000_fix_admin_role_labels.sql`
- Tables added or changed in file: None
- Views added or changed in file: None
- SQL functions added or changed in file: None
- Triggers added or changed in file: None

### `supabase/migrations/20260302183000_role_permission_matrix.sql`
- Tables added or changed in file: `role_permission_matrix`
- Views added or changed in file: None
- SQL functions added or changed in file: None
- Triggers added or changed in file: None

### `supabase/migrations/20260302190000_admin_role_limits_defaults.sql`
- Tables added or changed in file: None
- Views added or changed in file: None
- SQL functions added or changed in file: `get_user_admin_permissions`
- Triggers added or changed in file: None

### `supabase/migrations/20260303100000_penalty_types_update.sql`
- Tables added or changed in file: None
- Views added or changed in file: None
- SQL functions added or changed in file: None
- Triggers added or changed in file: None

### `supabase/migrations/20260303110000_admin_user_overview_last_seen.sql`
- Tables added or changed in file: None
- Views added or changed in file: `admin_user_overview`
- SQL functions added or changed in file: None
- Triggers added or changed in file: None

### `supabase/migrations/20260303193000_fix_get_user_all_permissions.sql`
- Tables added or changed in file: None
- Views added or changed in file: None
- SQL functions added or changed in file: `get_user_all_permissions`
- Triggers added or changed in file: None

### `supabase/migrations/20260303195000_seed_owner_lior.sql`
- Tables added or changed in file: None
- Views added or changed in file: None
- SQL functions added or changed in file: None
- Triggers added or changed in file: None

### `supabase/migrations/20260303202000_replace_get_user_admin_permissions_simple.sql`
- Tables added or changed in file: None
- Views added or changed in file: None
- SQL functions added or changed in file: `get_user_admin_permissions`
- Triggers added or changed in file: None

### `supabase/migrations/20260303213000_admin_roles_seed_and_owner_grant_role.sql`
- Tables added or changed in file: None
- Views added or changed in file: None
- SQL functions added or changed in file: `owner_grant_role`
- Triggers added or changed in file: None

### `supabase/migrations/20260303214000_seed_assign_roles_permission_matrix.sql`
- Tables added or changed in file: None
- Views added or changed in file: None
- SQL functions added or changed in file: None
- Triggers added or changed in file: None

### `supabase/migrations/20260303220000_replace_get_user_admin_permissions_final.sql`
- Tables added or changed in file: None
- Views added or changed in file: None
- SQL functions added or changed in file: `get_user_admin_permissions`
- Triggers added or changed in file: None

### `supabase/migrations/20260303221000_create_system_logs_if_missing.sql`
- Tables added or changed in file: `system_logs`
- Views added or changed in file: None
- SQL functions added or changed in file: None
- Triggers added or changed in file: None

### `supabase/migrations/20260304100000_profile_comments_and_likes.sql`
- Tables added or changed in file: `profile_comments`, `profile_likes`
- Views added or changed in file: None
- SQL functions added or changed in file: `trg_profile_likes_count`
- Triggers added or changed in file: `trg_profile_likes_count_ins`, `trg_profile_likes_count_del`

### `supabase/migrations/20260304120000_get_user_admin_permissions_from_role_config.sql`
- Tables added or changed in file: None
- Views added or changed in file: None
- SQL functions added or changed in file: `get_user_admin_permissions`
- Triggers added or changed in file: None

### `supabase/migrations/20260305100000_get_user_admin_permissions_limits_from_role_config_only.sql`
- Tables added or changed in file: None
- Views added or changed in file: None
- SQL functions added or changed in file: `get_user_admin_permissions`
- Triggers added or changed in file: None

### `supabase/migrations/20260305120000_owner_superuser_unrestricted.sql`
- Tables added or changed in file: None
- Views added or changed in file: None
- SQL functions added or changed in file: `get_user_admin_permissions`
- Triggers added or changed in file: None

### `supabase/migrations/20260305130000_username_change_cooldown.sql`
- Tables added or changed in file: None
- Views added or changed in file: None
- SQL functions added or changed in file: `can_change_username`, `enforce_username_change_cooldown`
- Triggers added or changed in file: `trg_enforce_username_change_cooldown`

### `supabase/migrations/20260309120000_add_regular_life_tags.sql`
- Tables added or changed in file: None
- Views added or changed in file: None
- SQL functions added or changed in file: None
- Triggers added or changed in file: None

### `supabase/migrations/20260309130000_add_relationship_tags.sql`
- Tables added or changed in file: None
- Views added or changed in file: None
- SQL functions added or changed in file: None
- Triggers added or changed in file: None

### `supabase/migrations/20260309140000_add_health_food_tags.sql`
- Tables added or changed in file: None
- Views added or changed in file: None
- SQL functions added or changed in file: None
- Triggers added or changed in file: None

### `supabase/migrations/20260309150000_add_social_and_everyday_tags.sql`
- Tables added or changed in file: None
- Views added or changed in file: None
- SQL functions added or changed in file: None
- Triggers added or changed in file: None

### `supabase/migrations/20260309160000_add_lifestyle_wellness_tags.sql`
- Tables added or changed in file: None
- Views added or changed in file: None
- SQL functions added or changed in file: None
- Triggers added or changed in file: None

### `supabase/migrations/20260309170000_add_tag_keywords.sql`
- Tables added or changed in file: None
- Views added or changed in file: None
- SQL functions added or changed in file: None
- Triggers added or changed in file: None

### `supabase/migrations/20260310100000_semantic_tagging_vectors.sql`
- Tables added or changed in file: `tag_embeddings`, `question_embeddings`, `tag_feedback_stats`
- Views added or changed in file: None
- SQL functions added or changed in file: `sync_tag_search_document`, `search_tags_autocomplete`, `match_tag_candidates`, `match_similar_tagged_questions`, `record_tag_feedback_batch`
- Triggers added or changed in file: `trg_tags_search_document`

### `supabase/migrations/20260310120000_trim_react_tag_keywords.sql`
- Tables added or changed in file: None
- Views added or changed in file: None
- SQL functions added or changed in file: None
- Triggers added or changed in file: None

### `supabase/migrations/20260310150000_update_question_tags_in_edit.sql`
- Tables added or changed in file: None
- Views added or changed in file: None
- SQL functions added or changed in file: `update_question_with_permission`
- Triggers added or changed in file: None

### `supabase/migrations/20260310151000_grant_update_question_with_tags.sql`
- Tables added or changed in file: None
- Views added or changed in file: None
- SQL functions added or changed in file: None
- Triggers added or changed in file: None

### `supabase/migrations/20260310152000_create_get_user_reputation_permissions.sql`
- Tables added or changed in file: None
- Views added or changed in file: None
- SQL functions added or changed in file: `get_user_reputation_permissions`
- Triggers added or changed in file: None
