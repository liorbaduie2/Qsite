import React from "react";
import { Crown, Shield, ShieldCheck, Wrench } from "lucide-react";

type RoleKey = "owner" | "guardian" | "admin" | "moderator" | string;

interface RoleBadgeProps {
  role: RoleKey;
  roleHebrew: string;
  size?: "sm" | "md";
  className?: string;
}

const ROLE_CONFIG: Record<
  string,
  {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    baseColor: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  owner: {
    icon: Crown,
    baseColor: "text-amber-700 dark:text-amber-300",
    bgColor: "bg-amber-50 dark:bg-amber-900/30",
    borderColor: "border-amber-200 dark:border-amber-700",
  },
  guardian: {
    icon: Shield,
    baseColor: "text-purple-700 dark:text-purple-300",
    bgColor: "bg-purple-50 dark:bg-purple-900/30",
    borderColor: "border-purple-200 dark:border-purple-700",
  },
  admin: {
    icon: ShieldCheck,
    baseColor: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-50 dark:bg-blue-900/30",
    borderColor: "border-blue-200 dark:border-blue-700",
  },
  moderator: {
    icon: Wrench,
    baseColor: "text-emerald-700 dark:text-emerald-300",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/30",
    borderColor: "border-emerald-200 dark:border-emerald-700",
  },
};

export function RoleBadge({
  role,
  roleHebrew,
  size = "md",
  className = "",
}: RoleBadgeProps) {
  const config = ROLE_CONFIG[role] ?? {
    icon: Shield,
    baseColor: "text-slate-700 dark:text-slate-300",
    bgColor: "bg-slate-50 dark:bg-slate-800/40",
    borderColor: "border-slate-200 dark:border-slate-600",
  };

  const Icon = config.icon;
  const baseSizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[0.7rem] gap-1"
      : "px-2.5 py-1 text-xs gap-1.5";
  const iconSize = size === "sm" ? 12 : 14;

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold ${baseSizeClasses} ${config.bgColor} ${config.borderColor} ${config.baseColor} ${className}`}
    >
      <Icon size={iconSize} className="shrink-0" />
      <span className="leading-none">{roleHebrew}</span>
    </span>
  );
}

