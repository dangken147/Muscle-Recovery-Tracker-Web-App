import type { GymExercise, MuscleGroup, UserProfile, ActivityLog, ExerciseSession, ExerciseSet, TrainingStyle } from '../types/recovery.types';
import { calculateCortisolState, calculateACWR } from './recovery.utils';

export interface AIAnalysisResult {
  targetRegion: 'upper' | 'lower' | 'full';
  freshMuscles: MuscleGroup[];
  fatiguedMuscles: MuscleGroup[];
  suggestionMessage: string;
}

// BUG-01 FIX: Sửa type mismatch - dùng đúng MuscleGroup values từ recovery.types.ts
const UPPER_MUSCLES: MuscleGroup[] = [
  'upper_chest', 'lower_chest', 'lats', 'traps',
  'front_shoulders', 'rear_shoulders', 'biceps', 'triceps', 'forearms', 'neck'
];
const LOWER_MUSCLES: MuscleGroup[] = ['quadriceps', 'hamstrings', 'glutes', 'calves', 'knees'];
const CORE_MUSCLES: MuscleGroup[] = ['upper_abs', 'lower_abs', 'obliques', 'lower_back'];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Scoring bài tập theo Training Style dựa trên đặc tính sẵn có.
 * Rule-based approach — không cần thêm metadata vào JSON.
 *
 * Nguyên tắc Exercise Science:
 * - Strength: Compound nặng, multi-joint → neural adaptation
 * - Hypertrophy: Mix compound + isolation, đa dạng góc tập → mechanical tension + metabolic stress
 * - Endurance: Bodyweight, bands, nhẹ → oxidative capacity
 * - Power: Explosive compound, push press, jump → rate of force development
 * - General: Cân bằng, không ưu tiên
 */
function getStyleScore(ex: GymExercise, style: TrainingStyle): number {
  let score = 0;
  const lowerName = ex.name.toLowerCase();
  const isCompoundEx = /squat|press|row|deadlift|lunge|pull-up|chin-up|push-up|dip/.test(lowerName);
  const isIsolationEx = /curl|extension|fly|raise|kickback|concentration|lateral/.test(lowerName);
  const isExplosive = /push press|jump|burpee|clean|snatch|thruster/.test(lowerName);
  const difficulty = ex.difficulty;

  switch (style) {
    case 'strength':
      // Ưu tiên compound nặng, multi-joint. Giảm isolation.
      if (isCompoundEx) score += 20;
      if (ex.movement_type === 'squat' || ex.movement_type === 'hinge') score += 10;
      if (isIsolationEx) score -= 10;
      if (ex.isBodyweight) score -= 15;
      if (difficulty === 'advanced') score += 5;
      if (difficulty === 'beginner') score -= 3;
      break;

    case 'hypertrophy':
      // Mix compound + isolation, đa dạng góc tập
      if (isCompoundEx) score += 10;
      if (isIsolationEx) score += 10;
      // Ưu tiên bài tập target nhiều nhóm cơ (muscle_mapping phong phú)
      const muscleCount = Object.keys(ex.muscle_mapping).length;
      if (muscleCount >= 5) score += 5;
      break;

    case 'endurance':
      // Ưu tiên bodyweight, bands, nhẹ nhàng
      if (ex.isBodyweight) score += 15;
      if (ex.equipment.includes('bands')) score += 10;
      if (isCompoundEx && !ex.isBodyweight) score -= 10;
      if (difficulty === 'beginner') score += 5;
      if (difficulty === 'advanced') score -= 5;
      break;

    case 'power':
      // Ưu tiên explosive, compound nhanh
      if (isExplosive) score += 25;
      if (isCompoundEx) score += 15;
      if (ex.movement_type === 'hinge') score += 10;
      if (isIsolationEx) score -= 15;
      if (difficulty === 'advanced') score += 5;
      if (difficulty === 'beginner') score -= 5;
      break;

    case 'general':
    default:
      // Baseline — cân bằng nhẹ
      if (isCompoundEx) score += 5;
      if (isIsolationEx) score += 3;
      break;
  }

  return score;
}

/**
 * Xác định tỷ lệ movement pattern cho mỗi Training Style.
 * Returns object { push, pull, squat, hinge, core } — số lần pick từ mỗi pool.
 */
