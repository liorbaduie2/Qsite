"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Lock, LogOut, Mail } from "lucide-react";
import { useAuth } from "@/app/components/AuthProvider";

export default function BlockedAccountPage() {
  const router = useRouter();
  const { user, profile, loginStatus, signOut, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    // If user is not signed in or cannot login, send them to login.
    if (!user || (loginStatus && !loginStatus.can_login)) {
      router.replace("/auth/login");
      return;
    }
  }, [loading, user, loginStatus, router]);

  if (loading || !user || (loginStatus && !loginStatus.can_login)) {
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

  const handleAppeal = () => {
    const subject = encodeURIComponent("בקשת בדיקה על חסימת מוניטין");
    const body = encodeURIComponent(
      `שלום,\n\nנראה שהחשבון שלי נחסם עקב מוניטין 0.\n\nפרטים:\n- מזהה משתמש: ${user.id}\n- שם משתמש: ${
        profile?.username ?? ""
      }\n- מוניטין נוכחי: ${reputation}\n\nאשמח לבדיקה מחודשת והבהרה.\n\nתודה רבה.`
    );
    window.location.href = `mailto:support@example.com?subject=${subject}&body=${body}`;
  };

  const handleLogout = async () => {
    await signOut();
    router.replace("/auth/login");
  };

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
            החשבון שלך הושעה בגלל מוניטין 0
          </h1>
          <p className="text-sm text-slate-700 dark:text-slate-300 text-center mb-6 leading-relaxed">
            כדי להגן על הקהילה, חשבונות שמגיעים למוניטין 0 מושעים באופן מלא:
            אי אפשר להתחבר, לשאול שאלות, לענות, להגיב או לבצע כל פעולה
            אינטראקטיבית באתר עד שהמוניטין יעלה מחדש על ידי מנהל.
          </p>

          <div className="rounded-2xl border border-amber-200/80 dark:border-amber-700/60 bg-amber-50/80 dark:bg-amber-900/20 p-4 mb-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
                  פרטי החשבון שלך
                </p>
                <p className="text-xs text-amber-800/90 dark:text-amber-200/80">
                  שם משתמש:{" "}
                  <span className="font-semibold">
                    {profile?.username ?? "לא ידוע"}
                  </span>
                  {" · "}
                  מוניטין נוכחי:{" "}
                  <span className="font-semibold">{reputation}</span>
                </p>
              </div>
              <div className="shrink-0 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-xs font-bold text-amber-900 dark:text-amber-100">
                חסימת מוניטין
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleAppeal}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 px-4 transition-colors shadow-md hover:shadow-lg"
            >
              <Mail className="w-5 h-5" />
              שלח בקשת בדיקה לצוות
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-semibold py-3.5 px-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              התנתק מהחשבון
            </button>
          </div>

          <p className="mt-5 text-xs text-center text-slate-500 dark:text-slate-400">
            אם לדעתך מדובר בטעות, אנא פרט/י כמה שיותר מידע רלוונטי בבקשת
            הבדיקה כדי שנוכל לעזור במהירות.
          </p>
        </div>
      </div>
    </div>
  );
}

