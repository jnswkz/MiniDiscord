"use client";

import { useState } from "react";
import { Plus, Smile, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  channelName: string;
}

export function MessageInput({ channelName }: MessageInputProps) {
  const [message, setMessage] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    // TODO: send message via WebSocket
    console.log("Send:", message);
    setMessage("");
  }

  return (
    <div className="px-4 pb-6 pt-1">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 rounded-lg bg-input px-4"
      >
        <button
          type="button"
          aria-label="Đính kèm file"
          className="flex h-10 w-6 items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <Plus className="h-5 w-5" />
        </button>

        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`Nhắn #${channelName}`}
          className="flex-1 bg-transparent py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Gift"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded text-muted-foreground transition-colors cursor-pointer",
              "hover:text-foreground"
            )}
          >
            <Gift className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Emoji"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded text-muted-foreground transition-colors cursor-pointer",
              "hover:text-foreground"
            )}
          >
            <Smile className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