function getMovementPattern(
  style: TrainingStyle,
  region: 'upper' | 'lower' | 'full',
  count: number
): { push: number; pull: number; squat: number; hinge: number; core: number } {
  // Base patterns theo region (giữ nguyên logic cũ)
  if (region === 'upper') {
    // Style-specific upper body patterns
    switch (style) {
      case 'strength': return { push: 2, pull: 2, squat: 0, hinge: 0, core: 1 };
      case 'power': return { push: 3, pull: 1, squat: 0, hinge: 0, core: 1 };
      default: return { push: 2, pull: 2, squat: 0, hinge: 0, core: 1 };
    }
  }

  if (region === 'lower') {
    switch (style) {
      case 'strength': return { push: 0, pull: 0, squat: 2, hinge: 2, core: 1 };
      case 'power': return { push: 0, pull: 0, squat: 1, hinge: 3, core: 1 };
      case 'endurance': return { push: 0, pull: 0, squat: 2, hinge: 1, core: 2 };
      default: return { push: 0, pull: 0, squat: 2, hinge: 2, core: 1 };
    }
  }

  // Full body — khác nhau theo training style
  switch (style) {
    case 'strength': return { push: 1, pull: 1, squat: 2, hinge: 1, core: 0 };
    case 'hypertrophy': return { push: 1, pull: 1, squat: 1, hinge: 1, core: 1 };
    case 'endurance': return { push: 1, pull: 1, squat: 1, hinge: 0, core: 2 };
    case 'power': return { push: 2, pull: 0, squat: 1, hinge: 2, core: 0 };
    case 'general':
    default: return { push: 1, pull: 1, squat: 1, hinge: 1, core: 1 };
  }
}

export function analyzeMuscleRecovery(muscleStates: Record<MuscleGroup, number>): AIAnalysisResult {
  const freshMuscles: MuscleGroup[] = [];
  const fatiguedMuscles: MuscleGroup[] = [];

  Object.entries(muscleStates).forEach(([m, value]) => {
    const muscle = m as MuscleGroup;
    if (value >= 75) freshMuscles.push(muscle);
    if (value <= 50) fatiguedMuscles.push(muscle);
  });

  const freshUpper = freshMuscles.filter(m => UPPER_MUSCLES.includes(m)).length;
  const freshLower = freshMuscles.filter(m => LOWER_MUSCLES.includes(m)).length;

  let targetRegion: 'upper' | 'lower' | 'full' = 'full';
  let suggestionMessage = 'Cơ thể bạn đang phục hồi khá đồng đều. Đề xuất một buổi tập Toàn Thân (Full Body) hôm nay!';

  if (freshUpper > freshLower + 1) {
    targetRegion = 'upper';
    suggestionMessage = 'AI nhận thấy Thân Dưới của bạn vẫn đang mỏi, nhưng Thân Trên đã phục hồi rất tốt. Đề xuất tập Thân Trên (Upper Body)!';
  } else if (freshLower > freshUpper + 1) {
    targetRegion = 'lower';
    suggestionMessage = 'AI nhận thấy Thân Trên của bạn đang mỏi, trong khi Thân Dưới tràn đầy năng lượng. Đề xuất tập Chân (Lower Body)!';
  } else if (fatiguedMuscles.length > 5) {
    suggestionMessage = 'Cơ thể bạn đang khá mệt mỏi ở nhiều vùng. Đề xuất một buổi tập Toàn Thân nhẹ nhàng để lưu thông máu!';
  }

  return { targetRegion, freshMuscles, fatiguedMuscles, suggestionMessage };
}

