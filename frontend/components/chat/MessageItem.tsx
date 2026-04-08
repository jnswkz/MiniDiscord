"use client";

import { StatusAvatar } from "@/components/ui/StatusAvatar";
import { MessageActions } from "@/components/chat/MessageActions";
import { Reply } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/stores/chatStore";
import { CURRENT_USER } from "@/lib/mock-data";
import type { Message } from "@/types";

interface MessageItemProps {
  message: Message;
  isGrouped?: boolean;
  channelId?: string;
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

export function MessageItem({ message, isGrouped = false, channelId }: MessageItemProps) {
  const replyingTo = useChatStore((s) => s.replyingTo);
  const setReplyingTo = useChatStore((s) => s.setReplyingTo);
  const addReaction = useChatStore((s) => s.addReaction);

  const isBeingReplied = replyingTo?.messageId === message.id;

  function handleReply() {
    setReplyingTo({
      messageId: message.id,
      senderName: message.senderName,
      content: message.content,
    });
  }

  function handleReaction(emoji: string) {
    if (channelId) {
      addReaction(channelId, message.id, emoji);
    }
  }

  function handleReactionBadgeClick(emoji: string) {
    if (channelId) {
      addReaction(channelId, message.id, emoji);
    }
  }

  return (
    <div
      className={cn(
        "group relative flex gap-4 px-4 py-0.5 transition-colors",
        !isGrouped && "mt-4 pt-1",
        isBeingReplied
          ? "bg-accent/8 hover:bg-accent/12"
          : "hover:bg-background-secondary/30"
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
          <span className="hidden group-hover:block text-[11px] text-muted-foreground leading-[22px] text-right w-full">
            {formatTime(message.createdAt)}
          </span>
        )}
      </div>

      {/* Message content */}
      <div className="flex-1 min-w-0">
        {!isGrouped && (
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-foreground text-[15px] hover:underline cursor-pointer">
              {message.senderName}
            </span>
            <time className="text-[12px] text-muted-foreground">
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

        <p className="text-[15px] text-foreground leading-relaxed break-words">
          {message.content}
        </p>

        {/* Reactions */}
        {message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {message.reactions.map((reaction, i) => {
              const hasReacted = reaction.userIds.includes(CURRENT_USER.id);
              return (
                <button
                  key={`${reaction.emoji}-${i}`}
                  onClick={() => handleReactionBadgeClick(reaction.emoji)}
                  className={cn(
                    "flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-xs transition-colors cursor-pointer",
                    hasReacted
                      ? "bg-[#5865F2]/20 border border-[#5865F2]"
                      : "bg-[#2b2d31] border border-transparent hover:border-border"
                  )}
                >
                  <span>{reaction.emoji}</span>
                  <span className={cn(
                    "font-medium",
                    hasReacted ? "text-[#5865F2]" : "text-muted-foreground"
                  )}>
                    {reaction.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Action bar on hover */}
      <MessageActions onReaction={handleReaction} onReply={handleReply} />
    </div>
  );
}
