import type { User, Room, Channel, Message, RoomParticipant, Friendship, DirectMessage } from "@/types";

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
  {
    id: "u2",
    username: "MinhTran",
    email: "minh@discord.mini",
    avatarUrl: null,
    status: "ONLINE",
    createdAt: "2026-01-16T10:00:00Z",
    lastSeenAt: null,
  },
  {
    id: "u3",
    username: "LinhDao",
    email: "linh@discord.mini",
    avatarUrl: null,
    status: "IDLE",
    createdAt: "2026-02-01T10:00:00Z",
    lastSeenAt: "2026-03-26T12:00:00Z",
  },
  {
    id: "u4",
    username: "HoangVu",
    email: "hoang@discord.mini",
    avatarUrl: null,
    status: "DND",
    createdAt: "2026-02-05T10:00:00Z",
    lastSeenAt: null,
  },
  {
    id: "u5",
    username: "ThaoLe",
    email: "thao@discord.mini",
    avatarUrl: null,
    status: "OFFLINE",
    createdAt: "2026-02-10T10:00:00Z",
    lastSeenAt: "2026-03-25T08:30:00Z",
  },
  {
    id: "u6",
    username: "DucPham",
    email: "duc@discord.mini",
    avatarUrl: null,
    status: "ONLINE",
    createdAt: "2026-02-12T10:00:00Z",
    lastSeenAt: null,
  },
];

export const MOCK_ROOMS: Room[] = [
  {
    id: "r1",
    name: "MiniDiscord Dev",
    description: "Main development server",
    iconUrl: null,
    type: "GROUP",
    ownerId: "u1",
    createdAt: "2026-01-20T10:00:00Z",
  },
  {
    id: "r2",
    name: "Study Group",
    description: "Learning together",
    iconUrl: null,
    type: "GROUP",
    ownerId: "u2",
    createdAt: "2026-02-01T10:00:00Z",
  },
  {
    id: "r3",
    name: "Gaming Hub",
    description: "Play games and chill",
    iconUrl: null,
    type: "GROUP",
    ownerId: "u3",
    createdAt: "2026-02-15T10:00:00Z",
  },
];

export const MOCK_CHANNELS: Channel[] = [
  // MiniDiscord Dev channels
  { id: "c1", roomId: "r1", name: "general", type: "TEXT", position: 0 },
  { id: "c2", roomId: "r1", name: "announcements", type: "TEXT", position: 1 },
  { id: "c3", roomId: "r1", name: "frontend", type: "TEXT", position: 2 },
  { id: "c4", roomId: "r1", name: "backend", type: "TEXT", position: 3 },
  { id: "c5", roomId: "r1", name: "General Voice", type: "VOICE", position: 4 },
  { id: "c6", roomId: "r1", name: "Pair Programming", type: "VOICE", position: 5 },
  // Study Group channels
  { id: "c7", roomId: "r2", name: "general", type: "TEXT", position: 0 },
  { id: "c8", roomId: "r2", name: "resources", type: "TEXT", position: 1 },
  { id: "c9", roomId: "r2", name: "Study Room", type: "VOICE", position: 2 },
  // Gaming Hub channels
  { id: "c10", roomId: "r3", name: "general", type: "TEXT", position: 0 },
  { id: "c11", roomId: "r3", name: "looking-for-group", type: "TEXT", position: 1 },
  { id: "c12", roomId: "r3", name: "Game Night", type: "VOICE", position: 2 },
];

export const MOCK_PARTICIPANTS: RoomParticipant[] = [
  { id: "p1", userId: "u1", roomId: "r1", role: "OWNER", joinedAt: "2026-01-20T10:00:00Z", mutedUntil: null },
  { id: "p2", userId: "u2", roomId: "r1", role: "ADMIN", joinedAt: "2026-01-21T10:00:00Z", mutedUntil: null },
  { id: "p3", userId: "u3", roomId: "r1", role: "MEMBER", joinedAt: "2026-01-22T10:00:00Z", mutedUntil: null },
  { id: "p4", userId: "u4", roomId: "r1", role: "MEMBER", joinedAt: "2026-01-23T10:00:00Z", mutedUntil: null },
  { id: "p5", userId: "u5", roomId: "r1", role: "MEMBER", joinedAt: "2026-01-24T10:00:00Z", mutedUntil: null },
  { id: "p6", userId: "u6", roomId: "r1", role: "MEMBER", joinedAt: "2026-01-25T10:00:00Z", mutedUntil: null },
];

