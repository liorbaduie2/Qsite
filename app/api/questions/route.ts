import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeTagName } from "@/lib/tag-matching";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  syncTagEmbeddings,
  upsertQuestionEmbedding,
} from "@/lib/tag-suggestions/embedding-sync";
import { requireActiveAccount } from "@/lib/account-state";

type TagSuggestionContext = {
  shownSuggestedTags: string[];
  acceptedSuggestedTags: string[];
};

type ExistingTagRow = {
  id: string;
  name: string;
  use_count: number | null;
};

function normalizeTagSuggestionContext(value: unknown): TagSuggestionContext {
  const fallback: TagSuggestionContext = {
    shownSuggestedTags: [],
    acceptedSuggestedTags: [],
  };

  if (!value || typeof value !== "object") {
    return fallback;
  }

  const context = value as {
    shownSuggestedTags?: unknown;
    acceptedSuggestedTags?: unknown;
  };

  return {
    shownSuggestedTags: Array.isArray(context.shownSuggestedTags)
      ? context.shownSuggestedTags
          .filter((tag): tag is string => typeof tag === "string")
          .map((tag) => normalizeTagName(tag))
          .filter(Boolean)
      : [],
    acceptedSuggestedTags: Array.isArray(context.acceptedSuggestedTags)
      ? context.acceptedSuggestedTags
          .filter((tag): tag is string => typeof tag === "string")
          .map((tag) => normalizeTagName(tag))
          .filter(Boolean)
      : [],
  };
}

