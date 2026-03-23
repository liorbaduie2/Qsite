"use client";

import React, { useState } from "react";
import { MobileNavbar } from "./MobileNavbar";
import { MobileNavDrawer } from "./MobileNavDrawer";
import { useAuth } from "./AuthProvider";
import { Home, Users, MessageSquare, HelpCircle, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { scrollToTopAfterMobileNav } from "@/lib/mobile-nav-scroll";
import { SimpleThemeToggle } from "./SimpleThemeToggle";

export function GlobalMobileNav() {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  const menuItems = [
    { label: "ראשי", icon: Home, href: "/" },
    { label: "סטטוסים", icon: Users, href: "/status" },
    { label: "דיונים", icon: MessageSquare, href: "/discussions" },
    { label: "שאלות", icon: HelpCircle, href: "/questions" },
    { label: "סיפורים", icon: BookOpen, href: "/stories" },
  ];

  return (
    <>
      <MobileNavDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        menuItems={menuItems}
        user={user}
        profile={profile}
        onSignOut={signOut}
        onOpenLoginModal={() => {
          setIsMobileDrawerOpen(false);
          router.push("/?modal=login");
          scrollToTopAfterMobileNav();
        }}
        headerExtra={<SimpleThemeToggle size="sm" className="shrink-0" />}
      />

      <MobileNavbar onMenuClick={() => setIsMobileDrawerOpen(true)} />
    </>
  );
}
