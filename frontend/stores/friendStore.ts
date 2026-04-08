import { create } from "zustand";
import { MOCK_FRIENDSHIPS, MOCK_DIRECT_MESSAGES, MOCK_USERS, CURRENT_USER } from "@/lib/mock-data";
import type { Friendship, DirectMessage } from "@/types";

interface FriendState {
  friendships: Friendship[];
  dmList: DirectMessage[];

  /* Actions */
  acceptFriend: (userId: string) => void;
  declineFriend: (userId: string) => void;

  /* Computed helpers */
  getAcceptedFriendIds: () => string[];
  getPendingCount: () => number;
}

/* Build initial DM list: only users with ACCEPTED friendships */
function getInitialDmList(): DirectMessage[] {
  const acceptedIds = MOCK_FRIENDSHIPS
    .filter((f) => f.status === "ACCEPTED")
    .map((f) => (f.userId === CURRENT_USER.id ? f.friendId : f.userId));

  return MOCK_DIRECT_MESSAGES.filter((dm) => acceptedIds.includes(dm.recipientId));
}

export const useFriendStore = create<FriendState>((set, get) => ({
  friendships: [...MOCK_FRIENDSHIPS],
  dmList: getInitialDmList(),

  acceptFriend: (userId: string) => {
    const { friendships, dmList } = get();

    // Change friendship status PENDING → ACCEPTED
    const updatedFriendships = friendships.map((f) => {
      const otherId = f.friendId === CURRENT_USER.id ? f.userId : f.friendId;
      if (otherId === userId && f.status === "PENDING") {
        return { ...f, status: "ACCEPTED" as const };
      }
      return f;
    });

    // Add user to DM list if not already there
    let updatedDmList = dmList;
    if (!dmList.some((dm) => dm.recipientId === userId)) {
      const user = MOCK_USERS.find((u) => u.id === userId);
      if (user) {
        const newDm: DirectMessage = {
          id: `dm-${userId}`,
          recipientId: user.id,
          recipientName: user.username,
          recipientAvatar: user.avatarUrl,
          recipientStatus: user.status,
          lastMessage: "",
          lastMessageAt: new Date().toISOString(),
          unreadCount: 0,
        };
        updatedDmList = [newDm, ...dmList];
      }
    }

    set({ friendships: updatedFriendships, dmList: updatedDmList });
  },

  declineFriend: (userId: string) => {
    set((state) => ({
      friendships: state.friendships.filter((f) => {
        const otherId = f.friendId === CURRENT_USER.id ? f.userId : f.friendId;
        return !(otherId === userId && f.status === "PENDING");
      }),
    }));
  },

  getAcceptedFriendIds: () => {
    const { friendships } = get();
    return friendships
      .filter((f) => f.status === "ACCEPTED")
      .map((f) => (f.userId === CURRENT_USER.id ? f.friendId : f.userId));
  },

  getPendingCount: () => {
    return get().friendships.filter((f) => f.status === "PENDING").length;
  },
}));
