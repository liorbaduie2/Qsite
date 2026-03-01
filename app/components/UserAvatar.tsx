"use client";

import Image from "next/image";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

type Size = "sm" | "sm2" | "md" | "lg" | "xl";

const sizeClasses: Record<Size, string> = {
  sm: "w-6 h-6",
  sm2: "w-7 h-7",
  md: "w-9 h-9",
  lg: "w-11 h-11 sm:w-11 sm:h-11",
  xl: "w-12 h-12",
};

const sizePx: Record<Size, number> = {
  sm: 24,
  sm2: 28,
  md: 36,
  lg: 44,
  xl: 48,
};

export interface UserAvatarProps {
  avatarUrl: string | null;
  username?: string;
  size?: Size;
  isOnline?: boolean;
  className?: string;
  alt?: string;
}

export function UserAvatar({
  avatarUrl,
  username,
  size = "md",
  isOnline = false,
  className,
  alt,
}: UserAvatarProps) {
  const px = sizePx[size];
  const sizeClass = sizeClasses[size];
  const resolvedAlt = alt ?? username ?? "Avatar";

  const avatarContent = avatarUrl ? (
    <Image
      src={avatarUrl}
      alt={resolvedAlt}
      width={px}
      height={px}
      className={cn(
        "rounded-full object-cover border border-gray-200 dark:border-gray-600",
        sizeClass,
        className
      )}
    />
  ) : (
    <div
      className={cn(
        "rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-400 to-purple-500 border border-gray-200 dark:border-gray-600",
        sizeClass,
        className
      )}
    >
      <User size={size === "sm" ? 10 : size === "sm2" ? 12 : size === "xl" ? 20 : 16} className="text-white" />
    </div>
  );

  if (isOnline) {
    return (
      <span
        className={cn(
          "inline-flex rounded-full flex-shrink-0",
          "avatar-aura-online",
          sizeClass
        )}
      >
        <span className={cn("block rounded-full overflow-hidden", sizeClass)}>
          {avatarContent}
        </span>
      </span>
    );
  }

  return (
    <span className={cn("inline-flex flex-shrink-0", sizeClass)}>
      {avatarContent}
    </span>
  );
}
