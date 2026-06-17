# Nghiên cứu: Các Trường Phái Rep Range & Tối ưu Thuật toán Tính Tải Cơ Bắp

> **Trạng thái:** 🔍 Đang nghiên cứu  
> **Ngày tạo:** 2026-06-17  
> **Mục tiêu:** Liệt kê các trường phái chọn số rep, mục đích của từng trường phái, và hướng tích hợp vào thuật toán `calcSetLoad` để tính fatigue chính xác nhất có thể

---

## Luồng dữ liệu

```
bodyWeight → bài tập → số rep → ghi nhận bài tập → truyền vào cơ thể để tính toán
```

---

## 1. Các Trường Phái Rep Range

### 1.1 Strength (Sức mạnh tối đa) — 1–5 reps

| Thuộc tính | Chi tiết |
|---|---|
| **Mục đích** | Tăng sức mạnh thần kinh cơ (neuromuscular strength), không phải tăng khối lượng cơ |
| **Cơ chế** | Kích hoạt tối đa các motor unit, tăng tần số xử lý thần kinh |
| **Tải trọng** | 85–100% 1RM |
| **Nghỉ giữa set** | 3–5 phút |
| **DOMS** | Thấp đến trung bình (cơ chế chủ yếu là thần kinh, ít tổn thương cơ học) |
| **Đại diện** | Powerlifting, Olympic Weightlifting |

**Ảnh hưởng đến thuật toán:**
```
fatigueType = 'neural'  → CNS fatigue cao, cơ bắp phục hồi nhanh hơn
rawLoad = reps × weight × rpeMultiplier  → load cao nhưng DOMS thấp
```

---

### 1.2 Hypertrophy (Tăng khối lượng cơ) — 6–12 reps

| Thuộc tính | Chi tiết |
|---|---|
| **Mục đích** | Tăng tiết diện ngang cơ (muscle cross-sectional area) |
| **Cơ chế** | Kết hợp Mechanical Tension + Metabolic Stress + Muscle Damage |
| **Tải trọng** | 65–85% 1RM |
| **Nghỉ giữa set** | 60–90 giây đến 2 phút |
| **DOMS** | Cao nhất trong các trường phái (tổn thương cơ học nhiều nhất) |
| **Đại diện** | Bodybuilding, Physique |

**Ảnh hưởng đến thuật toán:**
```
fatigueType = 'mechanical'  → DOMS cao, half-life dài nhất
rawLoad = reps × weight × rpeMultiplier  → đây là zone tạo ra nhiều fatigue nhất
```

---

### 1.3 Muscular Endurance (Sức bền cơ) — 15+ reps

| Thuộc tính | Chi tiết |
|---|---|
| **Mục đích** | Tăng khả năng chịu đựng mệt mỏi của cơ (lactate threshold) |
| **Cơ chế** | Chủ yếu Metabolic Stress, ít Mechanical Tension |
| **Tải trọng** | < 65% 1RM |
| **Nghỉ giữa set** | < 60 giây |
| **DOMS** | Thấp (tải nhẹ, ít tổn thương cơ học) |
| **Đại diện** | CrossFit, Circuit Training, Calisthenics |

**Ảnh hưởng đến thuật toán:**
```
fatigueType = 'metabolic'  → DOMS thấp, phục hồi nhanh hơn
rawLoad = reps × weight × rpeMultiplier  → load thấp dù nhiều reps
```

---

### 1.4 Power (Sức mạnh bùng nổ) — 1–6 reps @ tốc độ cao

| Thuộc tính | Chi tiết |
|---|---|
| **Mục đích** | Tăng tốc độ sinh lực (Rate of Force Development) |
| **Cơ chế** | Kích hoạt nhanh các fast-twitch fiber (Type IIx) |
| **Tải trọng** | 30–70% 1RM nhưng thực hiện tối đa tốc độ |
| **Nghỉ giữa set** | 2–3 phút |
| **DOMS** | Trung bình (fast-twitch fiber dễ tổn thương) |
| **Đại diện** | Olympic lifting, Plyometrics, Sprinting |

