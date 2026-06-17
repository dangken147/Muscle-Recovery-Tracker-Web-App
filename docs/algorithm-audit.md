# Kiểm tra Thuật toán: Danh mục Cần Nghiên cứu & Nâng cấp

> **Trạng thái:** 🔍 Đang kiểm tra  
> **Ngày tạo:** 2026-06-17  
> **Cập nhật:** 2026-06-17 (Review lần 2)  
> **Phạm vi:** `recovery.utils.ts`, `aiWorkoutGenerator.ts`, `useRecoveryState.ts`  
> **Mục đích:** Liệt kê các thuật toán cần kiểm tra, không thực thi sửa đổi

---

## ✅ Lỗi Xác nhận (Bug Confirmed)

> Các mục này đã được xác nhận là lỗi thực sự, cần sửa trước khi triển khai.

### BUG-01: Type Mismatch trong `analyzeMuscleRecovery` — ✅ ĐÃ FIX

| | |
|---|---|
| **File** | `aiWorkoutGenerator.ts` |
| **Vị trí** | `UPPER_MUSCLES`, `LOWER_MUSCLES`, `CORE_MUSCLES` constants |
| **Lỗi** | Dùng `'chest'`, `'back'`, `'shoulders'` — các giá trị này **không tồn tại** trong `MuscleGroup` type |
| **Ảnh hưởng** | `freshUpper` và `freshLower` luôn = 0 → `targetRegion` luôn = `'full'` → AI **không bao giờ** đề xuất upper/lower |
| **Cách sửa** | Thay bằng đúng `MuscleGroup` values: `'upper_chest'`, `'lower_chest'`, `'lats'`, `'traps'`, `'front_shoulders'`, `'rear_shoulders'` |
| **Ngày fix** | 2026-06-17 |

### BUG-02: `calibrateMuscleStatesWithDOMS` thiếu tham số `lastLog` — ✅ ĐÃ FIX

| | |
|---|---|
| **File** | `recovery.utils.ts`, `src/components/Dashboard.tsx` |
| **Vị trí** | Hàm `calibrateMuscleStatesWithDOMS` và nơi gọi trong `Dashboard.tsx` |
| **Lỗi** | Gọi `getMuscleHalfLife` thiếu tham số `lastLog` → luôn chạy với `lastLog = undefined` → **bỏ qua toàn bộ hiệu chỉnh ngủ/dinh dưỡng** khi tính DOMS |
| **Cách sửa** | Thêm tham số `lastLog?: ActivityLog` vào signature hàm. `Dashboard.tsx` truyền `lastLog` là log gần nhất |
| **Ngày fix** | 2026-06-17 |

### BUG-03: `calculateMuscleStates` có lỗi đóng ngoặc `}` — ✅ ĐÃ FIX

| | |
|---|---|
| **File** | `recovery.utils.ts` |
| **Vị trí** | Khối `if (log.activityType === 'gym' && log.dumbbellWeight ...)` |
| **Lỗi** | Dấu `}` đóng khối `if (isHomeWorkout)` nằm sai vị trí → các modifier Football và Swimming nằm **bên trong** khối `else` của `isHomeWorkout` |
| **Cách sửa** | Di chuyển `}` đóng khối `if (isHomeWorkout)` và `}` đóng khối `if (gym && dumbbellWeight)` ra đúng cấp độ |
| **Ngày fix** | 2026-06-17 |

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

### 3. `calcExerciseLoad(exercise, userBodyweight)` — ✅ ĐÃ FIX

| | |
|---|---|
| **File** | `recovery.utils.ts`, `exercises_with_joint_mapping.json`, `home_workout_muscle_mapping.json` |
| **Input** | `exercise: ExerciseSession`, `userBodyweight: number` (kg) |
| **Output** | `number` — tổng tải trọng 1 bài tập |
| **Vấn đề** | `bwFraction` mặc định 0.7 áp dụng cho tất cả bài bodyweight — không chính xác |
| **Cách sửa** | Thêm `isBodyweight: true` và `bwFraction` chính xác vào từng bài trong JSON |
| **Ngày fix** | 2026-06-17 |

**Bảng `bwFraction` theo khoa học thể thao:**

| Bài tập | ID | bwFraction | Nguồn |
|---|---|---|---|
| Push-up (các biến thể) | bw_001, bw_002, bw_003 | 0.64 | Suprak et al. 2011 |
| Bodyweight Squat | bw_004 | 0.67 | Lander et al. 1986 |
| Bulgarian Split Squat | bw_005 | 0.85 | Tải trọng 1 chân ≈ 85% BW |
| Glute Bridge | bw_006 | 0.30 | Chỉ phần thân trên nâng lên |
| Plank (isometric) | bw_007 | 0.50 | Tải trọng ổn định ≈ 50% BW |
| Burpee | bw_008 | 0.75 | Tổng hợp push-up + squat jump |
| Pull-up / Chin-up | pub_001, pub_002 | 0.80 | Ronai & Scibek 2014 |

---

### 4. `toFatiguePercent(rawLoad, mtl, k)` — ✅ ĐÃ FIX

