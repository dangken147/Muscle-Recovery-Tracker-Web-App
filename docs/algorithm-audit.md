# Kiểm tra Thuật toán: Danh mục Cần Nghiên cứu & Nâng cấp

> **Trạng thái:** 🔍 Đang kiểm tra  
> **Ngày tạo:** 2026-06-17  
> **Phạm vi:** `src/utils/recovery.utils.ts`, `src/utils/aiWorkoutGenerator.ts`  
> **Mục đích:** Liệt kê các thuật toán cần kiểm tra, không thực thi sửa đổi

---

## 1. `rpeMultiplier(rpe)`

| | |
|---|---|
| **File** | `recovery.utils.ts` |
| **Input** | `rpe: number` (thang 1–10) |
| **Output** | `number` — hệ số cường độ |
| **Công thức hiện tại** | `Math.pow(rpe / 10, 1.5)` |
| **Vấn đề cần kiểm tra** | Công thức Power Law có phản ánh đúng thang RPE khoa học không? RPE 6 vs RPE 10 có khoảng cách hợp lý không? |

---

## 2. `calcSetLoad(set, effectiveWeight)`

| | |
|---|---|
| **File** | `recovery.utils.ts` |
| **Input** | `set: ExerciseSet`, `effectiveWeight: number` (kg) |
| **Output** | `number` — tải trọng 1 hiệp |
| **Công thức hiện tại** | `reps × effectiveWeight × rpeMultiplier(rpe)` |
| **Vấn đề cần kiểm tra** | Đơn vị đầu ra là gì? Có cần normalize không? So sánh với chuẩn Tonnage (kg) trong khoa học thể thao. |

---

## 3. `calcExerciseLoad(exercise, userBodyweight)`

| | |
|---|---|
| **File** | `recovery.utils.ts` |
| **Input** | `exercise: ExerciseSession`, `userBodyweight: number` (kg) |
| **Output** | `number` — tổng tải trọng 1 bài tập |
| **Công thức hiện tại** | Nếu `isBodyweight`: `effectiveWeight = userBodyweight × bwFraction + set.weight` |
| **Vấn đề cần kiểm tra** | `bwFraction` mặc định 0.7 có đúng cho tất cả bài bodyweight không? Cần bảng riêng theo từng bài tập. |

---

## 4. `toFatiguePercent(rawLoad, mtl, k)`

| | |
|---|---|
| **File** | `recovery.utils.ts` |
| **Input** | `rawLoad: number`, `mtl: number` (Maximum Tolerable Load), `k = 5` |
| **Output** | `number` — % mệt mỏi (0–100) |
| **Công thức hiện tại** | Sigmoid curve: `1 / (1 + e^(-k × (x - 0.5)))` với `x = rawLoad / mtl` |
| **Vấn đề cần kiểm tra** | Giá trị `MTL_MAP` cho từng nhóm cơ có căn cứ khoa học không? Hằng số `k=5` có phù hợp không? |

---

## 5. `calculateDetailedSessionFatigue(detailedExercises, userBodyweight)`

| | |
|---|---|
| **File** | `recovery.utils.ts` |
| **Input** | `detailedExercises: ExerciseSession[]`, `userBodyweight: number` |
| **Output** | `Partial<Record<MuscleGroup, number>>` — % mệt mỏi theo từng nhóm cơ |
| **Công thức hiện tại** | Tổng hợp load từng bài × `muscle_mapping ratio` → đưa qua `toFatiguePercent` |
| **Vấn đề cần kiểm tra** | Khi nhiều bài tập cùng tác động 1 nhóm cơ, load có được cộng dồn đúng không? Có bị double-count không? |

---

## 6. `calculateACWR(logs, targetTime)`

| | |
|---|---|
| **File** | `recovery.utils.ts` |
| **Input** | `logs: ActivityLog[]`, `targetTime: number` (timestamp) |
| **Output** | `number` — tỷ lệ ACWR |
| **Công thức hiện tại** | `acuteLoad (7 ngày) / avgChronicLoad (28 ngày / 4)` |
| **Vấn đề cần kiểm tra** | Load đang dùng `intensity × duration` (legacy) — sau khi có `detailedExercises`, có nên cập nhật ACWR dùng Volume Load mới không? |

---

## 7. `calculateMuscleStates(profile, logs, targetTime)`

| | |
|---|---|
| **File** | `recovery.utils.ts` |
| **Input** | `profile: UserProfile`, `logs: ActivityLog[]`, `targetTime: number` |
| **Output** | `MuscleState[]` — trạng thái toàn bộ nhóm cơ |
| **Công thức hiện tại** | Exponential decay + cộng dồn fatigue theo từng log |
| **Vấn đề cần kiểm tra** | Giới hạn `finalIncrease ≤ 75%` có hợp lý không? Fallback legacy (`intensity × 6 + duration / 4`) có còn cần giữ không sau khi có `detailedExercises`? |

---

## 8. `getMuscleHalfLife(muscle, profile, lastLog)`