export const MOCK_MESSAGES: Message[] = [
  // ─── 26 tháng 3, 2026 ───
  {
    id: "m1", roomId: "r1", channelId: "c1", senderId: "u2", senderName: "MinhTran", senderAvatar: null,
    type: "TEXT", content: "Chào mọi người! 👋 Server mới tạo xong rồi nè", fileUrl: null, fileName: null, fileSize: null,
    reactions: [{ emoji: "👋", userIds: ["u1", "u3"], count: 2 }],
    isEdited: false, isDeleted: false, editedAt: null, createdAt: "2026-03-26T08:00:00Z", replyTo: null,
  },
  {
    id: "m2", roomId: "r1", channelId: "c1", senderId: "u1", senderName: "PhatNguyen", senderAvatar: null,
    type: "TEXT", content: "Welcome! Mình đã setup xong phần BE microservices rồi. Frontend đang khởi tạo.", fileUrl: null, fileName: null, fileSize: null,
    reactions: [], isEdited: false, isDeleted: false, editedAt: null, createdAt: "2026-03-26T08:05:00Z", replyTo: null,
  },
  {
    id: "m3", roomId: "r1", channelId: "c1", senderId: "u3", senderName: "LinhDao", senderAvatar: null,
    type: "TEXT", content: "Nice! Mình sẽ lo phần DB schema nhé 🔥", fileUrl: null, fileName: null, fileSize: null,
    reactions: [{ emoji: "🔥", userIds: ["u1", "u2", "u4"], count: 3 }],
    isEdited: false, isDeleted: false, editedAt: null, createdAt: "2026-03-26T08:10:00Z", replyTo: null,
  },
  {
    id: "m4", roomId: "r1", channelId: "c1", senderId: "u4", senderName: "HoangVu", senderAvatar: null,
    type: "TEXT", content: "Ae đã test WebSocket chưa? Mình thấy cần config CORS cho API Gateway", fileUrl: null, fileName: null, fileSize: null,
    reactions: [], isEdited: false, isDeleted: false, editedAt: null, createdAt: "2026-03-26T08:15:00Z", replyTo: null,
  },
  {
    id: "m5", roomId: "r1", channelId: "c1", senderId: "u1", senderName: "PhatNguyen", senderAvatar: null,
    type: "TEXT", content: "Rồi, mình đã thêm CorsConfig vào Gateway. Test thử đi Hoàng.", fileUrl: null, fileName: null, fileSize: null,
    reactions: [{ emoji: "👍", userIds: ["u4"], count: 1 }],
    isEdited: true, isDeleted: false, editedAt: "2026-03-26T08:20:00Z", createdAt: "2026-03-26T08:18:00Z",
    replyTo: { messageId: "m4", content: "Ae đã test WebSocket chưa?...", senderName: "HoangVu" },
  },
  {
    id: "m6", roomId: "r1", channelId: "c1", senderId: "u6", senderName: "DucPham", senderAvatar: null,
    type: "TEXT", content: "Mình mới join, đang đọc docs. Code convention ntn ae?", fileUrl: null, fileName: null, fileSize: null,
    reactions: [], isEdited: false, isDeleted: false, editedAt: null, createdAt: "2026-03-26T09:00:00Z", replyTo: null,
  },
  {
    id: "m7", roomId: "r1", channelId: "c1", senderId: "u2", senderName: "MinhTran", senderAvatar: null,
    type: "TEXT", content: "Check file CONTRIBUTING.md trong repo nhé Đức. Mình đã viết sẵn rồi.", fileUrl: null, fileName: null, fileSize: null,
    reactions: [{ emoji: "✅", userIds: ["u6"], count: 1 }],
    isEdited: false, isDeleted: false, editedAt: null, createdAt: "2026-03-26T09:05:00Z",
    replyTo: { messageId: "m6", content: "Mình mới join, đang đọc docs...", senderName: "DucPham" },
  },
  {
    id: "m8", roomId: "r1", channelId: "c1", senderId: "u1", senderName: "PhatNguyen", senderAvatar: null,
    type: "TEXT", content: "Ae nào rảnh review PR #12 giúp mình nhé. Refactor lại auth middleware.", fileUrl: null, fileName: null, fileSize: null,
    reactions: [], isEdited: false, isDeleted: false, editedAt: null, createdAt: "2026-03-26T10:30:00Z", replyTo: null,
  },
  {
    id: "m9", roomId: "r1", channelId: "c1", senderId: "u3", senderName: "LinhDao", senderAvatar: null,
    type: "TEXT", content: "Mình review được, để mình xem qua chiều nay.", fileUrl: null, fileName: null, fileSize: null,
    reactions: [], isEdited: false, isDeleted: false, editedAt: null, createdAt: "2026-03-26T10:35:00Z", replyTo: null,
  },
  {
    id: "m10", roomId: "r1", channelId: "c1", senderId: "u4", senderName: "HoangVu", senderAvatar: null,
    type: "TEXT", content: "CORS đã fix xong rồi! WebSocket connect thành công 🎊", fileUrl: null, fileName: null, fileSize: null,
    reactions: [{ emoji: "🎊", userIds: ["u1", "u2"], count: 2 }],
    isEdited: false, isDeleted: false, editedAt: null, createdAt: "2026-03-26T14:00:00Z", replyTo: null,
  },
  // ─── 27 tháng 3, 2026 ───
  {
    id: "m11", roomId: "r1", channelId: "c1", senderId: "u3", senderName: "LinhDao", senderAvatar: null,
    type: "TEXT", content: "DB schema v1 xong rồi ae ơi, mọi người review giúp nha 🎉", fileUrl: null, fileName: null, fileSize: null,
    reactions: [{ emoji: "🎉", userIds: ["u1", "u2"], count: 2 }],
    isEdited: false, isDeleted: false, editedAt: null, createdAt: "2026-03-27T10:00:00Z", replyTo: null,
  },
  {
    id: "m12", roomId: "r1", channelId: "c1", senderId: "u1", senderName: "PhatNguyen", senderAvatar: null,
    type: "TEXT", content: "Schema nhìn ổn đó Linh. Mình suggest thêm index cho bảng messages theo channelId + createdAt.", fileUrl: null, fileName: null, fileSize: null,
    reactions: [], isEdited: false, isDeleted: false, editedAt: null, createdAt: "2026-03-27T10:15:00Z",
    replyTo: { messageId: "m11", content: "DB schema v1 xong rồi ae ơi...", senderName: "LinhDao" },
  },
  {
    id: "m13", roomId: "r1", channelId: "c1", senderId: "u6", senderName: "DucPham", senderAvatar: null,
    type: "TEXT", content: "Mình đọc xong CONTRIBUTING.md rồi. Bắt đầu code feature đầu tiên: user profile page 💪", fileUrl: null, fileName: null, fileSize: null,
    reactions: [{ emoji: "💪", userIds: ["u1", "u2", "u3"], count: 3 }],
    isEdited: false, isDeleted: false, editedAt: null, createdAt: "2026-03-27T11:00:00Z", replyTo: null,
  },
  {
    id: "m14", roomId: "r1", channelId: "c1", senderId: "u2", senderName: "MinhTran", senderAvatar: null,
    type: "TEXT", content: "Good luck Đức! Nếu cần gì thì ping mình nhé. À mà ae nhớ viết unit test nha 🧪", fileUrl: null, fileName: null, fileSize: null,
    reactions: [], isEdited: false, isDeleted: false, editedAt: null, createdAt: "2026-03-27T11:10:00Z", replyTo: null,
  },
  {
    id: "m15", roomId: "r1", channelId: "c1", senderId: "u4", senderName: "HoangVu", senderAvatar: null,
    type: "TEXT", content: "Mình vừa push xong WebSocket service lên staging. Ae test realtime chat thử xem.", fileUrl: null, fileName: null, fileSize: null,
    reactions: [{ emoji: "🚀", userIds: ["u1", "u2", "u3", "u6"], count: 4 }],
    isEdited: false, isDeleted: false, editedAt: null, createdAt: "2026-03-27T14:30:00Z", replyTo: null,
  },
  // ─── 28 tháng 3, 2026 (unread from here) ───
  {
    id: "m16", roomId: "r1", channelId: "c1", senderId: "u3", senderName: "LinhDao", senderAvatar: null,
    type: "TEXT", content: "Ae ơi mình vừa phát hiện bug ở phần pagination. Khi load page 2 thì bị duplicate messages.", fileUrl: null, fileName: null, fileSize: null,
    reactions: [], isEdited: false, isDeleted: false, editedAt: null, createdAt: "2026-03-28T09:00:00Z", replyTo: null,
  },
  {
    id: "m17", roomId: "r1", channelId: "c1", senderId: "u1", senderName: "PhatNguyen", senderAvatar: null,
    type: "TEXT", content: "Mình check lại rồi, do cursor-based pagination đang dùng offset thay vì lastId. Sẽ fix trong PR tiếp theo.", fileUrl: null, fileName: null, fileSize: null,
    reactions: [{ emoji: "👍", userIds: ["u3"], count: 1 }],
    isEdited: false, isDeleted: false, editedAt: null, createdAt: "2026-03-28T09:15:00Z",
    replyTo: { messageId: "m16", content: "Ae ơi mình vừa phát hiện bug...", senderName: "LinhDao" },
  },
  {
    id: "m18", roomId: "r1", channelId: "c1", senderId: "u2", senderName: "MinhTran", senderAvatar: null,
    type: "TEXT", content: "Frontend milestone 1 đang tiến độ tốt. Xong được sidebar, chat area, friends list. Còn settings page nữa là done sprint 1 💯", fileUrl: null, fileName: null, fileSize: null,
    reactions: [{ emoji: "💯", userIds: ["u1", "u3", "u4", "u6"], count: 4 }],
    isEdited: false, isDeleted: false, editedAt: null, createdAt: "2026-03-28T10:00:00Z", replyTo: null,
  },
  {
    id: "m19", roomId: "r1", channelId: "c1", senderId: "u6", senderName: "DucPham", senderAvatar: null,
    type: "TEXT", content: "User profile page đã xong phần UI. Đang integrate API. Ae review PR #15 giúp mình 🙏", fileUrl: null, fileName: null, fileSize: null,
    reactions: [{ emoji: "🙏", userIds: ["u2"], count: 1 }],
    isEdited: false, isDeleted: false, editedAt: null, createdAt: "2026-03-28T14:00:00Z", replyTo: null,
  },
  {
    id: "m20", roomId: "r1", channelId: "c1", senderId: "u4", senderName: "HoangVu", senderAvatar: null,
    type: "TEXT", content: "Realtime notification đã hoạt động! Khi có tin nhắn mới sẽ có badge đỏ hiện trên channel name 🔔", fileUrl: null, fileName: null, fileSize: null,
    reactions: [{ emoji: "🔔", userIds: ["u1", "u2", "u3", "u6"], count: 4 }, { emoji: "🎉", userIds: ["u1", "u6"], count: 2 }],
    isEdited: false, isDeleted: false, editedAt: null, createdAt: "2026-03-28T16:00:00Z", replyTo: null,
  },
];

