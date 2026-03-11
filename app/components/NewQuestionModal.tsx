"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Send } from "lucide-react";
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
  const [tagMatches, setTagMatches] = useState<string[]>([]);

  // Refs for focus management
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const suggestionAbortRef = useRef<AbortController | null>(null);
  const suggestionRequestIdRef = useRef(0);
  const shownSuggestedTagsRef = useRef<Set<string>>(new Set());
  const acceptedSuggestedTagsRef = useRef<Set<string>>(new Set());

  const handleTagAdd = (
    tagText: string,
    source: "manual" | "suggestion" = "manual",
  ): void => {
    const trimmedTag = normalizeTagName(tagText);
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      if (source === "suggestion") {
        acceptedSuggestedTagsRef.current.add(trimmedTag);
      }
      setTags([...tags, trimmedTag]);
      setCurrentTag("");
      setTagMatches([]);
      setError(null);
    }
  };

  const handleTagRemove = (tagToRemove: string): void => {
    acceptedSuggestedTagsRef.current.delete(normalizeTagName(tagToRemove));
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
          tagSuggestionContext: {
            shownSuggestedTags: Array.from(shownSuggestedTagsRef.current),
            acceptedSuggestedTags: tags.filter((tag) =>
              acceptedSuggestedTagsRef.current.has(normalizeTagName(tag)),
            ),
          },
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
      shownSuggestedTagsRef.current = new Set();
      acceptedSuggestedTagsRef.current = new Set();
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
        handleTagAdd(exactMatch, "manual");
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
  const showTags = showContent && content.trim() !== "";

  const resetSuggestionState = useCallback(() => {
    suggestionAbortRef.current?.abort();
    setSuggestedTags([]);
  }, []);

  const fetchSuggestions = useCallback(async () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (
      !isOpen ||
      !showTags ||
      !shouldFetchSuggestedTags(trimmedTitle, trimmedContent) ||
      tags.length >= 5
    ) {
      resetSuggestionState();
      return;
    }

    const requestId = suggestionRequestIdRef.current + 1;
    suggestionRequestIdRef.current = requestId;
    suggestionAbortRef.current?.abort();

    const controller = new AbortController();
    suggestionAbortRef.current = controller;

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
        const nextSuggestions = data.suggestions
          .map((tag: string) => normalizeTagName(tag))
          .filter(Boolean)
          .slice(0, 5);
        nextSuggestions.forEach((tag: string) =>
          shownSuggestedTagsRef.current.add(tag),
        );
        setSuggestedTags(nextSuggestions);
      } else {
        setSuggestedTags([]);
      }
    } catch {
      if (controller.signal.aborted) {
        return;
      }

      setSuggestedTags([]);
    } finally {
      if (suggestionAbortRef.current === controller) {
        suggestionAbortRef.current = null;
      }
    }
  }, [isOpen, showTags, title, content, tags, resetSuggestionState]);

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
    if (!isOpen) {
      resetSuggestionState();
      setTagMatches([]);
      suggestionRequestIdRef.current = 0;
      shownSuggestedTagsRef.current = new Set();
      acceptedSuggestedTagsRef.current = new Set();
      return;
    }

    if (!showTags || tags.length >= 5) {
      resetSuggestionState();
      return;
    }

    const t = setTimeout(fetchSuggestions, 300);

    return () => {
      clearTimeout(t);
      suggestionAbortRef.current?.abort();
    };
  }, [isOpen, showTags, tags.length, fetchSuggestions, resetSuggestionState]);

  useEffect(() => {
    if (!isOpen) {
      setTagMatches([]);
      return;
    }

    const query = normalizeTagName(currentTag);
    if (!query || !showTags) {
      setTagMatches([]);
      return;
    }

    const t = setTimeout(fetchTagMatches, 200);
    return () => clearTimeout(t);
  }, [isOpen, currentTag, showTags, fetchTagMatches]);

  if (!isOpen) return null;

  const fieldBox =
    "bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl border border-gray-200/80 dark:border-gray-600/60 shadow-sm focus-within:ring-2 focus-within:ring-indigo-400/50 focus-within:border-indigo-300 dark:focus-within:border-indigo-500 transition-all";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" dir="rtl">
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative min-h-full flex items-center justify-center p-4 py-8">
        <form
          onSubmit={handleSubmit}
          className="relative w-full max-w-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
        >
          {/* Title - floating field */}
          <div className={`relative ${fieldBox}`}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="מהי שאלתך?"
              className="w-full p-4 pe-20 text-base bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              maxLength={70}
              autoFocus
              required
            />
            <span className="absolute end-4 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400 pointer-events-none">
              {title.length}/70 תווים
            </span>
          </div>

          {/* Content - shows when title is filled */}
          <div
            className={`transition-all duration-500 ${showContent ? "opacity-100 max-h-96" : "opacity-0 max-h-0 overflow-hidden"}`}
          >
            <div className={`relative ${fieldBox}`}>
              <textarea
                ref={contentRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="הסבר בפירוט את שאלתך..."
                className="w-full h-36 p-4 pe-20 text-base bg-transparent border-none outline-none resize-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                maxLength={300}
                disabled={!showContent}
                required
              />
              <span className="absolute end-4 bottom-4 text-xs text-gray-500 dark:text-gray-400 pointer-events-none">
                {content.length}/300 תווים
              </span>
            </div>
          </div>

          {/* Tags - shows when content is filled */}
          <div
            className={`transition-all duration-500 ${showTags ? "opacity-100 max-h-96" : "opacity-0 max-h-0 overflow-hidden"}`}
          >
            <div
              className={`flex flex-wrap items-center gap-2 p-3 ${fieldBox}`}
            >
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
              <div className="mt-2 rounded-xl border border-gray-200/80 dark:border-gray-600/60 bg-white/95 dark:bg-gray-800/95 overflow-hidden shadow-sm">
                {tagMatches.length > 0 ? (
                  tagMatches.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagAdd(tag, "manual")}
                      className="w-full px-3 py-2 text-right text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-50/80 dark:hover:bg-gray-700/80 transition-colors"
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
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {suggestedTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagAdd(tag, "suggestion")}
                    className="px-3 py-1 text-sm bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors border border-amber-200 dark:border-amber-700"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50/90 dark:bg-red-900/20 border border-red-200/80 dark:border-red-800/60 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Actions - no box */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
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
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  שולח...
                </>
              ) : (
                <>
                  <Send size={18} />
                  פרסם שאלה
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
