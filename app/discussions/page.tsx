 "use client";

import React, { useState } from "react";
import {
  MessageSquare,
  Home,
  Users,
  HelpCircle,
  BookOpen,
} from "lucide-react";
import Drawer from "../components/Drawer";
import NavHeader from "../components/NavHeader";
import { useAuth } from "../components/AuthProvider";

export default function DiscussionsPage() {
  const { user, profile, signOut } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const menuItems = [
    { label: "ראשי", icon: Home, href: "/" },
    { label: "סטטוסים", icon: Users, href: "/status" },
    { label: "דיונים", icon: MessageSquare, href: "/discussions", active: true },
    { label: "שאלות", icon: HelpCircle, href: "/questions" },
    { label: "סיפורים", icon: BookOpen, href: "/stories" },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="min-h-screen relative bg-slate-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100"
      dir="rtl"
      style={{ fontFamily: "Assistant, system-ui, sans-serif" }}
    >
      <NavHeader
        title="דיונים"
        wide
        onMenuClick={() => setIsDrawerOpen(!isDrawerOpen)}
      />

      <Drawer
        isDrawerOpen={isDrawerOpen}
        setIsDrawerOpen={setIsDrawerOpen}
        menuItems={menuItems}
        user={user}
        profile={profile}
        onSignOut={handleSignOut}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-5 py-6 sm:py-8">
        <section className="mb-6 flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50">
            <MessageSquare
              className="text-indigo-600 dark:text-indigo-300"
              size={20}
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              דיונים
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              כאן תוכל לפתוח ולהשתתף בדיונים פתוחים סביב נושאים שונים.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200/70 dark:border-gray-700/70 bg-white/80 dark:bg-gray-800/80 shadow-sm text-center py-12 px-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            הדף הזה עדיין בבנייה
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            בקרוב תוכל לפתוח נושאים, להגיב ולנהל שיחות עומק עם הקהילה.
          </p>
        </section>
      </main>
    </div>
  );
}

