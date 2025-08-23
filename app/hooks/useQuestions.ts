// Create this file: hooks/useQuestions.ts

"use client";

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface Question {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_username: string;
  author_avatar: string | null;
  votes_count: number;
  replies_count: number;
  views_count: number;
  created_at: string;
  updated_at: string;
  is_answered: boolean;
  tags: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

export function useQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch questions with author info and tags
      const { data, error } = await supabase
        .from('questions_with_details')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching questions:', error);
        setError('שגיאה בטעינת השאלות');
        return;
      }

      // Transform the data to match our component's expected format
      const transformedQuestions: Question[] = data.map((q: any) => ({
        id: q.id,
        title: q.title,
        content: q.content,
        author_id: q.author_id,
        author_username: q.author_username || 'משתמש אנונימי',
        author_avatar: q.author_avatar,
        votes_count: q.votes_count || 0,
        replies_count: q.replies_count || 0,
        views_count: q.views_count || 0,
        created_at: q.created_at,
        updated_at: q.updated_at,
        is_answered: q.is_answered || false,
        tags: q.tags || []
      }));

      setQuestions(transformedQuestions);
    } catch (error) {
      console.error('Unexpected error fetching questions:', error);
      setError('שגיאה בלתי צפויה בטעינת השאלות');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Format relative time in Hebrew
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'לפני פחות מדקה';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `לפני ${minutes} ${minutes === 1 ? 'דקה' : 'דקות'}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `לפני ${hours} ${hours === 1 ? 'שעה' : 'שעות'}`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `לפני ${days} ${days === 1 ? 'יום' : 'ימים'}`;
    }
  };

  // Increment view count for a question
  const incrementViews = async (questionId: string) => {
    try {
      const { error } = await supabase.rpc('increment_question_views', {
        question_id: questionId
      });

      if (error) {
        console.error('Error incrementing views:', error);
      }
    } catch (error) {
      console.error('Unexpected error incrementing views:', error);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  return {
    questions,
    loading,
    error,
    refetch: fetchQuestions,
    formatRelativeTime,
    incrementViews
  };
}