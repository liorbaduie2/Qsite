// components/LoginModal.tsx
"use client";

import React, { useState } from "react";
import { useAuth } from "./AuthProvider";
import AuthStatusDisplay from "./AuthStatusDisplay";
import { getTimeBasedGreeting } from "../utils/timeGreeting";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
  /** When false, user cannot close the modal (e.g. forced auth on restricted page). Default true */
  canClose?: boolean;
}

const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSwitchToRegister,
  canClose = true,
}) => {
  const { signIn, loading, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signIn(email, password);

    // Close modal only on successful authentication
    if (!result.error && result.data.user) {
      handleClose();
    }

    // Any errors or approval issues are shown via AuthStatusDisplay
  };

  const handleClose = () => {
    setEmail("");
    setPassword("");
    onClose();
  };

  const handleSwitchToRegister = () => {
    handleClose();
    onSwitchToRegister();
  };

  // Never render the login modal for an already authenticated user
  if (!isOpen || user) return null;

  const hasEmail = email.trim().length > 0;
  const hasPassword = password.length > 0;
  const isFormReady = hasEmail && hasPassword;
  const isSubmitDisabled = loading || !isFormReady;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-y-contain bg-black/50 dark:bg-black/60 backdrop-blur-sm px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-6 sm:pt-6 sm:pb-6"
      onClick={canClose ? handleClose : undefined}
    >
      <div
        className="relative my-auto w-full min-h-0 max-w-2xl max-h-[92dvh] overflow-y-auto modal-scroll sm:max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {canClose && (
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 z-20 flex items-center justify-center p-1.5 text-white transition-colors hover:text-white/80 sm:top-4 sm:right-5 sm:p-2"
            style={{ direction: "ltr" }}
            aria-label="סגור"
          >
            <svg
              className="h-5 w-5 sm:h-6 sm:w-6"
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

        <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/95 sm:rounded-3xl">
          <div
            className="relative overflow-hidden px-4 pb-4 pt-5 text-center text-white sm:p-8"
            style={{
              background:
                "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
            }}
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12"></div>
            </div>

            <div className="relative z-10">
              <h2 className="mb-2 text-2xl font-bold drop-shadow-lg sm:mb-3 sm:text-4xl">
                התחברות לחשבון
              </h2>
              <p className="text-base font-medium text-white/90 sm:text-lg">
                {getTimeBasedGreeting()}, ברוך שובך!
              </p>
            </div>
          </div>

          <div
            className="bg-gradient-to-br from-gray-50/50 to-white/50 px-4 py-5 dark:from-gray-900/80 dark:to-gray-800/80 sm:p-8"
            dir="rtl"
          >
            {/* Show auth status messages prominently */}
            <AuthStatusDisplay className="mb-4 sm:mb-6" />

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-300/60 bg-white/80 px-3 py-2.5 text-gray-900 shadow-sm backdrop-blur-sm transition-all duration-300 placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-gray-600/60 dark:bg-gray-700/80 dark:text-gray-100 dark:placeholder-gray-400 sm:px-4 sm:py-3"
                  dir="ltr"
                  required
                  placeholder="כתובת דואר אלקטרוני"
                  style={{ textAlign: "right" }}
                />
              </div>

              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-300/60 bg-white/80 px-3 py-2.5 text-gray-900 shadow-sm backdrop-blur-sm transition-all duration-300 placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-gray-600/60 dark:bg-gray-700/80 dark:text-gray-100 dark:placeholder-gray-400 sm:px-4 sm:py-3"
                  dir="ltr"
                  required
                  placeholder="הסיסמה"
                  style={{ textAlign: "right" }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitDisabled}
                className={
                  isFormReady
                    ? "w-full rounded-xl bg-purple-600 px-4 py-3 text-base font-bold text-white shadow-lg transition-all duration-300 hover:bg-purple-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 dark:bg-purple-600 dark:hover:bg-purple-500 sm:px-6 sm:py-4"
                    : "w-full cursor-not-allowed rounded-xl bg-gray-300 px-4 py-3 text-base font-bold text-gray-500 transition-all duration-300 dark:bg-gray-600 dark:text-gray-400 sm:px-6 sm:py-4"
                }
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    מתחבר...
                  </div>
                ) : (
                  "התחבר לחשבון"
                )}
              </button>
            </form>

            <div className="mt-5 text-center sm:mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300/60 dark:border-gray-600/60"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-gradient-to-br from-gray-50/50 to-white/50 px-3 font-medium text-gray-600 dark:from-gray-900/80 dark:to-gray-800/80 dark:text-gray-400 sm:px-4">
                    או
                  </span>
                </div>
              </div>

              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 sm:mt-6">
                אין לך חשבון?{" "}
                <button
                  onClick={handleSwitchToRegister}
                  className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold transition-colors duration-200 hover:underline"
                >
                  הירשם כאן
                </button>
              </p>

              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                שכחת סיסמה?{" "}
                <button className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors duration-200">
                  אפס סיסמה
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
