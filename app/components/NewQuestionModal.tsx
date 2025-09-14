"use client";

import React, { useState, useRef } from 'react';
import { X, Send, HelpCircle, Sparkles, Hash, CheckCircle } from 'lucide-react';

interface NewQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewQuestionModal({ isOpen, onClose }: NewQuestionModalProps) {
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Refs for focus management
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Popular tags - matching your existing Hebrew tags
  const popularTags: string[] = [
    'תכנות', 'React', 'JavaScript', 'CSS', 'HTML', 'Vue', 
    'עיצוב', 'UI/UX', 'קריירה', 'לימודים', 'מתחיל', 'עזרה'
  ];

  const handleTagAdd = (tagText: string): void => {
    const trimmedTag = tagText.trim().replace(/\s+/g, '-');
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      setTags([...tags, trimmedTag]);
      setCurrentTag('');
    }
  };

  const handleTagRemove = (tagToRemove: string): void => {
    setTags(tags.filter((tag: string) => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    
    setLoading(true);
    try {
      // Simulate API call - replace with actual Supabase submission
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Log the data that would be submitted to Supabase
      console.log({
        title: title.trim(),
        content: content.trim(),
        tags
      });
      
      // Reset form and close
      setTitle('');
      setContent('');
      setTags([]);
      setCurrentTag('');
      onClose();
    } catch (error) {
      console.error('Error creating question:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTagAdd(currentTag);
    }
  };
  
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTag(e.target.value.replace(/\s+/g, '-'));
  };

  if (!isOpen) return null;

  // Progressive disclosure states
  const showContent = title.trim() !== '';
  const showTags = content.trim() !== '';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" dir="rtl">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative min-h-full flex items-center justify-center p-4">
        <div className="relative bg-gray-50 rounded-2xl shadow-xl w-full max-w-4xl max-h-[95vh] overflow-hidden grid grid-cols-1 md:grid-cols-3">
          
          {/* Left Column - Tips and Popular Tags */}
          <div className="col-span-1 bg-white p-8 space-y-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Sparkles className="text-indigo-500" size={24} />
              טיפים לשאלה טובה
            </h3>
            
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <CheckCircle className="text-green-500 mt-1 flex-shrink-0" size={18} />
                <span className="text-gray-600">כותרת ברורה ותמציתית</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle 
                  className={`mt-1 flex-shrink-0 ${showContent ? 'text-green-500' : 'text-gray-300'}`} 
                  size={18} 
                />
                <span className={`${showContent ? 'text-gray-600' : 'text-gray-400'}`}>
                  הסבר מה ניסית ואיפה נתקעת
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle 
                  className={`mt-1 flex-shrink-0 ${showTags ? 'text-green-500' : 'text-gray-300'}`} 
                  size={18} 
                />
                <span className={`${showTags ? 'text-gray-600' : 'text-gray-400'}`}>
                  בחר תגיות מתאימות
                </span>
              </li>
            </ul>
            
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                <Hash className="text-indigo-500" size={20} />
                תגיות פופולריות
              </h3>
              <div className={`flex flex-wrap gap-2 transition-opacity duration-500 ${showTags ? 'opacity-100' : 'opacity-30'}`}>
                {popularTags.map((tag) => (
                  <button 
                    key={tag} 
                    type="button" 
                    onClick={() => handleTagAdd(tag)} 
                    disabled={!showTags || tags.includes(tag) || tags.length >= 5}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-indigo-100 hover:text-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right Column - Form */}
          <div className="col-span-2 p-8 space-y-6 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 rounded-xl">
                  <HelpCircle className="text-indigo-600" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">שאל שאלה חדשה</h2>
                  <p className="text-gray-500">שתף את הידע שלך עם הקהילה</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <label className="font-semibold text-gray-700">כותרת</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="מהי שאלתך?" 
                  className="w-full p-4 text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors" 
                  maxLength={300} 
                  autoFocus 
                  required
                />
                <div className="text-xs text-gray-500">
                  {title.length}/300 תווים
                </div>
              </div>

              {/* Content - shows when title is filled */}
              <div className={`space-y-2 transition-all duration-500 ${showContent ? 'opacity-100 max-h-96' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                <label className="font-semibold text-gray-700">תוכן</label>
                <textarea 
                  ref={contentRef}
                  value={content} 
                  onChange={(e) => setContent(e.target.value)} 
                  placeholder="הסבר בפירוט את שאלתך, מה ניסית לעשות, איפה נתקעת..."
                  className="w-full h-36 p-4 text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors resize-none" 
                  disabled={!showContent}
                  required
                />
              </div>
              
              {/* Tags - shows when content is filled */}
              <div className={`space-y-3 transition-all duration-500 ${showTags ? 'opacity-100 max-h-96' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                <label className="font-semibold text-gray-700 flex items-center gap-2">
                  <Hash className="text-indigo-500" size={20} />
                  תגיות (עד 5)
                </label>
                <div className="flex flex-wrap items-center gap-2 p-2 bg-white border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-transparent transition-all">
                  {tags.map((tag) => (
                    <span 
                      key={tag} 
                      className="group flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-800 rounded-md font-semibold text-sm transition-all duration-300"
                    >
                      {tag}
                      <button 
                        type="button" 
                        onClick={() => handleTagRemove(tag)} 
                        className="p-0.5 opacity-50 group-hover:opacity-100 hover:bg-indigo-200 rounded-full transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                  {tags.length < 5 && (
                    <input
                      ref={tagInputRef}
                      type="text"
                      value={currentTag}
                      onChange={handleTagInputChange}
                      onKeyPress={handleKeyPress}
                      placeholder="הוסף תגית ולחץ Enter..."
                      className="flex-1 bg-transparent p-1.5 min-w-[150px] focus:outline-none text-sm"
                      disabled={!showTags}
                    />
                  )}
                </div>
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
                  className="group flex items-center gap-3 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium text-base"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      שולח...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      פרסם שאלה
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}