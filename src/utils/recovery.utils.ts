import type {
  UserProfile,
  ActivityLog,
  MuscleState,
  MuscleGroup,
  MuscleStatus,
  CortisolState,
  CortisolZone,
  FootballPitchSize,
  FootballPosition,
  SwimmingStroke,
  SwimmingEnvironment,
  ExerciseSession,
  ExerciseSet,
} from '../types/recovery.types';

export const PITCH_SIZE_MULTIPLIERS: Record<FootballPitchSize, number> = {
  '5v5': 1.15,
  '7v7': 1.05,
  '11v11': 1.0
};

export const FOOTBALL_POS_MULTIPLIERS: Record<FootballPosition, Partial<Record<MuscleGroup, number>>> = {
  goalkeeper: { quadriceps: 0.30, upper_abs: 0.10, lower_abs: 0.10, front_shoulders: 0.08, rear_shoulders: 0.07, calves: 0.15, glutes: 0.10, hamstrings: 0.10 },
  defender: { quadriceps: 0.25, upper_abs: 0.10, lower_abs: 0.10, lower_back: 0.10, calves: 0.15, glutes: 0.15, hamstrings: 0.15 },
  midfielder: { quadriceps: 0.25, upper_abs: 0.10, lower_abs: 0.05, calves: 0.20, glutes: 0.15, hamstrings: 0.20, front_shoulders: 0.05 },
  striker: { quadriceps: 0.20, upper_abs: 0.05, lower_abs: 0.05, calves: 0.20, glutes: 0.15, hamstrings: 0.30, front_shoulders: 0.05 }
};

export const SWIMMING_ENV_MULTIPLIERS: Record<SwimmingEnvironment, number> = {
  pool: 1.0,
  open_water: 1.15
};

export const SWIMMING_STROKE_MULTIPLIERS: Record<SwimmingStroke, Partial<Record<MuscleGroup, number>>> = {
  freestyle: { lats: 0.30, front_shoulders: 0.25, quadriceps: 0.15, upper_abs: 0.10, calves: 0.10 },
  breaststroke: { glutes: 0.25, hamstrings: 0.20, upper_chest: 0.20, lats: 0.20, lower_back: 0.10 },
  butterfly: { lats: 0.30, lower_back: 0.25, front_shoulders: 0.20, upper_chest: 0.15, quadriceps: 0.10 },
  backstroke: { lats: 0.25, rear_shoulders: 0.25, quadriceps: 0.20, lower_back: 0.15, calves: 0.10 }
};

export const MUSCLE_LIST: MuscleGroup[] = [
  'neck',
  'upper_chest',
  'lower_chest',
  'traps',
  'lats',
  'lower_back',
  'front_shoulders',
  'rear_shoulders',
  'biceps',
  'triceps',
  'forearms',
  'upper_abs',
  'lower_abs',
  'obliques',
  'quadriceps',
  'hamstrings',
  'glutes',
  'calves',
  'wrists',
  'elbows',
  'knees',
  'ankles',
  'feet',
  'shoulder_joints',
  'acl',
  'achilles',
];

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  neck: 'Cổ',
  upper_chest: 'Ngực trên',
  lower_chest: 'Ngực dưới',
  traps: 'Cầu vai',
  lats: 'Cơ xô',
  lower_back: 'Thắt lưng',
  front_shoulders: 'Vai trước',
  rear_shoulders: 'Vai sau',
  biceps: 'Tay trước',
  triceps: 'Tay sau',
  forearms: 'Cẳng tay',
  upper_abs: 'Bụng trên',
  lower_abs: 'Bụng dưới',
  obliques: 'Cơ liên sườn',
  quadriceps: 'Đùi trước',
  hamstrings: 'Đùi sau',
  glutes: 'Cơ mông',
  calves: 'Bắp chân',
  wrists: 'Khớp cổ tay',
  elbows: 'Khớp khuỷu tay',
  knees: 'Khớp gối',
  ankles: 'Khớp cổ chân',
  feet: 'Gan bàn chân',
  shoulder_joints: 'Khớp vai',
  acl: 'Dây chằng gối (ACL)',
  achilles: 'Gân gót (Achilles)',
};

// Nâng cấp: Ma trận liên kết cơ (Synergy Matrix)
export const MUSCLE_SYNERGY: Partial<Record<MuscleGroup, MuscleGroup[]>> = {
  upper_chest: ['front_shoulders', 'triceps', 'elbows', 'wrists'],
  lower_chest: ['front_shoulders', 'triceps', 'elbows', 'wrists'],
  lats: ['biceps', 'forearms', 'elbows', 'wrists', 'lower_back'],
  traps: ['neck', 'rear_shoulders'],
  lower_back: ['glutes', 'lats', 'hamstrings'],
  front_shoulders: ['triceps', 'neck', 'shoulder_joints'],
  rear_shoulders: ['traps', 'neck', 'shoulder_joints'],
  quadriceps: ['glutes', 'knees'],
  hamstrings: ['glutes', 'knees', 'lower_back'],
  knees: ['quadriceps', 'hamstrings', 'calves'],
  elbows: ['biceps', 'triceps', 'forearms'],
  ankles: ['calves', 'feet', 'achilles'],
  feet: ['calves', 'ankles', 'achilles'],
  shoulder_joints: ['front_shoulders', 'rear_shoulders', 'upper_chest', 'lats'],
  acl: ['knees', 'quadriceps', 'hamstrings'],
  achilles: ['calves', 'ankles', 'feet']
};

