"use client";

import { useParams } from "next/navigation";
import { ServerList } from "@/components/sidebar/ServerList";
import { UserPanel } from "@/components/sidebar/UserPanel";
import { DMSidebar } from "@/components/sidebar/DMSidebar";
import { DmUserPanel } from "@/components/dm/DmUserPanel";
import { MessageInput } from "@/components/chat/MessageInput";
import { StatusAvatar } from "@/components/ui/StatusAvatar";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Phone, Video, Pin, User } from "lucide-react";
import { ResizeHandle } from "@/components/ui/ResizeHandle";
import { useUIStore } from "@/stores/uiStore";
import { MOCK_USERS, MOCK_DIRECT_MESSAGES, CURRENT_USER } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useCallback } from "react";

function getDmMessages(userId: string) {
  const user = MOCK_USERS.find((u) => u.id === userId);
  if (!user) return [];
  return [
    {
      id: "dm-m1",
      senderId: userId,
      senderName: user.username,
      senderAvatar: user.avatarUrl,
      content: `Chào ${CURRENT_USER.username}! 👋`,
      createdAt: "2026-03-26T07:00:00Z",
    },
    {
      id: "dm-m2",
      senderId: CURRENT_USER.id,
      senderName: CURRENT_USER.username,
      senderAvatar: CURRENT_USER.avatarUrl,
      content: `Hey ${user.username}! Có gì mới không?`,
      createdAt: "2026-03-26T07:05:00Z",
    },
    {
      id: "dm-m3",
      senderId: userId,
      senderName: user.username,
      senderAvatar: user.avatarUrl,
      content:
        MOCK_DIRECT_MESSAGES.find((dm) => dm.recipientId === userId)
          ?.lastMessage || "Mình ổn, cảm ơn!",
      createdAt: "2026-03-26T08:00:00Z",
    },
  ];
}

function DmMessageItem({
  message,
  isGrouped,
}: {
  message: ReturnType<typeof getDmMessages>[0];
  isGrouped: boolean;
}) {
  const time = new Date(message.createdAt).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const fallback = message.senderName;

  if (isGrouped) {
    return (
      <div className="group flex items-start gap-4 px-4 py-[2px] hover:bg-secondary/30">
        <span className="w-10 text-center text-[11px] text-muted-foreground opacity-0 group-hover:opacity-100 pt-0.5 leading-[1.375rem]">
          {time}
        </span>
        <p className="text-[0.9375rem] leading-[1.375rem] text-foreground">
          {message.content}
        </p>
      </div>
    );
  }

  return (
    <div className="group flex items-start gap-4 px-4 pt-[1.0625rem] pb-[2px] hover:bg-secondary/30">
      <StatusAvatar
        src={message.senderAvatar}
        fallback={fallback}
        status="ONLINE"
        size="lg"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-[0.9375rem] font-semibold text-foreground leading-[1.375rem] hover:underline cursor-pointer">
            {message.senderName}
          </span>
          <span className="text-[0.75rem] text-muted-foreground leading-[1.375rem]">{time}</span>
        </div>
        <p className="text-[0.9375rem] leading-[1.375rem] text-foreground">
          {message.content}
        </p>
      </div>
    </div>
  );
}

export default function DmChatPage() {
  const params = useParams();
  const userId = params?.userId as string;
  const showDmUserPanel = useUIStore((s) => s.showDmUserPanel);
  const toggleDmUserPanel = useUIStore((s) => s.toggleDmUserPanel);
  const sidebarWidth = useUIStore((s) => s.sidebarWidth);
  const setSidebarWidth = useUIStore((s) => s.setSidebarWidth);

  const handleResize = useCallback(
    (delta: number) => setSidebarWidth(sidebarWidth + delta),
    [sidebarWidth, setSidebarWidth]
  );

  const friend = MOCK_USERS.find((u) => u.id === userId);
  const friendName = friend?.username || "User";
  const messages = getDmMessages(userId);

  return (
    <>
      {/* Left section: ServerList + DMSidebar + UserPanel */}
      <div className="flex shrink-0 flex-col">
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <ServerList />
          <DMSidebar activeUserId={userId} />
        </div>
        <UserPanel />
      </div>

      {/* Resize Handle */}
      <ResizeHandle onResize={handleResize} />

      {/* Column 3: DM Chat */}
      <main className="flex flex-1 flex-col min-w-0 bg-background">
        {/* DM Header */}
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-4">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-semibold text-foreground">
              @ {friendName}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <Phone className="h-5 w-5" />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <Video className="h-5 w-5" />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <Pin className="h-5 w-5" />
            </button>
            <button
              onClick={toggleDmUserPanel}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md transition-colors cursor-pointer",
                showDmUserPanel
                  ? "text-foreground bg-secondary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Toggle user panel"
            >
              <User className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="flex flex-col justify-end min-h-full">
            {/* Welcome */}
            <div className="px-4 pt-20 pb-6">
              <StatusAvatar
                src={friend?.avatarUrl ?? null}
                fallback={friendName}
                status={friend?.status || "OFFLINE"}
                size="xl"
              />
              <h2 className="mt-3 text-[2rem] font-bold text-foreground leading-tight">
                {friendName}
              </h2>
              <p className="mt-1.5 text-[0.9375rem] leading-[1.375rem] text-muted-foreground">
                Đây là phần mở đầu trong lịch sử các tin nhắn trực tiếp của bạn với{" "}
                <strong className="font-semibold text-foreground">{friendName}</strong>.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <button className="rounded-[3px] border border-border bg-transparent px-4 py-[5px] text-[0.8125rem] font-medium text-foreground hover:bg-secondary/50 transition-colors duration-150 cursor-pointer">
                  Xóa Bạn
                </button>
                <button className="rounded-[3px] border border-border bg-transparent px-4 py-[5px] text-[0.8125rem] font-medium text-foreground hover:bg-secondary/50 transition-colors duration-150 cursor-pointer">
                  Chặn
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="relative mx-4 mb-2">
              <div className="h-px bg-border" />
            </div>

            {/* Messages */}
            <div className="pb-2">
              {messages.map((msg, i) => {
                const prev = messages[i - 1];
                const isGrouped = !!prev && prev.senderId === msg.senderId;
                return (
                  <DmMessageItem
                    key={msg.id}
                    message={msg}
                    isGrouped={isGrouped}
                  />
                );
              })}
            </div>
          </div>
        </ScrollArea>

        {/* Message Input */}
        <MessageInput channelName={friendName} isDm />
      </main>

      {/* Column 4: User Info Panel (toggleable) */}
      {showDmUserPanel && <DmUserPanel userId={userId} />}
    </>
  );
}
