# Kế hoạch Nâng cấp: Ghi nhận chi tiết Sets, Reps & Tính toán Muscle Load

Mục tiêu: Đưa ứng dụng từ mức độ theo dõi tổng thể (Session-based) lên mức độ chi tiết (Exercise-based) bằng cách cho phép người dùng nhập số Set, số Rep, Mức tạ và RPE cho từng bài tập cụ thể. Từ đó, tính toán Tải trọng (Volume Load) thực tế tác động lên từng nhóm cơ.

## 1. Phân tích Hiện trạng
- **Hiện tại:** Ứng dụng tính độ mỏi dựa trên `Duration (Thời gian)` x `Intensity (RPE tổng)`.
- **Nhược điểm:** Không phản ánh đúng khối lượng tạ (Volume) thực tế. Một người tập 5 set tạ nặng trong 30 phút sẽ có Load khác hoàn toàn so với người tập 1 set tạ nhẹ nhưng cũng nghỉ ngơi tốn 30 phút.

## 2. Thay đổi Cấu trúc Dữ liệu (Data Structure)

### `src/types/recovery.types.ts`
[NEW] Thêm các interface mới để lưu trữ chi tiết Set và Bài tập:
```typescript
export interface ExerciseSet {
  reps: number;
  weight: number; // kg (0 nếu là bodyweight)
  rpe?: number; // RPE riêng cho set này (tùy chọn)
}

export interface ExerciseSession {
  exerciseId: string;
  name: string;
  muscle_mapping: Partial<Record<MuscleGroup, number>>;
  sets: ExerciseSet[];
}
```

[MODIFY] Cập nhật `ActivityLog`:
```typescript
export interface ActivityLog {
  // ... các field cũ
  detailedExercises?: ExerciseSession[]; // Danh sách bài tập đã tập kèm sets/reps
}
```

## 3. Nâng cấp Giao diện Ghi nhật ký (ActivityForm.tsx)

**Bài toán UI:** Việc nhập Set/Rep rất dễ gây mệt mỏi cho người dùng ("Data entry fatigue").
- **Giải pháp:** 
  1. Khi người dùng chọn bài tập (VD: Bench Press), hệ thống tự động sinh ra 1 Set trống mặc định.
  2. Cung cấp nút "+ Thêm Set" hoặc nút "Sao chép Set trước đó".
  3. Form nhập liệu cần cực kỳ tối giản (chỉ gồm 3 ô input nhỏ trên 1 hàng: `[ Số KG ] x [ Số Rep ] | RPE [ ]`).

### [MODIFY] `src/components/ActivityForm.tsx`
- Tái cấu trúc lại Step 2 (hoặc tạo một Step riêng) khi chọn môn Gym.
- Hiển thị danh sách các bài tập đã chọn, bên dưới mỗi bài tập là các hàng input để nhập Set/Rep/Weight.

## 4. Cập nhật Thuật toán Phục hồi (recovery.utils.ts)

**Thách thức:** Quy đổi (Set x Rep x Weight) ra Load tiêu chuẩn.
- Đối với bài tập tạ: `Volume = Sets * Reps * Weight`.
- Đối với Bodyweight (Weight = 0): Chúng ta sẽ cần dùng `Weight = Trọng lượng cơ thể * Hệ số bài tập` (VD: Push-up chịu khoảng 64% trọng lượng cơ thể).

**Thuật toán dự kiến (Cần AI/Chuyên gia xác nhận):**
```typescript
// Tính Tonnage (Volume Load)
let exerciseLoad = 0;
session.sets.forEach(set => {
  const effectiveWeight = set.weight === 0 ? (userWeight * bodyweightFactor) : set.weight;
  exerciseLoad += set.reps * effectiveWeight * (set.rpe || 8);
});
// Normalize load về hệ số Fatigue (0-100%)
const fatigueImpact = (exerciseLoad / USER_MAX_TOLERANCE) * 100;
```

## 5. Các Câu hỏi Cần Làm Rõ (Open Questions)
1. **Lưu trữ lịch sử:** Nếu người dùng tập cùng 1 giáo án nhiều lần, hệ thống có nên tự động "điền sẵn" (auto-fill) mức tạ và reps của buổi tập trước đó để họ không phải nhập lại từ đầu không?
2. **Bodyweight Baseline:** Chúng ta có nên tính Volume cho bài tập Bodyweight không, hay áp dụng một công thức RPE x Reps riêng cho Bodyweight?

---
> [!IMPORTANT]
> Đây là một thay đổi kiến trúc lớn, ảnh hưởng đến toàn bộ công thức tính toán phục hồi cốt lõi của ứng dụng. Hãy lấy ý kiến tham khảo từ AI chuyên môn (Prompt được cung cấp ở chat) trước khi chúng ta code thực tế.
