"use client";

import { StatusAvatar } from "@/components/ui/StatusAvatar";
import { Smile, Reply, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/types";

interface MessageItemProps {
  message: Message;
  isGrouped?: boolean;
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFullDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ActionButton({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      aria-label={label}
      className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-background-tertiary transition-colors cursor-pointer"
    >
      {children}
    </button>
  );
}

export function MessageItem({ message, isGrouped = false }: MessageItemProps) {
  return (
    <div
      className={cn(
        "group relative flex gap-4 px-4 py-0.5 hover:bg-background-secondary/30 transition-colors",
        !isGrouped && "mt-4 pt-1"
      )}
    >
      {/* Avatar or timestamp gutter */}
      <div className="w-10 shrink-0">
        {!isGrouped ? (
          <StatusAvatar
            src={message.senderAvatar}
            fallback={message.senderName}
            size="lg"
          />
        ) : (
          <span className="hidden group-hover:block text-[10px] text-muted-foreground leading-[22px] text-right w-full">
            {formatTime(message.createdAt)}
          </span>
        )}
      </div>

      {/* Message content */}
      <div className="flex-1 min-w-0">
        {!isGrouped && (
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-foreground text-sm hover:underline cursor-pointer">
              {message.senderName}
            </span>
            <time className="text-xs text-muted-foreground">
              {formatFullDate(message.createdAt)}
            </time>
            {message.isEdited && (
              <span className="text-[10px] text-muted-foreground">(đã sửa)</span>
            )}
          </div>
        )}

        {/* Reply reference */}
        {message.replyTo && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
            <Reply className="h-3 w-3 rotate-180" />
            <span className="font-semibold text-accent cursor-pointer hover:underline">
              @{message.replyTo.senderName}
            </span>
            <span className="truncate">{message.replyTo.content}</span>
          </div>
        )}

        <p className="text-sm text-foreground leading-relaxed break-words">
          {message.content}
        </p>

        {/* Reactions */}
        {message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {message.reactions.map((reaction, i) => (
              <button
                key={i}
                className="flex items-center gap-1 rounded-md border border-border bg-background-secondary px-1.5 py-0.5 text-xs transition-colors hover:border-accent cursor-pointer"
              >
                <span>{reaction.emoji}</span>
                <span className="text-muted-foreground">{reaction.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action bar on hover */}
      <div className="absolute -top-3 right-4 hidden group-hover:flex items-center gap-0.5 rounded-md border border-border bg-background p-0.5 shadow-md">
        <ActionButton label="Thêm reaction">
          <Smile className="h-4 w-4" />
        </ActionButton>
        <ActionButton label="Trả lời">
          <Reply className="h-4 w-4" />
        </ActionButton>
        <ActionButton label="Thêm">
          <MoreHorizontal className="h-4 w-4" />
        </ActionButton>
      </div>
    </div>
  );
}
