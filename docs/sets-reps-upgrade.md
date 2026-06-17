# Kế hoạch Nâng cấp: Ghi nhận chi tiết Sets, Reps & Tính toán Muscle Load

> **Trạng thái:** 📋 Đang lên kế hoạch  
> **Mức độ ảnh hưởng:** 🔴 Cao - Thay đổi kiến trúc cốt lõi  
> **Người thực hiện:** Tu Dang Ken  
> **Ngày tạo:** 2026-06-17

---

## 🎯 Mục tiêu

Đưa ứng dụng từ mức độ theo dõi **tổng thể (Session-based)** lên mức độ **chi tiết (Exercise-based)** bằng cách cho phép người dùng nhập số Set, số Rep, Mức tạ và RPE cho từng bài tập cụ thể. Từ đó, tính toán **Tải trọng (Volume Load)** thực tế tác động lên từng nhóm cơ.

---

## 1. Phân tích Hiện trạng

| Tiêu chí | Hiện tại | Sau nâng cấp |
|---|---|---|
| Đơn vị tính | Session (buổi tập) | Exercise (bài tập) |
| Công thức | `Duration × RPE tổng` | `Sets × Reps × Weight × IntensityFactor` |
| Độ chính xác | Thấp | Cao |
| Dữ liệu cần | Thời gian, RPE | Set, Rep, Tạ, RPE per set |

**Nhược điểm hiện tại:** Một người tập 5 set tạ nặng trong 30 phút sẽ có Load **khác hoàn toàn** so với người tập 1 set tạ nhẹ nhưng nghỉ ngơi tốn 30 phút — nhưng hệ thống hiện tại tính như nhau.

---

## 2. Thay đổi Cấu trúc Dữ liệu

### `src/types/recovery.types.ts`

**[NEW] Thêm các interface mới:**

```typescript
export interface ExerciseSet {
  reps: number;
  weight: number;       // kg (0 nếu là bodyweight)
  rpe?: number;         // RPE riêng cho set này (tùy chọn, thang 1-10)
}

export interface ExerciseSession {
  exerciseId: string;
  name: string;
  muscle_mapping: Partial<Record<MuscleGroup, number>>;
  sets: ExerciseSet[];
}
```

**[MODIFY] Cập nhật `ActivityLog`:**

```typescript
export interface ActivityLog {
  // ... các field cũ giữ nguyên
  detailedExercises?: ExerciseSession[]; // Danh sách bài tập kèm sets/reps
}
```

> ✅ Dùng `optional field (?)` để đảm bảo **backward compatibility** với dữ liệu cũ.

---

## 3. Nâng cấp Giao diện Ghi nhật ký

### `src/components/ActivityForm.tsx`

**Nguyên tắc thiết kế UI:** Tránh "Data Entry Fatigue" — form nhập liệu phải cực kỳ tối giản.

**Giải pháp:**
1. Khi người dùng chọn bài tập (VD: Bench Press) → tự động sinh **1 Set trống mặc định**
2. Cung cấp nút **"+ Thêm Set"** và **"Sao chép Set trước"**
3. Mỗi hàng Set chỉ gồm 3 ô input nhỏ:

```
[ Số KG ] × [ Số Rep ] | RPE [ ]
```

**Thứ tự thay đổi:**
- Tái cấu trúc Step 2 (hoặc tạo Step riêng) khi chọn môn Gym
- Hiển thị danh sách bài tập đã chọn
- Bên dưới mỗi bài tập là các hàng input Set/Rep/Weight

---

## 4. Cập nhật Thuật toán Phục hồi

### `src/utils/recovery.utils.ts`

#### ⚠️ Vấn đề với công thức cũ (cần tránh)

```typescript
// ❌ SAI - RPE không nên nhân trực tiếp vào Volume
exerciseLoad += set.reps * effectiveWeight * (set.rpe || 8);
// RPE là cảm giác gắng sức (1-10), không phải hệ số nhân tuyến tính
```

#### ✅ Công thức đề xuất (dựa trên khoa học thể thao)

```typescript
// Bước 1: Tính Volume thuần túy (Tonnage)
const volume = sets * reps * weight;

// Bước 2: Quy đổi RPE → Intensity Factor (% of 1RM)
function rpeToIntensity(rpe: number): number {
  const rpeTable: Record<number, number> = {
    10: 1.00,  // 100% sức
    9:  0.96,
    8:  0.92,
    7:  0.89,
    6:  0.86,
  };
  return rpeTable[rpe] ?? 0.80; // Mặc định nếu không có RPE
}

// Bước 3: Tính Adjusted Load
const adjustedLoad = volume * rpeToIntensity(rpe);

// Bước 4: Normalize về Fatigue Score (0-100%)
const fatigueImpact = (adjustedLoad / USER_MAX_TOLERANCE) * 100;
```

