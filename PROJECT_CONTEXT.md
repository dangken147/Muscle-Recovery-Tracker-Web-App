# THÔNG TIN DỰ ÁN & CONTEXT CỐT LÕI (AI MUST READ THIS)

> **[CRITICAL INSTRUCTION FOR AI]**: BẠN BẮT BUỘC PHẢI ĐỌC HIỂU TOÀN BỘ FILE NÀY TRƯỚC KHI THỰC HIỆN BẤT CỨ THAY ĐỔI NÀO TRONG SOURCE CODE. FILE NÀY CHỨA CÁC QUY TẮC NGHIỆP VỤ (BUSINESS LOGIC) VÀ THIẾT KẾ ĐÃ CHỐT VỚI NGƯỜI DÙNG.

## 1. Công nghệ (Tech Stack)
- **Core:** React 18, TypeScript, Vite.
- **Styling:** TailwindCSS (chủ đạo là Dark mode, glassmorphism, hiệu ứng glow shadow, animation slide-in/fade-in).
- **Icons:** `lucide-react`.
- **State Management:** React `useState`, `useEffect`, `useMemo` & LocalStorage.

## 2. Kiến trúc & Chức năng cốt lõi (Core Features)

Dự án là một **Ứng dụng Quản lý Phục hồi & Lịch tập luyện (Aura Recovery / Aura Fitness)**.

### A. ActivityForm (Ghi nhận hoạt động)
- Hỗ trợ nhiều môn: Tập Gym, Đá bóng, Chạy bộ, Bơi lội, Bóng rổ.
- **Quy trình Gym (Phức tạp nhất):**
  - **Lên kế hoạch (Plan)** vs **Đã tập xong (Log)**.
    - **Địa điểm:** 
    - *Ở Nhà:* Có bước chọn "Dụng cụ hiện có" (Cơ thể, Tạ đơn). Nếu chọn Tạ đơn, chỉ cần khai báo *Trọng lượng mỗi tạ* (ví dụ: 10kg). Số lượng tạ (dumbbellCount) được mặc định là 2. Giao diện thiết lập dụng cụ đã được nới rộng (`max-w-5xl`) chia làm 2 cột tối ưu UI/UX. Nút "Ghim thiết lập dụng cụ" đã bị xoá để tránh lỗi.
    - *Phòng Gym:* Bỏ qua bước chọn dụng cụ, tự động có full thiết bị (máy, tạ đơn, barbell...).
  - **AI Coach (`generateSmartWorkout`):**
    - Trọng lượng tạ (dumbbellWeight) sẽ quyết định bài tập:
      - `< 8kg` (Tạ nhẹ): AI sẽ cộng điểm ưu tiên cho các bài tập cô lập (Isolation) hoặc từng bên (Unilateral).
      - `> 15kg` (Tạ nặng): AI ưu tiên các bài đa khớp (Compound).
    - Số lượng tạ (dumbbellCount): Được mặc định là 2 (Đã loại bỏ UI cho phép chọn 1 tạ). Mọi bài tập mặc định sử dụng 2 tạ hoặc chia đều 2 tay.
  - Sử dụng `BodyMap` để chọn nhóm cơ tập luyện (hiển thị trực quan).

### B. Recovery & DOMS Engine (`recovery.utils.ts`)
- Tính toán mức độ mỏi cơ (DOMS) và phục hồi dựa trên `ActivityLog`.
- **Tác động của mức tạ đơn (Dumbbell Weight) lên độ mỏi cơ:**
  - Nếu tạ nhẹ (<= 5kg): `baseIncrease *= 0.90` (Nghiêng về Metabolic stress, độ phá vỡ cơ bắp thấp, phục hồi nhanh hơn).
  - Nếu tạ nặng (>= 15kg): `baseIncrease *= 1.15` (Nghiêng về Mechanical tension, phá vỡ cơ sâu, DOMS mạnh hơn).
  - Trung bình (6 - 14kg): `baseIncrease *= 1.05`.

## 3. Tiêu chuẩn UI/UX & Viết Code (Nghiêm ngặt)
- **Design System:** Tông màu chủ đạo là tối (Slate-900), dùng hiệu ứng glow (`shadow-[0_0_15px...]`) với màu Rose, Indigo, Emerald. Giao diện dạng bo góc lớn (`rounded-2xl`, `rounded-[2.5rem]`). Border slate-700/800.
- **Strict TypeScript:** Không sử dụng type `any`. Mọi interface đều định nghĩa chuẩn trong `src/types/recovery.types.ts`.
- **An toàn mã nguồn:** Khi thêm component hay icon mới, **LUÔN** kiểm tra xem đã import đúng và đầy đủ từ thư viện (như `lucide-react`) chưa. (Lỗi ReferenceError do quên import đã từng xảy ra).

---
**[UPDATE LOG]**
- Đã sửa lỗi `Bot is not defined` do thiếu import từ `lucide-react`.
- Đã cấu trúc lại UI cho bước "Chọn dụng cụ" to và đẹp hơn với grid 2 cột.
- Đã hoàn thiện logic AI cho điểm (Scoring) theo khối lượng tạ đơn.
