"use client";

import { useState } from "react";
import { Plus, Smile, Gift, Sticker, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  channelName: string;
  /** Use @mention style placeholder instead of #channel */
  isDm?: boolean;
}

export function MessageInput({ channelName, isDm }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    // TODO: send message via WebSocket
    console.log("Send:", message);
    setMessage("");
  }

  const placeholder = isDm
    ? `Nhắn @${channelName}`
    : `Nhắn #${channelName}`;

  return (
    <div className="shrink-0 px-4 py-[7px]">
      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex items-center gap-2 rounded-lg bg-input px-4 transition-all duration-200",
          "ring-1 ring-transparent",
          isFocused && "ring-accent/70"
        )}
      >
        <button
          type="button"
          aria-label="Đính kèm file"
          className="flex h-[44px] w-6 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <Plus className="h-[22px] w-[22px]" />
        </button>

        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent py-[11px] text-[15px] text-foreground placeholder:text-muted-foreground outline-none"
        />

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Sticker"
            className="flex h-[34px] w-[34px] items-center justify-center rounded text-muted-foreground transition-colors cursor-pointer hover:text-foreground"
          >
            <Sticker className="h-[22px] w-[22px]" />
          </button>
          <button
            type="button"
            aria-label="Gift"
            className="flex h-[34px] w-[34px] items-center justify-center rounded text-muted-foreground transition-colors cursor-pointer hover:text-foreground"
          >
            <Gift className="h-[22px] w-[22px]" />
          </button>
          <button
            type="button"
            aria-label="GIF"
            className="flex h-[34px] w-[34px] items-center justify-center rounded text-muted-foreground transition-colors cursor-pointer hover:text-foreground"
          >
            <Sparkles className="h-[22px] w-[22px]" />
          </button>
          <button
            type="button"
            aria-label="Emoji"
            className="flex h-[34px] w-[34px] items-center justify-center rounded text-muted-foreground transition-colors cursor-pointer hover:text-foreground"
          >
            <Smile className="h-[22px] w-[22px]" />
          </button>
        </div>
      </form>
    </div>
  );
}
