export interface Room {
  id: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  type: "GROUP" | "DM";
  ownerId: string;
  createdAt: string;
}

export interface RoomParticipant {
  id: string;
  userId: string;
  roomId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  joinedAt: string;
  mutedUntil: string | null;
}

export interface Channel {
  id: string;
  roomId: string;
  name: string;
  type: "TEXT" | "VOICE";
  position: number;
}

export interface CreateRoomRequest {
  name: string;
  description?: string;
  type: "GROUP" | "DM";
}
