"use client";

import React, { useState } from 'react';
import { X, HelpCircle, Tag, Type, FileText, Send } from 'lucide-react';

interface NewQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewQuestionModal({ isOpen, onClose }: NewQuestionModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = [
    { value: 'programming', label: 'תכנות' },
    { value: 'design', label: 'עיצוב' },
    { value: 'career', label: 'קריירה' },
    { value: 'learning', label: 'לימודים' },
    { value: 'tools', label: 'כלים' },
    { value: 'general', label: 'כללי' }
  ];

  const suggestedTags = ['תכנות', 'React', 'JavaScript', 'CSS', 'HTML', 'Vue', 'עיצוב', 'UI/UX', 'קריירה', 'לימודים'];

  if (!isOpen) return null;

  const handleAddTag = (tag: string) => {
    if (tag.trim() && !tags.includes(tag.trim()) && tags.length < 5) {
      setTags([...tags, tag.trim()]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      e.preventDefault();
      handleAddTag(currentTag);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setLoading(true);
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Here you would actually save to Supabase
      console.log({
        title: title.trim(),
        content: content.trim(),
        tags,
        category
      });
      
      // Reset form and close
      setTitle('');
      setContent('');
      setTags([]);
      setCurrentTag('');
      setCategory('');
      onClose();
    } catch (error) {
      console.error('Error creating question:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" dir="rtl">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative min-h-full flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <HelpCircle className="text-indigo-600" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">שאל שאלה חדשה</h2>
                <p className="text-gray-600">שתף את השאלה שלך עם הקהילה</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Category Selection */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Tag size={16} />
                קטגוריה
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">בחר קטגוריה</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Type size={16} />
                כותרת השאלה
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="מה השאלה שלך?"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                maxLength={300}
                required
              />
              <div className="text-xs text-gray-500 mt-1">
                {title.length}/300 תווים
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FileText size={16} />
                תיאור מפורט
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="הסבר בפירוט את השאלה שלך, מה ניסית לעשות, איפה נתקעת..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                required
              />
            </div>

            {/* Tags */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Tag size={16} />
                תגיות (עד 5)
              </label>
              
              {/* Current Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-indigo-900"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Tag Input */}
              {tags.length < 5 && (
                <input
                  type="text"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="הוסף תגית ולחץ Enter"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              )}

              {/* Suggested Tags */}
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2">תגיות מוצעות:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedTags.filter(tag => !tags.includes(tag)).slice(0, 8).map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddTag(tag)}
                      disabled={tags.length >= 5}
                      className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">טיפים לשאלה טובה:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• כתוב כותרת ברורה ותמציתית</li>
                <li>• הסבר מה ניסית לעשות ומה הבעיה</li>
                <li>• הוסף קוד רלוונטי אם יש</li>
                <li>• בחר תגיות מתאימות</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
              >
                ביטול
              </button>
              <button
                type="submit"
                disabled={!title.trim() || !content.trim() || loading}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    שולח...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    פרסם שאלה
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}