"use client";

import { useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Hash, Volume2, ChevronDown, ChevronRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { useRoomStore } from "@/stores/roomStore";
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
        "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-[15px] transition-colors duration-150 cursor-pointer",
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
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-1 px-1 py-1.5 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
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

export function ChannelList() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const sidebarWidth = useUIStore((s) => s.sidebarWidth);
  const { rooms, channels } = useRoomStore();

  // Derive active channel from URL params
  const activeChannelId = (params?.channelId as string) || null;
  let activeRoomId: string | null = null;

  if (activeChannelId) {
    for (const [rId, cList] of Object.entries(channels)) {
      if (cList.some((c) => c.id === activeChannelId)) {
        activeRoomId = rId;
        break;
      }
    }
  }

  // If on dashboard or no active room, fallback to empty or first room
  const displayRoomId = activeRoomId || (rooms.length > 0 ? rooms[0].id : null);
  const room = rooms.find((r) => r.id === displayRoomId);
  const roomChannels = displayRoomId ? (channels[displayRoomId] || []) : [];
  
  const textChannels = roomChannels.filter((c) => c.type === "TEXT");
  const voiceChannels = roomChannels.filter((c) => c.type === "VOICE");

  function handleChannelClick(channelId: string) {
    router.push(`/channels/${channelId}`);
  }

  return (
    <div
      className="flex h-full flex-col bg-[#2b2d31]"
      style={{ width: sidebarWidth }}
    >
      {/* Server Name Header */}
      <button className="flex h-12 items-center justify-between px-4 text-[15px] font-semibold text-foreground hover:bg-secondary/50 transition-colors cursor-pointer shadow-sm">
        <span className="truncate">{room?.name || "Server"}</span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
      </button>

      {/* Channel List */}
      <ScrollArea className="flex-1 px-3 pt-4">
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
