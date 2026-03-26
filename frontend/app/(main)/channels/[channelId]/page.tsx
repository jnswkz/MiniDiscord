import { ServerList } from "@/components/sidebar/ServerList";
import { UserPanel } from "@/components/sidebar/UserPanel";
import { ChannelList } from "@/components/sidebar/ChannelList";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import { MemberList } from "@/components/sidebar/MemberList";
import { MOCK_MESSAGES, MOCK_CHANNELS } from "@/lib/mock-data";

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ channelId: string }>;
}) {
  const { channelId } = await params;
  const channel = MOCK_CHANNELS.find((c) => c.id === channelId);
  const channelName = channel?.name || "general";
  const messages = MOCK_MESSAGES.filter((m) => m.channelId === channelId);

  return (
    <>
      {/* Left section: Column 1 + Column 2 + UserPanel */}
      <div className="flex shrink-0 flex-col">
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Column 1: Server List */}
          <ServerList />
          {/* Column 2: Channel List */}
          <ChannelList />
        </div>
        {/* UserPanel spanning columns 1+2 */}
        <UserPanel />
      </div>

      {/* Column 3: Chat Area */}
      <main className="flex flex-1 flex-col min-w-0 bg-background">
        <ChatHeader channelName={channelName} />
        <MessageList messages={messages} channelName={channelName} />
        <MessageInput channelName={channelName} />
      </main>

      {/* Column 4: Member List */}
      <MemberList />
    </>
  );
}