| | |
|---|---|
| **File** | `recovery.utils.ts` |
| **Input** | `muscle: MuscleGroup`, `profile: UserProfile`, `lastLog?: ActivityLog` |
| **Output** | `number` — thời gian bán rã (giờ) |
| **Công thức hiện tại** | Base half-life theo kích thước cơ × các hệ số RHR, tuổi, ngủ, dinh dưỡng, chấn thương |
| **Vấn đề cần kiểm tra** | Base half-life (small=12h, medium=24h, large=36h) có đúng với DOMS thực tế không? Hệ số tuổi (+1.5%/năm sau 30) có căn cứ không? |

---

## 9. `calculateCortisolState(profile, logs, targetTime)`

| | |
|---|---|
| **File** | `recovery.utils.ts` |
| **Input** | `_profile: UserProfile`, `logs: ActivityLog[]`, `targetTime: number` |
| **Output** | `CortisolState` — mức cortisol & zone |
| **Công thức hiện tại** | Spike = `(intensity × duration) / 20`, decay theo half-life 4/6/12h |
| **Vấn đề cần kiểm tra** | Spike vẫn dùng `intensity × duration` (legacy) — có nên cập nhật theo Volume Load mới không? Ngưỡng zone (40/70%) có căn cứ sinh lý không? |

---

## 10. `calibrateMuscleStatesWithDOMS(profile, states, domsRecords)`

| | |
|---|---|
| **File** | `recovery.utils.ts` |
| **Input** | `profile: UserProfile`, `states: MuscleState[]`, `domsRecords: Record<MuscleGroup, number>` |
| **Output** | `MuscleState[]` — trạng thái cơ sau hiệu chỉnh DOMS |
| **Công thức hiện tại** | Map DOMS 2–5 → minFatigue (35/60/85/100%) |
| **Vấn đề cần kiểm tra** | Ngưỡng minFatigue có phù hợp với thang DOMS chuẩn (Delayed Onset Muscle Soreness) không? |

---

## 11. `generateCoachAdvice(profile, muscleStates, cortisol)`

| | |
|---|---|
| **File** | `recovery.utils.ts` |
| **Input** | `profile: UserProfile`, `muscleStates: MuscleState[]`, `cortisol: CortisolState` |
| **Output** | `CoachAdvice` — lời khuyên + danh sách cơ an toàn/tránh |
| **Công thức hiện tại** | Lọc cơ theo fatigue < 70% + áp dụng Synergy Matrix |
| **Vấn đề cần kiểm tra** | Ngưỡng `avoidMuscles.length > 5` để chuyển sang "Hồi Phục Chủ Động" có hợp lý không? Synergy Matrix có đủ các mối quan hệ cơ không? |

---

## 12. `analyzeMuscleRecovery(muscleStates)`

| | |
|---|---|
| **File** | `aiWorkoutGenerator.ts` |
| **Input** | `muscleStates: Record<MuscleGroup, number>` |
| **Output** | `AIAnalysisResult` — vùng đề xuất (upper/lower/full) |
| **Công thức hiện tại** | fresh ≥ 75%, fatigued ≤ 50%; so sánh số lượng cơ upper vs lower |
| **Vấn đề cần kiểm tra** | Ngưỡng 75%/50% có đúng không? `UPPER_MUSCLES` trong file này dùng `'chest'`, `'back'`, `'shoulders'` — không khớp với `MuscleGroup` thực tế trong types. |

---

## 13. `generateSmartWorkout(...)`

| | |
|---|---|
| **File** | `aiWorkoutGenerator.ts` |
| **Input** | `allExercises`, `equipment`, `muscleStates`, `profile`, `count`, `dumbbellWeight`, `dumbbellCount` |
| **Output** | `{ workoutIds: string[], message: string }` |
| **Công thức hiện tại** | Lọc theo equipment → loại bỏ cơ mệt/chấn thương → score → chọn theo region |
| **Vấn đề cần kiểm tra** | Sau khi có `detailedExercises`, có nên tích hợp Volume Load vào việc chọn bài tập không? `getScore()` hiện chỉ dựa vào dumbbellWeight, chưa tính đến tiến bộ của người dùng. |

---

## Tóm tắt Ưu tiên Kiểm tra

| Ưu tiên | Thuật toán | Lý do |
|---|---|---|
| 🔴 Cao | `calcExerciseLoad` (#3) | `bwFraction` mặc định 0.7 có thể sai cho nhiều bài |
| 🔴 Cao | `analyzeMuscleRecovery` (#12) | Lỗi type: dùng `'chest'` thay vì `'upper_chest'` |
| 🔴 Cao | `calculateACWR` (#6) | Vẫn dùng legacy load, chưa tích hợp Volume mới |
| 🟡 Trung bình | `getMuscleHalfLife` (#8) | Cần xác nhận hằng số khoa học |
| 🟡 Trung bình | `calculateCortisolState` (#9) | Spike vẫn dùng legacy |
| 🟡 Trung bình | `toFatiguePercent` (#4) | Cần xác nhận giá trị MTL_MAP |
| 🟢 Thấp | `generateCoachAdvice` (#11) | Logic ổn, chỉ cần kiểm tra ngưỡng |
| 🟢 Thấp | `calibrateMuscleStatesWithDOMS` (#10) | Cần xác nhận thang DOMS |
