"use client";

import { Hash, Pin, Users, Search, Bell } from "lucide-react";
import { Separator } from "@/components/ui/Separator";
import { useUIStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  channelName: string;
  channelDescription?: string;
}

function HeaderIcon({
  children,
  label,
  isActive,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md transition-colors duration-150 cursor-pointer",
        isActive
          ? "text-foreground bg-secondary"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

export function ChatHeader({
  channelName,
  channelDescription,
}: ChatHeaderProps) {
  const showMemberList = useUIStore((s) => s.showMemberList);
  const toggleMemberList = useUIStore((s) => s.toggleMemberList);

  return (
    <div className="flex h-12 shrink-0 items-center border-b border-border bg-background px-4">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Hash className="h-5 w-5 shrink-0 text-muted-foreground" />
        <span className="text-[15px] font-semibold text-foreground">{channelName}</span>
        {channelDescription && (
          <>
            <Separator orientation="vertical" className="mx-1 h-5" />
            <span className="truncate text-[13px] text-muted-foreground">
              {channelDescription}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-1">
        <HeaderIcon label="Ghim">
          <Pin className="h-5 w-5" />
        </HeaderIcon>
        <HeaderIcon
          label="Danh sách thành viên"
          isActive={showMemberList}
          onClick={toggleMemberList}
        >
          <Users className="h-5 w-5" />
        </HeaderIcon>
        <div className="relative mx-1">
          <input
            type="text"
            placeholder="Tìm kiếm"
            className="h-7 w-36 rounded-md bg-background-tertiary px-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:w-56 transition-all duration-200 outline-none"
          />
          <Search className="absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
        <HeaderIcon label="Hộp thư">
          <Bell className="h-5 w-5" />
        </HeaderIcon>
      </div>
    </div>
  );
}