// Phân loại kích thước cơ để tính Base Half-life
const MUSCLE_SIZE_GROUPS: Record<MuscleGroup, 'small' | 'medium' | 'large'> = {
  neck: 'small', wrists: 'small', elbows: 'small', ankles: 'small', knees: 'small', feet: 'small', shoulder_joints: 'small',
  acl: 'small', achilles: 'small',
  upper_abs: 'small', lower_abs: 'small', obliques: 'small', calves: 'small', forearms: 'small',
  upper_chest: 'medium', lower_chest: 'medium', front_shoulders: 'medium', rear_shoulders: 'medium', biceps: 'medium', triceps: 'medium', lower_back: 'medium',
  traps: 'medium', lats: 'large', quadriceps: 'large', hamstrings: 'large', glutes: 'large'
};

// ==========================================
// THUẬT TOÁN TÍNH LOAD BÀI TẬP (SET/REP)
// ==========================================

const DEFAULT_RPE = 7;

// Maximum Tolerable Load (MTL) defaults cho từng nhóm cơ
export const MTL_MAP: Record<MuscleGroup, number> = {
  upper_chest: 8000, lower_chest: 8000,
  lats: 10000, traps: 8000, lower_back: 8000,
  quadriceps: 15000, hamstrings: 15000, glutes: 15000, calves: 8000,
  front_shoulders: 5000, rear_shoulders: 5000,
  biceps: 3000, triceps: 3500, forearms: 2000,
  upper_abs: 4000, lower_abs: 4000, obliques: 4000,
  neck: 2000, wrists: 3000, elbows: 3000, knees: 3000, ankles: 3000, feet: 3000, shoulder_joints: 3000,
  acl: 3000, achilles: 3000
};

export function rpeMultiplier(rpe: number): number {
  const clamped = Math.max(1, Math.min(10, rpe));
  return Math.pow(clamped / 10, 1.5);
}

export function calcSetLoad(set: ExerciseSet, effectiveWeight: number): number {
  const rpe = set.rpe ?? DEFAULT_RPE;
  return set.reps * effectiveWeight * rpeMultiplier(rpe);
}

export function calcExerciseLoad(
  exercise: ExerciseSession,
  userBodyweight: number
): number {
  return exercise.sets.reduce((total, set) => {
    // Nếu là bài tập bodyweight, cộng thêm % trọng lượng cơ thể
    const baseWeight = exercise.isBodyweight
      ? (userBodyweight * (exercise.bwFraction ?? 0.7)) + set.weight
      : set.weight;
    return total + calcSetLoad(set, baseWeight);
  }, 0);
}

export function toFatiguePercent(rawLoad: number, mtl: number, k = 5): number {
  const x = rawLoad / mtl;
  // Sigmoid curve
  const sigmoid = 1 / (1 + Math.exp(-k * (x - 0.5)));
  return Math.min(Math.round(sigmoid * 100), 100);
}

export function calculateDetailedSessionFatigue(
  detailedExercises: ExerciseSession[],
  userBodyweight: number
): Partial<Record<MuscleGroup, number>> {
  const rawLoads: Partial<Record<MuscleGroup, number>> = {};

  for (const ex of detailedExercises) {
    const exLoad = calcExerciseLoad(ex, userBodyweight);
    for (const [muscleStr, ratio] of Object.entries(ex.muscle_mapping)) {
      const muscle = muscleStr as MuscleGroup;
      rawLoads[muscle] = (rawLoads[muscle] ?? 0) + exLoad * (ratio ?? 0);
    }
  }

  const fatigueMap: Partial<Record<MuscleGroup, number>> = {};
  for (const [muscleStr, load] of Object.entries(rawLoads)) {
    const muscle = muscleStr as MuscleGroup;
    const mtl = MTL_MAP[muscle] ?? 5000;
    fatigueMap[muscle] = toFatiguePercent(load ?? 0, mtl);
  }
  return fatigueMap;
}

// #6 FIX: Hàm tính tổng Volume Load thực tế từ detailedExercises
function calculateTotalVolumeLoad(detailedExercises: ExerciseSession[], userBodyweight: number): number {
  return detailedExercises.reduce((total, ex) => total + calcExerciseLoad(ex, userBodyweight), 0);
}

// Phase 9: Thuật toán Acute:Chronic Workload Ratio (ACWR)
// #6 FIX: Dùng Volume Load thực tế khi có detailedExercises, fallback legacy khi không có
export function calculateACWR(logs: ActivityLog[], targetTime: number, userBodyweight = 70): number {
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const TWENTY_EIGHT_DAYS_MS = 28 * 24 * 60 * 60 * 1000;
  
  let acuteLoad = 0;
  let chronicLoad = 0;

  logs.forEach(log => {
    if (log.status === 'planned' || log.timestamp > targetTime) return;
    const timeDiff = targetTime - log.timestamp;
    
    if (timeDiff <= TWENTY_EIGHT_DAYS_MS) {
      // #6 FIX: Ưu tiên dùng Volume Load thực tế, fallback về legacy nếu chưa có detailedExercises
      const load = (log.activityType === 'gym' && log.detailedExercises?.length)
        ? calculateTotalVolumeLoad(log.detailedExercises, userBodyweight)
        : log.intensity * log.duration;

      chronicLoad += load;
      if (timeDiff <= SEVEN_DAYS_MS) {
        acuteLoad += load;
      }
    }
  });

  const avgChronicLoadPerWeek = chronicLoad / 4;
  if (avgChronicLoadPerWeek === 0) return 0;
  return acuteLoad / avgChronicLoadPerWeek;
}

