// app/settings/page.tsx - SIMPLIFIED
'use client';

import { SimpleThemeToggle } from '../components/SimpleThemeToggle';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">הגדרות</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">נהל את ההעדפות שלך</p>
          </div>
          <SimpleThemeToggle />
        </div>
      </div>
    </div>
  );
}