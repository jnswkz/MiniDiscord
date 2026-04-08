"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { StatusAvatar } from "@/components/ui/StatusAvatar";
import { Users, Plus, X } from "lucide-react";
import { useFriendStore } from "@/stores/friendStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { NewMessageModal } from "@/components/dm/NewMessageModal";
import { UnreadBadge } from "@/components/ui/UnreadBadge";
import type { DirectMessage } from "@/types";

function DMItem({
  dm,
  isActive,
  unreadCount,
  onClick,
}: {
  dm: DirectMessage;
  isActive: boolean;
  unreadCount: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-4 rounded-md px-3 py-2 transition-colors duration-150 cursor-pointer",
        isActive
          ? "bg-secondary text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
      )}
    >
      <StatusAvatar
        src={dm.recipientAvatar}
        fallback={dm.recipientName}
        status={dm.recipientStatus}
        size="md"
      />
      <span className="flex-1 truncate text-left text-[15px] font-medium">
        {dm.recipientName}
      </span>
      {unreadCount > 0 && (
        <UnreadBadge count={unreadCount} variant="inline" className="group-hover:hidden" />
      )}
      <span
        onClick={(e) => {
          e.stopPropagation();
          // TODO: remove DM from list
        }}
        className="hidden h-5 w-5 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground group-hover:flex"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </span>
    </button>
  );
}

export function DMSidebar({ activeUserId }: { activeUserId?: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const sidebarWidth = useUIStore((s) => s.sidebarWidth);
  const dmList = useFriendStore((s) => s.dmList);
  const getUnreadCount = useNotificationStore((s) => s.getUnreadCount);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);

  const isDashboard = pathname?.startsWith("/dashboard");

  function handleCreateDM(userIds: string[]) {
    // Navigate to first selected user's DM
    if (userIds.length > 0) {
      router.push(`/dm/${userIds[0]}`);
    }
  }

  return (
    <>
      <div
        className="flex h-full flex-col bg-[#2b2d31]"
        style={{ width: sidebarWidth }}
      >
        {/* Search bar */}
        <div className="flex h-12 items-center px-3">
          <button className="flex h-7 w-full items-center rounded-md bg-background-tertiary px-2 text-[13px] text-muted-foreground transition-colors hover:bg-background-tertiary/80 cursor-pointer">
            {t("sidebar.searchOrStart")}
          </button>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-3 pt-3">
            {/* Friends nav */}
            <button
              onClick={() => router.push("/dashboard")}
              className={cn(
                "flex w-full items-center gap-4 rounded-md px-3 py-2.5 text-[15px] font-medium transition-colors cursor-pointer",
                isDashboard && !activeUserId
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <Users className="h-5 w-5 shrink-0" />
              <span>{t("sidebar.friends")}</span>
            </button>

            {/* DM Header */}
            <div className="mt-6 mb-1 flex items-center justify-between px-3">
              <h3 className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t("sidebar.directMessages")}
              </h3>
              <button
                onClick={() => setIsNewMessageModalOpen(true)}
                aria-label={t("sidebar.createDM")}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* DM list */}
            <div className="mt-1 space-y-0.5">
              {dmList.map((dm) => (
                <DMItem
                  key={dm.id}
                  dm={dm}
                  unreadCount={getUnreadCount(dm.recipientId)}
                  isActive={activeUserId === dm.recipientId}
                  onClick={() => {
                    markAsRead(dm.recipientId);
                    router.push(`/dm/${dm.recipientId}`);
                  }}
                />
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* New Message Modal */}
      {isNewMessageModalOpen && (
        <NewMessageModal
          onClose={() => setIsNewMessageModalOpen(false)}
          onCreateDM={handleCreateDM}
        />
      )}
    </>
  );
}