#### Xử lý Bodyweight Exercises

**Insight quan trọng:** Với bài tập bodyweight, **Reps là thước đo tiến bộ** thay cho Weight.
- Hôm nay: 10 reps hít đất
- Hôm sau: 15 reps hít đất (cùng trọng lượng cơ thể)
- → Volume tăng, cơ chịu tải lâu hơn → Fatigue **phải tăng theo**

Vì vậy **không cần** `userWeight` hay `bodyweightFactor` — thay vào đó dùng **Reps × RPE** làm thước đo tải trọng:

```typescript
// ✅ Công thức Bodyweight: Reps là thước đo tiến bộ
function calcBodyweightLoad(set: ExerciseSet): number {
  const rpe = set.rpe ?? 7; // Mặc định RPE 7 nếu không nhập
  // Reps tăng → Load tăng tuyến tính
  // RPE phản ánh mức độ gắng sức thực tế
  return set.reps * rpeToIntensity(rpe) * 10; // × 10 để normalize về cùng đơn vị với tạ
}

// So sánh 2 buổi tập:
// Buổi 1: 10 reps × RPE 8 (0.92) × 10 = 92 units
// Buổi 2: 15 reps × RPE 8 (0.92) × 10 = 138 units ✅ Fatigue cao hơn đúng như thực tế
```

**Phân loại bài tập theo cách tính Load:**

| Loại | Ví dụ | Công thức Load |
|---|---|---|
| Tạ tự do | Bench Press, Squat | `Reps × Weight × IntensityFactor` |
| Bodyweight | Hít đất, Pull-up, Dip | `Reps × RPE_Intensity × 10` |
| Cardio/Thể thao | Chạy bộ, Bóng đá | `Duration × IntensityFactor` |

> ✅ **Ưu điểm:** Không cần nhập trọng lượng cơ thể, đơn giản hơn cho người dùng, phản ánh đúng tiến bộ thực tế.

---

## 5. Thứ tự Triển khai (Implementation Order)

| Bước | Việc cần làm | File ảnh hưởng | Ưu tiên |
|---|---|---|---|
| 1 | Thêm `userWeight` vào User Profile | `types/`, `components/` | 🔴 Cao |
| 2 | Cập nhật Types & Interfaces | `src/types/recovery.types.ts` | 🔴 Cao |
| 3 | Xây form nhập Set/Rep/Weight | `src/components/ActivityForm.tsx` | 🔴 Cao |
| 4 | Cập nhật thuật toán Recovery | `src/utils/recovery.utils.ts` | 🟡 Trung bình |
| 5 | Auto-fill lịch sử tập | `localStorage` → Database | 🟢 Thấp |

---

## 6. Câu hỏi Cần Làm Rõ (Open Questions)

### Q1: Auto-fill lịch sử tập?
> Nếu người dùng tập cùng 1 giáo án nhiều lần, hệ thống có nên tự động điền sẵn mức tạ và reps của buổi trước không?

**Đề xuất:** ✅ **Nên làm** - đây là tính năng giảm friction rất lớn.
- **Giai đoạn 1:** Lưu `lastSession` per exercise trong `localStorage`
- **Giai đoạn 2:** Đồng bộ lên database

### Q2: Volume cho Bodyweight Exercises?
> Dùng công thức nào cho bài tập không có tạ?

**Đề xuất:** Dùng `RPE × Reps × bodyweightFactor` thay vì Volume thuần túy, vì bài bodyweight thường tăng reps/difficulty thay vì tăng tạ.

---

## 7. Rủi ro & Lưu ý

> [!IMPORTANT]
> Đây là thay đổi kiến trúc lớn, ảnh hưởng đến toàn bộ công thức tính toán phục hồi cốt lõi.

- **Migration data:** Các ActivityLog cũ không có `detailedExercises` → cần xử lý fallback
- **USER_MAX_TOLERANCE:** Cần xác định giá trị chuẩn hóa này dựa trên dữ liệu thực tế
- **RPE Table:** Bảng quy đổi RPE → Intensity có thể cần điều chỉnh theo từng nhóm người dùng
- **Lấy ý kiến chuyên môn** về thuật toán trước khi code thực tế
