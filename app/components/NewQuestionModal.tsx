import React, { useState } from 'react';
import { X, Send, HelpCircle, Sparkles, Plus, Hash } from 'lucide-react';

interface NewQuestionModalProps {
isOpen: boolean;
onClose: () => void;
}

interface Category {
value: string;
label: string;
color: string;
icon: string;
}

const ImprovedNewQuestionModal: React.FC<NewQuestionModalProps> = ({ isOpen, onClose }) => {
const [title, setTitle] = useState<string>('');
const [content, setContent] = useState<string>('');
const [category, setCategory] = useState<string>('');
const [tags, setTags] = useState<string[]>([]);
const [currentTag, setCurrentTag] = useState<string>('');
const [loading, setLoading] = useState<boolean>(false);

const categories: Category[] = [
{ value: 'general', label: 'כללי', color: '#6366f1', icon: '💬' },
{ value: 'programming', label: 'תכנות', color: '#10b981', icon: '💻' },
{ value: 'web-dev', label: 'פיתוח אתרים', color: '#f59e0b', icon: '🌐' },
{ value: 'mobile', label: 'פיתוח מובייל', color: '#8b5cf6', icon: '📱' },
{ value: 'career', label: 'קריירה', color: '#ef4444', icon: '💼' },
{ value: 'learning', label: 'למידה', color: '#06b6d4', icon: '📚' },
];

const popularTags: string[] = ['JavaScript', 'React', 'Python', 'HTML/CSS', 'Node.js', 'מתחיל', 'עזרה'];

const handleTagAdd = (tagText: string): void => {
const trimmedTag = tagText.trim();
if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
setTags([...tags, trimmedTag]);
setCurrentTag('');
}
};

const handleTagRemove = (tagToRemove: string): void => {
setTags(tags.filter((tag: string) => tag !== tagToRemove));
};

const handleSubmit = async (): Promise<void> => {
if (!title.trim() || !content.trim()) return;

code
Code
download
content_copy
expand_less

setLoading(true);

try {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  console.log({
    title: title.trim(),
    content: content.trim(),
    tags,
    category
  });
  
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

const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
if (e.key === 'Enter') {
e.preventDefault();
handleTagAdd(currentTag);
}
};

if (!isOpen) return null;

return (
<div className="fixed inset-0 z-50 overflow-y-auto" dir="rtl">
{/* Enhanced Backdrop */}
<div className="fixed inset-0 bg-gradient-to-br from-black/60 via-indigo-900/20 to-purple-900/40 backdrop-blur-md" onClick={onClose} />

code
Code
download
content_copy
expand_less
IGNORE_WHEN_COPYING_START
IGNORE_WHEN_COPYING_END
{/* Modal */}
  <div className="relative min-h-full flex items-center justify-center p-4">
    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
      
      {/* Enhanced Header with Gradient */}
      <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-8">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
              <HelpCircle className="text-white" size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                שאל שאלה חדשה
                <Sparkles className="text-yellow-300" size={24} />
              </h2>
              <p className="text-indigo-100 mt-1">שתף את השאלה שלך עם הקהילה</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200"
          >
            <X size={20} className="text-white" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 space-y-8 max-h-[calc(95vh-140px)] overflow-y-auto">
        
        {/* Title Input - Enhanced */}
        <div className="space-y-3">
          <div className="relative">
            <input
              type="text"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              placeholder="מה השאלה שלך? ✨"
              className="w-full p-6 text-lg border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 placeholder-gray-400"
              maxLength={300}
            />
            <div className="absolute left-4 top-6 text-gray-400">
              <HelpCircle size={24} />
            </div>
          </div>
          <div className="flex justify-end text-sm">
            <span className={`${title.length > 250 ? 'text-red-500' : 'text-gray-400'}`}>
              {title.length}/300
            </span>
          </div>
        </div>

        {/* Content Textarea - Enhanced */}
        <div className="space-y-3">
          <div className="relative">
            <textarea
              value={content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
              placeholder="הסבר בפירוט את השאלה שלך...

💡 מה ניסית לעשות?
🤔 איפה נתקעת?
🔍 מה כבר בדקת?

כלול קוד רלוונטי אם יש!"
className="w-full h-48 p-6 text-lg border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 resize-none placeholder-gray-400 leading-relaxed"
/>
</div>
<div className="flex justify-end text-sm">
<span className="text-gray-400">
{content.length}/1000
</span>
</div>
</div>

code
Code
download
content_copy
expand_less
IGNORE_WHEN_COPYING_START
IGNORE_WHEN_COPYING_END
{/* Tags Section - Interactive */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Hash className="text-indigo-600" size={20} />
            תגיות (עד 5)
          </h3>
          
          {/* Current Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {tags.map((tag: string) => (
                <span
                  key={tag}
                  className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 rounded-full font-medium border border-indigo-200 hover:shadow-md transition-all duration-200"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleTagRemove(tag)}
                    className="p-1 hover:bg-indigo-200 rounded-full transition-colors opacity-70 group-hover:opacity-100"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Add Tag Input */}
          {tags.length < 5 && (
            <div className="flex gap-2">
              <input
                type="text"
                value={currentTag}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="הוסף תגית..."
                className="flex-1 p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300"
              />
              <button
                type="button"
                onClick={() => handleTagAdd(currentTag)}
                disabled={!currentTag.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={20} />
              </button>
            </div>
          )}

          {/* Popular Tags */}
          <div>
            <p className="text-sm text-gray-600 mb-3">תגיות פופולריות:</p>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag: string) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagAdd(tag)}
                  disabled={tags.includes(tag) || tags.length >= 5}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-full hover:border-indigo-500 hover:text-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Success Tips - Redesigned */}
        <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
          <div className="relative">
            <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
              <Sparkles className="text-blue-600" size={20} />
              טיפים לשאלה מצוינת
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-blue-800">כתוב כותרת ברורה ותמציתית</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-blue-800">הסבר מה ניסית לעשות ומה הבעיה</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-blue-800">הוסף קוד רלוונטי אם יש</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-blue-800">בחר תגיות מתאימות</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions - Enhanced */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-4 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200 font-medium"
          >
            ביטול
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!title.trim() || !content.trim() || loading}
            className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                שולח...
              </>
            ) : (
              <>
                <Send size={20} className="group-hover:translate-x-1 transition-transform" />
                פרסם שאלה
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

);
};

export default ImprovedNewQuestionModal;