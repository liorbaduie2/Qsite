"use client";

import React from "react";
import { Menu } from "lucide-react";

interface NavHeaderProps {
  title: string;
  onMenuClick: () => void;
  rightContent?: React.ReactNode;
  topContent?: React.ReactNode;
  /** When provided, rendered in place of the title string (e.g. avatar + name) */
  titleContent?: React.ReactNode;
  wide?: boolean;
  /** Hide the menu control below md (e.g. home page uses bottom nav menu on mobile). */
  hideMenuOnMobile?: boolean;
}

/**
 * Shared navigation header matching the Status page design.
 * Use across all pages for consistent "תפריט ניווט" experience.
 */
export default function NavHeader({
  title,
  onMenuClick,
  rightContent,
  topContent,
  titleContent,
  wide,
  hideMenuOnMobile,
}: NavHeaderProps) {
  return (
    <header className="relative bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl shadow-xl border-b border-gray-200/20 dark:border-gray-700/50">
      {topContent}
      <div
        className={`mx-auto px-4 sm:px-5 ${wide ? "max-w-6xl" : "max-w-4xl"}`}
      >
        <div className="flex items-center gap-2 h-20">
          <div
            className={`flex items-center gap-2 sm:gap-4 ${hideMenuOnMobile ? "max-md:hidden" : ""}`}
          >
            <button
              type="button"
              onClick={onMenuClick}
              className="p-2 rounded-lg hover:bg-gray-100/60 dark:hover:bg-gray-700/60 transition-all duration-300 text-gray-800 dark:text-gray-100"
              aria-label="תפריט ניווט"
            >
              <Menu size={20} />
            </button>
          </div>
          <div className="flex-1 flex justify-center min-w-0">
            {titleContent != null && (
              <div className="flex items-center gap-3 min-w-0">
                {titleContent}
              </div>
            )}
          </div>
          {rightContent && (
            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-4 min-w-0 shrink-0">
              {rightContent}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