function buildTagFeedbackRows(params: {
  existingTagsByName: Map<
    string,
    {
      id: string;
    }
  >;
  normalizedTags: string[];
  suggestionContext: TagSuggestionContext;
}): Array<{
  tag_id: string;
  shown_delta: number;
  selected_delta: number;
  accepted_delta: number;
  manual_delta: number;
  shown_at: string | null;
  selected_at: string | null;
}> {
  const { existingTagsByName, normalizedTags, suggestionContext } = params;
  const shownTagSet = new Set(suggestionContext.shownSuggestedTags);
  const acceptedTagSet = new Set(suggestionContext.acceptedSuggestedTags);
  const selectedTagSet = new Set(normalizedTags);
  const timestamp = new Date().toISOString();

  return Array.from(new Set([...shownTagSet, ...selectedTagSet]))
    .map((tagName) => {
      const existingTag = existingTagsByName.get(tagName);
      if (!existingTag) return null;

      const wasShown = shownTagSet.has(tagName);
      const wasSelected = selectedTagSet.has(tagName);
      const wasAccepted = wasSelected && acceptedTagSet.has(tagName);
      const wasManualSelection = wasSelected && !wasAccepted;

      if (!wasShown && !wasSelected) {
        return null;
      }

      return {
        tag_id: existingTag.id,
        shown_delta: wasShown ? 1 : 0,
        selected_delta: wasSelected ? 1 : 0,
        accepted_delta: wasAccepted ? 1 : 0,
        manual_delta: wasManualSelection ? 1 : 0,
        shown_at: wasShown ? timestamp : null,
        selected_at: wasSelected ? timestamp : null,
      };
    })
    .filter(
      (
        row,
      ): row is {
        tag_id: string;
        shown_delta: number;
        selected_delta: number;
        accepted_delta: number;
        manual_delta: number;
        shown_at: string | null;
        selected_at: string | null;
      } => Boolean(row),
    );
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || "";
    const tag = searchParams.get("tag") || "";
    const sortBy = searchParams.get("sort") || "newest";
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    let weekStartIso: string | null = null;

    let query = supabase
      .from("questions")
      .select(
        `
        id,
        title,
        content,
        votes_count,
        replies_count,
        views_count,
        is_answered,
        created_at,
        author_id,
        profiles!questions_author_id_fkey (
          id,
          username,
          avatar_url,
          last_seen_at,
          account_state
        ),
        question_tags (
          tags (
            id,
            name
          )
        )
      `,
      )
      .is("deleted_at", null);

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    switch (sortBy) {
      case "votes":
        query = query.order("votes_count", { ascending: false });
        break;
      case "weekly_top":
        // Base ordering by votes; we'll apply weekly priority in application code
        query = query.order("votes_count", { ascending: false });
        break;
      case "replies":
        query = query.order("replies_count", { ascending: false });
        break;
      case "views":
        query = query.order("views_count", { ascending: false });
        break;
      case "oldest":
        query = query.order("created_at", { ascending: true });
        break;
      default:
        query = query.order("created_at", { ascending: false });
    }

    if (
      limit &&
      Number.isFinite(limit) &&
      limit > 0 &&
      sortBy !== "weekly_top"
    ) {
      query = query.limit(limit);
    }

    const { data: questions, error } = await query;

    if (error) {
      console.error("Error fetching questions:", error);
      return NextResponse.json(
        { error: "שגיאה בטעינת השאלות" },
        { status: 500 },
      );
    }

    let processed = questions || [];

    if (sortBy === "weekly_top") {
      const now = new Date();
      const day = now.getDay(); // 0 (Sunday) - 6 (Saturday)
      const diffToMonday = (day + 6) % 7; // days since Monday
      const startOfWeek = new Date(now);
      startOfWeek.setHours(0, 0, 0, 0);
      startOfWeek.setDate(now.getDate() - diffToMonday);
      weekStartIso = startOfWeek.toISOString();

      const weekly = processed.filter((q) => q.created_at >= weekStartIso!);
      const older = processed.filter((q) => q.created_at < weekStartIso!);
      processed = [...weekly, ...older];

      if (limit && Number.isFinite(limit) && limit > 0) {
        processed = processed.slice(0, limit);
      }
    }

    processed = processed.filter((q: any) => {
      const p = q.profiles as Record<string, unknown> | null;
      return p?.account_state !== "blocked";
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatted = (processed || []).map((q: any, index: number) => ({
      id: q.id,
      title: q.title,
      content: q.content,
      votes: q.votes_count || 0,
      replies: q.replies_count || 0,
      views: q.views_count || 0,
      isAnswered: q.is_answered || false,
      createdAt: q.created_at,
      author: {
        id: q.profiles?.id || q.author_id,
        username: q.profiles?.username || "אנונימי",
        avatar_url: q.profiles?.avatar_url || null,
        lastSeenAt: q.profiles?.last_seen_at ?? null,
      },
      tags: (q.question_tags || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((qt: any) => qt.tags?.name)
        .filter(Boolean),
      isTopOfWeek:
        sortBy === "weekly_top" &&
        index === 0 &&
        weekStartIso !== null &&
        q.created_at >= weekStartIso,
    }));

    const visibleQuestions =
      tag && tag !== "הכל"
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatted.filter((q: any) => q.tags.includes(tag))
        : formatted;

    return NextResponse.json({
      questions: visibleQuestions,
    });
  } catch (error) {
    console.error("Questions GET error:", error);
    return NextResponse.json({ error: "שגיאה בשרת" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "יש להתחבר כדי לשאול שאלה" },
        { status: 401 },
      );
    }

    const access = await requireActiveAccount(supabase, user.id);
    if (!access.allowed) return access.errorResponse!;

    const body = await request.json();
    const { title, content, tags, tagSuggestionContext } = body;
    const normalizedSuggestionContext =
      normalizeTagSuggestionContext(tagSuggestionContext);

    if (!title?.trim() || title.trim().length < 5) {
      return NextResponse.json(
        { error: "הכותרת חייבת להכיל לפחות 5 תווים" },
        { status: 400 },
      );
    }
    if (!content?.trim()) {
      return NextResponse.json(
        { error: "תוכן השאלה הוא שדה חובה" },
        { status: 400 },
      );
    }
    if (!Array.isArray(tags) || tags.length === 0) {
      return NextResponse.json(
        { error: "יש להוסיף לפחות תגית אחת" },
        { status: 400 },
      );
    }

    const submittedTags: string[] = tags.filter(
      (tag): tag is string => typeof tag === "string",
    );

    const normalizedTags: string[] = Array.from(
      new Set(
        submittedTags.map((tag) => normalizeTagName(tag)).filter(Boolean),
      ),
    ).slice(0, 5);

    if (normalizedTags.length === 0) {
      return NextResponse.json(
        { error: "יש לבחור לפחות תגית קיימת אחת" },
        { status: 400 },
      );
    }

    const { data: existingTagsResult, error: tagsValidationError } =
      await supabase.from("tags").select("id, name, use_count").limit(500);

    if (tagsValidationError) {
      console.error("Error validating tags:", tagsValidationError);
      return NextResponse.json(
        { error: "שגיאה באימות התגיות" },
        { status: 500 },
      );
    }

    const existingTags = (existingTagsResult || []) as ExistingTagRow[];
    const existingTagsByName = new Map(
      existingTags.map((tag) => [normalizeTagName(tag.name), tag]),
    );
    const invalidTags = normalizedTags.filter(
      (tag) => !existingTagsByName.has(tag),
    );

    if (invalidTags.length > 0) {
      return NextResponse.json(
        { error: "ניתן לבחור רק תגיות קיימות מהקטלוג" },
        { status: 400 },
      );
    }

    const { data: question, error: questionError } = await supabase
      .from("questions")
      .insert({
        title: title.trim(),
        content: content.trim(),
        author_id: user.id,
      })
      .select("id")
      .single();

    if (questionError) {
      console.error("Error creating question:", questionError);
      return NextResponse.json(
        { error: "שגיאה ביצירת השאלה" },
        { status: 500 },
      );
    }

    const selectedTagRows = normalizedTags.flatMap((tagName) => {
      const existingTag = existingTagsByName.get(tagName);
      return existingTag ? [existingTag] : [];
    });

    if (selectedTagRows.length > 0) {
      const questionTagRows = selectedTagRows.map((tag) => ({
        question_id: question.id,
        tag_id: tag.id,
      }));

      const { error: questionTagsError } = await supabase
        .from("question_tags")
        .insert(questionTagRows);

      if (questionTagsError) {
        console.error("Error linking question tags:", questionTagsError);
        return NextResponse.json(
          { error: "שגיאה בשמירת התגיות" },
          { status: 500 },
        );
      }

      const useCountUpdates = await Promise.allSettled(
        selectedTagRows.map((tag) =>
          supabase
            .from("tags")
            .update({ use_count: (tag.use_count || 0) + 1 })
            .eq("id", tag.id),
        ),
      );

      useCountUpdates.forEach((result) => {
        if (result.status === "rejected") {
          console.error("Error updating tag use count:", result.reason);
        } else if (result.value.error) {
          console.error("Error updating tag use count:", result.value.error);
        }
      });
    }

    const feedbackRows = buildTagFeedbackRows({
      existingTagsByName,
      normalizedTags,
      suggestionContext: normalizedSuggestionContext,
    });

    try {
      const adminClient = getAdminClient();
      const learningTasks: Promise<unknown>[] = [
        upsertQuestionEmbedding({
          questionId: question.id,
          title: title.trim(),
          content: content.trim(),
          adminClient,
        }),
        syncTagEmbeddings({
          adminClient,
          tagIds: selectedTagRows.map((tag) => tag.id),
          batchSize: 5,
        }),
      ];

      if (feedbackRows.length > 0) {
        learningTasks.push(
          (async () => {
            const { error } = await adminClient.rpc(
              "record_tag_feedback_batch",
              {
                feedback_rows: feedbackRows,
              },
            );

            if (error) {
              throw error;
            }
          })(),
        );
      }

      const learningResults = await Promise.allSettled(learningTasks);
      learningResults.forEach((result) => {
        if (result.status === "rejected") {
          console.error(
            "Question tagging learning task failed:",
            result.reason,
          );
        }
      });
    } catch (learningError) {
      console.error("Question tagging learning setup failed:", learningError);
    }

    return NextResponse.json(
      { success: true, questionId: question.id },
      { status: 201 },
    );
  } catch (error) {
    console.error("Questions POST error:", error);
    return NextResponse.json({ error: "שגיאה בשרת" }, { status: 500 });
  }
}
