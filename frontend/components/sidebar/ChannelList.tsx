"use client";

import { useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { ChevronDown, ChevronRight, Hash, Volume2 } from "lucide-react";
import { MOCK_ROOMS, MOCK_CHANNELS } from "@/lib/mock-data";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Channel } from "@/types";

function ChannelItem({
  channel,
  isActive,
  onClick,
}: {
  channel: Channel;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = channel.type === "TEXT" ? Hash : Volume2;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors duration-150 cursor-pointer",
        isActive
          ? "bg-secondary text-foreground font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
      )}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-60" />
      <span className="truncate">{channel.name}</span>
    </button>
  );
}

function ChannelCategory({
  title,
  channels,
  activeChannelId,
  onChannelClick,
}: {
  title: string;
  channels: Channel[];
  activeChannelId: string | null;
  onChannelClick: (channelId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mb-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-0.5 px-0.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        {isOpen ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        <span>{title}</span>
      </button>
      {isOpen && (
        <div className="space-y-0.5 px-1">
          {channels.map((ch) => (
            <ChannelItem
              key={ch.id}
              channel={ch}
              isActive={ch.id === activeChannelId}
              onClick={() => onChannelClick(ch.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Map channelId -> roomId for reverse lookup
function getRoomIdForChannel(channelId: string): string | null {
  const channel = MOCK_CHANNELS.find((c) => c.id === channelId);
  return channel?.roomId ?? null;
}

export function ChannelList() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();

  // Derive active channel from URL params
  const activeChannelId = (params?.channelId as string) || null;
  // Derive active room from channel, or null if on dashboard
  const activeRoomId = activeChannelId
    ? getRoomIdForChannel(activeChannelId)
    : null;

  const isDashboard = pathname?.startsWith("/dashboard");

  // If on dashboard or no active room, show first room by default
  const displayRoomId = activeRoomId || "r1";
  const room = MOCK_ROOMS.find((r) => r.id === displayRoomId);
  const roomChannels = MOCK_CHANNELS.filter((c) => c.roomId === displayRoomId);
  const textChannels = roomChannels.filter((c) => c.type === "TEXT");
  const voiceChannels = roomChannels.filter((c) => c.type === "VOICE");

  function handleChannelClick(channelId: string) {
    router.push(`/channels/${channelId}`);
  }

  return (
    <div className="flex h-full w-[240px] flex-col bg-background-secondary">
      {/* Server Name Header */}
      <button className="flex h-12 items-center justify-between border-b border-border px-4 font-semibold text-foreground hover:bg-secondary/50 transition-colors cursor-pointer">
        <span className="truncate">{room?.name || "Server"}</span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
      </button>

      {/* Channel List */}
      <ScrollArea className="flex-1 px-2 pt-3">
        <ChannelCategory
          title={t("channels.textChannels")}
          channels={textChannels}
          activeChannelId={activeChannelId}
          onChannelClick={handleChannelClick}
        />
        <ChannelCategory
          title={t("channels.voiceChannels")}
          channels={voiceChannels}
          activeChannelId={activeChannelId}
          onChannelClick={handleChannelClick}
        />
      </ScrollArea>
    </div>
  );
}
