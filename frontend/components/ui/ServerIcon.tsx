"use client";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/Tooltip";
import { UnreadBadge } from "@/components/ui/UnreadBadge";

interface ServerIconProps {
  name: string;
  iconUrl?: string | null;
  isActive?: boolean;
  hasNotification?: boolean;
  unreadCount?: number;
  onClick?: () => void;
  className?: string;
}

export function ServerIcon({
  name,
  iconUrl,
  isActive = false,
  hasNotification = false,
  unreadCount = 0,
  onClick,
  className,
}: ServerIconProps) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  return (
    <div className="relative flex items-center justify-center group">
      {/* Active / hover pill indicator */}
      <div
        className={cn(
          "absolute left-0 w-1 rounded-r-full bg-foreground transition-all duration-normal",
          isActive
            ? "h-10"
            : hasNotification
              ? "h-2"
              : "h-0 group-hover:h-5"
        )}
      />

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              "flex h-12 w-12 items-center justify-center transition-all duration-normal cursor-pointer overflow-hidden",
              isActive
                ? "rounded-[16px] bg-accent"
                : "rounded-full bg-background-secondary hover:rounded-[16px] hover:bg-accent",
              className
            )}
          >
            {iconUrl ? (
              <img
                src={iconUrl}
                alt={name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold text-foreground select-none">
                {initials}
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">{name}</TooltipContent>
      </Tooltip>

      {/* Unread badge overlay */}
      <UnreadBadge count={unreadCount} variant="overlay" />
    </div>
  );
}
