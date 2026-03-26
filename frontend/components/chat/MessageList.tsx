"use client";

import { ScrollArea } from "@/components/ui/ScrollArea";
import { MessageItem } from "@/components/chat/MessageItem";
import { Hash } from "lucide-react";
import type { Message } from "@/types";

interface MessageListProps {
  messages: Message[];
  channelName: string;
}

export function MessageList({ messages, channelName }: MessageListProps) {
  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col justify-end min-h-full">
        {/* Welcome header */}
        <div className="px-4 pt-16 pb-4">
          <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-secondary mb-2">
            <Hash className="h-10 w-10 text-foreground" />
          </div>
          <h2 className="text-3xl font-bold text-foreground">
            Chào mừng đến #{channelName}!
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Đây là khởi đầu của kênh #{channelName}. Hãy bắt đầu trò chuyện.
          </p>
        </div>

        {/* Messages */}
        <div className="pb-4">
          {messages.map((msg, i) => {
            const prev = messages[i - 1];
            const isGrouped =
              !!prev &&
              prev.senderId === msg.senderId &&
              new Date(msg.createdAt).getTime() -
                new Date(prev.createdAt).getTime() <
                5 * 60 * 1000;

            return (
              <MessageItem
                key={msg.id}
                message={msg}
                isGrouped={isGrouped}
              />
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}
