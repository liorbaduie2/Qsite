import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeTagName } from '@/lib/tag-matching';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search') || '';
    const tag = searchParams.get('tag') || '';
    const sortBy = searchParams.get('sort') || 'newest';
    const includeUserVotes = searchParams.get('includeUserVotes') === '1';
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    let currentUserId: string | null = null;

    if (includeUserVotes) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      currentUserId = user?.id ?? null;
    }

    let weekStartIso: string | null = null;

    let query = supabase
      .from('questions')
      .select(`
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
          last_seen_at
        ),
        question_tags (
          tags (
            id,
            name
          )
        )
      `)
      .is('deleted_at', null);

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    switch (sortBy) {
      case 'votes':
        query = query.order('votes_count', { ascending: false });
        break;
      case 'weekly_top':
        // Base ordering by votes; we'll apply weekly priority in application code
        query = query.order('votes_count', { ascending: false });
        break;
      case 'replies':
        query = query.order('replies_count', { ascending: false });
        break;
      case 'views':
        query = query.order('views_count', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    if (limit && Number.isFinite(limit) && limit > 0 && sortBy !== 'weekly_top') {
      query = query.limit(limit);
    }

    const { data: questions, error } = await query;

    if (error) {
      console.error('Error fetching questions:', error);
      return NextResponse.json({ error: 'שגיאה בטעינת השאלות' }, { status: 500 });
    }

    let processed = questions || [];

    if (sortBy === 'weekly_top') {
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
        username: q.profiles?.username || 'אנונימי',
        avatar_url: q.profiles?.avatar_url || null,
        lastSeenAt: q.profiles?.last_seen_at ?? null,
      },
      tags: (q.question_tags || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((qt: any) => qt.tags?.name)
        .filter(Boolean),
      isTopOfWeek:
        sortBy === 'weekly_top' &&
        index === 0 &&
        weekStartIso !== null &&
        q.created_at >= weekStartIso,
    }));

    const visibleQuestions =
      tag && tag !== 'הכל'
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatted.filter((q: any) => q.tags.includes(tag))
        : formatted;

    let userVotes: Record<string, 1 | -1> = {};
    if (includeUserVotes && currentUserId && visibleQuestions.length > 0) {
      const questionIds = visibleQuestions.map((question) => question.id);
      const { data: voteRows, error: votesError } = await supabase
        .from('votes')
        .select('question_id, vote_type')
        .eq('user_id', currentUserId)
        .in('question_id', questionIds);

      if (votesError) {
        console.error('Error fetching current user question votes:', votesError);
        return NextResponse.json({ error: 'שגיאה בטעינת ההצבעות' }, { status: 500 });
      }

      userVotes = Object.fromEntries(
        (voteRows ?? [])
          .filter(
            (vote) =>
              vote.question_id &&
              (vote.vote_type === 1 || vote.vote_type === -1),
          )
          .map((vote) => [vote.question_id as string, vote.vote_type as 1 | -1]),
      );
    }

    return NextResponse.json({
      questions: visibleQuestions,
      ...(includeUserVotes ? { userVotes } : {}),
    });
  } catch (error) {
    console.error('Questions GET error:', error);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'יש להתחבר כדי לשאול שאלה' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, tags } = body;

    if (!title?.trim() || title.trim().length < 5) {
      return NextResponse.json({ error: 'הכותרת חייבת להכיל לפחות 5 תווים' }, { status: 400 });
    }
    if (!content?.trim()) {
      return NextResponse.json({ error: 'תוכן השאלה הוא שדה חובה' }, { status: 400 });
    }
    if (!Array.isArray(tags) || tags.length === 0) {
      return NextResponse.json({ error: 'יש להוסיף לפחות תגית אחת' }, { status: 400 });
    }

    const submittedTags: string[] = tags.filter(
      (tag): tag is string => typeof tag === 'string',
    );

    const normalizedTags: string[] = Array.from(
      new Set(
        submittedTags
          .map((tag) => normalizeTagName(tag))
          .filter(Boolean),
      ),
    ).slice(0, 5);

    if (normalizedTags.length === 0) {
      return NextResponse.json({ error: 'יש לבחור לפחות תגית קיימת אחת' }, { status: 400 });
    }

    const { data: existingTags, error: tagsValidationError } = await supabase
      .from('tags')
      .select('id, name, use_count')
      .limit(500);

    if (tagsValidationError) {
      console.error('Error validating tags:', tagsValidationError);
      return NextResponse.json({ error: 'שגיאה באימות התגיות' }, { status: 500 });
    }

    const existingTagsByName = new Map(
      (existingTags || []).map((tag) => [normalizeTagName(tag.name), tag]),
    );
    const invalidTags = normalizedTags.filter((tag) => !existingTagsByName.has(tag));

    if (invalidTags.length > 0) {
      return NextResponse.json(
        { error: 'ניתן לבחור רק תגיות קיימות מהקטלוג' },
        { status: 400 },
      );
    }

    const { data: question, error: questionError } = await supabase
      .from('questions')
      .insert({
        title: title.trim(),
        content: content.trim(),
        author_id: user.id,
      })
      .select('id')
      .single();

    if (questionError) {
      console.error('Error creating question:', questionError);
      return NextResponse.json({ error: 'שגיאה ביצירת השאלה' }, { status: 500 });
    }

    for (const tagName of normalizedTags) {
      const existingTag = existingTagsByName.get(tagName);

      if (existingTag) {
        await supabase
          .from('question_tags')
          .insert({ question_id: question.id, tag_id: existingTag.id });

        await supabase
          .from('tags')
          .update({ use_count: (existingTag.use_count || 0) + 1 })
          .eq('id', existingTag.id);
      }
    }

    return NextResponse.json({ success: true, questionId: question.id }, { status: 201 });
  } catch (error) {
    console.error('Questions POST error:', error);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}
