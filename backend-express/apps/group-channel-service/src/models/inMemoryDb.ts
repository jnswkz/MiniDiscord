import crypto from 'crypto';

export interface Room {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoomMember {
  roomId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: Date;
}

export interface Channel {
  id: string;
  roomId: string;
  name: string;
  type: 'TEXT' | 'VOICE';
  createdAt: Date;
  updatedAt: Date;
}

class InMemoryDb {
  public rooms: Map<string, Room> = new Map();
  // Key: roomId:userId
  public roomMembers: Map<string, RoomMember> = new Map();
  public channels: Map<string, Channel> = new Map();

  constructor() {
    // Optionally seed a public default room
    const defaultRoomId = 'default-room-1';
    this.rooms.set(defaultRoomId, {
      id: defaultRoomId,
      name: 'General Server',
      description: 'The default server',
      ownerId: 'admin-123',
      isPrivate: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    this.channels.set('default-channel-1', {
      id: 'default-channel-1',
      roomId: defaultRoomId,
      name: 'general',
      type: 'TEXT',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
}

export const db = new InMemoryDb();
