'use client';

import { useAuth } from '@/app/components/AuthProvider';
import LoginStatusMessage from '@/app/components/LoginStatusMessage';
import Link from 'next/link';
import { Clock } from 'lucide-react';

export default function PendingPage() {
  const { signOut } = useAuth();

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10" dir="rtl">
      <div className="w-full max-w-md">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-slate-700/50 p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
              <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              הבקשה שלך ממתינה לאישור
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              חשבונך נוצר בהצלחה. מנהל הקהילה יבדוק את הבקשה וישלח לך אימייל כשיאושר.
            </p>
          </div>

          <LoginStatusMessage
            status="pending"
            message="הבקשה שלך נשלחה למערכת. תקבל הודעה במייל כשהחשבון יאושר. זמן האישור הממוצע: 24-48 שעות בימי עסקים."
            className="mb-6"
          />

          <div className="space-y-4">
            <button
              onClick={() => signOut()}
              className="w-full py-3 px-4 rounded-xl border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              התנתק
            </button>
            <Link
              href="/"
              className="block w-full py-3 px-4 rounded-xl text-center border-2 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
            >
              חזרה לדף הבית
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
