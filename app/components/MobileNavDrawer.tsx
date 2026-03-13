"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  X,
  LucideIcon,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Minus,
  Swords,
  Moon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ReputationArc } from "@/app/components/ReputationArc";
import { useAuth } from "@/app/components/AuthProvider";
import { useNotificationsRealtime } from "@/app/hooks/useNotificationsRealtime";
import { usePresenceTick } from "@/app/hooks/usePresenceTick";
import { createClient } from "@/lib/supabase/client";

interface MenuItem {
  label: string;
  icon: LucideIcon;
  href: string;
  active?: boolean;
}

interface Profile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  reputation?: number;
  is_moderator?: boolean;
  last_seen_at?: string | null;
}

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  user?: { id: string; email?: string } | null;
  profile?: Profile | null;
  onSignOut?: () => void;
  onOpenLoginModal?: () => void;
  headerExtra?: React.ReactNode;
}

export function MobileNavDrawer({
  isOpen,
  onClose,
  menuItems,
  user,
  profile,
  onSignOut,
  onOpenLoginModal,
  headerExtra,
}: MobileNavDrawerProps) {
  usePresenceTick();
  const router = useRouter();
  const { userPermissions } = useAuth();
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch("/api/chat/unread-count");
      const data = await res.json();
      if (res.ok && typeof data.count === "number")
        setChatUnreadCount(data.count);
    } catch {
      // ignore
    }
  }, [user?.id]);

  useNotificationsRealtime(user?.id);

  useEffect(() => {
    if (!user?.id) {
      setChatUnreadCount(0);
      return;
    }
    fetchUnreadCount();
  }, [user?.id, fetchUnreadCount]);

  useEffect(() => {
    if (user?.id && isOpen) {
      fetchUnreadCount();
    }
  }, [user?.id, isOpen, fetchUnreadCount]);

  useEffect(() => {
    if (!user?.id) return;
    const supabase = createClient();
    const channel = supabase
      .channel("mobile-nav-drawer-chat-unread")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        () => fetchUnreadCount(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchUnreadCount]);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => document.body.classList.remove("modal-open");
  }, [isOpen]);

  const handleMenuClick = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div
      className={`fixed inset-0 z-[60] transition-opacity duration-300 md:hidden flex flex-col justify-end ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Invisible backdrop - tap to close, no darkening */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden />

      {/* Bottom sheet panel */}
      <div
        className={`relative mx-auto w-[92%] max-w-md max-h-[70dvh] bg-white dark:bg-[#0B1221] text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 rounded-[2rem] shadow-2xl transform transition-transform duration-300 ease-out flex flex-col mb-[7rem] ${
          isOpen ? "translate-y-0 scale-100" : "translate-y-12 scale-95"
        }`}
        style={{ direction: "rtl" }}
      >
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 flex flex-col">
          {/* Header with theme toggle and close - close to PFP */}
          <div className="flex items-center justify-between mb-0">
            <div className="flex items-center justify-center">
              {headerExtra ? (
                headerExtra
              ) : (
                <div className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 dark:border-white/20">
                  <Moon size={20} className="text-gray-600 dark:text-white" />
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
              aria-label="סגור"
            >
              <X size={28} />
            </button>
          </div>

          {/* User Section - same structure as profile page */}
          <div className="flex flex-col items-center mb-4">
            {user ? (
              <>
                <div className="relative mb-1">
                  {/* PFP circle - matches profile page: outer ring + ReputationArc + inner image */}
                  <div
                    className="relative rounded-full p-1 bg-white dark:bg-[#0B1221] border border-gray-200 dark:border-white/20"
                    style={{ width: 132, height: 132 }}
                  >
                    <div className="absolute inset-1">
                      <ReputationArc
                        value={profile?.reputation ?? 0}
                        size={124}
                      />
                    </div>
                    <div className="absolute inset-4 flex items-center justify-center">
                      {profile?.avatar_url ? (
                        <Image
                          src={profile.avatar_url}
                          alt={profile?.username || ""}
                          width={96}
                          height={96}
                          className="w-[100px] h-[100px] rounded-full object-cover border-4 border-white dark:border-[#0B1221] shadow-sm"
                        />
                      ) : (
                        <div className="w-[100px] h-[100px] bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-full flex items-center justify-center border-4 border-white dark:border-[#0B1221] shadow-sm">
                          <span className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                            {profile?.username
                              ? profile.username.charAt(0).toUpperCase()
                              : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <h2 className="text-[1.75rem] font-bold text-gray-900 dark:text-white tracking-wide">
                  {profile?.full_name || profile?.username || "משתמש"}
                </h2>
                {userPermissions?.role &&
                  userPermissions.role !== "user" &&
                  !userPermissions.is_hidden && (
                    <div className="mt-0.5 flex justify-center">
                      <div className="whitespace-nowrap bg-white dark:bg-[#0B1221] border border-gray-200 dark:border-white/20 text-gray-700 dark:text-white px-3 py-0.5 rounded-full flex items-center gap-1.5 text-xs shadow-sm">
                        <Swords size={12} />
                        <span>{userPermissions.role_hebrew || "משתמש"}</span>
                      </div>
                    </div>
                  )}
              </>
            ) : (
              <div className="py-2 flex flex-col items-center">
                <div
                  className="relative rounded-full p-1 bg-white dark:bg-[#0B1221] border border-gray-200 dark:border-white/20 shadow-sm"
                  style={{ width: 132, height: 132 }}
                >
                  <div className="absolute inset-4 flex items-center justify-center">
                    <div className="w-[100px] h-[100px] bg-gray-100 dark:bg-gradient-to-br dark:from-indigo-900/50 dark:to-purple-900/50 rounded-full flex items-center justify-center border-4 border-white dark:border-[#0B1221]">
                      <User size={40} className="text-gray-400 dark:text-white/50" />
                    </div>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-wide mt-4">
                  אורח
                </h2>
              </div>
            )}
          </div>

          {/* Menu items */}
          <nav className="flex flex-col gap-2 w-full">
            {menuItems.map((item) => {
              const IconComponent = item.icon;

              // Determine left icon based on label to match the design
              let LeftIcon = null;
              if (item.label === "דיונים") {
                LeftIcon = <Minus size={18} className="text-gray-400 dark:text-white/70" />;
              } else if (item.label === "שאלות" || item.label === "סיפורים") {
                LeftIcon = <ChevronDown size={18} className="text-gray-400 dark:text-white/70" />;
              }

              return (
                <button
                  key={item.href}
                  onClick={() => handleMenuClick(item.href)}
                  className={`relative w-full h-[2.75rem] rounded-full border transition-colors flex items-center px-5 ${
                    item.active
                      ? "border-indigo-200 bg-indigo-50 dark:border-white/40 dark:bg-white/5 shadow-sm"
                      : "border-gray-200 dark:border-white/20 hover:border-gray-300 dark:hover:border-white/40 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-white/5 shadow-sm"
                  }`}
                >
                  <div className="absolute right-5 flex items-center justify-center">
                    <IconComponent size={22} className={item.active ? "text-indigo-600 dark:text-white" : "text-gray-700 dark:text-white"} />
                  </div>
                  <div className={`flex-1 text-center text-lg font-medium tracking-wide ${item.active ? "text-indigo-900 dark:text-white" : "text-gray-800 dark:text-white"}`}>
                    {item.label}
                  </div>
                  <div className="absolute left-5 flex items-center justify-center">
                    {LeftIcon}
                    {item.label === "דיונים" && chatUnreadCount > 0 && (
                      <span className="absolute -top-1 -right-2 bg-indigo-600 dark:bg-indigo-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold shadow-sm">
                        {chatUnreadCount > 9 ? "9+" : chatUnreadCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Footer Actions */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-between px-2">
            {user ? (
              <button
                onClick={async () => {
                  if (onSignOut) await onSignOut();
                  onClose();
                }}
                className="flex items-center gap-2 text-red-600 dark:text-white hover:text-red-700 dark:hover:text-white/80 transition-colors"
              >
                <LogOut size={24} className="rotate-180" />
                <span className="text-lg font-medium">התנתק</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  onOpenLoginModal?.();
                }}
                className="flex items-center gap-2 text-indigo-600 dark:text-white hover:text-indigo-700 dark:hover:text-white/80 transition-colors"
              >
                <User size={24} />
                <span className="text-lg font-medium">התחברות</span>
              </button>
            )}

            <button
              onClick={() => handleMenuClick("/settings")}
              className="text-gray-600 dark:text-white hover:text-gray-900 dark:hover:text-white/80 transition-colors p-1"
              aria-label="הגדרות"
            >
              <Settings size={28} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
