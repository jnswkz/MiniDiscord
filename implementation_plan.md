# Frontend — Implementation Plan (Phase 1 + Phase 2)

> **Goal:** Khởi tạo frontend MiniDiscord với design system hoàn chỉnh (dark/light), auth pages, và bộ khung layout Discord 4 cột pixel-accurate.

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

**Layout size variables (Discord-accurate):**

| Token | Value | Mục đích |
|-------|-------|----------|
| `--server-list-width` | `72px` | Column 1 — Server icon bar |
| `--channel-sidebar-width` | `300px` | Column 2 — Channel/DM sidebar |
| `--member-list-width` | `240px` | Column 4 — Member/Active Now |

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

#### [MODIFY] [app/(main)/layout.tsx](file:///d:/MiniDiscord/frontend/app/(main)/layout.tsx)

Discord 4-column layout container (pixel-accurate):

```
┌──────────────────────────┬─────────────────────┬──────────┐
│   72px  │   300px        │      flex-1         │  240px   │
│  Server │  Channel       │     Chat Area       │  Member  │
│  List   │   List         │                     │  List    │
│         │                │                     │(toggle)  │
├─────────┴────────────────┤                     │          │
│    UserPanel (372px)     │                     │          │
│  spans Col 1 + Col 2    │                     │          │
└──────────────────────────┴─────────────────────┴──────────┘
```

> [!IMPORTANT]
> **UserPanel PHẢI span cả Column 1 + Column 2** (tổng `372px`).
> UserPanel nằm ở bottom của wrapper div chứa cả ServerList + ChannelList.
>
> **Column 4 PHẢI toggle được** — ẩn/hiện qua icon button ở ChatHeader.
> Dashboard view (ActiveNow) luôn hiện. Channel view (MemberList) + DM view (DmUserPanel) toggle được.

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

#### [MODIFY] [components/sidebar/MemberList.tsx](file:///d:/MiniDiscord/frontend/components/sidebar/MemberList.tsx)

- Member categories: "Online — X", "Offline — Y"
- StatusAvatar + username per member
- Role color coding
- **Width: `w-[240px]`** (nhất quán với Col 2)

#### [MODIFY] [lib/mock-data.ts](file:///d:/MiniDiscord/frontend/lib/mock-data.ts)

Centralized mock data file using existing types from `types/`:
- Mock users, rooms, channels, messages
- Consistent IDs across all mock entities

#### [MODIFY] [app/(main)/channels/[channelId]/page.tsx](file:///d:/MiniDiscord/frontend/app/(main)/channels/[channelId]/page.tsx)

Channel chat view — assembles ChatHeader + MessageList + MessageInput.

---

## Phase 2 — Layout Fix & UI Improvements

> **Goal:** Sửa layout sai lệch so với Discord gốc, thêm toggle Column 4, hoàn thiện i18n, và nâng cấp UX.

### 🔴 P0 — Critical Layout Fixes

#### 2.1 Column 4 Toggle Mechanism

**Problem:** Column 4 luôn hiển thị, không thể toggle.

**Solution:**

##### [MODIFY] [stores/uiStore.ts](file:///d:/MiniDiscord/frontend/stores/uiStore.ts)

Thêm toggle states:
```ts
interface UIState {
  showSettings: boolean;
  showMemberList: boolean;    // NEW — toggle Col 4 on Channel view
  showDmUserPanel: boolean;   // NEW — toggle Col 4 on DM view
  // actions
  openSettings: () => void;
  closeSettings: () => void;
  toggleMemberList: () => void;   // NEW
  toggleDmUserPanel: () => void;  // NEW
}
```

##### [MODIFY] [components/chat/ChatHeader.tsx](file:///d:/MiniDiscord/frontend/components/chat/ChatHeader.tsx)

- Users icon → `onClick={toggleMemberList}` — toggle MemberList panel
- Active state highlight khi panel đang mở

##### [MODIFY] [app/(main)/channels/[channelId]/page.tsx](file:///d:/MiniDiscord/frontend/app/(main)/channels/[channelId]/page.tsx)

```tsx
{showMemberList && <MemberList />}
```

##### [MODIFY] [app/(main)/dm/[userId]/page.tsx](file:///d:/MiniDiscord/frontend/app/(main)/dm/[userId]/page.tsx)

DM header → thêm toggle button cho DmUserPanel:
```tsx
{showDmUserPanel && <DmUserPanel userId={userId} />}
```

##### Column 4 Animation

- Panel slide-in từ phải: `transition-all duration-200`
- Chat area mở rộng smooth khi panel đóng

---

#### 2.2 UserPanel Span Verification

**Problem:** UserPanel phải span cả Col 1 + Col 2 (tổng 312px).

**Current code:** Flex container đã đúng logic, nhưng cần verify:
- UserPanel `bg-background-tertiary` cùng màu ServerList → trông "hòa trộn"
- Cần đảm bảo visual distinction rõ ràng

##### [MODIFY] [components/sidebar/UserPanel.tsx](file:///d:/MiniDiscord/frontend/components/sidebar/UserPanel.tsx)

- Đảm bảo width = `w-full` (inherit từ parent = Col1 + Col2)
- Kiểm tra padding alignment với cả ServerList và ChannelList

---

#### 2.3 Responsive Breakpoints

**Problem:** App hoàn toàn break dưới 1024px.

**Solution:** Thêm responsive handling:

