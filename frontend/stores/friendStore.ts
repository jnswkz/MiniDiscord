import { create } from "zustand";
import { api } from "@/lib/api";
import type { FriendResponse, PendingFriendResponse, DirectMessage } from "@/types/friend";

// ── Debounced re-fetch (Gotcha B: avoid burst API calls) ──────────
let pendingTimer: ReturnType<typeof setTimeout> | null = null;
let friendsTimer: ReturnType<typeof setTimeout> | null = null;

function debouncedFetchPending() {
  if (pendingTimer) clearTimeout(pendingTimer);
  pendingTimer = setTimeout(() => {
    useFriendStore.getState().fetchPending();
  }, 300);
}

function debouncedFetchFriends() {
  if (friendsTimer) clearTimeout(friendsTimer);
  friendsTimer = setTimeout(() => {
    useFriendStore.getState().fetchFriends();
  }, 300);
}

interface FriendState {
  friends: FriendResponse[];
  pendingRequests: PendingFriendResponse[];
  dmList: DirectMessage[];
  isLoading: boolean;
  error: string | null;

  /* Actions */
  fetchFriends: () => Promise<void>;
  fetchPending: () => Promise<void>;
  sendRequest: (identifier: string) => Promise<void>;
  acceptFriend: (friendshipId: string) => Promise<void>;
  declineOrRemoveFriend: (friendshipId: string) => Promise<void>;

  /* WebSocket event handler */
  handleWsEvent: (type: string) => void;

  /* Computed helpers */
  getPendingCount: () => number;
}

export const useFriendStore = create<FriendState>((set, get) => ({
  friends: [],
  pendingRequests: [],
  dmList: [],
  isLoading: false,
  error: null,

  fetchFriends: async () => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.get<{ success: boolean; data: FriendResponse[] }>("/users/friends");
      set({ friends: res.data.data || [], isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchPending: async () => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.get<{ success: boolean; data: PendingFriendResponse[] }>("/users/friends/pending");
      set({ pendingRequests: res.data.data || [], isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  sendRequest: async (identifier: string) => {
    try {
      await api.post("/users/friends/request", { identifier });
      await get().fetchPending();
    } catch (error: any) {
      set({ error: error.response?.data?.message || error.message });
      throw error;
    }
  },

  acceptFriend: async (friendshipId: string) => {
    try {
      await api.put(`/users/friends/${friendshipId}/accept`);
      await Promise.all([get().fetchFriends(), get().fetchPending()]);
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  declineOrRemoveFriend: async (friendshipId: string) => {
    try {
      await api.delete(`/users/friends/${friendshipId}`);
      await Promise.all([get().fetchFriends(), get().fetchPending()]);
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  handleWsEvent: (type: string) => {
    switch (type) {
      case "FRIEND_REQUEST_SENT":
        debouncedFetchPending();
        break;
      case "FRIEND_ACCEPTED":
        debouncedFetchFriends();
        debouncedFetchPending();
        break;
      case "FRIEND_REMOVED":
        debouncedFetchFriends();
        break;
    }
  },

  getPendingCount: () => {
    return get().pendingRequests.length;
  },
}));
