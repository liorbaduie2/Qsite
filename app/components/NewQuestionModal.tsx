"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, HelpCircle, Hash } from "lucide-react";
import { normalizeTagName, shouldFetchSuggestedTags } from "@/lib/tag-matching";

interface NewQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestionCreated?: () => void;
}

export default function NewQuestionModal({
  isOpen,
  onClose,
  onQuestionCreated,
}: NewQuestionModalProps) {
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState<boolean>(false);
  const [tagMatches, setTagMatches] = useState<string[]>([]);

  // Refs for focus management
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const suggestionAbortRef = useRef<AbortController | null>(null);
  const suggestionRequestIdRef = useRef(0);

  const handleTagAdd = (tagText: string): void => {
    const trimmedTag = normalizeTagName(tagText);
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      setTags([...tags, trimmedTag]);
      setCurrentTag("");
      setTagMatches([]);
      setError(null);
    }
  };

  const handleTagRemove = (tagToRemove: string): void => {
    setTags(tags.filter((tag: string) => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    if (currentTag.trim()) {
      setError("יש לבחור תגית קיימת מהרשימה");
      return;
    }
    if (tags.length === 0) {
      setError("יש להוסיף לפחות תגית אחת");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          tags,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "שגיאה ביצירת השאלה");
        return;
      }

      setTitle("");
      setContent("");
      setTags([]);
      setCurrentTag("");
      onQuestionCreated?.();
      onClose();
    } catch (err) {
      console.error("Error creating question:", err);
      setError("שגיאה בחיבור לשרת");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      e.preventDefault();
      const normalizedCurrentTag = normalizeTagName(currentTag);
      const exactMatch = tagMatches.find(
        (tag) => normalizeTagName(tag) === normalizedCurrentTag,
      );

      if (exactMatch) {
        handleTagAdd(exactMatch);
      } else if (normalizedCurrentTag) {
        setError("יש לבחור תגית קיימת מהרשימה");
      }
    }
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTag(e.target.value);
    setError(null);
  };

  const showContent = title.trim() !== "";
  const showTags = content.trim() !== "";

  const fetchSuggestions = useCallback(async () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (
      !showTags ||
      !shouldFetchSuggestedTags(trimmedTitle, trimmedContent) ||
      tags.length >= 5
    ) {
      suggestionAbortRef.current?.abort();
      setSuggestedTags([]);
      setLoadingSuggestions(false);
      return;
    }

    const requestId = suggestionRequestIdRef.current + 1;
    suggestionRequestIdRef.current = requestId;
    suggestionAbortRef.current?.abort();

    const controller = new AbortController();
    suggestionAbortRef.current = controller;

    setLoadingSuggestions(true);

    try {
      const res = await fetch("/api/questions/suggest-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          title: trimmedTitle,
          content: trimmedContent,
          excludeTags: tags,
        }),
      });

      const data = await res.json();

      if (requestId !== suggestionRequestIdRef.current) {
        return;
      }

      if (res.ok && Array.isArray(data.suggestions)) {
        setSuggestedTags(data.suggestions);
      } else {
        setSuggestedTags([]);
      }
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      setSuggestedTags([]);
    } finally {
      if (requestId === suggestionRequestIdRef.current) {
        setLoadingSuggestions(false);
      }

      if (suggestionAbortRef.current === controller) {
        suggestionAbortRef.current = null;
      }
    }
  }, [showTags, title, content, tags]);

  const fetchTagMatches = useCallback(async () => {
    const query = normalizeTagName(currentTag);
    if (!showTags || !query || tags.length >= 5) {
      setTagMatches([]);
      return;
    }

    try {
      const params = new URLSearchParams({
        query,
        exclude: tags.join(","),
      });
      const res = await fetch(`/api/tags?${params.toString()}`);
      const data = await res.json();

      if (res.ok && Array.isArray(data.tags)) {
        setTagMatches(data.tags);
      } else {
        setTagMatches([]);
      }
    } catch {
      setTagMatches([]);
    }
  }, [currentTag, showTags, tags]);

  useEffect(() => {
    if (!showTags) {
      suggestionAbortRef.current?.abort();
      setSuggestedTags([]);
      setLoadingSuggestions(false);
      return;
    }

    const t = setTimeout(fetchSuggestions, 600);

    return () => {
      clearTimeout(t);
      suggestionAbortRef.current?.abort();
    };
  }, [showTags, fetchSuggestions]);

  useEffect(() => {
    if (!isOpen) {
      suggestionAbortRef.current?.abort();
      setSuggestedTags([]);
      setLoadingSuggestions(false);
      suggestionRequestIdRef.current = 0;
    }
  }, [isOpen]);

  useEffect(() => {
    const query = normalizeTagName(currentTag);
    if (!query || !showTags) {
      setTagMatches([]);
      return;
    }

    const t = setTimeout(fetchTagMatches, 200);
    return () => clearTimeout(t);
  }, [currentTag, showTags, fetchTagMatches]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" dir="rtl">
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative min-h-full flex items-center justify-center p-4">
        <div className="relative bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[95vh] overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Form */}
          <div className="p-8 space-y-6 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                  <HelpCircle
                    className="text-indigo-600 dark:text-indigo-400"
                    size={24}
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    שאל שאלה חדשה
                  </h2>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="מהי שאלתך?"
                    className="w-full p-4 pl-20 text-base bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    maxLength={70}
                    autoFocus
                    required
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400 pointer-events-none">
                    {title.length}/70 תווים
                  </span>
                </div>
              </div>

              {/* Content - shows when title is filled */}
              <div
                className={`space-y-2 transition-all duration-500 ${showContent ? "opacity-100 max-h-96" : "opacity-0 max-h-0 overflow-hidden"}`}
              >
                <div className="relative">
                  <textarea
                    ref={contentRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="הסבר בפירוט את שאלתך..."
                    className="w-full h-36 p-4 pl-20 text-base bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors resize-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    maxLength={300}
                    disabled={!showContent}
                    required
                  />
                  <span className="absolute left-4 bottom-4 text-xs text-gray-500 dark:text-gray-400 pointer-events-none">
                    {content.length}/300 תווים
                  </span>
                </div>
              </div>

              {/* Tags - shows when content is filled */}
              <div
                className={`space-y-3 transition-all duration-500 ${showTags ? "opacity-100 max-h-96" : "opacity-0 max-h-0 overflow-hidden"}`}
              >
                <label className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                  <Hash
                    className="text-indigo-500 dark:text-indigo-400"
                    size={20}
                  />
                  תגיות (1-5)
                </label>
                <div className="flex flex-wrap items-center gap-2 p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-transparent transition-all">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="group flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 rounded-md font-semibold text-sm transition-all duration-300"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleTagRemove(tag)}
                        className="p-0.5 opacity-50 group-hover:opacity-100 hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-full transition-opacity"
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
                      placeholder="חפש תגית קיימת..."
                      className="flex-1 bg-transparent p-1.5 min-w-[150px] focus:outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                      disabled={!showTags}
                    />
                  )}
                </div>
                {currentTag.trim() && (
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
                    {tagMatches.length > 0 ? (
                      tagMatches.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleTagAdd(tag)}
                          className="w-full px-3 py-2 text-right text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          {tag}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                        לא נמצאו תגיות תואמות בקטלוג
                      </div>
                    )}
                  </div>
                )}
                {suggestedTags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {suggestedTags
                      .map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleTagAdd(tag)}
                          className="px-3 py-1 text-sm bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors border border-amber-200 dark:border-amber-700"
                        >
                          + {tag}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={
                    !title.trim() ||
                    !content.trim() ||
                    !!currentTag.trim() ||
                    tags.length === 0 ||
                    loading
                  }
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
