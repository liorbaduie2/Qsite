"use client";

import { MessageCircle, Bell, Plus, Search, Menu } from "lucide-react";
import { useState } from "react";

const navShape = "/navbar-mobile.svg";

interface MobileNavbarProps {
  onMenuClick?: () => void;
}

export function MobileNavbar({ onMenuClick }: MobileNavbarProps) {
  const [activeTab, setActiveTab] = useState("home");
  const [messageCount] = useState(4);

  const navItems = [
    { id: "menu", icon: Menu, label: "Menu" },
    { id: "search", icon: Search, label: "Search" },
    { id: "add", icon: Plus, label: "Add", isCenter: true },
    { id: "notifications", icon: Bell, label: "Notifications" },
    {
      id: "messages",
      icon: MessageCircle,
      label: "Messages",
      badge: messageCount,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 px-4 pb-0 pt-2 z-50 md:hidden pointer-events-none">
      <div className="relative mx-auto max-w-md h-24 pointer-events-auto">
        {/* Custom Shape Background */}
        <div className="absolute inset-0 w-full h-full drop-shadow-[0_-4px_10px_rgba(0,0,0,0.05)] dark:drop-shadow-[0_-4px_12px_rgba(0,0,0,0.2)]">
          {/* Gradient Overlay */}
          <div
            className="absolute inset-0 w-full h-full bg-white dark:bg-slate-800"
            style={{
              WebkitMaskImage: navShape ? `url(${navShape})` : undefined,
              WebkitMaskSize: "100% 100%",
              WebkitMaskRepeat: "no-repeat",
              maskImage: navShape ? `url(${navShape})` : undefined,
              maskSize: "100% 100%",
              maskRepeat: "no-repeat",
              borderRadius: navShape ? undefined : "24px",
            }}
          />
        </div>

        {/* Navigation Items */}
        <div className="relative flex items-center justify-between px-6 h-full pt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isCenterButton = item.isCenter;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "menu" && onMenuClick) {
                    onMenuClick();
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                className={`relative flex items-center justify-center transition-all ${
                  isCenterButton
                    ? "w-16 h-16 -mt-6 translate-y-[10%]"
                    : "w-12 h-12"
                }`}
                aria-label={item.label}
              >
                {/* Button background circle */}
                <div
                  className={`absolute inset-0 rounded-full transition-all ${
                    isCenterButton ? "bg-white dark:bg-slate-700" : "bg-white dark:bg-slate-700"
                  }`}
                />

                {/* Outline (cutout effect matching background) */}
                <div
                  className={`absolute inset-0 rounded-full border-8 transition-all ${
                    isCenterButton ? "border-slate-50 dark:border-slate-800" : "border-white dark:border-slate-800"
                  }`}
                />

                {/* Icon background circle with outline */}
                <div
                  className={`absolute inset-0 rounded-full border-2 transition-all ${
                    isCenterButton
                      ? "border-indigo-100 dark:border-slate-500 bg-indigo-600 dark:bg-indigo-600"
                      : "border-gray-100 dark:border-slate-600 bg-transparent dark:bg-transparent"
                  } ${isActive && !isCenterButton ? "bg-indigo-50 dark:bg-slate-600/50 border-indigo-200 dark:border-slate-500" : ""}`}
                  style={{ margin: "2px" }}
                />

                {/* Icon */}
                <Icon
                  className={`relative z-10 ${
                    isCenterButton 
                      ? "w-8 h-8 text-white" 
                      : `w-6 h-6 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-slate-400"}`
                  }`}
                  strokeWidth={2.5}
                />

                {/* Badge for messages */}
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white dark:border-slate-800">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
