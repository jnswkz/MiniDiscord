import type { User } from "@/types";

export const MOCK_USERS: User[] = [
  {
    id: "u1",
    username: "PhatNguyen",
    email: "phat@discord.mini",
    avatarUrl: null,
    status: "ONLINE",
    createdAt: "2026-01-15T10:00:00Z",
    lastSeenAt: null,
  },
];

export const CURRENT_USER = MOCK_USERS[0];

// DEPRECATED: Other MOCK_* arrays have been removed in favor of real API data
export const MOCK_ROOMS = [];
export const MOCK_CHANNELS = [];
export const MOCK_MESSAGES = [];
export const MOCK_DIRECT_MESSAGES = [];
export const MOCK_FRIENDSHIPS = [];
export const MOCK_PARTICIPANTS = [];

