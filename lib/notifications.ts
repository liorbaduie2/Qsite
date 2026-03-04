import { getAdminClient } from "@/lib/supabase/admin";

export type NotificationType =
  | "question_answer"
  | "answer_accepted"
  | "question_vote"
  | "answer_vote"
  | "question_comment"
  | "answer_comment"
  | "mention"
  | "follow"
  | "system"
  | "status_reply"
  | "status_star"
  | "question_most_rated"
  | "status_leading";

export interface CreateNotificationParams {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  question_id?: string | null;
  answer_id?: string | null;
  status_id?: string | null;
  from_user_id?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Create a notification for a user. Uses admin client so we can insert
 * on behalf of any recipient (RLS would block when current user ≠ recipient).
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  const supabase = getAdminClient();
  const { error } = await supabase.from("notifications").insert({
    user_id: params.user_id,
    type: params.type,
    title: params.title,
    message: params.message,
    question_id: params.question_id ?? null,
    answer_id: params.answer_id ?? null,
    status_id: params.status_id ?? null,
    from_user_id: params.from_user_id ?? null,
    metadata: params.metadata ?? null,
  });
  if (error) {
    console.error("createNotification error:", error);
  }
}
