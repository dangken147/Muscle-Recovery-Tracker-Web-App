# Kiểm tra Thuật toán: Danh mục Cần Nghiên cứu & Nâng cấp

> **Trạng thái:** 🔍 Đang kiểm tra  
> **Ngày tạo:** 2026-06-17  
> **Cập nhật:** 2026-06-17 (Review lần 2)  
> **Phạm vi:** `recovery.utils.ts`, `aiWorkoutGenerator.ts`, `useRecoveryState.ts`  
> **Mục đích:** Liệt kê các thuật toán cần kiểm tra, không thực thi sửa đổi

---

## ✅ Lỗi Xác nhận (Bug Confirmed)

> Các mục này đã được xác nhận là lỗi thực sự, cần sửa trước khi triển khai.

### BUG-01: Type Mismatch trong `analyzeMuscleRecovery`

| | |
|---|---|
| **File** | `aiWorkoutGenerator.ts` |
| **Vị trí** | `UPPER_MUSCLES`, `LOWER_MUSCLES`, `CORE_MUSCLES` constants |
| **Lỗi** | Dùng `'chest'`, `'back'`, `'shoulders'` — các giá trị này **không tồn tại** trong `MuscleGroup` type |
| **Ảnh hưởng** | `freshUpper` và `freshLower` luôn = 0 → `targetRegion` luôn = `'full'` → AI **không bao giờ** đề xuất upper/lower |
| **Đúng phải là** | `'upper_chest'`, `'lower_chest'`, `'lats'`, `'traps'`, `'front_shoulders'`... |

### BUG-02: `calibrateMuscleStatesWithDOMS` thiếu tham số `lastLog`

| | |
|---|---|
| **File** | `recovery.utils.ts` |
| **Vị trí** | Dòng gọi `getMuscleHalfLife(state.muscle, profile)` |
| **Lỗi** | Gọi `getMuscleHalfLife` thiếu tham số `lastLog` → hàm luôn chạy với `lastLog = undefined` → **bỏ qua toàn bộ hiệu chỉnh ngủ/dinh dưỡng** khi tính DOMS |
| **Ảnh hưởng** | Thời gian phục hồi sau DOMS luôn dùng base half-life, không phản ánh ngủ xấu/dinh dưỡng kém |

### BUG-03: `calculateMuscleStates` có lỗi đóng ngoặc `}`

| | |
|---|---|
| **File** | `recovery.utils.ts` |
| **Vị trí** | Khối `else` của fallback legacy (dòng xử lý `dumbbellWeight`) |
| **Lỗi** | Dấu `}` đóng khối `if (isHomeWorkout)` nằm sai vị trí → các modifier Football và Swimming nằm **bên trong** khối `else` của `isHomeWorkout` thay vì ở cấp độ đúng |
| **Ảnh hưởng** | Modifier bóng đá và bơi lội chỉ được áp dụng khi `isHomeWorkout = false`, tức là **không bao giờ chạy** với gym tại nhà |

---

## 🔍 Thuật toán Cần Kiểm tra

### 1. `rpeMultiplier(rpe)`

| | |
|---|---|
| **File** | `recovery.utils.ts` |
| **Input** | `rpe: number` (thang 1–10) |
| **Output** | `number` — hệ số cường độ |
| **Công thức hiện tại** | `Math.pow(rpe / 10, 1.5)` |
| **Vấn đề cần kiểm tra** | Power Law có phản ánh đúng thang RPE khoa học không? RPE 6 → 0.47, RPE 10 → 1.0 — khoảng cách này có hợp lý không? |

---

### 2. `calcSetLoad(set, effectiveWeight)`

| | |
|---|---|
| **File** | `recovery.utils.ts` |
| **Input** | `set: ExerciseSet`, `effectiveWeight: number` (kg) |
| **Output** | `number` — tải trọng 1 hiệp |
| **Công thức hiện tại** | `reps × effectiveWeight × rpeMultiplier(rpe)` |
| **Vấn đề cần kiểm tra** | Đơn vị đầu ra là gì? Có cần normalize không? So sánh với chuẩn Tonnage (kg) trong khoa học thể thao. |

---

### 3. `calcExerciseLoad(exercise, userBodyweight)`

| | |
|---|---|
| **File** | `recovery.utils.ts` |
| **Input** | `exercise: ExerciseSession`, `userBodyweight: number` (kg) |
| **Output** | `number` — tổng tải trọng 1 bài tập |
| **Công thức hiện tại** | Nếu `isBodyweight`: `effectiveWeight = userBodyweight × bwFraction + set.weight` |
| **Vấn đề cần kiểm tra** | `bwFraction` mặc định 0.7 có đúng cho tất cả bài bodyweight không? Cần bảng riêng theo từng bài (push-up=0.64, pull-up=0.80...) |