---

### 1.5 General Fitness — 8–15 reps (vùng trung gian)

| Thuộc tính | Chi tiết |
|---|---|
| **Mục đích** | Cân bằng giữa sức mạnh, khối lượng cơ và sức bền |
| **Tải trọng** | 60–80% 1RM |
| **DOMS** | Trung bình |
| **Đại diện** | Người tập phổ thông, gym cơ bản |

---

## 2. Bảng Tóm tắt So sánh

| Trường phái | Rep range | % 1RM | DOMS | Phục hồi | Fatigue type |
|---|---|---|---|---|---|
| Strength | 1–5 | 85–100% | Thấp | Nhanh | Neural |
| Hypertrophy | 6–12 | 65–85% | **Cao** | Chậm | Mechanical |
| Endurance | 15+ | <65% | Thấp | Nhanh | Metabolic |
| Power | 1–6 | 30–70% | Trung bình | Trung bình | Neural + Mechanical |
| General | 8–15 | 60–80% | Trung bình | Trung bình | Mixed |

---

## 3. Tập Đến Ngưỡng Thất Bại (Training to Failure)

> ⚠️ **Cần nghiên cứu chuyên sâu** — đây là chủ đề phức tạp và có nhiều rủi ro nếu không được hướng dẫn đúng.

### 3.1 Các loại Failure

| Loại | Mô tả | Rủi ro |
|---|---|---|
| **Technical Failure** | Không thể giữ form chuẩn | Thấp — đây là ngưỡng **an toàn** |
| **Muscular Failure** | Cơ không thể co rút thêm | Trung bình — cần spotter |
| **Absolute Failure** | Dùng mọi cách (forced reps, cheat reps) | **Cao** — nguy cơ chấn thương cao |

### 3.2 Ảnh hưởng đến Fatigue

- Tập đến failure tăng DOMS **20–40%** so với dừng trước failure (RIR 2–3)
- CNS fatigue tăng đáng kể, đặc biệt với Absolute Failure
- Thời gian phục hồi dài hơn 30–50%

### 3.3 Hướng tích hợp vào thuật toán

```typescript
// Đề xuất: Thêm field 'trainingStyle' vào ExerciseSet
export interface ExerciseSet {
  reps: number;
  weight: number;
  rpe?: number;
  toFailure?: boolean;        // Người dùng có tập đến failure không?
  rir?: number;               // Reps In Reserve (số rep còn lại trước failure)
}

// Nếu toFailure = true → nhân thêm hệ số failure penalty
const failurePenalty = set.toFailure ? 1.35 : 1.0;
const adjustedLoad = calcSetLoad(set, effectiveWeight) * failurePenalty;
```

---

## 4. Hướng Tích hợp vào Thuật toán Hiện tại

### 4.1 Vấn đề hiện tại

Thuật toán hiện tại dùng cùng 1 công thức cho mọi trường phái:
```
rawLoad = reps × weight × rpeMultiplier
```

Điều này **chưa phản ánh đúng** vì:
- 5 reps @ 100kg (Strength) và 15 reps @ 50kg (Endurance) có thể có rawLoad tương đương
- Nhưng DOMS và thời gian phục hồi **khác nhau rất nhiều**

### 4.2 Đề xuất nâng cấp

**Thêm `repRangeMultiplier`** dựa trên số rep để điều chỉnh DOMS:

```typescript
// Hệ số DOMS theo rep range (dựa trên nghiên cứu Schoenfeld 2010)
function repRangeMultiplier(reps: number): number {
  if (reps <= 5)  return 0.75;  // Strength: ít DOMS, nhiều neural fatigue
  if (reps <= 12) return 1.00;  // Hypertrophy: chuẩn tham chiếu, DOMS cao nhất
  if (reps <= 20) return 0.80;  // General: DOMS trung bình
  return 0.65;                  // Endurance: ít DOMS nhất
}

// Áp dụng vào calcSetLoad
export function calcSetLoad(set: ExerciseSet, effectiveWeight: number): number {
  const rpe = set.rpe ?? DEFAULT_RPE;
  const failurePenalty = set.toFailure ? 1.35 : 1.0;
  return set.reps * effectiveWeight * rpeMultiplier(rpe) * repRangeMultiplier(set.reps) * failurePenalty;
}
```

