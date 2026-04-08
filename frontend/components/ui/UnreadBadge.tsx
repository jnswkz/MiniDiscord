"use client";

import { cn } from "@/lib/utils";
import { formatUnreadCount } from "@/stores/notificationStore";

interface UnreadBadgeProps {
  count: number;
  /** "inline" for DM list rows, "overlay" for absolute-positioned on server icons */
  variant?: "inline" | "overlay";
  className?: string;
}

export function UnreadBadge({ count, variant = "inline", className }: UnreadBadgeProps) {
  if (count <= 0) return null;

  const formatted = formatUnreadCount(count);
  const isWide = formatted.length > 1;

  return (
    <span
      className={cn(
        "flex items-center justify-center font-bold text-white bg-[#f23f42] leading-none select-none",
        isWide
          ? "h-4 min-w-[16px] rounded-full px-1 text-[11px]"
          : "h-4 w-4 rounded-full text-[11px]",
        variant === "overlay" && "absolute -bottom-1 -right-1 border-[3px] border-[#1e1f22] h-5 min-w-[20px] text-[10px]",
        variant === "overlay" && isWide && "px-1.5",
        className
      )}
    >
      {formatted}
    </span>
  );
}