---

### 4. `toFatiguePercent(rawLoad, mtl, k)`

| | |
|---|---|
| **File** | `recovery.utils.ts` |
| **Input** | `rawLoad: number`, `mtl: number`, `k = 5` |
| **Output** | `number` — % mệt mỏi (0–100) |
| **Công thức hiện tại** | Sigmoid: `1 / (1 + e^(-k × (x - 0.5)))` với `x = rawLoad / mtl` |
| **Vấn đề cần kiểm tra** | Giá trị `MTL_MAP` có căn cứ khoa học không? Hằng số `k=5` có phù hợp không? |

---

### 5. `calculateDetailedSessionFatigue(detailedExercises, userBodyweight)`

| | |
|---|---|
| **File** | `recovery.utils.ts` |
| **Input** | `detailedExercises: ExerciseSession[]`, `userBodyweight: number` |
| **Output** | `Partial<Record<MuscleGroup, number>>` — % mệt mỏi theo từng nhóm cơ |
| **Công thức hiện tại** | Tổng load từng bài × `muscle_mapping ratio` → `toFatiguePercent` |
| **Vấn đề cần kiểm tra** | Khi nhiều bài cùng tác động 1 nhóm cơ, load có được cộng dồn đúng không? Có bị double-count không? |

---

### 6. `calculateACWR(logs, targetTime)`

| | |
|---|---|
| **File** | `recovery.utils.ts` |
| **Input** | `logs: ActivityLog[]`, `targetTime: number` |
| **Output** | `number` — tỷ lệ ACWR |
| **Công thức hiện tại** | `acuteLoad (7 ngày) / avgChronicLoad (28 ngày / 4)` với load = `intensity × duration` |
| **Vấn đề cần kiểm tra** | Load vẫn dùng legacy — sau khi có `detailedExercises`, có nên cập nhật ACWR dùng Volume Load mới không? |

---

### 7. `calculateMuscleStates(profile, logs, targetTime)`

| | |
|---|---|
| **File** | `recovery.utils.ts` |
| **Input** | `profile: UserProfile`, `logs: ActivityLog[]`, `targetTime: number` |
| **Output** | `MuscleState[]` |
| **Công thức hiện tại** | Exponential decay + cộng dồn fatigue theo từng log |
| **Vấn đề cần kiểm tra** | Giới hạn `finalIncrease ≤ 75%` có hợp lý không? Fallback legacy (`intensity × 6 + duration / 4`) có còn cần giữ không sau khi có `detailedExercises`? |
| **Ghi chú thêm** | ❗ Liên quan đến BUG-03 — cần sửa lỗi đóng ngoặc trước khi kiểm tra logic |

---

### 8. `getMuscleHalfLife(muscle, profile, lastLog)`

| | |
|---|---|
| **File** | `recovery.utils.ts` |
| **Input** | `muscle: MuscleGroup`, `profile: UserProfile`, `lastLog?: ActivityLog` |
| **Output** | `number` — thời gian bán rã (giờ) |
| **Công thức hiện tại** | Base half-life theo kích thước cơ × hệ số RHR, tuổi, ngủ, dinh dưỡng, chấn thương |
| **Vấn đề cần kiểm tra** | Base half-life (small=12h, medium=24h, large=36h) có đúng với DOMS thực tế không? Hệ số tuổi (+1.5%/năm sau 30) có căn cứ không? |
| **Ghi chú thêm** | ❗ Liên quan đến BUG-02 — khi gọi từ `calibrateMuscleStatesWithDOMS` thiếu `lastLog` |

---

### 9. `calculateCortisolState(profile, logs, targetTime)`

| | |
|---|---|
| **File** | `recovery.utils.ts` |
| **Input** | `_profile: UserProfile` *(bỏ qua)*, `logs: ActivityLog[]`, `targetTime: number` |
| **Output** | `CortisolState` |
| **Công thức hiện tại** | Spike = `(intensity × duration) / 20`, decay half-life 4/6/12h |
| **Vấn đề cần kiểm tra** | Spike vẫn dùng legacy — có nên cập nhật theo Volume Load mới không? Ngưỡng zone (40/70%) có căn cứ sinh lý không? |
| **Ghi chú thêm** | Tham số `_profile` bị bỏ qua hoàn toàn — có thể tích hợp `profile.weight`, `profile.age` để cá nhân hóa cortisol không? |

---

### 10. `calibrateMuscleStatesWithDOMS(profile, states, domsRecords)`

