# Frontend Phase 1 — Implementation Plan

> **Goal:** Khởi tạo frontend MiniDiscord với design system hoàn chỉnh (dark/light), auth pages, và bộ khung layout Discord 4 cột.

## User Review Required

> [!IMPORTANT]
> **shadcn/ui + Tailwind v4 compatibility:** shadcn/ui v2 đã hỗ trợ Tailwind v4 (CSS-first config). Sẽ dùng `npx shadcn@latest init` với cấu hình New York style.

> [!WARNING]
> **Discord "Blurple" brand color:** Dùng `#5865F2` (Discord Blurple) làm accent chính — đây là màu xanh-tím đặc trưng của Discord, KHÔNG phải purple thuần (không vi phạm Purple Ban vì đây là brand-accurate requirement).

---

## Proposed Changes

### Step 1: Design System & Scaffold

#### [MODIFY] [package.json](file:///d:/MiniDiscord/frontend/package.json)

Cài đặt dependencies:

```bash
# Core UI
npm install next-themes lucide-react class-variance-authority clsx tailwind-merge

# Forms & Validation
npm install react-hook-form @hookform/resolvers zod

# State & API
npm install zustand axios
```

---

#### [MODIFY] [globals.css](file:///d:/MiniDiscord/frontend/app/globals.css)

Xây dựng Discord-accurate color system dùng CSS variables. Hệ thống 2 lớp:

**Dark Mode (mặc định — Discord style):**

| Token | Hex | Mục đích |
|-------|-----|----------|
| `--background` | `#313338` | Nền chat area |
| `--background-secondary` | `#2B2D31` | Nền channel sidebar |
| `--background-tertiary` | `#1E1F22` | Nền server sidebar |
| `--background-floating` | `#111214` | Popover, dropdown |
| `--foreground` | `#F2F3F5` | Text chính |
| `--muted-foreground` | `#949BA4` | Text phụ |
| `--accent` | `#5865F2` | Discord Blurple |
| `--accent-hover` | `#4752C4` | Blurple hover |
| `--destructive` | `#DA373C` | Danger/delete |
| `--success` | `#23A559` | Online/success |
| `--warning` | `#F0B232` | Idle/warning |
| `--border` | `#3F4147` | Borders |
| `--input` | `#383A40` | Input background |
| `--ring` | `#5865F2` | Focus ring |

**Light Mode:**

| Token | Hex | Mục đích |
|-------|-----|----------|
| `--background` | `#FFFFFF` | Nền chat area |
| `--background-secondary` | `#F2F3F5` | Nền channel sidebar |
| `--background-tertiary` | `#E3E5E8` | Nền server sidebar |
| `--background-floating` | `#FFFFFF` | Popover, dropdown |
| `--foreground` | `#060607` | Text chính |
| `--muted-foreground` | `#5C5E66` | Text phụ |

---

#### [MODIFY] [layout.tsx](file:///d:/MiniDiscord/frontend/app/layout.tsx)

- Đổi font sang **Inter** (Google Fonts via `next/font/google`)
- Wrap children với `<ThemeProvider>` từ `next-themes`
- Update metadata: title → "MiniDiscord", description phù hợp
- Set `defaultTheme="dark"`, `attribute="class"`

---

#### [NEW] [lib/cn.ts](file:///d:/MiniDiscord/frontend/lib/cn.ts)

Utility function `cn()` = `clsx` + `tailwind-merge` (chuẩn shadcn/ui).

---

#### [NEW] [components/providers/ThemeProvider.tsx](file:///d:/MiniDiscord/frontend/components/providers/ThemeProvider.tsx)

Client component wrapping `next-themes` `ThemeProvider`.

---

### Step 2: Base Components (shadcn/ui)

#### shadcn/ui Components cần thêm:

```bash
npx shadcn@latest add button input dialog scroll-area tooltip avatar popover separator dropdown-menu
```

Các component này sẽ được copy vào `components/ui/` với full source code, cho phép custom style theo Discord theme.

#### [NEW] [components/ui/status-avatar.tsx](file:///d:/MiniDiscord/frontend/components/ui/status-avatar.tsx)

