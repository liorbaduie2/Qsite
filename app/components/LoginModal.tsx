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
      className="fixed inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6"
      onClick={canClose ? handleClose : undefined}
    >
      <div
        className="w-full max-w-2xl max-h-[95vh] overflow-y-auto relative modal-scroll"
        onClick={(e) => e.stopPropagation()}
      >
        {canClose && (
          <button
            onClick={handleClose}
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

        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-gray-700/50">
          <div
            className="text-center p-8 text-white relative overflow-hidden"
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
              <h2 className="text-4xl font-bold mb-3 drop-shadow-lg">
                התחברות לחשבון
              </h2>
              <p className="text-white/90 text-lg font-medium">
                {getTimeBasedGreeting()}, ברוך שובך!
              </p>
            </div>
          </div>

          <div
            className="p-8 bg-gradient-to-br from-gray-50/50 to-white/50 dark:from-gray-900/80 dark:to-gray-800/80"
            dir="rtl"
          >
            {/* Show auth status messages prominently */}
            <AuthStatusDisplay className="mb-6" />

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300/60 dark:border-gray-600/60 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm transition-all duration-300 shadow-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
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
                  className="w-full px-4 py-3 border border-gray-300/60 dark:border-gray-600/60 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm transition-all duration-300 shadow-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
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
                    ? "w-full py-4 px-6 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed bg-purple-600 dark:bg-purple-600 hover:bg-purple-700 dark:hover:bg-purple-500"
                    : "w-full py-4 px-6 font-bold rounded-xl transition-all duration-300 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
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

            <div className="mt-8 text-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300/60 dark:border-gray-600/60"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gradient-to-br from-gray-50/50 to-white/50 dark:from-gray-900/80 dark:to-gray-800/80 text-gray-600 dark:text-gray-400 font-medium">
                    או
                  </span>
                </div>
              </div>

              <p className="mt-6 text-sm text-gray-600 dark:text-gray-400">
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
