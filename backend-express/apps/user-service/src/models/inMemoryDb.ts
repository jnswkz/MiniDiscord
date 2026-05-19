export type UserRole = 'USER' | 'ADMIN';
export type UserStatus = 'ONLINE' | 'OFFLINE' | 'IDLE' | 'DND';

export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type FriendshipStatus = 'PENDING' | 'ACCEPTED' | 'BLOCKED';

export interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
  createdAt: Date;
  updatedAt: Date;
}

class InMemoryDb {
  public users: Map<string, User> = new Map();
  public friendships: Map<string, Friendship> = new Map();

  // Helper index for faster email lookup
  public usersByEmail: Map<string, string> = new Map();

  constructor() {
    // Optionally seed an admin user
    const adminId = 'admin-123';
    this.users.set(adminId, {
      id: adminId,
      email: 'admin@minidiscord.local',
      passwordHash: 'seeded-no-login', // Just for testing
      name: 'Admin User',
      role: 'ADMIN',
      status: 'ONLINE',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    this.usersByEmail.set('admin@minidiscord.local', adminId);
  }
}

// Singleton instance
export const db = new InMemoryDb();
