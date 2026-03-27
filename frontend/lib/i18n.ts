import { create } from "zustand";
import { useEffect } from "react";

export type Locale = "en" | "vi";

interface I18nState {
  locale: Locale;
  hydrated: boolean;
  setLocale: (locale: Locale) => void;
  hydrate: () => void;
}

export const useI18nStore = create<I18nState>((set) => ({
  locale: "en",
  hydrated: false,
  setLocale: (locale) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("locale", locale);
    }
    set({ locale });
  },
  hydrate: () => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("locale") as Locale | null;
      if (saved && (saved === "en" || saved === "vi")) {
        set({ locale: saved, hydrated: true });
      } else {
        set({ hydrated: true });
      }
    }
  },
}));

/** Call this in a top-level client component to hydrate locale from localStorage */
export function useI18nHydration() {
  const hydrate = useI18nStore((s) => s.hydrate);
  const hydrated = useI18nStore((s) => s.hydrated);
  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);
}

const translations = {
  en: {
    // Auth
    "auth.welcomeBack": "Welcome back!",
    "auth.gladToSeeYou": "We're glad to see you again!",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.forgotPassword": "Forgot your password?",
    "auth.login": "Log In",
    "auth.needAccount": "Need an account?",
    "auth.register": "Register",
    "auth.createAccount": "Create an account",
    "auth.username": "Username",
    "auth.confirmPassword": "Confirm Password",
    "auth.signUp": "Sign Up",
    "auth.haveAccount": "Already have an account?",

    // Validation
    "validation.emailInvalid": "Invalid email address",
    "validation.passwordMin": "Password must be at least 6 characters",
    "validation.usernameMin": "Username must be at least 3 characters",
    "validation.usernameMax": "Username must be at most 50 characters",
    "validation.passwordMismatch": "Passwords do not match",

    // Sidebar
    "sidebar.directMessages": "Direct Messages",
    "sidebar.friends": "Friends",
    "sidebar.searchOrStart": "Find or start a conversation",
    "sidebar.addServer": "Add a Server",
    "sidebar.createDM": "Create DM",

    // User Panel
    "userPanel.muteMic": "Mute",
    "userPanel.deafen": "Deafen",
    "userPanel.settings": "User Settings",

    // Status
    "status.online": "Online",
    "status.offline": "Offline",
    "status.idle": "Idle",
    "status.dnd": "Do Not Disturb",

    // Friends
    "friends.title": "Friends",
    "friends.all": "All",
    "friends.pending": "Pending",
    "friends.addFriend": "Add Friend",
    "friends.allCount": "All Friends",
    "friends.pendingCount": "Pending",
    "friends.search": "Search",
    "friends.incomingRequest": "Incoming Friend Request",
    "friends.outgoingRequest": "Outgoing Friend Request",
    "friends.noPending": "There are no pending friend requests.",
    "friends.addTitle": "Add Friend",
    "friends.addDescription": "You can add friends with their username.",
    "friends.addPlaceholder": "Enter a username",
    "friends.sendRequest": "Send Friend Request",

    // Active Now
    "activeNow.title": "Active Now",
    "activeNow.empty": "It's quiet for now...",
    "activeNow.emptyDescription":
      "When a friend starts an activity — like playing a game or hanging out on voice — we'll show it here!",

    // Channels
    "channels.textChannels": "Text Channels",
    "channels.voiceChannels": "Voice Channels",

    // Chat
    "chat.welcome": "Welcome to",
    "chat.welcomeDescription": "This is the start of the",
    "chat.welcomeStart": "channel. Start chatting!",
    "chat.messagePlaceholder": "Message",
    "chat.edited": "(edited)",
    "chat.pin": "Pinned Messages",
    "chat.memberList": "Member List",
    "chat.inbox": "Inbox",
    "chat.attachFile": "Attach file",
    "chat.addReaction": "Add Reaction",
    "chat.reply": "Reply",
    "chat.more": "More",

    // Members
    "members.online": "Online",
    "members.offline": "Offline",
  },

  vi: {
    // Auth
    "auth.welcomeBack": "Chào mừng trở lại!",
    "auth.gladToSeeYou": "Rất vui được gặp lại bạn!",
    "auth.email": "Email",
    "auth.password": "Mật khẩu",
    "auth.forgotPassword": "Quên mật khẩu?",
    "auth.login": "Đăng nhập",
    "auth.needAccount": "Cần tài khoản?",
    "auth.register": "Đăng ký",
    "auth.createAccount": "Tạo tài khoản",
    "auth.username": "Tên người dùng",
    "auth.confirmPassword": "Xác nhận mật khẩu",
    "auth.signUp": "Đăng ký",
    "auth.haveAccount": "Đã có tài khoản?",

    // Validation
    "validation.emailInvalid": "Email không hợp lệ",
    "validation.passwordMin": "Mật khẩu tối thiểu 6 ký tự",
    "validation.usernameMin": "Tên người dùng tối thiểu 3 ký tự",
    "validation.usernameMax": "Tên người dùng tối đa 50 ký tự",
    "validation.passwordMismatch": "Mật khẩu không khớp",

    // Sidebar
    "sidebar.directMessages": "Tin nhắn trực tiếp",
    "sidebar.friends": "Bạn bè",
    "sidebar.searchOrStart": "Tìm hoặc bắt đầu cuộc trò chuyện",
    "sidebar.addServer": "Thêm Server",
    "sidebar.createDM": "Tạo tin nhắn",

    // User Panel
    "userPanel.muteMic": "Tắt tiếng mic",
    "userPanel.deafen": "Tắt âm thanh",
    "userPanel.settings": "Cài đặt",

    // Status
    "status.online": "Trực tuyến",
    "status.offline": "Ngoại tuyến",
    "status.idle": "Chờ",
    "status.dnd": "Không làm phiền",

    // Friends
    "friends.title": "Bạn bè",
    "friends.all": "Tất cả",
    "friends.pending": "Đang chờ xử lý",
    "friends.addFriend": "Thêm Bạn",
    "friends.allCount": "Tất cả bạn bè",
    "friends.pendingCount": "Đang chờ",
    "friends.search": "Tìm kiếm",
    "friends.incomingRequest": "Lời mời kết bạn đến",
    "friends.outgoingRequest": "Lời mời kết bạn đi",
    "friends.noPending": "Không có lời mời kết bạn nào đang chờ xử lý.",
    "friends.addTitle": "Thêm bạn",
    "friends.addDescription": "Bạn có thể thêm bạn bè bằng tên người dùng.",
    "friends.addPlaceholder": "Nhập tên người dùng",
    "friends.sendRequest": "Gửi lời mời kết bạn",

    // Active Now
    "activeNow.title": "Đang Hoạt Động",
    "activeNow.empty": "Hiện tại không có cập nhật mới nào cả...",
    "activeNow.emptyDescription":
      "Nếu bạn bè của bạn có hoạt động mới, ví dụ như chơi game hoặc trò chuyện thoại, chúng tôi sẽ hiển thị hoạt động đó ở đây!",

    // Channels
    "channels.textChannels": "Kênh Văn Bản",
    "channels.voiceChannels": "Kênh Thoại",

    // Chat
    "chat.welcome": "Chào mừng đến",
    "chat.welcomeDescription": "Đây là khởi đầu của kênh",
    "chat.welcomeStart": ". Hãy bắt đầu trò chuyện.",
    "chat.messagePlaceholder": "Nhắn",
    "chat.edited": "(đã sửa)",
    "chat.pin": "Tin ghim",
    "chat.memberList": "Danh sách thành viên",
    "chat.inbox": "Hộp thư",
    "chat.attachFile": "Đính kèm file",
    "chat.addReaction": "Thêm reaction",
    "chat.reply": "Trả lời",
    "chat.more": "Thêm",

    // Members
    "members.online": "Trực tuyến",
    "members.offline": "Ngoại tuyến",
  },
} as const;

export type TranslationKey = keyof (typeof translations)["en"];

export function useTranslation() {
  const locale = useI18nStore((s) => s.locale);
  const setLocale = useI18nStore((s) => s.setLocale);

  function t(key: TranslationKey): string {
    return translations[locale][key] || translations["en"][key] || key;
  }

  return { t, locale, setLocale };
}
