'use client';

import React from 'react';
import { Menu } from 'lucide-react';

interface NavHeaderProps {
  title: string;
  onMenuClick: () => void;
  rightContent?: React.ReactNode;
  topContent?: React.ReactNode;
  /** When provided, rendered in place of the title string (e.g. avatar + name) */
  titleContent?: React.ReactNode;
  wide?: boolean;
}

/**
 * Shared navigation header matching the Status page design.
 * Use across all pages for consistent "תפריט ניווט" experience.
 */
export default function NavHeader({ title, onMenuClick, rightContent, topContent, titleContent, wide }: NavHeaderProps) {
  return (
    <header className="relative bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl shadow-xl border-b border-gray-200/20 dark:border-gray-700/50">
      {topContent}
      <div className={`mx-auto px-5 ${wide ? 'max-w-6xl' : 'max-w-4xl'}`}>
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onMenuClick}
              className="p-2 rounded-lg hover:bg-gray-100/60 dark:hover:bg-gray-700/60 transition-all duration-300 text-gray-800 dark:text-gray-100"
              aria-label="תפריט ניווט"
            >
              <Menu size={20} />
            </button>
            {titleContent != null ? (
              <div className="flex items-center gap-3 min-w-0">
                {titleContent}
              </div>
            ) : (
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {title}
              </h1>
            )}
          </div>
          {rightContent && <div className="flex items-center gap-4">{rightContent}</div>}
        </div>
      </div>
    </header>
  );
}