Custom Avatar component kế thừa shadcn Avatar, thêm:
- Status indicator dot (Online=green, Idle=yellow, DND=red, Offline=gray)
- Size variants: `sm` (24px), [md](file:///d:/MiniDiscord/README.md) (32px), `lg` (40px), `xl` (80px)

#### [NEW] [components/ui/server-icon.tsx](file:///d:/MiniDiscord/frontend/components/ui/server-icon.tsx)

- Hình tròn mặc định → `border-radius` giảm dần thành rounded-square khi hover
- Active state: pill indicator bên trái
- Tooltip hiện server name

---

### Step 3: Auth Pages

#### [NEW] [app/(auth)/layout.tsx](file:///d:/MiniDiscord/frontend/app/(auth)/layout.tsx)

Layout cho auth routes — centered card trên background gradient.

#### [NEW] [app/(auth)/login/page.tsx](file:///d:/MiniDiscord/frontend/app/(auth)/login/page.tsx)

Login form:
- Email + Password inputs (shadcn Input)
- "Log In" button (shadcn Button, accent color)
- Link → Register
- Zod schema validation
- react-hook-form integration

#### [NEW] [app/(auth)/register/page.tsx](file:///d:/MiniDiscord/frontend/app/(auth)/register/page.tsx)

Register form:
- Username + Email + Password + Confirm Password
- Link → Login
- Zod schema validation

#### [MODIFY] [stores/authStore.ts](file:///d:/MiniDiscord/frontend/stores/authStore.ts)

Zustand store implementation:
- State: `user`, `token`, `isAuthenticated`, `isLoading`
- Actions: `login()`, `register()`, `logout()`, `setUser()`
- Persist token to `localStorage`

#### [MODIFY] [lib/api.ts](file:///d:/MiniDiscord/frontend/lib/api.ts)

Axios instance:
- `baseURL` from env `NEXT_PUBLIC_API_URL`
- Request interceptor: attach JWT `Authorization: Bearer <token>`
- Response interceptor: handle 401 → logout

---

### Step 4: Main Layout Skeleton

#### [NEW] [app/(main)/layout.tsx](file:///d:/MiniDiscord/frontend/app/(main)/layout.tsx)

Discord 4-column layout container:
```
┌──────┬────────────┬─────────────────────┬──────────┐
│  72px│   240px    │      flex-1         │  240px   │
│Server│  Channel   │     Chat Area       │  Member  │
│ List │   List     │                     │  List    │
│      │            │                     │(toggle)  │
│      ├────────────┤                     │          │
│      │ User Panel │                     │          │
└──────┴────────────┴─────────────────────┴──────────┘
```

#### [NEW] [components/sidebar/ServerList.tsx](file:///d:/MiniDiscord/frontend/components/sidebar/ServerList.tsx)

- Vertical list of ServerIcon components
- DM button ở đầu (Discord icon)
- Separator giữa DM và servers
- Add Server button cuối (icon +)
- Mock data: 3-4 dummy servers

#### [NEW] [components/sidebar/ChannelList.tsx](file:///d:/MiniDiscord/frontend/components/sidebar/ChannelList.tsx)

- Server name header (with dropdown menu)
- Channel categories (collapsible)
- Text channel items (# icon + name)
- Voice channel items (speaker icon + name)
- Active channel highlight
- Mock data: 2 categories, 4-5 channels mỗi category

#### [NEW] [components/sidebar/UserPanel.tsx](file:///d:/MiniDiscord/frontend/components/sidebar/UserPanel.tsx)

- Bottom of channel sidebar
- User avatar + username + status
- Mic/Headphone/Settings icon buttons

#### [NEW] [components/chat/ChatHeader.tsx](file:///d:/MiniDiscord/frontend/components/chat/ChatHeader.tsx)

- # Channel name
- Channel description/topic
- Action icons (pin, members toggle, search, inbox)

#### [NEW] [components/chat/MessageList.tsx](file:///d:/MiniDiscord/frontend/components/chat/MessageList.tsx)

- ScrollArea với mock messages
- Message grouping by sender
- Date separators

#### [NEW] [components/chat/MessageItem.tsx](file:///d:/MiniDiscord/frontend/components/chat/MessageItem.tsx)

- Avatar + username + timestamp
- Message content
- Hover → show action bar (react, reply, more)

#### [NEW] [components/chat/MessageInput.tsx](file:///d:/MiniDiscord/frontend/components/chat/MessageInput.tsx)

- Input bar với placeholder "Message #channel-name"
- Attach file button (icon)
- Emoji picker button (icon)
- Gift/GIF button (icon)

#### [NEW] [components/sidebar/MemberList.tsx](file:///d:/MiniDiscord/frontend/components/sidebar/MemberList.tsx)

- Member categories: "Online — X", "Offline — Y"
- StatusAvatar + username per member
- Role color coding
- Mock data: 5-6 dummy members

#### [NEW] [lib/mock-data.ts](file:///d:/MiniDiscord/frontend/lib/mock-data.ts)

Centralized mock data file using existing types from `types/`:
- Mock users, rooms, channels, messages
- Consistent IDs across all mock entities

#### [NEW] [app/(main)/channels/[channelId]/page.tsx](file:///d:/MiniDiscord/frontend/app/(main)/channels/[channelId]/page.tsx)

Channel chat view — assembles ChatHeader + MessageList + MessageInput.

---

## Verification Plan

### Automated Tests

```bash
# 1. Build check — ensures no TypeScript errors
cd d:\MiniDiscord\frontend && npx tsc --noEmit

# 2. Lint check
cd d:\MiniDiscord\frontend && npm run lint

# 3. Dev server starts without crash
cd d:\MiniDiscord\frontend && npm run dev
# → Verify output contains "Ready" and no error stack traces
```

### Manual Browser Verification

> Mở browser tại `http://localhost:3000` sau khi `npm run dev`:

1. **Auth Pages:**
   - Navigate to `/login` → form hiện đúng với 2 fields + button
   - Navigate to `/register` → form hiện đúng với 4 fields + button
   - Submit form trống → validation errors hiển thị

2. **Dark/Light Mode:**
   - Mặc định phải là dark mode
   - Tìm theme toggle → click → chuyển sang light mode
   - Toàn bộ UI must update (background, text, borders, inputs)
   - Click lại → trở về dark mode
   - Reload page → theme vẫn được lưu

3. **Main Layout:**
   - Navigate to `/channels/mock-channel-1` (hoặc route tương tự)
   - Kiểm tra layout 4 cột hiện đúng:
     - Cột 1 (72px): Server icons dạng tròn, hover → bo góc vuông
     - Cột 2 (240px): Channel list với categories, user panel ở dưới
     - Cột 3 (flex): Chat area với messages
     - Cột 4 (240px): Member list (có thể toggle ẩn/hiện)
   - Hover tin nhắn → action bar xuất hiện

4. **Responsive:**
   - Thu nhỏ browser xuống 768px → sidebar ẩn hoặc collapse
   - 375px → chỉ hiện chat area, có hamburger menu

