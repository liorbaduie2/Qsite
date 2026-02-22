'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { User, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import { SimpleThemeToggle } from '../components/SimpleThemeToggle';

type BlockedEntry = {
  blocked_id: string;
  created_at: string;
  profile: { id: string; username: string; full_name: string | null; avatar_url: string | null };
};

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [blocked, setBlocked] = useState<BlockedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const fetchBlocked = useCallback(async () => {
    if (!user) {
      setBlocked([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/chat/blocked');
      const data = await res.json();
      if (res.ok) setBlocked(data.blocked || []);
    } catch {
      setBlocked([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBlocked();
  }, [fetchBlocked]);

  const handleUnblock = async (userId: string) => {
    setUnblockingId(userId);
    try {
      const res = await fetch(`/api/chat/blocked/${userId}`, { method: 'DELETE' });
      if (res.ok) await fetchBlocked();
    } finally {
      setUnblockingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex justify-between items-center mb-8 gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors flex-shrink-0"
          >
            <ArrowRight size={20} />
            <span>חזור</span>
          </Link>
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">הגדרות</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">נהל את ההעדפות שלך</p>
          </div>
          <SimpleThemeToggle />
        </div>

        {user && (
          <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
              <Shield size={20} className="text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">משתמשים חסומים</h2>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400" />
                </div>
              ) : blocked.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">אין משתמשים חסומים</p>
              ) : (
                <ul className="space-y-3">
                  {blocked.map((b) => (
                    <li
                      key={b.blocked_id}
                      className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"
                    >
                      {b.profile.avatar_url ? (
                        <Image
                          src={b.profile.avatar_url}
                          alt=""
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center">
                          <User size={20} className="text-indigo-700 dark:text-indigo-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 dark:text-gray-100 truncate">
                          {b.profile.full_name || b.profile.username}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">@{b.profile.username}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnblock(b.blocked_id)}
                        disabled={unblockingId === b.blocked_id}
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                      >
                        {unblockingId === b.blocked_id ? 'מסיר...' : 'הסר חסימה'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