export function generateSmartWorkout(
  allExercises: GymExercise[],
  equipment: string[],
  muscleStates: Record<MuscleGroup, number>,
  profile?: UserProfile | null,
  count: number = 5,
  dumbbellWeight?: number,
  dumbbellCount?: number,
  trainingStyle: TrainingStyle = 'general'
): { workoutIds: string[], message: string } {

  const analysis = analyzeMuscleRecovery(muscleStates);

  // Extract injured joints/muscles from profile
  const injuredJoints = profile?.injuryHistory?.map(h => h.muscle) || [];
  let avoidedInjuries = false;

  // 1. Filter by Equipment & Exclude Fatigued Muscles/Injured Joints
  let pool = allExercises.filter(ex => {
    // Check equipment
    const hasEq = ex.equipment.some(eq => equipment.includes(eq));
    if (!hasEq) return false;

    // Exclude if it heavily targets a fatigued muscle (weight >= 5)
    const usesFatigued = Object.entries(ex.muscle_mapping).some(([m, weight]) => {
      return analysis.fatiguedMuscles.includes(m as MuscleGroup) && (weight as number) >= 5;
    });

    // Check injured joints (safe guard)
    const jointHits = ex.joint_mapping || {};
    const hitsInjuredJoint = Object.entries(jointHits).some(([joint, load]) => {
      return injuredJoints.includes(joint as MuscleGroup) && load >= 0.4;
    });

    if (hitsInjuredJoint) {
      avoidedInjuries = true;
      return false;
    }

    return !usesFatigued;
  });

  // If pool is too small, relax the fatigue constraint a bit (allow up to weight 7)
  // But NEVER relax the injury constraint!
  if (pool.length < count) {
    pool = allExercises.filter(ex => {
      const hasEq = ex.equipment.some(eq => equipment.includes(eq));
      if (!hasEq) return false;

      const jointHits = ex.joint_mapping || {};
      const hitsInjuredJoint = Object.entries(jointHits).some(([joint, load]) => {
        return injuredJoints.includes(joint as MuscleGroup) && load >= 0.4;
      });

      return !hitsInjuredJoint;
    });
  }

  // Helper functions to classify exercises
  const isIsolationOrUnilateral = (name: string) => {
    const lowerName = name.toLowerCase();
    return /single|one arm|lateral|curl|extension|fly|raise|kickback|bulgarian|concentration|calf/.test(lowerName);
  };

  const isStrictlyOneDumbbell = (name: string) => {
    const lowerName = name.toLowerCase();
    return /single|one arm|goblet|pullover|concentration/.test(lowerName);
  }

  const isCompound = (name: string) => {
    const lowerName = name.toLowerCase();
    return /squat|press|row|deadlift|lunge|pull-up|chin-up|push-up|dip/.test(lowerName);
  };

  const isExplosive = (name: string) => {
    const lowerName = name.toLowerCase();
    return /push press|jump|burpee|clean|snatch|thruster/.test(lowerName);
  };

  // Score exercises for optimal sorting
  const getScore = (ex: GymExercise): number => {
    let score = 0;

    // Weight-based scoring for home workouts (indicated by having dumbbellWeight)
    if (dumbbellWeight !== undefined) {
      if (dumbbellWeight <= 8) {
        if (isIsolationOrUnilateral(ex.name)) score += 10;
        if (isCompound(ex.name)) score -= 5;
      } else if (dumbbellWeight >= 15) {
        if (isCompound(ex.name)) score += 10;
        if (isIsolationOrUnilateral(ex.name)) score -= 2;
      }
    }

    // Count-based scoring
    if (dumbbellCount === 1) {
      if (isStrictlyOneDumbbell(ex.name)) score += 15; // Phù hợp hoàn hảo cho 1 tạ
    }

    // Training Style scoring — ưu tiên bài tập phù hợp với mục tiêu tập
    score += getStyleScore(ex, trainingStyle);

    return score;
  };

  // 2. Categorize remaining exercises (sorted by score descending, then shuffled partially by nature of sort stability)
  const sortPool = (arr: GymExercise[]) => shuffleArray(arr).sort((a, b) => getScore(b) - getScore(a));

  const pushPool = sortPool(pool.filter(e => e.movement_type.toLowerCase() === 'push'));
  const pullPool = sortPool(pool.filter(e => e.movement_type.toLowerCase() === 'pull'));
  const squatPool = sortPool(pool.filter(e => e.movement_type.toLowerCase() === 'squat'));
  const hingePool = sortPool(pool.filter(e => e.movement_type.toLowerCase() === 'hinge'));
  const corePool = sortPool(pool.filter(e => e.movement_type.toLowerCase() === 'core'));

  const resultIds: Set<string> = new Set();

  const pickEx = (arr: GymExercise[]) => {
    const ex = arr.find(e => !resultIds.has(e.id));
    if (ex) resultIds.add(ex.id);
  };

  // 3. Select based on Target Region + Training Style
  const pattern = getMovementPattern(trainingStyle, analysis.targetRegion, count);
  for (let i = 0; i < pattern.push; i++) pickEx(pushPool);
  for (let i = 0; i < pattern.pull; i++) pickEx(pullPool);
  for (let i = 0; i < pattern.squat; i++) pickEx(squatPool);
  for (let i = 0; i < pattern.hinge; i++) pickEx(hingePool);
  for (let i = 0; i < pattern.core; i++) pickEx(corePool);

  // 4. Fallback if not enough exercises picked
  let remainingPool = shuffleArray(pool);
  while (resultIds.size < count && remainingPool.length > 0) {
    pickEx(remainingPool);
  }

  let finalMessage = analysis.suggestionMessage;

  // Thông báo về Training Style ảnh hưởng đến việc chọn bài
  const styleMessages: Record<TrainingStyle, string> = {
    strength: ' 💪 AI đã ưu tiên Compound nặng (Squat, Press, Deadlift) cho mục tiêu Sức Mạnh.',
    hypertrophy: ' 🏋️ AI đã cân bằng Compound + Isolation cho mục tiêu Phì Đại Cơ.',
    endurance: ' 🏃 AI đã chọn bài tập nhẹ nhàng, bodyweight cho mục tiêu Sức Bền.',
    power: ' ⚡ AI đã ưu tiên bài tập Explosive (Push Press, Hinge) cho mục tiêu Sức Mạnh Bùng Nổ.',
    general: ''
  };
  finalMessage += styleMessages[trainingStyle];

  if (avoidedInjuries) {
    finalMessage += ' (Đã tự động loại bỏ các bài tập gây áp lực lên khớp/vùng cơ đang bị chấn thương của bạn).';
  }

  // NSCA Sequencing Rule: Power -> Compound Lower -> Compound Upper -> Isolation -> Core
  const finalIds = Array.from(resultIds).slice(0, count);
  finalIds.sort((a, b) => {
    const exA = allExercises.find(e => e.id === a);
    const exB = allExercises.find(e => e.id === b);
    if (!exA || !exB) return 0;

    const getSeqScore = (ex: GymExercise) => {
      if (isExplosive(ex.name)) return 1;
      if (ex.movement_type === 'squat' || ex.movement_type === 'hinge') return isCompound(ex.name) ? 2 : 4;
      if (ex.movement_type === 'push' || ex.movement_type === 'pull') return isCompound(ex.name) ? 3 : 4;
      if (ex.movement_type === 'core') return 5;
      return 4; // Isolation default
    };

    return getSeqScore(exA) - getSeqScore(exB);
  });

  return {
    workoutIds: finalIds,
    message: finalMessage
  };
}

