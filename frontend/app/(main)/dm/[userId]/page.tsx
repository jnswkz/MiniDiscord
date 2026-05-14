"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { ServerList } from "@/components/sidebar/ServerList";
import { UserPanel } from "@/components/sidebar/UserPanel";
import { DMSidebar } from "@/components/sidebar/DMSidebar";
import { DmUserPanel } from "@/components/dm/DmUserPanel";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { MessageInput } from "@/components/chat/MessageInput";
import { MessageActions } from "@/components/chat/MessageActions";
import { StatusAvatar } from "@/components/ui/StatusAvatar";
import { Phone, Video, Pin, User, Reply, Server, UserPlus } from "lucide-react";
import { ResizeHandle } from "@/components/ui/ResizeHandle";
import { SlidingPanel } from "@/components/ui/SlidingPanel";
import { useUIStore } from "@/stores/uiStore";
import { useChatStore, type DmMessage } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import { useFriendStore } from "@/stores/friendStore";

function getMutualServersCount(userId: string) {
  // TODO: Implement mutual servers logic with real API
  return 0;
}

import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { DateSeparator } from "@/components/chat/DateSeparator";
import { useNotificationStore } from "@/stores/notificationStore";

function DmMessageItem({
  message,
  isGrouped,
  isBeingReplied,
  onReply,
  onReaction,
  currentUserId,
}: {
  message: DmMessage;
  isGrouped: boolean;
  isBeingReplied: boolean;
  onReply: () => void;
  onReaction?: (emoji: string) => void;
  currentUserId?: string;
}) {
  const time = new Date(message.createdAt).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const fallback = message.senderName;

  if (isGrouped) {
    return (
      <div
        className={cn(
          "group relative flex items-start gap-4 px-4 py-[2px] transition-colors",
          isBeingReplied
            ? "bg-accent/8 hover:bg-accent/12"
            : "hover:bg-secondary/30"
        )}
      >
        <span className="w-10 text-center text-[11px] text-muted-foreground opacity-0 group-hover:opacity-100 pt-0.5 leading-[1.375rem]">
          {time}
        </span>
        <div className="flex-1 min-w-0">
          {/* Reply reference */}
          {message.replyTo && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
              <Reply className="h-3 w-3 rotate-180" />
              <span className="font-semibold text-accent cursor-pointer hover:underline">
                @{message.replyTo.senderName}
              </span>
              <span className="truncate">{message.replyTo.content}</span>
            </div>
          )}
          <p className="text-[0.9375rem] leading-[1.375rem] text-foreground">
            {message.content}
          </p>
          {/* Reaction badges */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {message.reactions.map((reaction, i) => {
                const hasReacted = currentUserId ? reaction.userIds.includes(currentUserId) : false;
                return (
                  <button
                    key={`${reaction.emoji}-${i}`}
                    onClick={() => onReaction?.(reaction.emoji)}
                    className={cn(
                      "flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-xs transition-colors cursor-pointer",
                      hasReacted
                        ? "bg-[#5865F2]/20 border border-[#5865F2]"
                        : "bg-[#2b2d31] border border-transparent hover:border-border"
                    )}
                  >
                    <span>{reaction.emoji}</span>
                    <span className={cn("font-medium", hasReacted ? "text-[#5865F2]" : "text-muted-foreground")}>
                      {reaction.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <MessageActions onReply={onReply} onReaction={onReaction} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative flex items-start gap-4 px-4 pt-[1.0625rem] pb-[2px] transition-colors",
        isBeingReplied
          ? "bg-accent/8 hover:bg-accent/12"
          : "hover:bg-secondary/30"
      )}
    >
      <StatusAvatar
        src={message.senderAvatar}
        fallback={fallback}
        status="ONLINE"
        size="lg"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-[0.9375rem] font-semibold text-foreground leading-[1.375rem] hover:underline cursor-pointer">
            {message.senderName}
          </span>
          <span className="text-[0.75rem] text-muted-foreground leading-[1.375rem]">
            {time}
          </span>
        </div>
        {/* Reply reference */}
        {message.replyTo && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
            <Reply className="h-3 w-3 rotate-180" />
            <span className="font-semibold text-accent cursor-pointer hover:underline">
              @{message.replyTo.senderName}
            </span>
            <span className="truncate">{message.replyTo.content}</span>
          </div>
        )}
        <p className="text-[0.9375rem] leading-[1.375rem] text-foreground">
          {message.content}
        </p>
        {/* Reaction badges */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {message.reactions.map((reaction, i) => {
              const hasReacted = currentUserId ? reaction.userIds.includes(currentUserId) : false;
              return (
                <button
                  key={`${reaction.emoji}-${i}`}
                  onClick={() => onReaction?.(reaction.emoji)}
                  className={cn(
                    "flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-xs transition-colors cursor-pointer",
                    hasReacted
                      ? "bg-[#5865F2]/20 border border-[#5865F2]"
                      : "bg-[#2b2d31] border border-transparent hover:border-border"
                  )}
                >
                  <span>{reaction.emoji}</span>
                  <span className={cn("font-medium", hasReacted ? "text-[#5865F2]" : "text-muted-foreground")}>
                    {reaction.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <MessageActions onReply={onReply} onReaction={onReaction} />
    </div>
  );
}

export default function DmChatPage() {
  const params = useParams();
  const userId = params?.userId as string;
  const { t } = useTranslation();
  const showDmUserPanel = useUIStore((s) => s.showDmUserPanel);
  const toggleDmUserPanel = useUIStore((s) => s.toggleDmUserPanel);
  const sidebarWidth = useUIStore((s) => s.sidebarWidth);
  const setSidebarWidth = useUIStore((s) => s.setSidebarWidth);

  const handleResize = useCallback(
    (delta: number) => setSidebarWidth(sidebarWidth + delta),
    [sidebarWidth, setSidebarWidth]
  );

  const { dmList } = useFriendStore();
  const currentUser = useAuthStore((s) => s.user);
  
  const friend = dmList.find((u) => u.recipientId === userId);
  const friendName = friend?.recipientName || "User";
  const [modalType, setModalType] = useState<"REMOVE_FRIEND" | "BLOCK" | null>(null);
  const [relationship, setRelationship] = useState<"friend" | "none" | "blocked">("friend");

  // Chat store
  const messages = useChatStore((s) => s.getDmMessages(userId));
  const sendDmMessage = useChatStore((s) => s.sendDmMessage);
  const addDmReaction = useChatStore((s) => s.addDmReaction);
  const replyingTo = useChatStore((s) => s.replyingTo);
  const setReplyingTo = useChatStore((s) => s.setReplyingTo);

  const handleSend = useCallback(
    (content: string) => sendDmMessage(userId, content),
    [userId, sendDmMessage]
  );

  // Auto-mark DM as read when entering
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  useEffect(() => {
    markAsRead(userId);
  }, [userId, markAsRead]);

  // Auto-scroll to bottom
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <>
      {/* Left shell combines columns 1 + 2 and keeps a bottom lane free for the floating user panel. */}
      <div
        className="relative flex shrink-0 flex-col bg-background-tertiary border-r border-border"
        style={{ paddingBottom: "var(--floating-user-panel-offset)" }}
      >
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <ServerList />
          <DMSidebar activeUserId={userId} />
        </div>
        <UserPanel />
      </div>

      <ResizeHandle onResize={handleResize} />

      {/* Column 3 is the positioning context for the floating message composer. */}
      <main className="relative flex flex-1 min-w-0 flex-col bg-[#313338]">
        {/* DM Header */}
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-[#313338] px-4">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-semibold text-foreground">
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
            <button
              onClick={toggleDmUserPanel}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md transition-colors cursor-pointer",
                showDmUserPanel
                  ? "text-foreground bg-secondary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Toggle user panel"
            >
              <User className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div
            className="flex min-h-full flex-col"
            style={{ paddingBottom: "var(--floating-message-input-offset)" }}
          >
            {/* ─── Welcome Header (Discord-accurate) ─── */}
            <div className="px-4 pt-4 pb-4">
              {/* Large Avatar */}
              <div className="mb-3">
                <StatusAvatar
                  src={friend?.recipientAvatar ?? null}
                  fallback={friendName}
                  status={friend?.recipientStatus || "OFFLINE"}
                  size="xl"
                />
              </div>

              {/* Display Name */}
              <h2 className="text-[2rem] font-bold text-foreground leading-tight">
                {friendName}
              </h2>

              {/* Secondary Username */}
              <p className="text-[15px] text-muted-foreground mt-0.5">
                {friendName.toLowerCase()}
              </p>

              {/* Description */}
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                {t("dm.welcomeMessage")}{" "}
                <strong className="font-semibold text-foreground">{friendName}</strong>.
              </p>

              {/* Mutual Servers + Action Buttons Row */}
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {/* Mutual Servers Badge */}
                {getMutualServersCount(userId) > 0 && (
                  <div className="flex items-center gap-1.5 rounded-full bg-secondary/60 px-3 py-1 text-[13px] text-muted-foreground">
                    <Server className="h-3.5 w-3.5" />
                    <span>{getMutualServersCount(userId)} {t("dm.mutualServers")}</span>
                  </div>
                )}

                {/* Relationship: friend → show Remove + Block */}
                {relationship === "friend" && (
                  <>
                    <button
                      onClick={() => setModalType("REMOVE_FRIEND")}
                      className="rounded-[3px] border border-border bg-transparent px-4 py-1.5 text-[13px] font-medium text-foreground hover:bg-secondary/50 transition-colors duration-150 cursor-pointer"
                    >
                      {t("dm.removeFriend")}
                    </button>
                    <button
                      onClick={() => setModalType("BLOCK")}
                      className="rounded-[3px] border border-border bg-transparent px-4 py-1.5 text-[13px] font-medium text-foreground hover:bg-secondary/50 transition-colors duration-150 cursor-pointer"
                    >
                      {t("dm.block")}
                    </button>
                  </>
                )}

                {/* Relationship: none → show Add Friend */}
                {relationship === "none" && (
                  <button
                    onClick={() => setRelationship("friend")}
                    className="flex items-center gap-1.5 rounded-[3px] bg-accent px-4 py-1.5 text-[13px] font-medium text-white hover:bg-accent-hover transition-colors duration-150 cursor-pointer"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    {t("dm.addFriend")}
                  </button>
                )}

                {/* Relationship: blocked → show Unblock + Report Spam */}
                {relationship === "blocked" && (
                  <>
                    <button
                      onClick={() => setRelationship("none")}
                      className="rounded-[3px] border border-border bg-transparent px-4 py-1.5 text-[13px] font-medium text-foreground hover:bg-secondary/50 transition-colors duration-150 cursor-pointer"
                    >
                      {t("dm.unblock")}
                    </button>
                    <button
                      className="rounded-[3px] bg-destructive px-4 py-1.5 text-[13px] font-medium text-white hover:bg-destructive/80 transition-colors duration-150 cursor-pointer"
                    >
                      {t("dm.reportSpam")}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Date Divider */}
            <div className="relative mx-4 mb-3">
              <div className="h-px bg-border" />
            </div>

            {/* Messages */}
            <div className="pb-2">
              {messages.map((msg, i) => {
                const prev = messages[i - 1];

                // Date separator check
                const msgDate = new Date(msg.createdAt);
                const prevDate = prev ? new Date(prev.createdAt) : null;
                const showDateSeparator =
                  i === 0 ||
                  !prevDate ||
                  msgDate.getFullYear() !== prevDate.getFullYear() ||
                  msgDate.getMonth() !== prevDate.getMonth() ||
                  msgDate.getDate() !== prevDate.getDate();

                const isGrouped =
                  !!prev &&
                  prev.senderId === msg.senderId &&
                  !showDateSeparator &&
                  msgDate.getTime() - new Date(prev.createdAt).getTime() < 5 * 60 * 1000;

                return (
                  <div key={msg.id}>
                    {showDateSeparator && (
                      <DateSeparator date={msgDate} />
                    )}
                    <DmMessageItem
                      message={msg}
                      currentUserId={currentUser?.id}
                      isGrouped={isGrouped}
                      isBeingReplied={replyingTo?.messageId === msg.id}
                      onReply={() =>
                        setReplyingTo({
                          messageId: msg.id,
                          senderName: msg.senderName,
                          content: msg.content,
                        })
                      }
                      onReaction={(emoji) => addDmReaction(userId, msg.id, emoji)}
                    />
                  </div>
                );
              })}
            </div>

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Bottom bar: MessageInput or Blocked bar */}
        {relationship === "blocked" ? (
          <div
            className="absolute inset-x-0 z-20 px-4"
            style={{ bottom: "var(--floating-bar-gap)" }}
          >
            <div
              className="flex items-center justify-between px-4 shadow-[0_12px_30px_rgba(0,0,0,0.24)]"
              style={{
                minHeight: "var(--floating-user-panel-height)",
                borderRadius: "var(--floating-bar-radius)",
                backgroundColor: "#383a40",
              }}
            >
              <span className="text-sm font-semibold text-zinc-200">
                {t("dm.blockedMessage")}
              </span>
              <button
                onClick={() => setRelationship("none")}
                className="shrink-0 rounded bg-[#2b2d31] px-4 py-1.5 text-sm text-white hover:bg-[#1e1f22] transition-colors cursor-pointer"
              >
                {t("dm.unblock")}
              </button>
            </div>
          </div>
        ) : (
          <MessageInput channelName={friendName} isDm onSend={handleSend} />
        )}
      </main>

      <SlidingPanel show={showDmUserPanel} width={340}>
        <DmUserPanel userId={userId} />
      </SlidingPanel>

      {/* Confirm Modal (Remove Friend / Block) */}
      {modalType && (
        <ConfirmModal
          title={
            modalType === "REMOVE_FRIEND"
              ? `${t("modal.removeFriendTitle")} ${friendName}`
              : `${t("modal.blockTitle")} ${friendName}`
          }
          description={
            modalType === "REMOVE_FRIEND" ? (
              <p>
                {t("modal.removeFriendDesc").split("{name}")[0]}
                <strong className="font-semibold text-white">{friendName}</strong>
                {t("modal.removeFriendDesc").split("{name}")[1]}
              </p>
            ) : (
              <p>
                {t("modal.blockDesc").split("{name}")[0]}
                <strong className="font-semibold text-white">{friendName}</strong>
                {t("modal.blockDesc").split("{name}")[1]}
              </p>
            )
          }
          confirmText={
            modalType === "REMOVE_FRIEND"
              ? t("modal.removeFriendConfirm")
              : t("modal.blockConfirm")
          }
          onClose={() => setModalType(null)}
          onConfirm={() => {
            if (modalType === "REMOVE_FRIEND") {
              setRelationship("none");
            } else {
              setRelationship("blocked");
            }
          }}
        />
      )}
    </>
  );
}
