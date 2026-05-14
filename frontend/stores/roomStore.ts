import { create } from "zustand";
import { api } from "@/lib/api";
import type { Room, Channel, MemberDetailResponse } from "@/types";

interface RoomState {
  rooms: Room[];
  channels: Record<string, Channel[]>; // roomId -> channels
  members: Record<string, MemberDetailResponse[]>; // roomId -> members
  isLoading: boolean;
  error: string | null;

  fetchMyRooms: () => Promise<void>;
  fetchChannels: (roomId: string) => Promise<void>;
  fetchMembers: (roomId: string) => Promise<void>;
  createRoom: (name: string, type?: "GROUP" | "DM") => Promise<Room>;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  rooms: [],
  channels: {},
  members: {},
  isLoading: false,
  error: null,

  fetchMyRooms: async () => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.get<{ message: string; data: Room[] }>("/rooms/my");
      const rooms = res.data.data;
      set({ rooms, isLoading: false });
      
      // Auto-fetch channels for all rooms to support channelId -> roomId reverse lookup
      rooms.forEach(room => {
        get().fetchChannels(room.id);
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchChannels: async (roomId: string) => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.get<{ message: string; data: Channel[] }>(`/rooms/${roomId}/channels`);
      set({
        channels: { ...get().channels, [roomId]: res.data.data },
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchMembers: async (roomId: string) => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.get<{ message: string; data: MemberDetailResponse[] }>(`/rooms/${roomId}/members`);
      set({
        members: { ...get().members, [roomId]: res.data.data },
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createRoom: async (name: string, type = "GROUP") => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.post<{ message: string; data: Room }>("/rooms", { name, type });
      await get().fetchMyRooms();
      return res.data.data;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
}));
