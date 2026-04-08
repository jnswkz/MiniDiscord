"use client";

import { ServerList } from "@/components/sidebar/ServerList";
import { UserPanel } from "@/components/sidebar/UserPanel";
import { ChannelList } from "@/components/sidebar/ChannelList";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList, type MessageListHandle } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import { ScrollToBottomBanner } from "@/components/chat/ScrollToBottomBanner";
import { MemberList } from "@/components/sidebar/MemberList";
import { ResizeHandle } from "@/components/ui/ResizeHandle";
import { SlidingPanel } from "@/components/ui/SlidingPanel";
import { useUIStore } from "@/stores/uiStore";
import { useChatStore } from "@/stores/chatStore";
import { MOCK_CHANNELS } from "@/lib/mock-data";
import { useParams } from "next/navigation";
import { useCallback, useRef, useState } from "react";

export default function ChannelPage() {
  const params = useParams();
  const channelId = params?.channelId as string;
  const showMemberList = useUIStore((s) => s.showMemberList);
  const sidebarWidth = useUIStore((s) => s.sidebarWidth);
  const setSidebarWidth = useUIStore((s) => s.setSidebarWidth);

  const channel = MOCK_CHANNELS.find((c) => c.id === channelId);
  const channelName = channel?.name || "general";
  const roomId = channel?.roomId || "r1";

  // Read messages from in-memory store
  const messages = useChatStore((s) => s.getChannelMessages(channelId));
  const sendChannelMessage = useChatStore((s) => s.sendChannelMessage);

  const handleSend = useCallback(
    (content: string) => sendChannelMessage(channelId, roomId, content),
    [channelId, roomId, sendChannelMessage]
  );

  const handleResize = useCallback(
    (delta: number) => setSidebarWidth(sidebarWidth + delta),
    [sidebarWidth, setSidebarWidth]
  );

  // Ref to MessageList for scroll control
  const messageListRef = useRef<MessageListHandle>(null);
  const [showJumpBanner, setShowJumpBanner] = useState(false);

  const handleScrollStateChange = useCallback((isAtBottom: boolean) => {
    setShowJumpBanner(!isAtBottom);
  }, []);

  return (
    <>
      {/* Left shell combines columns 1 + 2 and keeps a bottom lane free for the floating user panel. */}
      <div
        className="relative flex shrink-0 flex-col bg-background-tertiary border-r border-border"
        style={{ paddingBottom: "var(--floating-user-panel-offset)" }}
      >
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Column 1: Server List */}
          <ServerList />
          {/* Column 2: Channel List */}
          <ChannelList />
        </div>
        {/* UserPanel spanning columns 1+2 */}
        <UserPanel />
      </div>

      {/* Resize Handle */}
      <ResizeHandle onResize={handleResize} />

      {/* Column 3 is the positioning context for the floating message composer. */}
      <main className="relative flex flex-1 min-w-0 flex-col bg-[#313338]">
        <ChatHeader channelName={channelName} />
        <MessageList
          ref={messageListRef}
          messages={messages}
          channelName={channelName}
          channelId={channelId}
          onScrollStateChange={handleScrollStateChange}
        />

        {/* Input wrapper — relative context for floating banner */}
        <div className="relative">
          <ScrollToBottomBanner
            visible={showJumpBanner}
            onJumpToPresent={() => messageListRef.current?.scrollToBottom()}
          />
          <MessageInput channelName={channelName} onSend={handleSend} />
        </div>
      </main>

      {/* Column 4: Member List (toggleable with slide animation) */}
      <SlidingPanel show={showMemberList} width={240}>
        <MemberList />
      </SlidingPanel>
    </>
  );
}
