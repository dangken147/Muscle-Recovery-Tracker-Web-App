import type { GymExercise, MuscleGroup, UserProfile } from '../types/recovery.types';

export interface AIAnalysisResult {
  targetRegion: 'upper' | 'lower' | 'full';
  freshMuscles: MuscleGroup[];
  fatiguedMuscles: MuscleGroup[];
  suggestionMessage: string;
}

const UPPER_MUSCLES: MuscleGroup[] = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'neck'];
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
