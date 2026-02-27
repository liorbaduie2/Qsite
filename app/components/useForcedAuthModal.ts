"use client";

import { useState, useEffect, useCallback } from "react";

type AuthMode = "login" | "register";

interface UseForcedAuthModalOptions {
  isGuest: boolean;
  authLoading: boolean;
  autoOpen?: boolean;
}

/** Returns state for index-style LoginModal + RegisterModal (same layout as index). */
export function useForcedAuthModal({
  isGuest,
  authLoading,
  autoOpen = true,
}: UseForcedAuthModalOptions) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && isGuest && autoOpen) {
      setIsLoginModalOpen(true);
      setIsRegisterModalOpen(false);
    }
  }, [authLoading, isGuest, autoOpen]);

  const handleAuthAction = useCallback((mode: AuthMode) => {
    if (mode === "login") {
      setIsRegisterModalOpen(false);
      setIsLoginModalOpen(true);
    } else {
      setIsLoginModalOpen(false);
      setIsRegisterModalOpen(true);
    }
  }, []);

  const closeLogin = useCallback(() => setIsLoginModalOpen(false), []);
  const closeRegister = useCallback(() => setIsRegisterModalOpen(false), []);

  return {
    isLoginModalOpen,
    isRegisterModalOpen,
    setIsLoginModalOpen,
    setIsRegisterModalOpen,
    handleAuthAction,
    closeLogin,
    closeRegister,
    canClose: !isGuest,
  };
}

