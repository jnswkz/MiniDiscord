# 🏗️ Frontend Architecture Decisions — Mini Discord Clone

**Dự án:** Mini Discord Clone
**Stack:** Next.js 16 (App Router), Tailwind CSS v4, Zustand

---

## 1. Phân tích & Lựa chọn UI Library Approach

Việc chọn cách tiếp cận UI Library quyết định tốc độ phát triển và khả năng bảo trì của dự án.

* **Pure Tailwind (Custom components):** * *Ưu điểm:* Kiểm soát 100% markup, không phụ thuộc thư viện ngoài.
    * *Nhược điểm:* Mất rất nhiều thời gian để xây dựng các component phức tạp cần tính accessibility (a11y) cao như Dropdown, Modal, Tooltip, Select.
* **Headless UI / Radix Primitives:**
    * *Ưu điểm:* Giải quyết triệt để bài toán a11y, logic component được xử lý sẵn.
    * *Nhược điểm:* Phải tự viết toàn bộ CSS/Tailwind từ đầu, tốn thời gian setup.
* **Custom CSS:**
    * *Nhược điểm:* Đi ngược lại triết lý tiện dụng của Tailwind, dễ dẫn đến file CSS khổng lồ và khó maintain trong môi trường component-based.
* **shadcn/ui (🌟 KHUYÊN DÙNG):**
    * *Ưu điểm:* Đây là sự kết hợp hoàn hảo. Nó sử dụng Radix UI bên dưới (đảm bảo a11y) và dùng Tailwind để style. Khác với thư viện component truyền thống (như MUI hay AntD), shadcn/ui copy trực tiếp source code vào dự án, cho phép bạn toàn quyền custom (Rất quan trọng để làm UI giống Discord).
    * *Nhược điểm:* Cần thời gian ngắn để làm quen với cấu trúc file của nó.

> **Đề xuất:** Chọn **shadcn/ui**. Nó cung cấp sẵn các primitive components (Button, Dialog, Popover, ScrollArea...) rất chuẩn chỉ, giúp bạn focus vào việc build layout và logic realtime thay vì ngồi căn chỉnh từng pixel cho cái dropdown.

---

## 2. Design Style (Đã chốt: 2.A - Faithful to Discord)

**Quyết định:** Bám sát thiết kế gốc của Discord (Dark-first, layout 3-4 cột).

**Phân tích & Lưu ý triển khai:**
1.  **Layout kinh điển:** * Cột 1: Server List (Icon tròn, hover thành vuông bo góc).
    * Cột 2: Channel List (Text/Voice channels).
    * Cột 3: Chat Area (Header, Message List, Input area).
    * Cột 4: Member List (Có thể toggle ẩn/hiện).
2.  **Typography & Spacing:** Discord sử dụng font chữ sans-serif rất dễ đọc (gg font: `gg sans` - có thể dùng `Inter` hoặc `Roboto` làm alternative) và hệ thống spacing rất chặt chẽ.
3.  **Tương tác vi mô (Micro-interactions):** Cần chú ý các hiệu ứng hover lên tin nhắn (hiện menu reaction), hiệu ứng focus vào ô input, và tooltip khi hover lên server icon.

---

## 3. Dark/Light Mode (Đã chốt: Cả Dark và Light mode)

**Quyết định:** Hỗ trợ cả 2 theme với toggle switch.

**Phân tích & Lưu ý triển khai:**
Mặc dù Discord nổi tiếng với Dark Mode, việc hỗ trợ Light Mode đòi hỏi sự chuẩn bị kỹ lưỡng về hệ thống màu sắc (Color System).
1.  **Không dùng màu tĩnh:** Tuyệt đối không hardcode class như `bg-gray-900` hay `text-white`.
2.  **Sử dụng Semantic CSS Variables:** Bạn cần thiết lập Tailwind config sử dụng biến CSS.
    * *Ví dụ:* `--bg-primary`, `--bg-secondary`, `--text-normal`, `--text-muted`, `--accent-brand` (màu Blurple đặc trưng của Discord).
3.  **Công cụ:** Sử dụng thư viện `next-themes` (tích hợp rất tốt với shadcn/ui) để quản lý việc switch theme (thêm class `dark` vào thẻ `html`).

---

## 4. Phạm vi Phase 1 & Chạy Script Design System

**Phân tích các phương án:**
* **Chỉ Design System + Scaffold:** Quá an toàn, khó thấy được hình hài dự án.
* **Full đến Main Layout:** Quá rủi ro, ôm đồm nhiều thứ cùng lúc (cả UI phức tạp lẫn logic).
* **Iterative Approach (Đề xuất):** Đi từng bước vững chắc.

**Đề xuất Phạm vi Phase 1 (Frontend Init):**
1.  **Bước 1: Design System & Scaffold (Core):**
    * Khởi tạo Next.js + Tailwind v4 + shadcn/ui.
    * **NÊN CHẠY** script `/ui-ux-pro-max`: Nếu bạn đã có script Python tự động generate bảng màu (đặc biệt là cho cả Dark/Light mode) và typography, hãy tận dụng nó để tạo ra file `globals.css` và cấu hình Tailwind chuẩn ngay từ đầu.
2.  **Bước 2: Base Components:**
    * Xây dựng các component cơ sở dùng chung: Custom Input, Button, Avatar, Tooltip.
3.  **Bước 3: Auth Pages (Login/Register):**
    * Xây dựng UI cho trang Đăng nhập/Đăng ký.
    * Đây là bước đệm tốt để test các form validation (React Hook Form + Zod) và test connection với Backend (User Service) nếu BE đã sẵn sàng.
4.  **Bước 4: Main Layout Skeleton:**
    * Chỉ dựng bộ khung (Sidebar, Header, Main area) sử dụng dữ liệu mock tĩnh (dummy data), chưa cắm logic WebSocket hay quản lý State.

> **Kết luận Phase 1:** Hoàn thành xong Phase 1, bạn phải có được một hệ thống component nhất quán, đổi được Dark/Light mode trơn tru, và xem trước được bộ khung UI của ứng dụng chat.