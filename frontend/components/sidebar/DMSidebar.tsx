"use client";

import { useRouter, usePathname } from "next/navigation";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { StatusAvatar } from "@/components/ui/StatusAvatar";
import { Users, Plus } from "lucide-react";
import { MOCK_DIRECT_MESSAGES } from "@/lib/mock-data";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { DirectMessage } from "@/types";

function DMItem({
  dm,
  isActive,
  onClick,
}: {
  dm: DirectMessage;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-3 rounded-md px-2 py-1.5 transition-colors duration-150 cursor-pointer",
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
      <span className="flex-1 truncate text-left text-sm">
        {dm.recipientName}
      </span>
      {dm.unreadCount > 0 && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
          {dm.unreadCount}
        </span>
      )}
    </button>
  );
}

export function DMSidebar({ activeUserId }: { activeUserId?: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();

  const isDashboard = pathname?.startsWith("/dashboard");

  return (
    <div className="flex h-full w-[240px] flex-col bg-background-secondary">
      {/* Search bar */}
      <div className="flex h-12 items-center border-b border-border px-3">
        <button className="flex h-7 w-full items-center rounded-md bg-background-tertiary px-2 text-xs text-muted-foreground transition-colors hover:bg-background-tertiary/80 cursor-pointer">
          {t("sidebar.searchOrStart")}
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-2 pt-2">
          {/* Friends nav */}
          <button
            onClick={() => router.push("/dashboard")}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors cursor-pointer",
              isDashboard && !activeUserId
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            <Users className="h-5 w-5 shrink-0" />
            <span>{t("sidebar.friends")}</span>
          </button>

          {/* DM Header */}
          <div className="mt-4 flex items-center justify-between px-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("sidebar.directMessages")}
            </h3>
            <button
              aria-label={t("sidebar.createDM")}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* DM list */}
          <div className="mt-1 space-y-0.5">
            {MOCK_DIRECT_MESSAGES.map((dm) => (
              <DMItem
                key={dm.id}
                dm={dm}
                isActive={activeUserId === dm.recipientId}
                onClick={() => router.push(`/dm/${dm.recipientId}`)}
              />
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
