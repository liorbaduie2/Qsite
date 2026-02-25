"use client";

import { useState, useEffect, useCallback } from "react";

type AuthMode = "login" | "register";

interface UseForcedAuthModalOptions {
  isGuest: boolean;
  authLoading: boolean;
  autoOpen?: boolean;
}

export function useForcedAuthModal({
  isGuest,
  authLoading,
  autoOpen = true,
}: UseForcedAuthModalOptions) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthMode>("login");

  useEffect(() => {
    if (!authLoading && isGuest && autoOpen) {
      setAuthModalMode("login");
      setIsAuthModalOpen(true);
    }
  }, [authLoading, isGuest, autoOpen]);

  const handleAuthAction = useCallback((mode: AuthMode) => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const modalProps = {
    isOpen: isAuthModalOpen,
    onClose: () => setIsAuthModalOpen(false),
    initialMode: authModalMode as AuthMode,
    canClose: !isGuest,
  };

  return {
    isAuthModalOpen,
    authModalMode,
    handleAuthAction,
    setIsAuthModalOpen,
    modalProps,
  };
}