| | |
|---|---|
| **File** | `recovery.utils.ts` |
| **Input** | `rawLoad: number`, `mtl: number`, `k = 5` |
| **Output** | `number` — % mệt mỏi (0–100) |
| **Công thức** | Sigmoid: `1 / (1 + e^(-k × (x - 0.5)))` với `x = rawLoad / mtl` |
| **Vấn đề** | `MTL_MAP` cũ quá cao (upper_chest=8000) → 3x10 Bench Press 60kg chỉ gây ~15% fatigue (quá thấp) |
| **Cách sửa** | Hiệu chỉnh lại toàn bộ `MTL_MAP` dựa trên mô phỏng thực tế: 3x10 Bench @ 60kg RPE8 → rawLoad≈1289 → mục tiêu ~50% fatigue → MTL≈2500 |
| **Ngày fix** | 2026-06-17 |

**Bảng MTL_MAP mới (sau hiệu chỉnh):**

| Nhóm | Cơ | MTL cũ | MTL mới | Lý do |
|---|---|---|---|---|
| Ngực | upper/lower_chest | 8000 | **2500** | Chuẩn tham chiếu |
| Lưng | lats | 10000 | **3200** | Lớn hơn ngực |
| Lưng | lower_back | 8000 | **2200** | Dễ tổn thương hơn |
| Chân | quadriceps | 15000 | **5000** | Cơ lớn nhất |
| Chân | hamstrings | 15000 | **4500** | Cơ lớn |
| Chân | glutes | 15000 | **4800** | Cơ lớn |
| Vai | front_shoulders | 5000 | **1800** | Nhỏ hơn ngực |
| Tay | biceps | 3000 | **1200** | Cơ nhỏ |
| Khớp | knees/ankles | 3000 | **1200/1000** | Dễ tổn thương |
| Dây chằng | acl/achilles | 3000 | **800** | Ngưỡng thấp nhất |

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

### 6. `calculateACWR(logs, targetTime)` — ✅ ĐÃ FIX

| | |
|---|---|
| **File** | `recovery.utils.ts` |
| **Input** | `logs: ActivityLog[]`, `targetTime: number`, `userBodyweight: number` *(mới)* |
| **Output** | `number` — tỷ lệ ACWR |
| **Vấn đề** | Load luôn dùng `intensity × duration` kể cả khi đã có `detailedExercises` |
| **Cách sửa** | Ưu tiên dùng `calculateTotalVolumeLoad(detailedExercises, userBodyweight)` khi có, fallback legacy khi không có |
| **Ngày fix** | 2026-06-17 |

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

### 9. `calculateCortisolState(profile, logs, targetTime)` — ✅ ĐÃ FIX

| | |
|---|---|
| **File** | `recovery.utils.ts` |
| **Input** | `profile: UserProfile` *(giờ dùng thực sự)*, `logs: ActivityLog[]`, `targetTime: number` |
| **Output** | `CortisolState` |
| **Vấn đề** | `_profile` bị bỏ qua — không cá nhân hóa cortisol theo người dùng |
| **Cách sửa** | Tích hợp 3 yếu tố từ profile: `age` (clearance chậm sau 35 tuổi), `rhr` (RHR thấp = decay nhanh hơn), `primarySport` (endurance athlete có baseline và spike thấp hơn) |
| **Ngày fix** | 2026-06-17 |

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

### 14. `useRecoveryState` — Data Flow & Side Effects — ✅ ĐÃ FIX

| | |
|---|---|
| **File** | `useRecoveryState.ts` |
| **Input** | Không có (hook tự fetch từ API/localStorage) |
| **Output** | Toàn bộ state của ứng dụng |
| **Vấn đề 1** | `targetTime = Date.now() + ...` thay đổi mỗi millisecond → `useMemo` tính lại liên tục |
| **Cách sửa 1** | Wrap `targetTime` trong `useMemo`, làm tròn xuống phút gần nhất → chỉ thay đổi mỗi 60 giây |
| **Vấn đề 2** | `handleSimulateSleep` chỉ cập nhật UI state, không sync về DB → mất dữ liệu khi reload |
| **Cách sửa 2** | Sync cả `localStorage` và gọi API `POST /logs` sau khi cập nhật |
| **Ngày fix** | 2026-06-17 |

---

## 📊 Tóm tắt Ưu tiên

| Ưu tiên | Mã | Thuật toán | Loại |
|---|---|---|---|
| 🔴 Cao | BUG-01 | `analyzeMuscleRecovery` — type mismatch | **Bug** |
| 🔴 Cao | BUG-02 | `calibrateMuscleStatesWithDOMS` — thiếu `lastLog` | **Bug** |
| 🔴 Cao | BUG-03 | `calculateMuscleStates` — lỗi đóng ngoặc `}` | **Bug** |
| 🟡 Trung bình | #3 | `calcExerciseLoad` — `bwFraction` mặc định 0.7 | Cần nghiên cứu |
| ✅ Đã fix | #6 | `calculateACWR` — vẫn dùng legacy load | 2026-06-17 |
| ✅ Đã fix | #9 | `calculateCortisolState` — `_profile` bỏ qua | 2026-06-17 |
| ✅ Đã fix | #14 | `useRecoveryState` — performance & sync | 2026-06-17 |
| 🟢 Thấp | #4 | `toFatiguePercent` — xác nhận MTL_MAP | Cần nghiên cứu |
| 🟢 Thấp | #8 | `getMuscleHalfLife` — xác nhận hằng số | Cần nghiên cứu |
| 🟢 Thấp | #11 | `generateCoachAdvice` — `_profile` bỏ qua | Cần nâng cấp |