| Breakpoint | Col 1 | Col 2 | Col 3 | Col 4 |
|------------|-------|-------|-------|-------|
| ≥1440px | 72px | 240px | flex-1 | 240px (toggleable) |
| 1024-1439px | 72px | 240px | flex-1 | hidden by default |
| 768-1023px | 72px | collapsed | flex-1 | hidden |
| <768px | hidden | hidden | flex-1 | hidden (hamburger menu) |

---

### 🟡 P1 — Important Improvements

#### 2.4 i18n Completion (~40+ strings)

##### [MODIFY] [lib/i18n.ts](file:///d:/MiniDiscord/frontend/lib/i18n.ts)

Thêm translation keys cho:
- `chat.*` — ChatHeader labels, MessageInput placeholders, MessageList welcome
- `dm.*` — DM page strings, DmUserPanel labels
- `auth.*` — Login Google section, "HOẶC" divider
- `settings.*` — Replace `locale === "vi" ? ... : ...` patterns

##### Files affected:
- [ChatHeader.tsx](file:///d:/MiniDiscord/frontend/components/chat/ChatHeader.tsx) — 4 hardcoded strings
- [MessageInput.tsx](file:///d:/MiniDiscord/frontend/components/chat/MessageInput.tsx) — 5 strings
- [MessageItem.tsx](file:///d:/MiniDiscord/frontend/components/chat/MessageItem.tsx) — 1 string
- [MessageList.tsx](file:///d:/MiniDiscord/frontend/components/chat/MessageList.tsx) — 2 strings
- [DmUserPanel.tsx](file:///d:/MiniDiscord/frontend/components/dm/DmUserPanel.tsx) — ~15 strings
- [dm/[userId]/page.tsx](file:///d:/MiniDiscord/frontend/app/(main)/dm/[userId]/page.tsx) — 5 strings
- [login/page.tsx](file:///d:/MiniDiscord/frontend/app/(auth)/login/page.tsx) — 3 strings
- [SettingsOverlay.tsx](file:///d:/MiniDiscord/frontend/components/settings/SettingsOverlay.tsx) — refactor inline ternaries

#### 2.5 Friends Tab "Online"

##### [MODIFY] [components/friends/FriendsPage.tsx](file:///d:/MiniDiscord/frontend/components/friends/FriendsPage.tsx)

- Thêm tab `"online"` vào `FriendsTab` type
- Filter friends bởi `status !== "OFFLINE"`
- Discord gốc có 4 tabs: Online | All | Pending | [Add Friend]

#### 2.6 Missing Header Icons

##### [MODIFY] [components/chat/ChatHeader.tsx](file:///d:/MiniDiscord/frontend/components/chat/ChatHeader.tsx)

Thêm các icons theo Discord gốc:
- Threads icon (MessageSquare)
- Inbox icon (Archive/Inbox)
- Help icon (HelpCircle) — rightmost

#### 2.7 DM Sidebar Item Close Button

##### [MODIFY] [components/sidebar/DMSidebar.tsx](file:///d:/MiniDiscord/frontend/components/sidebar/DMSidebar.tsx)

- Hover DM item → hiện nút X (close/remove) ở bên phải
- Discord behavior: click X → remove DM from list (not unfriend)

#### 2.8 Settings → Full Page Transition

##### [MODIFY] [components/settings/SettingsOverlay.tsx](file:///d:/MiniDiscord/frontend/components/settings/SettingsOverlay.tsx)

- Chuyển từ modal overlay → full-page layout
- ESC button ở góc phải (giữ nguyên)
- Slide transition khi mở/đóng

---

### 🟢 P2 — Polish

#### 2.9 Micro-animations
- Page transitions: route change fade
- Panel toggle: slide animation
- Channel switch: subtle crossfade

#### 2.10 LanguageSwitcher SVG Flags
- Replace emoji flags → SVG flag icons

#### 2.11 Auth Pages Consistency
- Register page: thêm `backdrop-blur-sm border border-border/30` cho nhất quán với Login

#### 2.12 Code Cleanup
- Extract duplicate `getRoomIdForChannel()` → `lib/helpers.ts`
- Typography fine-tuning: category labels `11px` thay vì `12px`

#### 2.13 Accessibility
- Status dots: thêm shape variants ngoài color (half-moon cho Idle, dash cho DND)
- Skip-to-content link
- `role="region"` cho channel categories

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

3. **Main Layout (Phase 1 + Phase 2):**
   - Navigate to `/channels/c1`
   - Kiểm tra layout 4 cột hiện đúng:
     - Cột 1 (`72px`): Server icons dạng tròn, hover → bo góc vuông
     - Cột 2 (`240px`): Channel list với categories
     - UserPanel span **toàn bộ Col 1 + Col 2** (`312px`) ở bottom
     - Cột 3 (`flex-1`): Chat area với messages
     - Cột 4 (`240px`): Member list — **toggle ẩn/hiện bằng icon ở header**
   - Hover tin nhắn → action bar xuất hiện
   - Click Users icon ở header → Col 4 toggle

4. **DM View:**
   - Navigate to `/dm/u2`
   - Col 4 = DmUserPanel (`340px`) — toggle qua header button
   - Hover DM item ở sidebar → nút X xuất hiện

5. **Dashboard:**
   - Navigate to `/dashboard`
   - ActiveNow panel luôn hiển thị (không toggle)
   - Friends tabs: Online | All | Pending | [Add Friend]

6. **Responsive:**
   - 1440px+: full 4-column layout
   - 1024px: Col 4 auto-hidden
   - 768px: Col 2 collapsed
   - 375px: hamburger menu, chỉ hiện chat area

