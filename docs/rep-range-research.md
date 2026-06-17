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

## 5. Câu hỏi Cần Làm Rõ (Open Questions)

1. **RIR vs RPE:** Nên dùng RIR (Reps In Reserve) hay RPE để đo lường cường độ? RIR trực quan hơn cho người mới.
2. **Failure detection:** Làm sao biết người dùng có tập đến failure không? Có thể dùng RPE 10 làm proxy.
3. **1RM estimation:** Có nên tính % 1RM tự động từ `reps + weight` để phân loại trường phái không?

---

## 6. Thứ tự Triển khai Đề xuất

| Bước | Việc cần làm | Ưu tiên |
|---|---|---|
| 1 | Thêm `repRangeMultiplier` vào `calcSetLoad` | 🔴 Cao |
| 2 | Thêm field `toFailure` và `rir` vào `ExerciseSet` | 🔴 Cao |
| 3 | Điều chỉnh `getMuscleHalfLife` theo fatigue type | 🟡 Trung bình |
| 4 | Nghiên cứu chuyên sâu về Failure Training | 🟡 Trung bình |
| 5 | Thêm UI cho người dùng chọn RIR/failure | 🟢 Thấp |
