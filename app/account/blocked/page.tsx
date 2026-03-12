"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Lock, LogOut, Send } from "lucide-react";
import { useAuth } from "@/app/components/AuthProvider";

export default function BlockedAccountPage() {
  const router = useRouter();
  const { user, profile, accountState, signOut, loading } = useAuth();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    if (accountState !== "blocked") {
      router.replace("/");
    }
  }, [loading, user, accountState, router]);

  const handleSubmitAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      setError("נא להזין הודעת ערעור");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/appeals/blocked-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "שגיאה בשליחת הערעור");
        return;
      }
      setSubmitted(true);
      setMessage("");
    } catch {
      setError("שגיאה בחיבור לשרת");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.replace("/auth/login");
  };

  if (loading || !user || accountState !== "blocked") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">טוען חשבון...</p>
        </div>
      </div>
    );
  }

  const reputation = profile?.reputation ?? 0;

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 p-4"
      dir="rtl"
    >
      <div className="w-full max-w-lg">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 dark:border-slate-700/70 p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center shadow-lg">
                <Lock className="w-9 h-9 text-white" />
              </div>
              <div className="absolute -bottom-2 -left-2 w-7 h-7 rounded-full bg-red-600 flex items-center justify-center border-2 border-white dark:border-slate-900">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 text-center mb-3">
            החשבון שלך חסום
          </h1>
          <p className="text-sm text-slate-700 dark:text-slate-300 text-center mb-6 leading-relaxed">
            החשבון שלך נחסם ולא ניתן לגשת לאתר. כל התוכן שלך מוסתר באופן זמני.
            ניתן להגיש ערעור כאן ולבקש שחזור.
          </p>

          {reputation === 0 && (
            <div className="rounded-2xl border border-amber-200/80 dark:border-amber-700/60 bg-amber-50/80 dark:bg-amber-900/20 p-4 mb-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
                    מוניטין נוכחי
                  </p>
                  <p className="text-3xl font-black text-red-600 dark:text-red-400">
                    {reputation}
                  </p>
                </div>
                <div className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed max-w-[200px]">
                  המוניטין שלך הגיע ל-0. כדי לשחזר את החשבון, מנהל צריך להעלות
                  את המוניטין שלך.
                </div>
              </div>
            </div>
          )}

          {submitted ? (
            <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 mb-6 text-center text-green-800 dark:text-green-200 text-sm">
              הערעור נשלח בהצלחה. צוות הניהול יבדוק אותו בהקדם.
            </div>
          ) : (
            <form onSubmit={handleSubmitAppeal} className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                הודעת ערעור
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="הסבר את עמדתך ובקש בדיקה מחודשת..."
                rows={4}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400"
                disabled={submitting}
              />
              {error && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
              <button
                type="submit"
                disabled={submitting || !message.trim()}
                className="mt-3 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors shadow-lg shadow-indigo-500/30"
              >
                <Send className="w-4 h-4" />
                {submitting ? "שולח..." : "שלח ערעור"}
              </button>
            </form>
          )}

          <div className="space-y-3">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              התנתק מהחשבון
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
