"use client";

import React, { useState } from 'react';
import { X, Plus, Tag } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { createBrowserClient } from '@supabase/ssr';

interface NewQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestionCreated?: () => void;
}

export default function NewQuestionModal({ isOpen, onClose, onQuestionCreated }: NewQuestionModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const availableTags = [
    { id: 'javascript', name: 'JavaScript', color: '#f7df1e' },
    { id: 'react', name: 'React', color: '#61dafb' },
    { id: 'nextjs', name: 'Next.js', color: '#000000' },
    { id: 'typescript', name: 'TypeScript', color: '#3178c6' },
    { id: 'programming', name: 'תכנות', color: '#3b82f6' },
    { id: 'career', name: 'קריירה', color: '#10b981' },
    { id: 'learning', name: 'לימודים', color: '#f59e0b' },
    { id: 'design', name: 'עיצוב', color: '#ec4899' },
  ];

  if (!isOpen) return null;

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('יש להתחבר כדי לפרסם שאלה');
      return;
    }

    if (title.trim().length < 5) {
      setError('כותרת השאלה חייבת להכיל לפחות 5 תווים');
      return;
    }

    if (content.trim().length < 10) {
      setError('תוכן השאלה חייב להכיל לפחות 10 תווים');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Insert question
      const { data: question, error: questionError } = await supabase
        .from('questions')
        .insert([
          {
            title: title.trim(),
            content: content.trim(),
            author_id: user.id,
          }
        ])
        .select()
        .single();

      if (questionError) throw questionError;

      // Insert question tags if any selected
      if (selectedTags.length > 0) {
        // First, get or create the tags
        const { data: existingTags, error: tagsError } = await supabase
          .from('tags')
          .select('id, name')
          .in('name', selectedTags.map(tagId => 
            availableTags.find(t => t.id === tagId)?.name || tagId
          ));

        if (tagsError) throw tagsError;

        // Create question_tags relationships
        const questionTags = existingTags.map(tag => ({
          question_id: question.id,
          tag_id: tag.id
        }));

        const { error: relationError } = await supabase
          .from('question_tags')
          .insert(questionTags);

        if (relationError) throw relationError;
      }

      // Reset form
      setTitle('');
      setContent('');
      setSelectedTags([]);
      
      // Call callback and close modal
      onQuestionCreated?.();
      onClose();

    } catch (error: any) {
      console.error('Error creating question:', error);
      setError(error.message || 'אירעה שגיאה ביצירת השאלה');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setTitle('');
      setContent('');
      setSelectedTags([]);
      setError('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">שאלה חדשה</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              כותרת השאלה *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="כתוב כותרת ברורה ותמציתית לשאלה שלך..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              disabled={loading}
              maxLength={200}
            />
            <div className="text-xs text-gray-500 mt-1">
              {title.length}/200 תווים (מינימום 5)
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              פירוט השאלה *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="פרט את השאלה שלך, הוסף דוגמאות, הקשר נוסף וכל מידע שיכול לעזור למשיבים..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none h-32"
              disabled={loading}
            />
            <div className="text-xs text-gray-500 mt-1">
              {content.length} תווים (מינימום 10)
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              תגיות (אופציונלי)
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleTagToggle(tag.id)}
                  disabled={loading}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedTags.includes(tag.id)
                      ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-300'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:border-gray-300'
                  } disabled:opacity-50`}
                >
                  <Tag size={14} />
                  {tag.name}
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              נבחרו {selectedTags.length} תגיות
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || !title.trim() || !content.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  מפרסם...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  פרסם שאלה
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}