// Phase 2, Task 1: Calculate cumulative muscle fatigue with sports science constants
export function calculateMuscleStates(
  profile: UserProfile,
  logs: ActivityLog[],
  targetTime: number
): MuscleState[] {
  // Active Window Filtering: Chỉ xử lý các logs trong 7 ngày gần nhất để tối ưu hiệu năng (O(N) Optimization)
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const sortedLogs = [...logs]
    .filter((log) => log.status !== 'planned' && log.timestamp <= targetTime && log.timestamp >= targetTime - SEVEN_DAYS_MS)
    .sort((a, b) => a.timestamp - b.timestamp);

  // Initialize fatigue of all muscles at 0%
  const currentFatigues: Record<MuscleGroup, number> = {} as any;
  const lastTrainedTimes: Record<MuscleGroup, number | null> = {} as any;
  const injuredUntil: Record<MuscleGroup, number> = {} as any;

  MUSCLE_LIST.forEach((m) => {
    currentFatigues[m] = 0;
    lastTrainedTimes[m] = null;
    injuredUntil[m] = 0;
  });

  let lastEventTime = sortedLogs.length > 0 ? sortedLogs[0].timestamp : targetTime;

  // Chronologically process logs
  sortedLogs.forEach((log) => {
    const timeGapHours = (log.timestamp - lastEventTime) / (1000 * 60 * 60);
    
    // 1. Decay existing fatigue to the current log's time
    if (timeGapHours > 0) {
      MUSCLE_LIST.forEach((m) => {
        const isInjured = log.timestamp < injuredUntil[m];
        if (!isInjured) {
          const halfLife = getMuscleHalfLife(m, profile, log);
          const decayConst = Math.log(2) / halfLife;
          currentFatigues[m] = currentFatigues[m] * Math.exp(-decayConst * timeGapHours);
        }
      });
    }

    lastEventTime = log.timestamp;

    // 2. Process injury reports in this log
    if (log.hasInjury && log.injuredMuscles) {
      log.injuredMuscles.forEach((m) => {
        currentFatigues[m] = 100;
        injuredUntil[m] = log.timestamp + 120 * 60 * 60 * 1000; // Injured for 120 hours (5 days)
        lastTrainedTimes[m] = log.timestamp;
      });
    }

    // 2.5 Process detailed exercises load if available
    let detailedFatigueMap: Partial<Record<MuscleGroup, number>> | null = null;
    if (log.activityType === 'gym' && log.detailedExercises && log.detailedExercises.length > 0) {
      detailedFatigueMap = calculateDetailedSessionFatigue(log.detailedExercises, profile.weight);
    }

    // 3. Process workload fatigue increase for target muscles
    log.targetMuscles.forEach((m) => {
      // If muscle is currently injured, we don't apply standard fatigue (it stays locked at 100%)
      if (log.timestamp < injuredUntil[m]) {
        return;
      }

      // Calculate workload volume & intensity
      let baseIncrease = 0;
      
      if (detailedFatigueMap && detailedFatigueMap[m] !== undefined) {
        // AI-calculated fatigue based on Sets, Reps, Weight
        baseIncrease = detailedFatigueMap[m]!;
      } else {
        // Fallback to legacy Duration x Intensity
        baseIncrease = (log.intensity * 6) + (log.duration / 4);

        // Modifier: Dumbbell Weight for Home Workouts
        if (log.activityType === 'gym' && log.dumbbellWeight && log.dumbbellCount) {
          const isHomeWorkout = !log.gymEquipment?.includes('machines');
          if (isHomeWorkout) {
            if (log.dumbbellWeight >= 15) {
              baseIncrease *= 1.15; // Mechanical tension high -> deeper DOMS
            } else if (log.dumbbellWeight <= 5) {
              baseIncrease *= 0.90; // Metabolic stress high -> less DOMS than heavy weights
            } else {
              baseIncrease *= 1.05; // Standard home workout weight
            }
          }
        } // BUG-03 FIX: Đóng đúng khối if gym/dumbbell ở đây

      // Modifier: Pitch Size for Football
      if (log.activityType === 'football' && log.footballPitchSize) {
        baseIncrease *= PITCH_SIZE_MULTIPLIERS[log.footballPitchSize] || 1.0;
      }

      // Modifier: Environment for Swimming & Zero-Impact Base Reduction
      if (log.activityType === 'swimming') {
        baseIncrease *= 0.85; // Giảm sát thương gốc 15% vì bơi lội không có va đập ly tâm
        if (log.swimmingEnvironment) {
          baseIncrease *= SWIMMING_ENV_MULTIPLIERS[log.swimmingEnvironment] || 1.0;
        }
      }

      // Modifier: Pace Penalty for Endurance Sports
      if (log.distance && log.distance > 0) {
        if (log.activityType === 'swimming') {
          // Pace = seconds per 100m
          const paceSecs = (log.duration * 60) / (log.distance / 100);
          if (paceSecs < 100) baseIncrease *= 1.20; // < 1:40/100m
          else if (paceSecs > 150) baseIncrease *= 0.85; // > 2:30/100m
        } else if (log.activityType === 'running') {
          // Pace = minutes per km
          const paceMins = log.duration / log.distance;
          if (paceMins < 5.0) baseIncrease *= 1.25; // < 5:00/km
          else if (paceMins > 7.5) baseIncrease *= 0.85; // > 7:30/km
        } else if (log.activityType === 'cycling') {
          // Speed = km/h
          const speedKmh = log.distance / (log.duration / 60);
          if (speedKmh > 30) baseIncrease *= 1.20; // > 30 km/h
          else if (speedKmh < 20) baseIncrease *= 0.85; // < 20 km/h
        }
      }

      // Modifier: Sport Specificity (Adaptation Coefficient)
      const isPreferredSport = 
        (profile.primarySport === 'strength' && log.activityType === 'gym') ||
        (profile.primarySport === 'endurance' && ['running', 'cycling', 'swimming'].includes(log.activityType)) ||
        (profile.primarySport === 'team_sports' && ['football', 'basketball'].includes(log.activityType));

      if (isPreferredSport) {
        // Adaptability reduces fatigue impact by 10%
        baseIncrease *= 0.90;
      }

      // Modifier: BMI/Weight Penalty for High-Impact Sports
      // BMI = weight(kg) / (height(m) * height(m))
      const heightInMeters = profile.height / 100;
      const bmi = profile.weight / (heightInMeters * heightInMeters);
      const isHighImpactActivity = ['football', 'running', 'basketball'].includes(log.activityType);
      const isLowerBodyMuscle = ['quadriceps', 'hamstrings', 'calves', 'knees', 'ankles', 'feet', 'glutes'].includes(m);
      
      if (isHighImpactActivity && isLowerBodyMuscle) {
        if (bmi > 25) {
          // BMI > 25 indicates overweight/extra mass. 
          // Extra mass significantly increases mechanical load on lower body during high-impact sports.
          // Add 5% extra fatigue for every 1 BMI point over 25. (e.g. BMI 28 = +15% fatigue)
          const bmiPenalty = 1 + ((bmi - 25) * 0.05);
          baseIncrease *= bmiPenalty;
        }
      }

      // Modifier: Fitness Level (Dynamic ACWR hoặc Static Fallback)
      // #6 FIX: Truyền profile.weight để tính Volume Load đúng cho bodyweight exercises
      const acwr = calculateACWR(logs, log.timestamp - 1, profile.weight);
      
      if (acwr > 0) {
        if (acwr < 0.8) {
          baseIncrease *= 1.15; // Detraining: Cơ thể đang mất form, dễ bị sốc tải
        } else if (acwr <= 1.3) {
          baseIncrease *= 0.90; // Sweet Spot: Đang vào guồng, khả năng chịu tải tốt
        } else if (acwr > 1.5) {
          baseIncrease *= 1.25; // Overreaching: Tập quá sức so với nền tảng, nguy cơ chấn thương cao
        }
      } else {
        // Fallback tĩnh nếu người dùng mới, chưa có data ACWR
        if (profile.weeklyFrequency === 0) {
          baseIncrease *= 1.05; // Tùy hứng/Linh hoạt (phạt nhẹ 5% do không có nhịp sinh học đều)
        } else if (profile.weeklyFrequency >= 5) {
          baseIncrease *= 0.85; // High training frequency, better fitness
        } else if (profile.weeklyFrequency <= 2) {
          baseIncrease *= 1.15; // Low training frequency, easily fatigued
        }
      }

      // Modifier: Injury History (Smart Profiling)
      const pastInjury = profile.injuryHistory.find(i => i.muscle === m);
      if (pastInjury) {
        let penalty = 1.10; // Phạt nhẹ 10% cho chấn thương cũ/nhẹ
        
        if (pastInjury.timeframe === 'recent') {
          if (pastInjury.severity === 'severe') penalty = 2.0; // Phạt 100% (Khóa khớp/nguy hiểm)
          else if (pastInjury.severity === 'moderate') penalty = 1.4; // Phạt 40%
          else penalty = 1.2; // Phạt 20%
        } else if (pastInjury.timeframe === 'subacute') {
          if (pastInjury.severity === 'severe') penalty = 1.4;
          else if (pastInjury.severity === 'moderate') penalty = 1.2;
          else penalty = 1.1;
        } else {
          if (pastInjury.severity === 'severe') penalty = 1.2;
        }
        baseIncrease *= penalty;
      }

      // Modifier: Positional Matrix for Football & Swimming
      let finalIncrease = baseIncrease;

      // Modifier: Precision Muscle Mapping cho Gym
      if (!detailedFatigueMap && log.activityType === 'gym' && log.muscleMapping && log.muscleMapping[m] !== undefined) {
        finalIncrease *= log.muscleMapping[m];
      }

      if (log.activityType === 'football' && log.footballPositions) {
        // Calculate weighted fatigue from multiple positions
        let totalMultiplier = 0;
        let weightedMultiplier = 0;
        
        log.footballPositions.forEach(posPercent => {
          const posMatrix = FOOTBALL_POS_MULTIPLIERS[posPercent.position];
          if (posMatrix && posMatrix[m]) {
            weightedMultiplier += posMatrix[m] * (posPercent.percentage / 100);
            totalMultiplier += 1;
          }
        });
        
        if (totalMultiplier > 0) {
          finalIncrease = baseIncrease * weightedMultiplier * 3.5;
        } else {
          finalIncrease = 0; // Muscle not used in any selected position
        }

        // Add heading penalty to neck
        if (log.footballIncludesHeading && m === 'neck') {
          // Heading impact creates significant neck fatigue regardless of positional matrix
          finalIncrease = baseIncrease * 0.4 * 3.5;
        }
      } else if (log.activityType === 'football' && (log as any).footballPosition) {
        // Fallback for old data
        const posMatrix = FOOTBALL_POS_MULTIPLIERS[(log as any).footballPosition as FootballPosition];
        const weight = posMatrix ? (posMatrix[m] || 0.1) : 0;
        finalIncrease = baseIncrease * weight * 3.5;
      } else if (log.activityType === 'swimming' && log.swimmingStroke) {
        const strokeMatrix = SWIMMING_STROKE_MULTIPLIERS[log.swimmingStroke];
        const weight = strokeMatrix[m] || 0.1;
        finalIncrease = baseIncrease * weight * 3.5;
      }

      // Giới hạn mức tăng tối đa cho 1 buổi tập để tránh hệ số nhân phi lý
      finalIncrease = Math.min(finalIncrease, 75); // Không quá 75% cho 1 buổi

      // Add fatigue, capped at 100%
      currentFatigues[m] = Math.min(100, currentFatigues[m] + finalIncrease);
      lastTrainedTimes[m] = log.timestamp;
    });
  });

  // Decay from the last log to the targetTime
  const finalTimeGapHours = (targetTime - lastEventTime) / (1000 * 60 * 60);
  if (finalTimeGapHours > 0) {
    MUSCLE_LIST.forEach((m) => {
      const isInjured = targetTime < injuredUntil[m];
      if (!isInjured) {
        // Use default/last sleep & nutrition for final decay
        const lastLog = sortedLogs[sortedLogs.length - 1];
        const halfLife = getMuscleHalfLife(m, profile, lastLog);
        const decayConst = Math.log(2) / halfLife;
        currentFatigues[m] = currentFatigues[m] * Math.exp(-decayConst * finalTimeGapHours);
      }
    });
  }

  // Map to MuscleState[]
  return MUSCLE_LIST.map((m) => {
    const fatigue = Math.round(currentFatigues[m]);
    const lastTrained = lastTrainedTimes[m];
    const isInjured = targetTime < injuredUntil[m];
    
    let status: MuscleStatus = 'recovered';
    let recoveryTimeRemaining = 0;

    if (isInjured) {
      status = 'injured';
      const remainingMs = Math.max(0, injuredUntil[m] - targetTime);
      recoveryTimeRemaining = Math.round(remainingMs / (1000 * 60 * 60));
    } else {
      if (fatigue > 70) status = 'heavy';
      else if (fatigue > 50) status = 'moderate';
      else if (fatigue > 20) status = 'mild';
      else status = 'recovered';

      if (fatigue > 0) {
        const halfLife = getMuscleHalfLife(m, profile, sortedLogs[sortedLogs.length - 1]);
        const decayConst = Math.log(2) / halfLife;
        // Time to reach recovered zone (< 20% fatigue)
        // 20 = fatigue * e^(-decayConst * t) => t = ln(fatigue / 20) / decayConst
        if (fatigue > 20) {
          recoveryTimeRemaining = Math.max(0, Math.round(Math.log(fatigue / 20) / decayConst));
        }
      }
    }

    return {
      muscle: m,
      fatigue,
      lastTrained,
      recoveryTimeRemaining,
      status,
    };
  });
}

// Helper: Get muscle recovery half-life (hours) adjusted by lifestyle & biology
function getMuscleHalfLife(muscle: MuscleGroup, profile: UserProfile, lastLog?: ActivityLog): number {
  // Cá nhân hóa theo kích thước cơ bắp
  const size = MUSCLE_SIZE_GROUPS[muscle];
  let baseHalfLife = size === 'small' ? 12 : size === 'medium' ? 24 : 36;

  // 1. Adjusted by Resting Heart Rate (RHR)
  // Standard RHR is 70 bpm. Lower RHR increases recovery speed
  const rhrFactor = 1 + (profile.rhr - 70) * 0.006;
  baseHalfLife *= rhrFactor;

  // 2. Adjusted by Injury History
  const pastInjury = profile.injuryHistory.find(i => i.muscle === muscle);
  if (pastInjury) {
    let penalty = 1.10; // recovers 10% slower default
    if (pastInjury.timeframe === 'recent') penalty = pastInjury.severity === 'severe' ? 1.5 : 1.3;
    else if (pastInjury.timeframe === 'subacute') penalty = pastInjury.severity === 'severe' ? 1.3 : 1.2;
    baseHalfLife *= penalty; 
  }

  // 3. Adjusted by Sleep Quality of last log
  if (lastLog) {
    if (lastLog.sleep === 'good') baseHalfLife *= 0.85; // 15% faster recovery
    else if (lastLog.sleep === 'poor') baseHalfLife *= 1.25; // 25% slower recovery
    
    // 4. Adjusted by Nutrition today
    if (lastLog.nutrition === 'deficit') baseHalfLife *= 1.20; // 20% slower recovery due to calorie/protein deficit
    else if (lastLog.nutrition === 'surplus') baseHalfLife *= 0.85; // 15% faster recovery due to optimal protein/calorie surplus
  }

  // 5. Adjusted by Age
  // Peak cellular recovery happens before age 30.
  // Slower muscle protein synthesis adds 1.5% to recovery time for every year over 30.
  if (profile.age > 30) {
    const agePenalty = 1 + ((profile.age - 30) * 0.015);
    baseHalfLife *= agePenalty;
  }

  return Math.max(8, baseHalfLife); // Minimum half-life is 8 hours
}

// Phase 2, Task 2: Calculate Cortisol accumulation & decay
// #9 FIX: Sử dụng profile để cá nhân hóa cortisol decay theo tuổi, RHR và primarySport
export function calculateCortisolState(
  profile: UserProfile,
  logs: ActivityLog[],
  targetTime: number
): CortisolState {
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const sortedLogs = [...logs]
    .filter((log) => log.status !== 'planned' && log.timestamp <= targetTime && log.timestamp >= targetTime - SEVEN_DAYS_MS)
    .sort((a, b) => a.timestamp - b.timestamp);

  // #9 FIX: Cá nhân hóa baseline cortisol theo profile
  // Vận động viên sức bền có ngưỡng cortisol cao hơn do thích nghi
  const sportBaseline = profile.primarySport === 'endurance' ? 25 : 20;

  // #9 FIX: Tính hệ số decay dựa trên RHR (RHR thấp = hệ thần kinh khỏe = decay nhanh hơn)
  // RHR chuẩn = 60 bpm. Mỗi 10 bpm thấp hơn → decay nhanh hơn 8%
  const rhrDecayFactor = 1 - Math.max(-0.20, Math.min(0.20, (profile.rhr - 60) * 0.008));

  // #9 FIX: Tuổi ảnh hưởng tốc độ clearance cortisol
  // Sau 35 tuổi, cortisol clearance chậm hơn 1% mỗi năm
  const ageFactor = profile.age > 35 ? 1 + (profile.age - 35) * 0.01 : 1.0;

  let currentCortisol = sportBaseline;
  let lastEventTime = sortedLogs.length > 0 ? sortedLogs[0].timestamp : targetTime;
  let recentSpikes: { time: number; spike: number }[] = [];

  sortedLogs.forEach((log) => {
    const timeGapHours = (log.timestamp - lastEventTime) / (1000 * 60 * 60);

    if (timeGapHours > 0) {
      const lastSleep = sortedLogs.find((l) => l.timestamp < log.timestamp)?.sleep || 'good';
      // #9 FIX: Áp dụng rhrDecayFactor và ageFactor vào half-life
      const baseHalfLife = lastSleep === 'good' ? 4 : lastSleep === 'poor' ? 12 : 6;
      const halfLife = baseHalfLife * ageFactor / rhrDecayFactor;
      const decayConst = Math.log(2) / halfLife;
      const baseline = log.stress === 'high' ? 35 : sportBaseline;
      currentCortisol = baseline + (currentCortisol - baseline) * Math.exp(-decayConst * timeGapHours);
    }

    lastEventTime = log.timestamp;

    let spike = (log.intensity * log.duration) / 20;

    // #9 FIX: Vận động viên sức bền có spike thấp hơn do thích nghi cao
    if (profile.primarySport === 'endurance' && ['running', 'cycling', 'swimming'].includes(log.activityType)) {
      spike *= 0.85;
    }

    if (log.sleep === 'poor') spike *= 1.30;
    if (log.stress === 'high') spike *= 1.30;
    if (log.nutrition === 'deficit') spike *= 1.15;
    else if (log.nutrition === 'surplus') spike *= 0.90;

    recentSpikes = recentSpikes.filter(s => log.timestamp - s.time <= 24 * 60 * 60 * 1000);
    const accumulated24h = recentSpikes.reduce((sum, s) => sum + s.spike, 0);
    const allowedSpike = Math.max(0, 60 - accumulated24h);
    spike = Math.min(spike, 40, allowedSpike);
    recentSpikes.push({ time: log.timestamp, spike });
    currentCortisol = Math.min(100, currentCortisol + spike);
  });

  const finalTimeGapHours = (targetTime - lastEventTime) / (1000 * 60 * 60);
  if (finalTimeGapHours > 0) {
    const lastLog = sortedLogs[sortedLogs.length - 1];
    const lastSleep = lastLog ? lastLog.sleep : 'good';
    const lastStress = lastLog ? lastLog.stress : 'low';
    const baseHalfLife = lastSleep === 'good' ? 4 : lastSleep === 'poor' ? 12 : 6;
    // #9 FIX: Áp dụng các hệ số profile vào final decay
    const halfLife = baseHalfLife * ageFactor / rhrDecayFactor;
    const decayConst = Math.log(2) / halfLife;
    const baseline = lastStress === 'high' ? 35 : sportBaseline;
    currentCortisol = baseline + (currentCortisol - baseline) * Math.exp(-decayConst * finalTimeGapHours);
  }

  const finalLevel = Math.max(20, Math.min(100, Math.round(currentCortisol)));

  let zone: CortisolZone = 'anabolic';
  let description = '';

  if (finalLevel > 70) {
    zone = 'catabolic';
    description = 'Cảnh báo: Phân rã cơ bắp, nguy cơ chấn thương cao.';
  } else if (finalLevel >= 40) {
    zone = 'normal';
    description = 'Thích nghi tốt, sinh học ổn định.';
  } else {
    zone = 'anabolic';
    description = 'Hormone xây cơ chiếm ưu thế, sẵn sàng tập nặng.';
  }

  return { currentLevel: finalLevel, zone, description };
}

// Phase 2, Task 4: Apply DOMS calibration to muscle states
// BUG-02 FIX: Thêm tham số lastLog để áp dụng đúng hiệu chỉnh ngủ/dinh dưỡng khi tính half-life
export function calibrateMuscleStatesWithDOMS(
  profile: UserProfile,
  states: MuscleState[],
  domsRecords: Record<MuscleGroup, number>,
  lastLog?: ActivityLog
): MuscleState[] {
  return states.map((state) => {
    const doms = domsRecords[state.muscle];
    
    // If DOMS is not recorded or is 1 (No Soreness), keep the calculated state
    if (!doms || doms <= 1) {
      return state;
    }

    // Map subjective DOMS (2-5) to minimum fatigue levels
    let minFatigue = 0;
    if (doms === 2) minFatigue = 35; // Mild soreness
    else if (doms === 3) minFatigue = 60; // Moderate soreness
    else if (doms === 4) minFatigue = 85; // Heavy soreness
    else if (doms === 5) minFatigue = 100; // Extreme soreness/pain

    // If calculated fatigue is lower than DOMS indication, override it
    if (state.fatigue < minFatigue && state.status !== 'injured') {
      const fatigue = minFatigue;
      let status: MuscleStatus = 'mild';
      if (fatigue > 70) status = 'heavy';
      else if (fatigue > 50) status = 'moderate';

      // Recalculate remaining recovery hours for the calibrated fatigue level
      // Phạt Half-life nếu DOMS >= 4 (tăng 30% thời gian phục hồi do tổn thương sâu)
      const domsPenalty = doms >= 4 ? 1.3 : 1.0;
      // BUG-02 FIX: Truyền lastLog để áp dụng hiệu chỉnh ngủ/dinh dưỡng chính xác
      const halfLife = getMuscleHalfLife(state.muscle, profile, lastLog) * domsPenalty;
      const decayConst = Math.log(2) / halfLife;
      const recoveryTimeRemaining = Math.max(0, Math.round(Math.log(fatigue / 20) / decayConst));

      return {
        ...state,
        fatigue,
        status,
        recoveryTimeRemaining,
      };
    }

    return state;
  });
}

// Phase 2, Task 5: Smart Coach/Doctor recommendation engine
export interface CoachAdvice {
  status: 'anabolic' | 'normal' | 'catabolic';
  title: string;
  advice: string;
  safeMuscles: MuscleGroup[];
  avoidMuscles: MuscleGroup[];
}

export function generateCoachAdvice(
  _profile: UserProfile,
  muscleStates: MuscleState[],
  cortisol: CortisolState
): CoachAdvice {
  let safeMuscles = muscleStates
    .filter((s) => s.fatigue < 70 && s.status !== 'injured')
    .map((s) => s.muscle);
    
  const avoidMusclesSet = new Set(
    muscleStates
      .filter((s) => s.fatigue >= 70 || s.status === 'injured')
      .map((s) => s.muscle)
  );

  // Áp dụng Synergy Matrix: Nếu cơ phụ trợ bị đau/mỏi, không được tập cơ chính
  const finalSafeMuscles: MuscleGroup[] = [];
  safeMuscles.forEach(m => {
    const dependencies = MUSCLE_SYNERGY[m] || [];
    const hasFatiguedDependency = dependencies.some(dep => avoidMusclesSet.has(dep));
    
    if (hasFatiguedDependency) {
      avoidMusclesSet.add(m); // Chuyển cơ chính sang vùng tránh tập
    } else {
      finalSafeMuscles.push(m);
    }
  });

  safeMuscles = finalSafeMuscles;
  const avoidMuscles = Array.from(avoidMusclesSet);

  // Scenario 1: Catabolic Zone (Cortisol > 70%) - Central Nervous System Fatigue Warning
  if (cortisol.zone === 'catabolic') {
    return {
      status: 'catabolic',
      title: 'CẢNH BÁO: NGHỈ NGƠI HOÀN TOÀN',
      advice: `Cortisol đạt ngưỡng nguy hiểm (${cortisol.currentLevel}%). CNS quá tải. KHÔNG tập nặng hôm nay. Ưu tiên ngủ và phục hồi.`,
      safeMuscles: [],
      avoidMuscles: MUSCLE_LIST,
    };
  }

  // Scenario 2: Normal Zone (Cortisol 40% - 70%)
  if (cortisol.zone === 'normal') {
    // If most of the major muscle groups are fatigued
    if (avoidMuscles.length > 5) {
      return {
        status: 'normal',
        title: 'Hồi Phục Chủ Động',
        advice: `Cơ bắp đang mỏi rã rời dù hệ thần kinh ổn định. Tập trung giãn cơ, bơi lội hoặc đi bộ nhẹ nhàng hôm nay.`,
        safeMuscles: [],
        avoidMuscles: MUSCLE_LIST,
      };
    }

    const safeLabels = safeMuscles.map((m) => MUSCLE_LABELS[m]);
    const avoidLabels = avoidMuscles.map((m) => MUSCLE_LABELS[m]);

    return {
      status: 'normal',
      title: 'Tập Có Chọn Lọc',
      advice: `Sẵn sàng tập: ${safeLabels.join(', ')}. Tuyệt đối tránh: ${avoidLabels.join(', ')}.`,
      safeMuscles,
      avoidMuscles,
    };
  }

  // Scenario 3: Anabolic Zone (Cortisol < 40%) - Peak Performance
  const safeLabels = safeMuscles.map((m) => MUSCLE_LABELS[m]);
  const avoidLabels = avoidMuscles.map((m) => MUSCLE_LABELS[m]);

  if (safeMuscles.length >= 8) {
    return {
      status: 'anabolic',
      title: 'SẴN SÀNG BÙNG NỔ',
      advice: `Thể trạng HOÀN HẢO! Hệ thần kinh hồi phục 100%. Hãy bung sức với các bài tập nặng hôm nay.`,
      safeMuscles,
      avoidMuscles,
    };
  }

  return {
    status: 'anabolic',
    title: 'Tập Cường Độ Cao',
    advice: `Hệ thần kinh đang hồi phục cực tốt. Có thể tập nặng: ${safeLabels.join(', ')}. Tránh: ${avoidLabels.join(', ')}.`,
    safeMuscles,
    avoidMuscles,
  };
}

// TỪ ĐIỂN TRIỆU CHỨNG CHẤN THƯƠNG
export const INJURY_SYMPTOMS_DICT: Record<string, { mild: string, moderate: string, severe: string }> = {
  ankles: {
    mild: 'Đau nhói lúc lật nhưng vẫn có thể tự đứng dậy và đi bộ được. Khớp hơi sưng nhẹ sau 24h, không bầm tím.',
    moderate: 'Sưng to rõ rệt, bắt đầu có vết bầm tím sau vài giờ. Đi lại khập khiễng, đau buốt khi dồn trọng lượng.',
    severe: 'Nghe tiếng "rắc" lúc lật. Sưng vù lập tức, bầm tím diện rộng. Không thể tự đứng trụ hoặc bước đi. Khớp có cảm giác lỏng lẻo.'
  },
  knees: {
    mild: 'Hơi nhức hoặc mỏi sau khi tập nặng. Cảm giác hơi căng ở gối nhưng không cản trở chuyển động gập/duỗi.',
    moderate: 'Sưng phồng quanh gối, đau buốt khi ngồi xổm hoặc leo cầu thang. Có cảm giác lục cục, lạo xạo hoặc hơi kẹt khớp.',
    severe: 'Cảm giác sụp gối, lỏng gối, mất vững khi đi lại. Sưng to tức thì, không thể duỗi thẳng hoặc gập hết cỡ gối. Có tiếng nổ lụp cụp.'
  },
  wrists: {
    mild: 'Hơi ê ẩm sau khi tập các bài chống đẩy hoặc nâng tạ. Vẫn có thể xoay cổ tay bình thường, chỉ nhức nhẹ.',
    moderate: 'Nhói buốt khi dùng lực cầm nắm (bóp phanh xe, xách đồ). Đau rõ rệt khi xoay cổ tay hoặc tì đè trọng lượng. Sưng quanh mắt cá tay.',
    severe: 'Đau dữ dội, không thể cầm nắm bất cứ vật gì. Cổ tay sưng húp, biến dạng nhẹ hoặc mất hoàn toàn sức lực ở bàn tay.'
  },
  elbows: {
    mild: 'Mỏi và căng tức vùng khuỷu tay sau buổi tập. Sức nắm vẫn tốt, không ảnh hưởng sinh hoạt.',
    moderate: 'Đau buốt chạy dọc từ khuỷu xuống cẳng tay khi xách đồ nặng hoặc vặn nắp chai. Cơn đau dai dẳng ngay cả lúc nghỉ ngơi.',
    severe: 'Cơn đau nhói như dao đâm khi cử động khuỷu tay. Sưng nóng đỏ, không thể duỗi thẳng tay hoặc gập tay chạm vai.'
  },
  lower_back: {
    mild: 'Mỏi nhừ vùng lưng dưới sau khi ngồi lâu hoặc tập nặng. Nghỉ ngơi 1-2 ngày là hết, không lan ra chỗ khác.',
    moderate: 'Đau co cứng cơ lưng, khó khăn khi cúi gập người mang giày hoặc vặn mình. Phải đi khom lưng. Đau tăng khi ho hoặc hắt hơi.',
    severe: 'Đau nhói dữ dội, cơn đau lan tỏa từ mông chạy dọc xuống đùi và bắp chân (đau thần kinh tọa). Tê bì, châm chích ngón chân.'
  },
  neck: {
    mild: 'Mỏi cổ gáy do tư thế gập cổ lâu. Hơi căng khi xoay đầu nhưng vẫn nhìn được sang 2 bên.',
    moderate: 'Cứng gáy ("vẹo cổ"), rất đau khi cố ngoái đầu nhìn ra sau. Cơn đau có thể lan xuống bả vai.',
    severe: 'Đau buốt lan từ cổ dọc xuống cánh tay, kèm theo tê rần hoặc yếu các ngón tay. Đau chói như điện giật khi cử động cổ.'
  },
  default: {
    mild: 'Mỏi cơ, ê ẩm nhẹ. Vẫn có thể sinh hoạt và vận động bình thường.',
    moderate: 'Đau buốt khi co duỗi cơ hoặc dùng lực. Có thể sưng nhẹ hoặc bầm tím. Khó khăn trong sinh hoạt.',
    severe: 'Đau dữ dội, hoàn toàn mất chức năng vận động vùng cơ này. Rách cơ hoặc sưng rất to.'
  }
};
