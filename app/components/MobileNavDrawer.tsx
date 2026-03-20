"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { X, LucideIcon, User, LogOut, Settings, Moon } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { ReputationArc } from "@/app/components/ReputationArc";
import { RoleBadge } from "@/app/components/RoleBadge";
import { useAuth } from "@/app/components/AuthProvider";
import { useNotificationsRealtime } from "@/app/hooks/useNotificationsRealtime";
import { usePresenceTick } from "@/app/hooks/usePresenceTick";
import { createClient } from "@/lib/supabase/client";

interface MenuItem {
  label: string;
  icon: LucideIcon;
  href: string;
  /** Optional override; otherwise active state follows the current URL */
  active?: boolean;
}

function menuHrefMatchesCurrentPath(pathname: string, href: string): boolean {
  const p = pathname || "/";
  if (href === "/") return p === "/" || p === "";
  return p === href || p.startsWith(`${href}/`);
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
  const pathname = usePathname() || "";
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

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("mobile-nav-drawer-state", {
        detail: { open: isOpen },
      }),
    );
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
        className={`relative mx-auto w-[92%] max-w-md max-h-[82dvh] bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 border border-gray-200 dark:border-slate-600 rounded-[2rem] shadow-[0_4px_12px_-2px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.15)] transform transition-transform duration-300 ease-out flex flex-col mb-24 ${
          isOpen ? "translate-y-0 scale-100" : "translate-y-12 scale-95"
        }`}
        style={{ direction: "rtl" }}
      >
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 flex flex-col">
          {/* X and theme on same row as PFP */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center justify-center w-12 shrink-0 -translate-y-[31px]">
              {headerExtra ? (
                headerExtra
              ) : (
                <div className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 dark:border-slate-600">
                  <Moon
                    size={20}
                    className="text-gray-600 dark:text-slate-400"
                  />
                </div>
              )}
            </div>
            {user ? (
              <div className="relative shrink-0">
                <div
                  className="relative rounded-full p-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600"
                  style={{ width: 104, height: 104 }}
                >
                  <div className="absolute inset-1">
                    <ReputationArc value={profile?.reputation ?? 0} size={96} />
                  </div>
                  <div className="absolute inset-3 flex items-center justify-center">
                    {profile?.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile?.username || ""}
                        width={74}
                        height={74}
                        className="w-[74px] h-[74px] rounded-full object-cover border-[3px] border-white dark:border-slate-700 shadow-sm"
                      />
                    ) : (
                      <div className="w-[74px] h-[74px] bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 rounded-full flex items-center justify-center border-[3px] border-white dark:border-slate-700 shadow-sm">
                        <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                          {profile?.username
                            ? profile.username.charAt(0).toUpperCase()
                            : ""}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="relative rounded-full p-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 shadow-sm shrink-0"
                style={{ width: 104, height: 104 }}
              >
                <div className="absolute inset-3 flex items-center justify-center">
                  <div className="w-[74px] h-[74px] bg-gray-100 dark:bg-slate-600 rounded-full flex items-center justify-center border-[3px] border-white dark:border-slate-700">
                    <User
                      size={32}
                      className="text-gray-400 dark:text-slate-500"
                    />
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors shrink-0 -translate-y-[30px]"
              aria-label="סגור"
            >
              <X size={28} />
            </button>
          </div>

          {/* Username and role below PFP row */}
          <div className="flex flex-col items-center mb-4">
            {user ? (
              <>
                <h2 className="text-[1.75rem] font-bold text-gray-900 dark:text-slate-100 tracking-wide">
                  {profile?.full_name || profile?.username || "משתמש"}
                </h2>
                {userPermissions?.role &&
                  userPermissions.role !== "user" &&
                  !userPermissions.is_hidden && (
                    <div className="mt-0.5 flex justify-center">
                      <RoleBadge
                        role={userPermissions.role}
                        roleHebrew={userPermissions.role_hebrew || "משתמש"}
                        size="sm"
                      />
                    </div>
                  )}
              </>
            ) : (
              <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-wide mt-2">
                אורח
              </h2>
            )}
          </div>

          {/* Menu items */}
          <nav className="flex flex-col gap-2 w-full">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive =
                item.active ??
                menuHrefMatchesCurrentPath(pathname, item.href);

              return (
                <button
                  key={item.href}
                  onClick={() => handleMenuClick(item.href)}
                  className={`relative w-full h-[2.75rem] rounded-full border transition-colors flex items-center px-5 ${
                    isActive
                      ? "border-indigo-200 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/30 shadow-sm"
                      : "border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 bg-white dark:bg-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700 shadow-sm"
                  }`}
                >
                  <div className="absolute right-5 flex items-center justify-center">
                    <IconComponent
                      size={22}
                      className={
                        isActive
                          ? "text-indigo-600 dark:text-indigo-400"
                          : "text-gray-700 dark:text-slate-300"
                      }
                    />
                  </div>
                  <div
                    className={`flex-1 text-center text-lg font-medium tracking-wide ${isActive ? "text-indigo-900 dark:text-indigo-200" : "text-gray-800 dark:text-slate-200"}`}
                  >
                    {item.label}
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Footer Actions */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-600 flex items-center justify-between px-2">
            {user ? (
              <button
                onClick={async () => {
                  if (onSignOut) await onSignOut();
                  onClose();
                }}
                className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
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
                className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                <User size={24} />
                <span className="text-lg font-medium">התחברות</span>
              </button>
            )}

            <button
              onClick={() => handleMenuClick("/settings")}
              className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 transition-colors p-1"
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
