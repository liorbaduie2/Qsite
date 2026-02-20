'use client';

import { useState } from 'react';
import { useAuth } from '@/app/components/AuthProvider';
import AuthStatusDisplay from '@/app/components/AuthStatusDisplay';
import Link from 'next/link';

export default function LoginPage() {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn(email, password);
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-slate-700/50 p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              התחברות לחשבון
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              היכנס עם החשבון שלך
            </p>
          </div>

          <AuthStatusDisplay className="mb-6" />

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                כתובת אימייל
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                dir="ltr"
                required
                placeholder="הזן את האימייל שלך"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                סיסמה
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                dir="ltr"
                required
                placeholder="הזן את הסיסמה שלך"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed button-gradient"
            >
              {loading ? 'מתחבר...' : 'התחבר לחשבון'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <Link href="/auth/forgot-password" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                שכחת סיסמה?
              </Link>
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              אין לך חשבון?{' '}
              <Link href="/" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                הירשם כאן
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
