"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StatusAvatar } from "@/components/ui/StatusAvatar";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ScrollArea } from "@/components/ui/ScrollArea";
import {
  Users,
  MessageCircle,
  MoreVertical,
  Search,
  Check,
  X,
  Video,
  Phone,
  UserX,
} from "lucide-react";
import { MOCK_USERS, MOCK_FRIENDSHIPS, CURRENT_USER } from "@/lib/mock-data";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type FriendsTab = "all" | "pending" | "add";

/* ─── Context menu for friend "three dots" ─────────────────────────── */
function FriendContextMenu({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const { locale } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const items = [
    {
      icon: Video,
      label: locale === "vi" ? "Bắt Đầu Cuộc Gọi Video" : "Start Video Call",
      onClick: () => onClose(),
    },
    {
      icon: Phone,
      label: locale === "vi" ? "Bắt Đầu Cuộc Gọi Thoại" : "Start Voice Call",
      onClick: () => onClose(),
    },
    {
      icon: UserX,
      label: locale === "vi" ? "Xóa Bạn" : "Remove Friend",
      danger: true,
      onClick: () => onClose(),
    },
  ];

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full z-20 mt-1 min-w-[220px] whitespace-nowrap rounded-md bg-background-floating border border-border p-1.5 shadow-xl"
    >
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <button
            key={i}
            onClick={item.onClick}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-[13px] transition-colors cursor-pointer",
              item.danger
                ? "text-destructive hover:bg-destructive hover:text-white"
                : "text-foreground hover:bg-accent hover:text-white"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Header ───────────────────────────────────────────────────────── */
function FriendsHeader({
  activeTab,
  onTabChange,
}: {
  activeTab: FriendsTab;
  onTabChange: (tab: FriendsTab) => void;
}) {
  const { t } = useTranslation();
  const pendingCount = MOCK_FRIENDSHIPS.filter(
    (f) => f.status === "PENDING"
  ).length;

  const TABS: { key: FriendsTab; label: string; highlight?: boolean }[] = [
    { key: "all", label: t("friends.all") },
    { key: "pending", label: t("friends.pending") },
    { key: "add", label: t("friends.addFriend"), highlight: true },
  ];

  return (
    <div className="flex h-12 items-center gap-3 border-b border-border px-4">
      <div className="flex items-center gap-2 text-[15px] text-foreground font-semibold">
        <Users className="h-5 w-5" />
        <span>{t("friends.title")}</span>
      </div>

      <div className="mx-2 h-5 w-px bg-border" />

      <div className="flex items-center gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={cn(
              "relative rounded-md px-3 py-1 text-[14px] font-medium transition-colors cursor-pointer",
              tab.highlight && activeTab !== tab.key
                ? "bg-success text-white hover:bg-success/80"
                : activeTab === tab.key
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            {tab.label}
            {tab.key === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Friend item ──────────────────────────────────────────────────── */
function FriendItem({
  user,
  isPending,
  isIncoming,
}: {
  user: (typeof MOCK_USERS)[0];
  isPending?: boolean;
  isIncoming?: boolean;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const statusKey = user.status.toLowerCase() as
    | "online"
    | "offline"
    | "idle"
    | "dnd";

  function handleNavigate() {
    if (!isPending) {
      router.push(`/dm/${user.id}`);
    }
  }

  return (
    <div
      onClick={handleNavigate}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors border-t border-border/30",
        isPending
          ? "hover:bg-secondary/50"
          : "hover:bg-secondary/50 cursor-pointer"
      )}
    >
      <StatusAvatar
        src={user.avatarUrl}
        fallback={user.username}
        status={user.status}
        size="lg"
      />

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <p className="text-[15px] font-semibold text-foreground truncate leading-snug">
          {user.username}
        </p>
        <p className="text-[13px] text-muted-foreground leading-snug">
          {isPending
            ? isIncoming
              ? t("friends.incomingRequest")
              : t("friends.outgoingRequest")
            : t(`status.${statusKey}`)}
        </p>
      </div>

      <div
        className={cn(
          "flex items-center gap-2",
          isPending
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100 transition-opacity"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {isPending ? (
          <>
            {isIncoming && (
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-success transition-colors cursor-pointer"
                aria-label="Accept"
              >
                <Check className="h-5 w-5" />
              </button>
            )}
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
              aria-label="Reject"
            >
              <X className="h-5 w-5" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => router.push(`/dm/${user.id}`)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label="Message"
            >
              <MessageCircle className="h-[18px] w-[18px]" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label="More"
              >
                <MoreVertical className="h-[18px] w-[18px]" />
              </button>
              {showMenu && (
                <FriendContextMenu
                  userId={user.id}
                  onClose={() => setShowMenu(false)}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── All friends tab ──────────────────────────────────────────────── */
function AllFriends() {
  const { t } = useTranslation();
  const acceptedIds = MOCK_FRIENDSHIPS.filter(
    (f) => f.status === "ACCEPTED"
  ).map((f) => (f.userId === CURRENT_USER.id ? f.friendId : f.userId));

  const friends = MOCK_USERS.filter((u) => acceptedIds.includes(u.id));

  return (
    <div>
      <div className="px-6 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder={t("friends.search")}
            className="h-8 w-full rounded-md bg-background-tertiary pl-9 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>
      </div>
      <div className="px-6 mt-4">
        <h3 className="mb-2 px-3 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
          {t("friends.allCount")} — {friends.length}
        </h3>
        {friends.map((user) => (
          <FriendItem key={user.id} user={user} />
        ))}
      </div>
    </div>
  );
}

/* ─── Pending friends tab ──────────────────────────────────────────── */
function PendingFriends() {
  const { t } = useTranslation();
  const pending = MOCK_FRIENDSHIPS.filter((f) => f.status === "PENDING");

  const pendingUsers = pending.map((f) => {
    const isIncoming = f.friendId === CURRENT_USER.id;
    const otherId = isIncoming ? f.userId : f.friendId;
    const user = MOCK_USERS.find((u) => u.id === otherId)!;
    return { friendship: f, user, isIncoming };
  });

  return (
    <div className="px-6 pt-8">
      <h3 className="mb-2 px-3 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
        {t("friends.pendingCount")} — {pendingUsers.length}
      </h3>
      {pendingUsers.map(({ friendship, user, isIncoming }) => (
        <FriendItem
          key={friendship.id}
          user={user}
          isPending
          isIncoming={isIncoming}
        />
      ))}
      {pendingUsers.length === 0 && (
        <p className="py-8 text-center text-[14px] text-muted-foreground">
          {t("friends.noPending")}
        </p>
      )}
    </div>
  );
}

/* ─── Add friend tab ───────────────────────────────────────────────── */
function AddFriend() {
  const [username, setUsername] = useState("");
  const { t } = useTranslation();

  return (
    <div className="px-6 pt-4">
      <h2 className="text-[16px] font-bold text-foreground">
        {t("friends.addTitle")}
      </h2>
      <p className="mt-1 text-[14px] text-muted-foreground">
        {t("friends.addDescription")}
      </p>

      <div className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t("friends.addPlaceholder")}
            className="h-12 bg-background-tertiary border-accent/30 focus-visible:ring-accent"
          />
        </div>
        <Button
          disabled={!username.trim()}
          className="h-12 px-6 text-[14px] font-medium"
        >
          {t("friends.sendRequest")}
        </Button>
      </div>
    </div>
  );
}

/* ─── Main component ───────────────────────────────────────────────── */
export function FriendsPage() {
  const [activeTab, setActiveTab] = useState<FriendsTab>("all");

  return (
    <div className="flex h-full flex-col">
      <FriendsHeader activeTab={activeTab} onTabChange={setActiveTab} />

      <ScrollArea className="flex-1">
        {activeTab === "all" && <AllFriends />}
        {activeTab === "pending" && <PendingFriends />}
        {activeTab === "add" && <AddFriend />}
      </ScrollArea>
    </div>
  );
}
