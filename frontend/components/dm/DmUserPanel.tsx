"use client";

import { useState } from "react";
import { StatusAvatar } from "@/components/ui/StatusAvatar";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Button } from "@/components/ui/Button";
import {
  X,
  MessageCircle,
  MoreHorizontal,
  UserPlus,
  Calendar,
  Server,
} from "lucide-react";
import {
  MOCK_USERS,
  MOCK_ROOMS,
  MOCK_PARTICIPANTS,
  CURRENT_USER,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

function formatDate(dateStr: string, locale: string = "vi-VN") {
  return new Date(dateStr).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getMutualServers(userId: string) {
  const currentUserRooms = MOCK_PARTICIPANTS.filter(
    (p) => p.userId === CURRENT_USER.id
  ).map((p) => p.roomId);
  const friendRooms = MOCK_PARTICIPANTS.filter(
    (p) => p.userId === userId
  ).map((p) => p.roomId);
  const mutualRoomIds = currentUserRooms.filter((id) =>
    friendRooms.includes(id)
  );
  return MOCK_ROOMS.filter((r) => mutualRoomIds.includes(r.id));
}

/* ─── Full Profile Modal (2-column layout) ─────────────────────────── */
function UserProfileModal({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<
    "activity" | "mutual" | "servers"
  >("activity");
  const [note, setNote] = useState("");
  const mutualServers = getMutualServers(user.id);
  const isFriend = true; // Mock: assume they are friends if viewing DM

  const TABS = [
    { key: "activity" as const, label: "Hoạt động" },
    { key: "mutual" as const, label: "Không có bạn chung" },
    {
      key: "servers" as const,
      label: `${mutualServers.length} Máy Chủ Chung`,
    },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative z-10 flex w-[880px] max-w-[90vw] h-[560px] max-h-[80vh] rounded-lg overflow-hidden shadow-2xl border border-border/50 bg-background-secondary animate-in fade-in zoom-in-95 duration-200">
        {/* ─── Column 1: Profile Info ─── */}
        <div className="flex w-[300px] shrink-0 flex-col">
          {/* Banner */}
          <div className="h-[120px] bg-accent shrink-0" />

          {/* Profile content */}
          <div className="flex flex-1 flex-col px-4">
            {/* Avatar overlapping banner */}
            <div className="relative -mt-12 mb-2">
              <StatusAvatar
                src={user.avatarUrl}
                fallback={user.username}
                status={user.status}
                size="xl"
              />
            </div>

            {/* Name */}
            <h2 className="text-xl font-bold text-foreground">
              {user.username}
            </h2>
            <p className="text-sm text-muted-foreground">
              {user.username.toLowerCase()}
            </p>

            {/* Action buttons */}
            <div className="mt-3 flex items-center gap-2">
              {isFriend ? (
                <Button size="sm" className="text-xs h-8 gap-1.5 bg-success hover:bg-success/80">
                  <MessageCircle className="h-3.5 w-3.5" />
                  Nhắn tin
                </Button>
              ) : (
                <Button size="sm" className="text-xs h-8 gap-1.5">
                  <UserPlus className="h-3.5 w-3.5" />
                  Thêm Bạn
                </Button>
              )}
              <button className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <UserPlus className="h-4 w-4" />
              </button>
              <button className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>

            {/* Separator */}
            <div className="my-3 border-t border-border" />

            {/* Join date */}
            <div className="mb-3">
              <p className="text-xs font-bold text-foreground">Gia Nhập Từ</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatDate(user.createdAt)}
              </p>
            </div>

            {/* Notes */}
            <div className="mb-4">
              <p className="text-xs font-bold text-foreground">
                Ghi chú (chỉ hiển thị cho bạn)
              </p>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhấp để thêm ghi chú"
                className="mt-1 w-full rounded-md bg-background-tertiary px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none border border-transparent focus:border-accent transition-colors"
              />
            </div>
          </div>
        </div>

        {/* ─── Column 2: Tabs Content ─── */}
        <div className="flex flex-1 flex-col min-w-0 bg-background">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Tabs header */}
          <div className="flex gap-4 border-b border-border px-4 pt-4">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "pb-2 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px",
                  activeTab === tab.key
                    ? "border-accent text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <ScrollArea className="flex-1">
            <div className="p-4">
              {activeTab === "activity" && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm font-medium text-foreground">
                    {user.username} không có hoạt động nào để chia sẻ ở đây
                  </p>
                  <p className="mt-2 max-w-[280px] text-xs text-muted-foreground leading-relaxed">
                    Chưa có hoạt động chung nào - hãy gửi một lời chào thân thiện để bắt đầu trò chuyện
                  </p>
                </div>
              )}

              {activeTab === "mutual" && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm font-medium text-foreground">
                    Các bạn không có bạn chung nào
                  </p>
                  <p className="mt-2 max-w-[280px] text-xs text-muted-foreground leading-relaxed">
                    Mạng lưới bạn bè của bạn giống như các thiên hà riêng biệt vậy - đã đến lúc va chạm vào nhau rồi!
                  </p>
                </div>
              )}

              {activeTab === "servers" && (
                <div className="space-y-1">
                  {mutualServers.map((server) => (
                    <div
                      key={server.id}
                      className="flex items-center gap-3 rounded-md p-2.5 hover:bg-secondary/50 transition-colors cursor-pointer"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-accent text-sm font-semibold text-foreground shrink-0">
                        {server.name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          Máy chủ của {server.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {server.description}
                        </p>
                      </div>
                    </div>
                  ))}
                  {mutualServers.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <p className="text-sm text-muted-foreground">
                        Không có máy chủ chung
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

/* ─── Column 4: DM User Info Panel ─────────────────────────────────── */
export function DmUserPanel({ userId }: { userId: string }) {
  const [showProfile, setShowProfile] = useState(false);
  const user = MOCK_USERS.find((u) => u.id === userId);
  if (!user) return null;

  const mutualServers = getMutualServers(userId);

  return (
    <>
      <aside className="flex h-full w-[340px] shrink-0 flex-col border-l border-border bg-background-secondary">
        {/* Header */}
        <div className="flex h-12 items-center border-b border-border px-4">
          <span className="text-sm font-semibold text-foreground truncate">
            {user.username}
          </span>
        </div>

        <ScrollArea className="flex-1">
          <div className="flex flex-col items-center px-4 pt-6">
            {/* Avatar */}
            <StatusAvatar
              src={user.avatarUrl}
              fallback={user.username}
              status={user.status}
              size="xl"
            />

            {/* Name + tag */}
            <h3 className="mt-3 text-lg font-bold text-foreground">
              {user.username}
            </h3>
            <p className="text-xs text-muted-foreground">
              {user.username.toLowerCase()}
            </p>
          </div>

          {/* Info section */}
          <div className="mt-4 mx-4 space-y-4 rounded-lg bg-background-tertiary p-4">
            {/* Join date */}
            <div>
              <p className="text-xs font-bold text-foreground mb-0.5">
                Gia Nhập Từ
              </p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(user.createdAt)}
              </p>
            </div>

            {/* Mutual servers */}
            <div>
              <p className="text-xs font-bold text-foreground mb-1.5">
                Máy Chủ Chung — {mutualServers.length}
              </p>
              <div className="space-y-1.5">
                {mutualServers.map((server) => (
                  <div
                    key={server.id}
                    className="flex items-center gap-2 rounded-md p-1.5 hover:bg-secondary/50 transition-colors cursor-pointer"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-accent text-[10px] font-semibold text-foreground">
                      {server.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <span className="text-xs text-foreground">
                      {server.name}
                    </span>
                  </div>
                ))}
                {mutualServers.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Không có máy chủ chung
                  </p>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* View full profile button */}
        <div className="p-3 border-t border-border">
          <button
            onClick={() => setShowProfile(true)}
            className="w-full rounded-md bg-secondary px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
          >
            Xem hồ sơ đầy đủ
          </button>
        </div>
      </aside>

      {/* Full profile modal */}
      {showProfile && (
        <UserProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
        />
      )}
    </>
  );
}