/**
 * AI Auto-Fill Generator
 * Áp dụng các hệ số khoa học từ NotebookLM:
 * - Reactive Deload: Skip bài tập nếu cơ mỏi > 70% (Recovery <= 30)
 * - Load Prescription: ±2% tạ cho mỗi 0.5 RPE sai lệch so với RPE mục tiêu (8).
 * - Rest Interval: 120-180s cho Isolation, 180-240s cho Compound.
 * - Warm-up: 1 set với 80% mức tạ chính.
 * - Working Sets: 3 sets với RIR = 2.
 */
export function generateDetailedWorkout(
  allExercises: GymExercise[],
  equipment: string[],
  muscleStates: Record<MuscleGroup, number>,
  profile: UserProfile | null | undefined,
  historyLogs: ActivityLog[],
  count: number = 5,
  dumbbellWeight?: number,
  dumbbellCount?: number,
  trainingStyle: string = 'general'
): { detailedExercises: ExerciseSession[], message: string } {
  // First, get the basic workout using generateSmartWorkout
  const { workoutIds, message } = generateSmartWorkout(
    allExercises,
    equipment,
    muscleStates,
    profile,
    count,
    dumbbellWeight,
    dumbbellCount
  );

  // 0. Overtraining & Periodization Check
  let activeStyle = trainingStyle;
  let finalMessage = message;

  if (profile && historyLogs.length > 0) {
    const targetTime = Date.now();
    const cortisol = calculateCortisolState(profile, historyLogs, targetTime);
    const acwr = calculateACWR(historyLogs, targetTime, profile.weight);

    // Nếu Cortisol > 60 và ACWR > 1.3 (vượt ngưỡng chịu đựng mạn tính)
    if (cortisol.currentLevel > 60 && acwr > 1.3) {
      activeStyle = 'deload';
      finalMessage += '\n🚨 [CẢNH BÁO ĐỎ] Phát hiện dấu hiệu Overtraining (Cortisol > 60, ACWR > 1.3). AI đã tự động ép sang chế độ Deload (giảm khối lượng và cường độ) để bảo vệ hệ thống thần kinh của bạn.';
    }
  }

  const detailedExercises: ExerciseSession[] = [];
  const warmedUpMuscles = new Set<MuscleGroup>();

  workoutIds.forEach(id => {
    const ex = allExercises.find(e => e.id === id);
    if (!ex) return;

    // 1. Reactive Deload Check
    // muscleStates: 100 = fully recovered, 0 = exhausted
    // Fatigue > 70% means Recovery <= 30
    const isHeavilyFatigued = Object.entries(ex.muscle_mapping).some(([m, weight]) => {
      return (muscleStates[m as MuscleGroup] || 0) <= 30 && (weight as number) >= 5;
    });

    if (isHeavilyFatigued) {
      // Skip this exercise completely for Reactive Deload
      return;
    }

    // 2. Find historical working weight and reps
    let historicalWeight = 0;
    let historicalReps = 10; // Default reps
    let historicalRIR = 2; // Default target
    let foundHistory = false;

    // Sort logs descending by timestamp to get the most recent
    const sortedLogs = [...historyLogs].sort((a, b) => b.timestamp - a.timestamp);
    for (const log of sortedLogs) {
      if (log.detailedExercises) {
        const pastEx = log.detailedExercises.find(e => e.exerciseId === ex.id);
        if (pastEx && pastEx.sets && pastEx.sets.length > 0) {
          // Lấy thông số từ hiệp chính cuối cùng (Working Set)
          const lastSet = pastEx.sets[pastEx.sets.length - 1];
          historicalWeight = lastSet.weight || 0;
          historicalReps = lastSet.reps || 10;
          historicalRIR = lastSet.rir !== undefined ? lastSet.rir : 2;
          foundHistory = true;
          break;
        }
      }
    }

    // 3. Progressive Overload Calculation
    let targetWeight = historicalWeight;
    if (foundHistory && !ex.isBodyweight && targetWeight > 0) {
      const pastRPE = 10 - historicalRIR;
      const targetRPE = 8; // RIR = 2
      const deviation = pastRPE - targetRPE;

      // NotebookLM Rule: ±2% cho mỗi 0.5 RPE deviation
      // Quá nặng (pastRPE > 8) -> deviation > 0 -> giảm tạ
      // Quá nhẹ (pastRPE < 8) -> deviation < 0 -> tăng tạ
      const adjustment = -(deviation / 0.5) * 0.02;
      targetWeight = targetWeight * (1 + adjustment);

      // Round to nearest 1kg
      targetWeight = Math.round(targetWeight);
    } else if (!foundHistory && !ex.isBodyweight && dumbbellWeight) {
      targetWeight = dumbbellWeight;
    }

    // 3.5 Auto-scale Reps/Sets/Weight/Tempo based on NSCA/ACSM Guidelines
    let targetReps = historicalReps;
    let numWorkingSets = 3;
    let tempo = '2/0/2/0';

    switch (activeStyle) {
      case 'deload':
        targetReps = 10;
        numWorkingSets = 2; // Chỉ 2 hiệp để duy trì cơ bắp
        targetWeight = targetWeight * 0.6; // Giảm tạ còn 60%
        tempo = '2/0/2/0';
        break;
      case 'strength':
        targetReps = 5; // 1-6 reps
        numWorkingSets = 4; // 2-6 sets
        tempo = '2/0/1/0'; // 1-2s eccentric, 1-2s concentric
        break;
      case 'hypertrophy':
        targetReps = 10; // 6-12 reps
        numWorkingSets = 4; // 3-6 sets
        tempo = '3/0/1/1'; // 2-8s total per rep
        break;
      case 'endurance':
        targetReps = 15; // 12-25+ reps
        numWorkingSets = 3; // 2-3 sets
        tempo = '4/2/1/1'; // Slow, controlled for stabilization
        break;
      case 'power':
        targetReps = 4; // 3-5 reps (Multi-effort)
        numWorkingSets = 4; // 3-5 sets
        tempo = '1/0/X/0'; // X = Maximal intent
        break;
      case 'general':
      default:
        targetReps = 10;
        numWorkingSets = 3;
        tempo = '2/0/2/0';
        break;
    }

    // Adjust targetWeight based on Brzycki 1RM formula if we have history
    if (foundHistory && !ex.isBodyweight && targetWeight > 0) {
      // Cân bằng trọng lượng lịch sử về 1RM, sau đó tính lại dựa trên targetReps mới
      const estimated1RM = targetWeight * (1 + historicalReps / 30);
      targetWeight = estimated1RM / (1 + targetReps / 30);

      // Power training usually uses lighter weight but max velocity
      if (activeStyle === 'power') targetWeight *= 0.8;

      targetWeight = Math.round(targetWeight * 2) / 2; // Lên xuống 0.5kg
    } else if (!foundHistory && !ex.isBodyweight && dumbbellWeight) {
      if (activeStyle === 'strength') targetWeight = dumbbellWeight * 1.2;
      if (activeStyle === 'endurance') targetWeight = Math.max(0.5, dumbbellWeight * 0.7);
      if (activeStyle === 'deload') targetWeight = Math.max(0.5, dumbbellWeight * 0.6);
      targetWeight = Math.round(targetWeight * 2) / 2;
    }

    // 4. Determine Rest Time based on NSCA Guidelines
    let restTime = 90;
    switch (activeStyle) {
      case 'strength':
      case 'power':
        restTime = 180; // 2-5 mins
        break;
      case 'hypertrophy':
        restTime = 60; // 30-90s
        break;
      case 'endurance':
        restTime = 30; // < 30s
        break;
      case 'deload':
        restTime = 120; // Đủ dài để phục hồi thần kinh
        break;
      case 'general':
      default:
        restTime = 90;
        break;
    }

    const sets: ExerciseSet[] = [];

    // Lấy các nhóm cơ chính của bài tập
    const primaryMuscles = Object.entries(ex.muscle_mapping)
      .filter(([_, ratio]) => (ratio as number) >= 0.5)
      .map(([m]) => m as MuscleGroup);
    
    const isCompound = /squat|press|row|deadlift|lunge|pull-up|chin-up|push-up|dip/.test(ex.name.toLowerCase());
    
    // Kiểm tra xem đã khởi động cơ này chưa
    let needsFullWarmup = false;
    if (isCompound) {
      needsFullWarmup = primaryMuscles.some(m => !warmedUpMuscles.has(m));
    }
    // Đánh dấu các cơ đã được khởi động
    primaryMuscles.forEach(m => warmedUpMuscles.add(m));

    // 5. Warm-up Set
    if (targetWeight > 0 && !ex.isBodyweight) {
      if (needsFullWarmup) {
        if (targetWeight >= 60) {
          // 3 sets: 20kg (thanh đòn), 50%, 75%
          sets.push({ reps: 10, weight: 20, rir: 4, toFailure: false });
          sets.push({ reps: 8, weight: Math.round((targetWeight * 0.5) * 2) / 2, rir: 4, toFailure: false });
          sets.push({ reps: 5, weight: Math.round((targetWeight * 0.75) * 2) / 2, rir: 4, toFailure: false });
        } else if (targetWeight >= 30) {
          // 2 sets: 20kg, 70%
          sets.push({ reps: 10, weight: 20, rir: 4, toFailure: false });
          sets.push({ reps: 5, weight: Math.round((targetWeight * 0.7) * 2) / 2, rir: 4, toFailure: false });
        } else {
          // 1 set: 50%
          sets.push({ reps: targetReps, weight: Math.round((targetWeight * 0.5) * 2) / 2, rir: 4, toFailure: false });
        }
      } else {
        // Cơ đã nóng, chỉ 1 hiệp khởi động 80%
        sets.push({
          reps: targetReps,
          weight: Math.round((targetWeight * 0.8) * 2) / 2,
          rir: 4,
          toFailure: false
        });
      }
    } else if (ex.isBodyweight) {
      sets.push({
        reps: Math.max(1, Math.floor(targetReps * 0.5)),
        weight: 0,
        rir: 4,
        toFailure: false
      });
    }

    // 6. Working Sets
    for (let i = 0; i < numWorkingSets; i++) {
      sets.push({
        reps: targetReps,
        weight: targetWeight,
        rir: 2, // Mục tiêu RIR 2 (RPE 8)
        toFailure: false
      });
    }

    detailedExercises.push({
      exerciseId: ex.id,
      name: ex.name,
      muscle_mapping: ex.muscle_mapping,
      isBodyweight: ex.isBodyweight,
      bwFraction: ex.bwFraction,
      sets,
      restTime,
      tempo
    });
  });

  return { detailedExercises, message: finalMessage };
}
