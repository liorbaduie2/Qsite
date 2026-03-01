"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/components/AuthProvider";
import { FileQuestion, ArrowRight } from "lucide-react";

function AppealQuestionDeletionContent() {
  const searchParams = useSearchParams();
  const activityLogId = searchParams.get("activity_log_id") ?? "";
  const { user, loading: authLoading } = useAuth();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      setError("יש להתחבר כדי להגיש ערעור");
    }
  }, [user, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityLogId.trim() || !message.trim()) {
      setError("נא לכתוב את עמדתך");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/appeals/question-deletion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activity_log_id: activityLogId.trim(), message: message.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "שגיאה בשליחת הערעור");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("שגיאה בחיבור לשרת");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900" dir="rtl">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 text-center">
          <p className="text-slate-600 dark:text-slate-300 mb-4">{error}</p>
          <Link href="/" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
            חזרה לדף הבית
          </Link>
        </div>
      </div>
    );
  }

  if (!activityLogId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900" dir="rtl">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 text-center">
          <FileQuestion className="w-12 h-12 mx-auto text-slate-400 mb-4" />
          <p className="text-slate-600 dark:text-slate-300 mb-4">קישור לא תקין. נא להגיש ערעור מההתראה על הסרת השאלה.</p>
          <Link href="/" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
            חזרה לדף הבית
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900" dir="rtl">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 text-center">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">הערעור נשלח</h1>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            בקשתך נשלחה. רק בעלים יכול לאשר או לדחות ערעור. תקבל הודעה כשההחלטה תתקבל.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
          >
            חזרה לדף הבית
            <ArrowRight className="w-4 h-4 rotate-180" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900" dir="rtl">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">ערעור על הסרת שאלה</h1>
        <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">
          הסבר מדוע לדעתך השאלה לא הייתה צריכה להימחק. הערעור ייבחן על ידי בעלים האתר.
        </p>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">עמדתך (חובה)</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full min-h-[120px] px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 resize-y"
            placeholder="הסבר את עמדתך..."
            required
          />
          {error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <div className="mt-4 flex gap-3 justify-end">
            <Link
              href="/"
              className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-500"
            >
              ביטול
            </Link>
            <button
              type="submit"
              disabled={submitting || !message.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "שולח..." : "שלח ערעור"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AppealQuestionDeletionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
      }
    >
      <AppealQuestionDeletionContent />
    </Suspense>
  );
}
