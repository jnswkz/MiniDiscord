import { ServerList } from "@/components/sidebar/ServerList";
import { UserPanel } from "@/components/sidebar/UserPanel";
import { DMSidebar } from "@/components/sidebar/DMSidebar";
import { DmUserPanel } from "@/components/dm/DmUserPanel";
import { StatusAvatar } from "@/components/ui/StatusAvatar";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Phone, Video, Pin, UserX, Ban, Plus, Gift, Smile, Send } from "lucide-react";
import { MOCK_USERS, MOCK_DIRECT_MESSAGES, CURRENT_USER } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

// Mock DM chat messages for demo
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
      content: MOCK_DIRECT_MESSAGES.find((dm) => dm.recipientId === userId)?.lastMessage || "Mình ổn, cảm ơn!",
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
      <div className="group flex items-start gap-4 px-4 py-0.5 hover:bg-secondary/30">
        <span className="w-10 text-center text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 pt-1">
          {time}
        </span>
        <p className="text-sm text-foreground">{message.content}</p>
      </div>
    );
  }

  return (
    <div className="group flex items-start gap-4 px-4 pt-4 pb-0.5 hover:bg-secondary/30">
      <StatusAvatar
        src={message.senderAvatar}
        fallback={fallback}
        status="ONLINE"
        size="lg"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-foreground">
            {message.senderName}
          </span>
          <span className="text-[11px] text-muted-foreground">{time}</span>
        </div>
        <p className="text-sm text-foreground">{message.content}</p>
      </div>
    </div>
  );
}

export default async function DmChatPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const friend = MOCK_USERS.find((u) => u.id === userId);
  const friendName = friend?.username || "User";
  const messages = getDmMessages(userId);

  return (
    <>
      {/* Left section */}
      <div className="flex shrink-0 flex-col">
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <ServerList />
          <DMSidebar activeUserId={userId} />
        </div>
        <UserPanel />
      </div>

      {/* Column 3: DM Chat */}
      <main className="flex flex-1 flex-col min-w-0 bg-background">
        {/* DM Header */}
        <div className="flex h-12 items-center justify-between border-b border-border bg-background px-4">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-foreground">
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
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="flex flex-col justify-end min-h-full">
            {/* Welcome */}
            <div className="px-4 pt-16 pb-4">
              <StatusAvatar
                src={friend?.avatarUrl ?? null}
                fallback={friendName}
                status={friend?.status || "OFFLINE"}
                size="xl"
              />
              <h2 className="mt-2 text-2xl font-bold text-foreground">
                {friendName}
              </h2>
              <p className="text-sm text-muted-foreground">
                Đây là khởi đầu cuộc trò chuyện trực tiếp với <strong>{friendName}</strong>.
              </p>
              <div className="mt-2 flex gap-2">
                <button className="rounded-md bg-secondary px-3 py-1 text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors cursor-pointer">
                  Xóa Bạn
                </button>
                <button className="rounded-md bg-secondary px-3 py-1 text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors cursor-pointer">
                  Chặn
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="pb-4">
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
        <div className="px-4 pb-6">
          <div className="flex items-center gap-2 rounded-lg bg-input px-4 py-2.5">
            <button className="shrink-0 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <Plus className="h-5 w-5" />
            </button>
            <input
              type="text"
              placeholder={`Nhắn @${friendName}`}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <div className="flex items-center gap-1.5">
              <button className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <Gift className="h-5 w-5" />
              </button>
              <button className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <Smile className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Column 4: User Info Panel */}
      <DmUserPanel userId={userId} />
    </>
  );
}
