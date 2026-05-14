"use client";

import { ScrollArea } from "@/components/ui/ScrollArea";
import { StatusAvatar } from "@/components/ui/StatusAvatar";
import { useTranslation } from "@/lib/i18n";
import { useRoomStore } from "@/stores/roomStore";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import type { MemberDetailResponse } from "@/types";

export function MemberList() {
  const { t } = useTranslation();
  const params = useParams();
  const { channels, members, fetchMembers } = useRoomStore();

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

  useEffect(() => {
    if (activeRoomId) {
      fetchMembers(activeRoomId);
    }
  }, [activeRoomId, fetchMembers]);

  const roomMembers = activeRoomId ? (members[activeRoomId] || []) : [];
  const online = roomMembers.filter((u) => u.status !== "OFFLINE");
  const offline = roomMembers.filter((u) => u.status === "OFFLINE");

  return (
    <div className="flex h-full w-[240px] flex-col bg-[#2b2d31] border-l border-border">
      <ScrollArea className="flex-1 px-2 pt-4">
        <MemberSection
          title={`${t("members.online")} — ${online.length}`}
          users={online}
        />
        <MemberSection
          title={`${t("members.offline")} — ${offline.length}`}
          users={offline}
        />
      </ScrollArea>
    </div>
  );
}

function MemberSection({
  title,
  users,
}: {
  title: string;
  users: MemberDetailResponse[];
}) {
  return (
    <div className="mb-6">
      <h3 className="mb-2 px-3 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-0.5 px-2">
        {users.map((user) => (
          <button
            key={user.userId}
            className="group flex w-full items-center gap-3 rounded-md px-3 py-1.5 transition-colors duration-150 hover:bg-secondary/50 cursor-pointer"
          >
            <StatusAvatar
              src={user.avatarUrl}
              fallback={user.username}
              status={user.status as any}
              size="md"
            />
            <span className="truncate text-[15px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              {user.username}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
