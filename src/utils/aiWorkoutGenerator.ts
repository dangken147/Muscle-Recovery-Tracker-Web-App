import type { GymExercise, MuscleGroup, UserProfile, ActivityLog, ExerciseSession, ExerciseSet } from '../types/recovery.types';

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
  dumbbellCount?: number
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

  // 3. Select based on Target Region
  if (analysis.targetRegion === 'upper') {
    // 2 Push, 2 Pull, 1 Core (or more Push/Pull)
    pickEx(pushPool); pickEx(pushPool);
    pickEx(pullPool); pickEx(pullPool);
    pickEx(corePool);
  } else if (analysis.targetRegion === 'lower') {
    // 2 Squat, 2 Hinge, 1 Core
    pickEx(squatPool); pickEx(squatPool);
    pickEx(hingePool); pickEx(hingePool);
    pickEx(corePool);
  } else {
    // Full Body: 1 of each
    pickEx(pushPool);
    pickEx(pullPool);
    pickEx(squatPool);
    pickEx(hingePool);
    pickEx(corePool);
  }

  // 4. Fallback if not enough exercises picked
  let remainingPool = shuffleArray(pool);
  while (resultIds.size < count && remainingPool.length > 0) {
    pickEx(remainingPool);
  }

  let finalMessage = analysis.suggestionMessage;
  if (avoidedInjuries) {
    finalMessage += ' (Đã tự động loại bỏ các bài tập gây áp lực lên khớp/vùng cơ đang bị chấn thương của bạn).';
  }

  return {
    workoutIds: Array.from(resultIds).slice(0, count),
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

  const detailedExercises: ExerciseSession[] = [];

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

    // 3.5 Auto-scale Reps/Sets/Weight based on Training Style
    let targetReps = historicalReps;
    let numWorkingSets = 3;
    let styleWeightMultiplier = 1.0;

    switch (trainingStyle) {
      case 'strength':
        targetReps = 5; // 3-5 reps
        numWorkingSets = 4;
        break;
      case 'hypertrophy':
        targetReps = 10; // 8-12 reps
        numWorkingSets = 3;
        break;
      case 'endurance':
        targetReps = 15; // 15-20 reps
        numWorkingSets = 2;
        break;
      case 'power':
        targetReps = 4; // 3-5 reps
        numWorkingSets = 4;
        break;
      case 'general':
      default:
        targetReps = 10;
        numWorkingSets = 3;
        break;
    }

    // Adjust targetWeight based on Brzycki 1RM formula if we have history
    if (foundHistory && !ex.isBodyweight && targetWeight > 0) {
       // Cân bằng trọng lượng lịch sử về 1RM, sau đó tính lại dựa trên targetReps mới
       const estimated1RM = targetWeight * (1 + historicalReps / 30);
       targetWeight = estimated1RM / (1 + targetReps / 30);
       
       // Power training usually uses lighter weight but max velocity
       if (trainingStyle === 'power') targetWeight *= 0.8;
       
       targetWeight = Math.round(targetWeight * 2) / 2; // Lên xuống 0.5kg
    } else if (!foundHistory && !ex.isBodyweight && dumbbellWeight) {
       if (trainingStyle === 'strength') targetWeight = dumbbellWeight * 1.2;
       if (trainingStyle === 'endurance') targetWeight = Math.max(0.5, dumbbellWeight * 0.7);
       targetWeight = Math.round(targetWeight * 2) / 2;
    }

    // 4. Determine Rest Time
    const isCompound = /squat|press|row|deadlift|lunge|pull-up|chin-up|push-up|dip/.test(ex.name.toLowerCase());
    let restTime = isCompound ? 180 : 120; // 3 mins for compound, 2 mins for isolation
    
    // Adjust Rest time based on style
    if (trainingStyle === 'strength' || trainingStyle === 'power') restTime += 60; // Cần nghỉ lâu hơn
    if (trainingStyle === 'endurance') restTime = Math.max(60, restTime - 60); // Nghỉ rất ngắn

    const sets: ExerciseSet[] = [];
    
    // 5. Warm-up Set (80% of Working Weight)
    if (targetWeight > 0 && !ex.isBodyweight) {
      sets.push({
        reps: targetReps,
        weight: Math.round((targetWeight * 0.8) * 2) / 2, // 80%
        rir: 4, // RPE 6, khởi động nhẹ nhàng
        toFailure: false
      });
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
      restTime
    });
  });

  return { detailedExercises, message };
}