export const CURRENT_USER = MOCK_USERS[0];

export const MOCK_DIRECT_MESSAGES: DirectMessage[] = [
  { id: "dm1", recipientId: "u2", recipientName: "MinhTran", recipientAvatar: null, recipientStatus: "ONLINE", lastMessage: "Check file CONTRIBUTING.md nhé", lastMessageAt: "2026-03-26T09:05:00Z", unreadCount: 2 },
  { id: "dm2", recipientId: "u3", recipientName: "LinhDao", recipientAvatar: null, recipientStatus: "IDLE", lastMessage: "DB schema xong chưa?", lastMessageAt: "2026-03-26T08:30:00Z", unreadCount: 0 },
  { id: "dm3", recipientId: "u4", recipientName: "HoangVu", recipientAvatar: null, recipientStatus: "DND", lastMessage: "CORS fix rồi, test lại đi", lastMessageAt: "2026-03-26T08:20:00Z", unreadCount: 0 },
  { id: "dm4", recipientId: "u6", recipientName: "DucPham", recipientAvatar: null, recipientStatus: "ONLINE", lastMessage: "Mình đang đọc docs", lastMessageAt: "2026-03-26T09:00:00Z", unreadCount: 1 },
  { id: "dm5", recipientId: "u5", recipientName: "ThaoLe", recipientAvatar: null, recipientStatus: "OFFLINE", lastMessage: "Mai gặp nhé!", lastMessageAt: "2026-03-25T18:00:00Z", unreadCount: 0 },
];

export const MOCK_FRIENDSHIPS: Friendship[] = [
  { id: "f1", userId: "u1", friendId: "u2", status: "ACCEPTED", createdAt: "2026-01-20T10:00:00Z" },
  { id: "f2", userId: "u1", friendId: "u3", status: "ACCEPTED", createdAt: "2026-02-01T10:00:00Z" },
  { id: "f3", userId: "u4", friendId: "u1", status: "PENDING", createdAt: "2026-03-25T10:00:00Z" },
  { id: "f4", userId: "u1", friendId: "u6", status: "ACCEPTED", createdAt: "2026-02-12T10:00:00Z" },
  { id: "f5", userId: "u5", friendId: "u1", status: "PENDING", createdAt: "2026-03-26T07:00:00Z" },
];

