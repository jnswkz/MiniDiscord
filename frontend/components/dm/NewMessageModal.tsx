"use client";

import { useState, useMemo } from "react";
import { X, Check, ChevronDown } from "lucide-react";
import { StatusAvatar } from "@/components/ui/StatusAvatar";
import {
  MOCK_USERS,
  MOCK_FRIENDSHIPS,
  CURRENT_USER,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface NewMessageModalProps {
  onClose: () => void;
  onCreateDM?: (userIds: string[]) => void;
}

const MAX_FRIENDS = 9;

export function NewMessageModal({ onClose, onCreateDM }: NewMessageModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [friendsExpanded, setFriendsExpanded] = useState(true);
  const [serversExpanded, setServersExpanded] = useState(true);

  // Get accepted friends of current user
  const friends = useMemo(() => {
    const friendUserIds = MOCK_FRIENDSHIPS
      .filter(
        (f) =>
          f.status === "ACCEPTED" &&
          (f.userId === CURRENT_USER.id || f.friendId === CURRENT_USER.id)
      )
      .map((f) =>
        f.userId === CURRENT_USER.id ? f.friendId : f.userId
      );

    return MOCK_USERS.filter((u) => friendUserIds.includes(u.id));
  }, []);

  // Filter by search
  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;
    const q = searchQuery.toLowerCase();
    return friends.filter((f) =>
      f.username.toLowerCase().includes(q)
    );
  }, [friends, searchQuery]);

  function toggleSelect(userId: string) {
    setSelectedIds((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      }
      if (prev.length >= MAX_FRIENDS) return prev;
      return [...prev, userId];
    });
  }

  function handleCreate() {
    if (selectedIds.length === 0) return;
    onCreateDM?.(selectedIds);
    onClose();
  }

  const remaining = MAX_FRIENDS - selectedIds.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative z-10 flex w-full max-w-[460px] min-h-[420px] flex-col rounded-xl bg-[#313338] shadow-2xl animate-in fade-in zoom-in-95 duration-200">

        {/* ─── Header ─── */}
        <div className="px-6 pt-6 pb-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                Tin Nhắn Mới
              </h2>
              <p className="text-sm text-[#b5bac1]/80">
                Bạn có thể thêm {remaining} người bạn nữa.
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#b5bac1] hover:text-white transition-colors cursor-pointer -mt-1 -mr-1"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* ─── Search Input ─── */}
          <div className="mt-5 mb-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm bạn bè hoặc thành viên máy chủ"
              className="message-input-wrapper w-full rounded-md bg-[#1e1f22] px-4 py-3 text-[14px] text-white placeholder:text-[#6d6f78] outline-none focus-visible:outline-none border border-transparent transition-colors"
              autoFocus
            />
          </div>

          {/* Selected chips */}
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2 pb-1">
              {selectedIds.map((id) => {
                const user = MOCK_USERS.find((u) => u.id === id);
                if (!user) return null;
                return (
                  <span
                    key={id}
                    className="flex items-center gap-1 rounded-md bg-[#5865F2] px-2 py-0.5 text-[12px] font-medium text-white cursor-pointer hover:bg-[#4752c4] transition-colors"
                    onClick={() => toggleSelect(id)}
                  >
                    {user.username}
                    <X className="h-3 w-3" />
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Friends List Area ─── */}
        <div className="flex-1 overflow-y-auto px-3 pb-2 max-h-[280px]">

          {/* Section: Bạn bè */}
          <button
            onClick={() => setFriendsExpanded(!friendsExpanded)}
            className="flex items-center gap-1 px-3 mt-3 mb-2 cursor-pointer group"
          >
            <span className="text-[11px] font-bold uppercase tracking-wide text-[#949ba4] group-hover:text-[#dbdee1] transition-colors">
              Bạn bè
            </span>
            <ChevronDown
              className={cn(
                "h-3 w-3 text-[#949ba4] transition-transform duration-200",
                !friendsExpanded && "-rotate-90"
              )}
            />
          </button>

          {friendsExpanded && (
            <div>
              {filteredFriends.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <p className="text-[13px] text-[#949ba4]">
                    Không tìm thấy kết quả nào
                  </p>
                </div>
              ) : (
                filteredFriends.map((friend) => {
                  const isSelected = selectedIds.includes(friend.id);
                  const isDisabled = !isSelected && selectedIds.length >= MAX_FRIENDS;

                  return (
                    <button
                      key={friend.id}
                      onClick={() => !isDisabled && toggleSelect(friend.id)}
                      disabled={isDisabled}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 mb-0.5 transition-colors cursor-pointer",
                        isSelected
                          ? "bg-[#393c41]"
                          : "hover:bg-[#393c41]",
                        isDisabled && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <StatusAvatar
                          src={friend.avatarUrl}
                          fallback={friend.username}
                          status={friend.status}
                          size="md"
                        />
                        <div className="min-w-0 text-left">
                          <p className="text-[15px] font-medium text-white truncate leading-tight">
                            {friend.username}
                          </p>
                          <p className="text-[13px] text-[#949ba4] truncate leading-tight">
                            {friend.username.toLowerCase()}
                          </p>
                        </div>
                      </div>

                      {/* Checkbox */}
                      <div
                        className={cn(
                          "flex h-[22px] w-[22px] items-center justify-center rounded-[4px] border-2 transition-colors shrink-0",
                          isSelected
                            ? "bg-[#5865F2] border-[#5865F2]"
                            : "border-[#5c5e66] bg-transparent"
                        )}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Section: Thành Viên Máy Chủ */}
          <button
            onClick={() => setServersExpanded(!serversExpanded)}
            className="flex items-center gap-1 px-3 mt-4 mb-2 cursor-pointer group"
          >
            <span className="text-[11px] font-bold uppercase tracking-wide text-[#949ba4] group-hover:text-[#dbdee1] transition-colors">
              Thành Viên Máy Chủ
            </span>
            <ChevronDown
              className={cn(
                "h-3 w-3 text-[#949ba4] transition-transform duration-200",
                !serversExpanded && "-rotate-90"
              )}
            />
          </button>

          {serversExpanded && (
            <div className="flex flex-col items-center justify-center py-4 px-3">
              <p className="text-[13px] text-[#949ba4] text-center leading-relaxed">
                Sử dụng thanh tìm kiếm để tìm người cụ thể từ các máy chủ chung.
              </p>
            </div>
          )}
        </div>

        {/* ─── Divider ─── */}
        <div className="h-px bg-white/5" />

        {/* ─── Footer ─── */}
        <div className="flex items-center gap-4 bg-[#2b2d31] px-5 py-4 rounded-b-xl">
          <button
            onClick={onClose}
            className="flex-1 rounded-[3px] px-6 py-2.5 text-[14px] font-medium text-[#dbdee1] hover:text-white hover:underline bg-transparent transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleCreate}
            disabled={selectedIds.length === 0}
            className={cn(
              "flex-1 rounded-[3px] px-8 py-2.5 text-[14px] font-medium text-white transition-colors cursor-pointer",
              selectedIds.length > 0
                ? "bg-[#5865F2] hover:bg-[#4752c4]"
                : "bg-[#5865F2]/50 cursor-not-allowed"
            )}
          >
            Tạo Tin Nhắn
          </button>
        </div>
      </div>
    </div>
  );
}