| | |
|---|---|
| **File** | `recovery.utils.ts` |
| **Input** | `profile: UserProfile`, `states: MuscleState[]`, `domsRecords: Record<MuscleGroup, number>` |
| **Output** | `MuscleState[]` |
| **Công thức hiện tại** | Map DOMS 2–5 → minFatigue (35/60/85/100%) |
| **Vấn đề cần kiểm tra** | Ngưỡng minFatigue có phù hợp với thang DOMS chuẩn không? |
| **Ghi chú thêm** | ❗ Liên quan đến BUG-02 — gọi `getMuscleHalfLife` thiếu `lastLog` |

---

### 11. `generateCoachAdvice(profile, muscleStates, cortisol)`

| | |
|---|---|
| **File** | `recovery.utils.ts` |
| **Input** | `profile: UserProfile` *(bỏ qua)*, `muscleStates: MuscleState[]`, `cortisol: CortisolState` |
| **Output** | `CoachAdvice` |
| **Công thức hiện tại** | Lọc cơ theo fatigue < 70% + Synergy Matrix |
| **Vấn đề cần kiểm tra** | Ngưỡng `avoidMuscles.length > 5` có hợp lý không? Synergy Matrix có đủ không? |
| **Ghi chú thêm** | Tham số `_profile` bị bỏ qua — có thể dùng `profile.primarySport` để tùy chỉnh lời khuyên không? |

---

### 12. `analyzeMuscleRecovery(muscleStates)` ❗ BUG-01

| | |
|---|---|
| **File** | `aiWorkoutGenerator.ts` |
| **Input** | `muscleStates: Record<MuscleGroup, number>` |
| **Output** | `AIAnalysisResult` — vùng đề xuất (upper/lower/full) |
| **Công thức hiện tại** | fresh ≥ 75%, fatigued ≤ 50%; so sánh số lượng cơ upper vs lower |
| **Vấn đề cần kiểm tra** | Ngưỡng 75%/50% có đúng không? ❗ **BUG-01 xác nhận**: `UPPER_MUSCLES` dùng `'chest'`, `'back'`, `'shoulders'` không tồn tại trong `MuscleGroup` |

---

### 13. `generateSmartWorkout(...)`

| | |
|---|---|
| **File** | `aiWorkoutGenerator.ts` |
| **Input** | `allExercises`, `equipment`, `muscleStates`, `profile`, `count`, `dumbbellWeight`, `dumbbellCount` |
| **Output** | `{ workoutIds: string[], message: string }` |
| **Công thức hiện tại** | Lọc equipment → loại bỏ cơ mệt/chấn thương → score → chọn theo region |
| **Vấn đề cần kiểm tra** | `getScore()` chỉ dựa vào `dumbbellWeight`, chưa tính tiến bộ người dùng. Có nên tích hợp Volume Load sau khi có `detailedExercises` không? |
| **Ghi chú thêm** | ❗ Phụ thuộc vào BUG-01 — `targetRegion` luôn = `'full'` nên logic upper/lower chưa bao giờ chạy |

---

### 14. `useRecoveryState` — Data Flow & Side Effects

| | |
|---|---|
| **File** | `useRecoveryState.ts` |
| **Input** | Không có (hook tự fetch từ API/localStorage) |
| **Output** | Toàn bộ state của ứng dụng |
| **Vấn đề cần kiểm tra** | `muscleStates` và `cortisolState` được tính lại mỗi khi `targetTime` thay đổi (mỗi giây?) — có gây performance issue không? |
| **Ghi chú thêm** | `handleSimulateSleep` chỉ cập nhật local UI state, **không sync về DB** — dữ liệu sẽ mất khi reload trang |

---

## 📊 Tóm tắt Ưu tiên

| Ưu tiên | Mã | Thuật toán | Loại |
|---|---|---|---|
| 🔴 Cao | BUG-01 | `analyzeMuscleRecovery` — type mismatch | **Bug** |
| 🔴 Cao | BUG-02 | `calibrateMuscleStatesWithDOMS` — thiếu `lastLog` | **Bug** |
| 🔴 Cao | BUG-03 | `calculateMuscleStates` — lỗi đóng ngoặc `}` | **Bug** |
| 🟡 Trung bình | #3 | `calcExerciseLoad` — `bwFraction` mặc định 0.7 | Cần nghiên cứu |
| 🟡 Trung bình | #6 | `calculateACWR` — vẫn dùng legacy load | Cần nâng cấp |
| 🟡 Trung bình | #9 | `calculateCortisolState` — `_profile` bỏ qua | Cần nâng cấp |
| 🟡 Trung bình | #14 | `useRecoveryState` — performance & sync | Cần kiểm tra |
| 🟢 Thấp | #4 | `toFatiguePercent` — xác nhận MTL_MAP | Cần nghiên cứu |
| 🟢 Thấp | #8 | `getMuscleHalfLife` — xác nhận hằng số | Cần nghiên cứu |
| 🟢 Thấp | #11 | `generateCoachAdvice` — `_profile` bỏ qua | Cần nâng cấp |
