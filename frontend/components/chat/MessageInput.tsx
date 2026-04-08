"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, Smile, Gift, Sticker, X, Reply, FileUp, Image, Video } from "lucide-react";
import { EmojiPicker } from "@/components/ui/EmojiPicker";
import { useChatStore } from "@/stores/chatStore";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  channelName: string;
  isDm?: boolean;
  onSend?: (content: string) => void;
}

function GifIcon() {
  return (
    <span className="flex h-[22px] w-[22px] items-center justify-center rounded-[3px] border-2 border-current text-[10px] font-bold leading-none">
      GIF
    </span>
  );
}

export function MessageInput({ channelName, isDm, onSend }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const attachRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const replyingTo = useChatStore((s) => s.replyingTo);
  const clearReplyingTo = useChatStore((s) => s.clearReplyingTo);

  // Auto-focus input when reply mode activates
  useEffect(() => {
    if (replyingTo) {
      inputRef.current?.focus();
    }
  }, [replyingTo]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    onSend?.(message.trim());
    setMessage("");
  }

  function handleEmojiSelect(emoji: string) {
    setMessage((prev) => prev + emoji);
  }

  // Click-outside to close attachment menu
  useEffect(() => {
    if (!isAttachOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (attachRef.current && !attachRef.current.contains(e.target as Node)) {
        setIsAttachOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isAttachOpen]);

  const ATTACH_ITEMS = [
    { icon: FileUp, label: t("chat.uploadFile") },
    { icon: Image, label: t("chat.uploadImage") },
    { icon: Video, label: t("chat.uploadVideo") },
  ];

  const placeholder = isDm
    ? t("chat.messagePlaceholderDm", { userName: channelName })
    : t("chat.messagePlaceholderChannel", { channelName });

  return (
    <div
      className="absolute inset-x-0 z-20 px-4"
      style={{ bottom: "var(--floating-bar-gap)" }}
    >
      {/* Floating shell keeps the composer inside column 3 and visually detached from the screen edges. */}
      <div
        className="shadow-[0_12px_30px_rgba(0,0,0,0.24)]"
        style={{
          borderRadius: "var(--floating-bar-radius)",
          backgroundColor: "#383a40",
        }}
      >
        {/* Reply content lives inside the same shell so the whole composer reads as one floating bar. */}
        {replyingTo && (
          <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
            <div className="flex min-w-0 items-center gap-2">
              <Reply className="h-3.5 w-3.5 shrink-0 rotate-180 text-accent" />
              <span className="text-sm text-muted-foreground">
                Đang trả lời{" "}
                <strong className="font-semibold text-foreground">
                  {replyingTo.senderName}
                </strong>
              </span>
              <span className="max-w-[300px] truncate text-xs text-muted-foreground/60">
                — {replyingTo.content}
              </span>
            </div>
            <button
              type="button"
              onClick={clearReplyingTo}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
              aria-label="Hủy trả lời"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className={cn(
            "message-input-wrapper flex items-center gap-2 px-4 text-foreground",
            replyingTo ? "pb-3 pt-1.5" : "py-2.5"
          )}
        >
          <div className="relative" ref={attachRef}>
            <button
              type="button"
              onClick={() => setIsAttachOpen((v) => !v)}
              aria-label="Đính kèm file"
              className={cn(
                "flex h-[40px] w-7 shrink-0 items-center justify-center transition-colors cursor-pointer",
                isAttachOpen ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Plus className="h-[22px] w-[22px]" />
            </button>

            {/* Attachment Popover */}
            {isAttachOpen && (
              <div className="absolute bottom-[calc(100%+8px)] left-0 w-48 rounded-lg bg-[#2b2d31] p-1.5 shadow-xl border border-border/30 z-30">
                {ATTACH_ITEMS.map(({ icon: Icon, label }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setIsAttachOpen(false)}
                    className="flex w-full items-center gap-3 rounded px-2.5 py-2 text-[14px] text-[#dbdee1] hover:bg-[#4752c4] hover:text-white transition-colors cursor-pointer"
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent py-[11px] text-[15px] text-foreground placeholder:text-muted-foreground outline-none focus-visible:outline-none"
          />

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              aria-label="Gift / Nitro"
              className="flex h-[34px] w-[34px] items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            >
              <Gift className="h-[22px] w-[22px]" />
            </button>
            <button
              type="button"
              aria-label="GIF"
              className="flex h-[34px] w-[34px] items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            >
              <GifIcon />
            </button>
            <button
              type="button"
              aria-label="Sticker"
              className="flex h-[34px] w-[34px] items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            >
              <Sticker className="h-[22px] w-[22px]" />
            </button>

            <EmojiPicker onEmojiSelect={handleEmojiSelect} position="top">
              <button
                type="button"
                aria-label="Emoji"
                className="flex h-[34px] w-[34px] items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
              >
                <Smile className="h-[22px] w-[22px]" />
              </button>
            </EmojiPicker>
          </div>
        </form>
      </div>
    </div>
  );
}
