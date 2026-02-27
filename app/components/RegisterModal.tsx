"use client";

import React from "react";
import HebrewRegistration from "./HebrewRegistration";
import { getTimeBasedGreeting } from "../utils/timeGreeting";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
  /** When false, hide the X close button (e.g. when opened from login on Questions/Chat/Status). Default true */
  canClose?: boolean;
}

export default function RegisterModal({
  isOpen,
  onClose,
  onSwitchToLogin,
  canClose = true,
}: RegisterModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6"
      onClick={canClose ? onClose : undefined}
    >
      <div
        className="w-full max-w-2xl max-h-[95vh] overflow-y-auto relative modal-scroll"
        onClick={(e) => e.stopPropagation()}
      >
        {canClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-5 z-20 p-2 flex items-center justify-center text-white hover:text-white/80 transition-colors"
            style={{ direction: "ltr" }}
            aria-label="סגור"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-gray-700/20">
          <div
            className="text-center p-8 text-white relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
            }}
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16" />
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12" />
            </div>

            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-3 drop-shadow-lg">
                הצטרפות לקהילה
              </h2>
              <p className="text-white/90 text-lg font-medium">
                {getTimeBasedGreeting()}, ברוך הבא!
              </p>
            </div>
          </div>

          <div className="p-8 bg-gray-50/50 dark:bg-gray-900/50">
            <HebrewRegistration onComplete={onClose} />

            <div className="mt-8 text-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300/60 dark:border-gray-600/60" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gray-50/50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 font-medium">
                    או
                  </span>
                </div>
              </div>

              <p
                className="mt-6 text-sm text-gray-600 dark:text-gray-400"
                dir="rtl"
              >
                יש לך כבר חשבון?{" "}
                <button
                  onClick={onSwitchToLogin}
                  className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold transition-colors duration-200 hover:underline"
                >
                  התחבר כאן
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