### 4.3 Điều chỉnh `getMuscleHalfLife` theo Fatigue Type

```typescript
// Thêm fatigueTypeFactor vào getMuscleHalfLife
function getFatigueTypeFactor(reps: number): number {
  if (reps <= 5)  return 0.80;  // Neural fatigue: phục hồi nhanh hơn 20%
  if (reps <= 12) return 1.00;  // Mechanical: chuẩn
  return 0.85;                  // Metabolic: phục hồi nhanh hơn 15%
}
```

---

## 5. Quyết định đã chốt

### Q1: RIR vs RPE — ✅ Dùng RIR

> **Quyết định:** Dùng **RIR (Reps In Reserve)** làm thước đo cường độ chính.

- RIR trực quan hơn cho người mới: *"Còn đẩy được mấy cái nữa?"* dễ hiểu hơn RPE
- RPE 10 = RIR 0 (tập đến failure) → dùng làm proxy để detect failure
- Bảng quy đổi RIR ↔ RPE:

| RIR | RPE | Ý nghĩa |
|---|---|---|
| 0 | 10 | Tập đến failure |
| 1 | 9 | Còn 1 rep |
| 2 | 8 | Còn 2 rep |
| 3 | 7 | Còn 3 rep |
| 4+ | ≤ 6 | Còn nhiều rep |

**Tích hợp vào `ExerciseSet`:**
```typescript
export interface ExerciseSet {
  reps: number;
  weight: number;
  rir: number;        // Reps In Reserve (0 = failure, 1-2 = gần failure, 3+ = còn nhiều)
  toFailure?: boolean; // true khi rir = 0, dùng để hiển thị UI rõ hơn
}

// Quy đổi RIR → RPE để dùng trong công thức hiện tại
function rirToRpe(rir: number): number {
  return Math.max(1, Math.min(10, 10 - rir));
}
```

---

### Q2: Failure Detection — ✅ Dùng RIR = 0

> **Quyết định:** `toFailure = (rir === 0)` — khi người dùng nhập RIR = 0 thì hệ thống tự động áp dụng failure penalty.

```typescript
const failurePenalty = set.rir === 0 ? 1.35 : 1.0;
```

---

### Q3: 1RM Estimation & Phân loại Trường phái — ✅ Người dùng tự chọn

> **Quyết định:** **Không** tự động phân loại. Người dùng **tự chọn trường phái** khi ghi nhận bài tập.

- Tự động phân loại dễ sai vì cùng 1 bài tập có thể dùng cho nhiều mục đích khác nhau
- Người dùng biết rõ mình đang tập vì mục đích gì hơn thuật toán
- UI sẽ có dropdown chọn: `Strength / Hypertrophy / Endurance / Power / General`
- Hệ số `repRangeMultiplier` sẽ dựa trên lựa chọn này thay vì tự suy luận từ số rep

---

## 6. Thứ tự Triển khai Đề xuất

| Bước | Việc cần làm | Ưu tiên |
|---|---|---|
| 1 | Thêm `repRangeMultiplier` vào `calcSetLoad` | 🔴 Cao |
| 2 | Thêm field `toFailure` và `rir` vào `ExerciseSet` | 🔴 Cao |
| 3 | Điều chỉnh `getMuscleHalfLife` theo fatigue type | 🟡 Trung bình |
| 4 | Nghiên cứu chuyên sâu về Failure Training | 🟡 Trung bình |
| 5 | Thêm UI cho người dùng chọn RIR/failure | 🟢 Thấp |
