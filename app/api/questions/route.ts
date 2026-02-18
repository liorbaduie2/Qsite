import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search') || '';
    const tag = searchParams.get('tag') || '';
    const sortBy = searchParams.get('sort') || 'newest';

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
          avatar_url
        ),
        question_tags (
          tags (
            id,
            name
          )
        )
      `);

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    switch (sortBy) {
      case 'votes':
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

    const { data: questions, error } = await query;

    if (error) {
      console.error('Error fetching questions:', error);
      return NextResponse.json({ error: 'שגיאה בטעינת השאלות' }, { status: 500 });
    }

    const formatted = (questions || []).map((q: any) => ({
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
      },
      tags: (q.question_tags || [])
        .map((qt: any) => qt.tags?.name)
        .filter(Boolean),
    }));

    if (tag && tag !== 'הכל') {
      const filtered = formatted.filter((q: any) => q.tags.includes(tag));
      return NextResponse.json({ questions: filtered });
    }

    return NextResponse.json({ questions: formatted });
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

    if (tags && tags.length > 0) {
      for (const tagName of tags.slice(0, 5)) {
        let { data: existingTag } = await supabase
          .from('tags')
          .select('id')
          .eq('name', tagName)
          .single();

        if (!existingTag) {
          const { data: newTag } = await supabase
            .from('tags')
            .insert({ name: tagName })
            .select('id')
            .single();
          existingTag = newTag;
        }

        if (existingTag) {
          await supabase
            .from('question_tags')
            .insert({ question_id: question.id, tag_id: existingTag.id });

          await supabase
            .from('tags')
            .update({ use_count: (existingTag as any).use_count ? (existingTag as any).use_count + 1 : 1 })
            .eq('id', existingTag.id);
        }
      }
    }

    return NextResponse.json({ success: true, questionId: question.id }, { status: 201 });
  } catch (error) {
    console.error('Questions POST error:', error);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}
