"use client";

import { StatusAvatar } from "@/components/ui/StatusAvatar";
import { Mic, Headphones, Settings } from "lucide-react";
import { CURRENT_USER } from "@/lib/mock-data";
import { useTranslation } from "@/lib/i18n";
import { useUIStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";

function IconButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 cursor-pointer",
        "hover:bg-secondary hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

export function UserPanel() {
  const { t } = useTranslation();
  const openSettings = useUIStore((s) => s.openSettings);
  const statusKey = CURRENT_USER.status.toLowerCase() as
    | "online"
    | "offline"
    | "idle"
    | "dnd";

  return (
    <div className="flex h-[58px] shrink-0 items-center gap-2 rounded-lg bg-background-tertiary px-2 mx-2 mb-2">
      <StatusAvatar
        src={CURRENT_USER.avatarUrl}
        fallback={CURRENT_USER.username}
        status={CURRENT_USER.status}
        size="md"
      />

      <div className="flex-1 min-w-0">
        <p className="truncate text-[14px] font-semibold text-foreground leading-tight">
          {CURRENT_USER.username}
        </p>
        <p className="truncate text-[12px] text-muted-foreground leading-tight">
          {t(`status.${statusKey}`)}
        </p>
      </div>

      <div className="flex items-center gap-0.5">
        <IconButton label={t("userPanel.muteMic")}>
          <Mic className="h-[18px] w-[18px]" />
        </IconButton>
        <IconButton label={t("userPanel.deafen")}>
          <Headphones className="h-[18px] w-[18px]" />
        </IconButton>
        <IconButton label={t("userPanel.settings")} onClick={openSettings}>
          <Settings className="h-[18px] w-[18px]" />
        </IconButton>
      </div>
    </div>
  );
}
