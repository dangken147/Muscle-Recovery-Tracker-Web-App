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
  TrainingStyle,
  BasketballFormat,
  BasketballSurface,
  BasketballMatchType,
} from '../types/recovery.types';

import { 
  FOOTBALL_CNS_HALF_LIFE,
  FOOTBALL_POSITION_MATRIX,
  FOOTBALL_SSG_MULTIPLIER,
  FOOTBALL_SURFACE_MULTIPLIER,
  FOOTBALL_HEADING_MULTIPLIER,
  FOOTBALL_MATCH_MULTIPLIER,
  WEATHER_HEAT_INDEX_MULTIPLIER,
  WEATHER_COLD_MULTIPLIER,
  RUNNING_IMPACT_MATRIX,
  RUNNING_TERRAIN_MULTIPLIERS,
  RUNNING_FOOTWEAR_MULTIPLIERS,
  SWIMMING_STROKE_MULTIPLIERS,
  SWIMMING_ENV_MULTIPLIERS,
  SWIMMING_EQUIPMENT_LOAD_SHIFT,
  BASKETBALL_BASE_RECOVERY_HOURS,
  BASKETBALL_SURFACE_MULTIPLIER,
  BASKETBALL_FORMAT_MULTIPLIER,
  BASKETBALL_MATCH_MULTIPLIER,
  BASKETBALL_FATIGUE_DISTRIBUTION
} from './recoveryAlgorithm';

// ==========================================
// THÔNG SỐ TRÍCH XUẤT TỪ NOTEBOOKLM (TABLE TENNIS)
// ==========================================
export const TABLE_TENNIS_BASE_MUSCLES: MuscleGroup[] = [
  'quadriceps', 'glutes', 'calves', 'hamstrings', 'obliques', 'lower_back', 'front_shoulders', 'forearms', 'wrists'
];

export const TABLE_TENNIS_STYLE_MULTIPLIERS: Record<'offensive' | 'defensive' | 'all_round', Partial<Record<MuscleGroup, number>>> = {
  offensive: { glutes: 1.35, quadriceps: 1.25, obliques: 1.30, calves: 1.20, front_shoulders: 1.25, forearms: 1.30, wrists: 1.25 },
  defensive: { quadriceps: 1.20, hamstrings: 1.15, calves: 1.15, lower_back: 1.25, rear_shoulders: 1.15, forearms: 1.10 },
  all_round: { quadriceps: 1.0, hamstrings: 1.0, glutes: 1.0, calves: 1.0, obliques: 1.0, lower_back: 1.0, front_shoulders: 1.0, rear_shoulders: 1.0, biceps: 1.0, triceps: 1.0, forearms: 1.0, wrists: 1.0 }
};

export const TABLE_TENNIS_DOUBLES_MULTIPLIER = 0.85;
export const TABLE_TENNIS_CNS_FATIGUE = 1.35;
export const TABLE_TENNIS_MUSCLE_DAMAGE = 0.75;
export const TABLE_TENNIS_INJURY_HALF_LIFE: Partial<Record<MuscleGroup, number>> = {
  elbows: 1.40, front_shoulders: 1.35, lower_back: 1.35, knees: 1.30, wrists: 1.25, ankles: 1.20
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

// Maximum Tolerable Load (MTL) - ngưỡng tải tối đa mà cơ chịu được trước khi đạt 100% fatigue
// #4 FIX: Hiệu chỉnh lại dựa trên mô phỏng thực tế:
// Người 70kg, Bench Press 3x10 @ 60kg RPE8 → rawLoad ≈ 1289
// Mục tiêu: buổi tập đó gây ~50% fatigue → MTL_MAP[upper_chest] ≈ 1289/0.5 = 2578 → làm tròn 2500
// Các nhóm cơ lớn (quad/hamstring/glutes) chịu tải cao hơn ~2x so với ngực
// Khớp và dây chằng có ngưỡng thấp hơn nhiều do dễ tổn thương
export const MTL_MAP: Record<MuscleGroup, number> = {
  // Nhóm cơ ngực - chuẩn tham chiếu
  upper_chest: 2500, lower_chest: 2500,
  // Nhóm cơ lưng - lớn hơn ngực
  lats: 3200, traps: 2500, lower_back: 2200,
  // Nhóm cơ chân - lớn nhất, chịu tải cao nhất
  quadriceps: 5000, hamstrings: 4500, glutes: 4800, calves: 2000,
  // Nhóm vai - nhỏ hơn ngực
  front_shoulders: 1800, rear_shoulders: 1600,
  // Nhóm tay - nhỏ nhất trong các cơ chính
  biceps: 1200, triceps: 1400, forearms: 900,
  // Nhóm core
  upper_abs: 1500, lower_abs: 1500, obliques: 1400,
  // Cơ nhỏ
  neck: 800,
  // Khớp và dây chằng - ngưỡng thấp do dễ tổn thương
  wrists: 900, elbows: 900, knees: 1200, ankles: 1000,
  feet: 900, shoulder_joints: 1000,
  acl: 800, achilles: 800
};

export function rpeMultiplier(rpe: number): number {
  const clamped = Math.max(1, Math.min(10, rpe));
  return Math.pow(clamped / 10, 1.5);
}

export function rirToRpe(rir: number): number {
  return Math.max(1, Math.min(10, 10 - rir));
}

export function getStyleMultiplier(style?: TrainingStyle): number {
  switch (style) {
    case 'strength': return 0.75;  // Neural fatigue, less DOMS
    case 'hypertrophy': return 1.00; // Mechanical damage, max DOMS
    case 'endurance': return 0.65; // Metabolic stress, low DOMS
    case 'power': return 0.80;
    case 'general':
    default: return 0.80; // General
  }
}

export function calcSetLoad(set: ExerciseSet, effectiveWeight: number, style?: TrainingStyle): number {
  const rir = set.rir ?? 2; // Mặc định RIR 2 (RPE 8)
  const rpe = rirToRpe(rir);
  const failurePenalty = (rir === 0 || set.toFailure) ? 1.35 : 1.0;
  const styleMultiplier = getStyleMultiplier(style);
  
  // NotebookLM: Convert Time Under Tension (Duration) to Equivalent Reps (4s per dynamic rep)
  const equivalentReps = set.duration ? set.duration / 4.0 : set.reps;
  
  return equivalentReps * effectiveWeight * rpeMultiplier(rpe) * failurePenalty * styleMultiplier;
}

export function calcExerciseLoad(
  exercise: ExerciseSession,
  userBodyweight: number,
  sessionStyle?: TrainingStyle
): number {
  const style = exercise.trainingStyle ?? sessionStyle;
  return exercise.sets.reduce((total, set) => {
    // Nếu là bài tập bodyweight, cộng thêm % trọng lượng cơ thể
    const baseWeight = exercise.isBodyweight
      ? (userBodyweight * (exercise.bwFraction ?? 0.7)) + set.weight
      : set.weight;
    
    // Hệ số phạt Form: Form càng kém (formRating thấp), độ mỏi càng tăng (tối đa x1.5 fatigue)
    // Ưu tiên formRating của từng Set, nếu không có thì lấy formRating chung của bài, mặc định 100
    const setFormRating = set.formRating ?? exercise.formRating ?? 100;
    const formPenalty = 1 + ((100 - setFormRating) / 100) * 0.5; 
    
    return total + calcSetLoad(set, baseWeight, style) * formPenalty;
  }, 0);
}

export function toFatiguePercent(rawLoad: number, mtl: number, k = 5): number {
  const x = rawLoad / mtl;
  // Sigmoid curve
  const sigmoid = 1 / (1 + Math.exp(-k * (x - 0.5)));
  return Math.min(Math.round(sigmoid * 100), 100);
}

export function getDynamicMTL(muscle: MuscleGroup, profile: UserProfile, acwr?: number): number {
  const baseMtl = MTL_MAP[muscle] ?? 5000;
  
  // 1. Fitness Multiplier
  let fitnessMultiplier = 1.0;
  if (profile.weeklyFrequency >= 5) fitnessMultiplier = 1.3;
  else if (profile.weeklyFrequency >= 3) fitnessMultiplier = 1.15;
  else if (profile.weeklyFrequency <= 1) fitnessMultiplier = 0.9;

  // Nếu có ACWR, có thể tinh chỉnh thêm
  if (acwr !== undefined && acwr > 0) {
    if (acwr > 1.3) fitnessMultiplier *= 1.1; // Chịu tải tốt hơn nếu đang trong chu kỳ tải cao
    if (acwr < 0.8) fitnessMultiplier *= 0.9; // Yếu đi nếu nghỉ tập lâu
  }

  // 2. Weight Multiplier
  // Người 70kg là chuẩn (1.0). Tăng/giảm theo logarit để tránh over-scaling cho người béo phì.
  let weightMultiplier = 1.0;
  if (profile.weight > 70) {
    // Logarithmic scaling for weight > 70kg
    weightMultiplier = 1 + Math.log10(profile.weight / 70) * 0.5;
  } else if (profile.weight < 70) {
    weightMultiplier = profile.weight / 70;
  }

  let finalMtl = baseMtl * fitnessMultiplier * weightMultiplier;
  
  // Clamp giới hạn an toàn [0.8 * baseMtl, 1.6 * baseMtl]
  const minMtl = baseMtl * 0.8;
  const maxMtl = baseMtl * 1.6;
  
  return Math.max(minMtl, Math.min(maxMtl, finalMtl));
}

export function calculateDetailedSessionFatigue(
  detailedExercises: ExerciseSession[],
  profile: UserProfile,
  acwr?: number,
  sessionStyle?: TrainingStyle
): Partial<Record<MuscleGroup, number>> {
  const rawLoads: Partial<Record<MuscleGroup, number>> = {};

  for (const ex of detailedExercises) {
    const exLoad = calcExerciseLoad(ex, profile.weight, sessionStyle);
    for (const [muscleStr, ratio] of Object.entries(ex.muscle_mapping)) {
      const muscle = muscleStr as MuscleGroup;
      rawLoads[muscle] = (rawLoads[muscle] ?? 0) + exLoad * (ratio ?? 0);
    }
  }

  const fatigueMap: Partial<Record<MuscleGroup, number>> = {};
  for (const [muscleStr, load] of Object.entries(rawLoads)) {
    const muscle = muscleStr as MuscleGroup;
    const mtl = getDynamicMTL(muscle, profile, acwr);
    fatigueMap[muscle] = toFatiguePercent(load ?? 0, mtl);
  }
  return fatigueMap;
}

// #6 FIX: Hàm tính tổng Volume Load thực tế từ detailedExercises
function calculateTotalVolumeLoad(detailedExercises: ExerciseSession[], userBodyweight: number, sessionStyle?: TrainingStyle): number {
  return detailedExercises.reduce((total, ex) => total + calcExerciseLoad(ex, userBodyweight, sessionStyle), 0);
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
      // #6 FIX: Ưu tiên dùng Volume Load thực tế bất kể loại hoạt động, fallback về legacy nếu chưa có
      const load = log.detailedExercises?.length
        ? calculateTotalVolumeLoad(log.detailedExercises, userBodyweight, log.trainingStyle)
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
  const lastARTime: Record<MuscleGroup, number> = {} as any;

  MUSCLE_LIST.forEach((m) => {
    currentFatigues[m] = 0;
    lastTrainedTimes[m] = null;
    injuredUntil[m] = 0;
    lastARTime[m] = 0;
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

    // Modifier: Fitness Level (Dynamic ACWR hoặc Static Fallback) - Tính 1 lần cho mỗi log
    const acwr = calculateACWR(logs, log.timestamp - 1, profile.weight);

    // 2.5 Process detailed exercises load if available
    let detailedFatigueMap: Partial<Record<MuscleGroup, number>> | null = null;
    if (log.activityType === 'gym' && log.detailedExercises && log.detailedExercises.length > 0) {
      detailedFatigueMap = calculateDetailedSessionFatigue(log.detailedExercises, profile, acwr);
    }

    // 3. Process workload fatigue increase for target muscles
    log.targetMuscles.forEach((m) => {
      // If muscle is currently injured, we don't apply standard fatigue (it stays locked at 100%)
      if (log.timestamp < injuredUntil[m]) {
        return;
      }

      // 3.1 Active Recovery Check
      // Tập cường độ thấp (RPE <= 3) và thời gian ngắn (<= 45p)
      const isActiveRecovery = log.intensity <= 3 && log.duration <= 45;
      
      if (isActiveRecovery) {
        const timeSinceLastAR = log.timestamp - lastARTime[m];
        // Cooldown 24h
        if (timeSinceLastAR >= 24 * 60 * 60 * 1000) {
          const currentF = currentFatigues[m];
          // Giảm 15% mệt mỏi nhưng không giảm xuống dưới mức sàn 20%
          if (currentF > 20) {
            currentFatigues[m] = Math.max(20, currentF - 15);
            lastARTime[m] = log.timestamp;
            lastTrainedTimes[m] = log.timestamp;
          }
        }
        // Skip adding fatigue for this muscle in this log
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
      }

      // Modifier: Football Scientific Modifiers
      if (log.activityType === 'football') {
        if (log.footballPitchSize) {
          baseIncrease *= FOOTBALL_SSG_MULTIPLIER[log.footballPitchSize]?.muscle || 1.0;
        }
        if (log.footballSurface) {
          baseIncrease *= FOOTBALL_SURFACE_MULTIPLIER[log.footballSurface] || 1.0;
        }
        const matchType = log.footballMatchType || (log.footballIsMatch ? 'tournament' : 'training');
        if (FOOTBALL_MATCH_MULTIPLIER[matchType]) {
          baseIncrease *= FOOTBALL_MATCH_MULTIPLIER[matchType].muscle;
        }
      }

      // Modifier: Basketball Scientific Modifiers (NotebookLM)
      if (log.activityType === 'basketball') {
        const fatigueDist = (BASKETBALL_FATIGUE_DISTRIBUTION as any)[m];
        if (fatigueDist !== undefined) {
          baseIncrease *= (fatigueDist * 5.0); // Tương tự cách scale của chạy bộ
        }

        if (log.basketballFormat) {
          baseIncrease *= BASKETBALL_FORMAT_MULTIPLIER[log.basketballFormat] || 1.0;
        }
        if (log.basketballSurface) {
          baseIncrease *= BASKETBALL_SURFACE_MULTIPLIER[log.basketballSurface] || 1.0;
        }
        if (log.basketballMatchType) {
          baseIncrease *= BASKETBALL_MATCH_MULTIPLIER[log.basketballMatchType] || 1.0;
        }
      }

      // Modifier: Running Scientific Modifiers (NotebookLM)
      if (log.activityType === 'running') {
        const rType = log.runningType || 'base';
        const impactMatrix = RUNNING_IMPACT_MATRIX[rType] || RUNNING_IMPACT_MATRIX.base;
        baseIncrease *= impactMatrix.multiplier;
        
        // Distribution
        const muscleRatio = (impactMatrix as any)[m];
        if (muscleRatio !== undefined) {
          // Multiply by the ratio (scaled up so it's comparable to generic baseIncrease)
          // Since normal generic baseIncrease is applied 100% to target muscles, we use ratio * 5.0 
          // (assuming 20% average ratio is baseline 1.0) to balance it, or just use ratio * total targets.
          baseIncrease *= (muscleRatio * 5.0); 
        }

        if (log.runningTerrain) {
          const terrainMultipliers = RUNNING_TERRAIN_MULTIPLIERS[log.runningTerrain];
          if (terrainMultipliers && (terrainMultipliers as any)[m] !== undefined) {
            baseIncrease *= (terrainMultipliers as any)[m];
          }
        }

        if (log.runningFootwear) {
          const footwearMultipliers = RUNNING_FOOTWEAR_MULTIPLIERS[log.runningFootwear] || RUNNING_FOOTWEAR_MULTIPLIERS.cushioned;
          baseIncrease *= footwearMultipliers.timeMultiplier;
          if ((footwearMultipliers as any)[m] !== undefined) {
            baseIncrease *= (footwearMultipliers as any)[m];
          }
        }
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
      // Đã được tính toán bên ngoài vòng lặp (acwr)
      
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

      // Modifier: Weather (Heat Index & Cold Weather)
      if (log.weather && ['football', 'running', 'basketball', 'cycling', 'swimming'].includes(log.activityType)) {
        const temp = log.weather.apparentTemp ?? log.weather.temp;
        if (temp >= WEATHER_HEAT_INDEX_MULTIPLIER.extreme_danger.min) {
          baseIncrease *= WEATHER_HEAT_INDEX_MULTIPLIER.extreme_danger.muscle;
        } else if (temp >= WEATHER_HEAT_INDEX_MULTIPLIER.danger.min) {
          baseIncrease *= WEATHER_HEAT_INDEX_MULTIPLIER.danger.muscle;
        } else if (temp >= WEATHER_HEAT_INDEX_MULTIPLIER.caution.min) {
          baseIncrease *= WEATHER_HEAT_INDEX_MULTIPLIER.caution.muscle;
        } else if (temp <= WEATHER_COLD_MULTIPLIER.cold.max) {
          baseIncrease *= WEATHER_COLD_MULTIPLIER.cold.muscle;
        }
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
          const posMatrix = FOOTBALL_POSITION_MATRIX[posPercent.position];
          if (posMatrix && (posMatrix as any)[m]) {
            weightedMultiplier += (posMatrix as any)[m] * (posPercent.percentage / 100);
            totalMultiplier += 1;
          }
        });
        
        if (totalMultiplier > 0) {
          finalIncrease = baseIncrease * weightedMultiplier * 3.5;
        } else {
          finalIncrease = 0; // Muscle not used in any selected position
        }

        // Add heading penalty to neck
        if (m === 'neck') {
          if (log.footballHeadingFrequency) {
            finalIncrease = baseIncrease * FOOTBALL_HEADING_MULTIPLIER[log.footballHeadingFrequency].neckDoms * 0.4 * 3.5;
          } else if (log.footballIncludesHeading) {
            // Fallback legacy boolean
            finalIncrease = baseIncrease * FOOTBALL_HEADING_MULTIPLIER.medium.neckDoms * 0.4 * 3.5;
          }
        }
      } else if (log.activityType === 'football' && (log as any).footballPosition) {
        // Fallback for old data
        const posMatrix = FOOTBALL_POSITION_MATRIX[(log as any).footballPosition as FootballPosition];
        const weight = posMatrix ? ((posMatrix as any)[m] || 0.1) : 0;
        finalIncrease = baseIncrease * weight * 3.5;
      } else if (log.activityType === 'swimming' && log.swimmingStroke) {
        const strokeData = SWIMMING_STROKE_MULTIPLIERS[log.swimmingStroke];
        if (strokeData) {
          let weight = (strokeData.muscles as any)[m] || 0.05;
          let envMultiplier = log.swimmingEnvironment ? (SWIMMING_ENV_MULTIPLIERS[log.swimmingEnvironment] || 1.0) : 1.0;
          let eqMultiplier = 1.0;

          // Process equipment load shift
          if (log.swimmingEquipment && log.swimmingEquipment.length > 0) {
            let totalUpperShift = 0;
            let totalLowerShift = 0;

            const hasFins = log.swimmingEquipment.includes('fins') || log.swimmingEquipment.includes('kickboard');
            const hasPaddles = log.swimmingEquipment.includes('paddles');
            const hasPullBuoy = log.swimmingEquipment.includes('pull_buoy');

            if (hasPaddles && hasPullBuoy) {
              const shift = SWIMMING_EQUIPMENT_LOAD_SHIFT.paddles_and_pull_buoy;
              totalUpperShift += shift.upper;
              totalLowerShift += shift.lower;
              eqMultiplier *= shift.multiplier;
            } else {
              if (hasFins) {
                const shift = SWIMMING_EQUIPMENT_LOAD_SHIFT.fins_or_kickboard;
                totalUpperShift += shift.upper;
                totalLowerShift += shift.lower;
                eqMultiplier *= shift.multiplier;
              }
              if (hasPaddles && !hasPullBuoy) {
                const shift = SWIMMING_EQUIPMENT_LOAD_SHIFT.paddles;
                totalUpperShift += shift.upper;
                totalLowerShift += shift.lower;
                eqMultiplier *= shift.multiplier;
              }
            }

            // Apply shifts to specific muscles
            const isUpper = ['upper_chest', 'lats', 'front_shoulders', 'rear_shoulders', 'biceps', 'triceps', 'forearms', 'neck'].includes(m);
            const isLower = ['quadriceps', 'hamstrings', 'glutes', 'calves', 'knees', 'ankles', 'feet', 'achilles'].includes(m);

            if (isUpper) {
              weight *= (1 + totalUpperShift);
            } else if (isLower) {
              weight *= (1 + totalLowerShift);
            }
          }

          finalIncrease = baseIncrease * weight * 3.5 * strokeData.multiplier * envMultiplier * eqMultiplier;
        }
      } else if (log.activityType === 'table_tennis') {
        // Áp dụng dữ liệu từ NotebookLM Deep Research
        finalIncrease = baseIncrease * TABLE_TENNIS_MUSCLE_DAMAGE;
        if (log.tableTennisFormat === 'doubles') {
          finalIncrease *= TABLE_TENNIS_DOUBLES_MULTIPLIER;
        }
        if (log.tableTennisStyle) {
          const styleMatrix = TABLE_TENNIS_STYLE_MULTIPLIERS[log.tableTennisStyle as keyof typeof TABLE_TENNIS_STYLE_MULTIPLIERS];
          const weight = styleMatrix ? (styleMatrix[m] || 1.0) : 1.0;
          finalIncrease *= weight;
        }
        finalIncrease *= 3.5; // Scale chung cho cardio
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
// #8 FIX: Hiệu chỉnh hằng số dựa trên nghiên cứu DOMS thực tế
// - Cơ nhỏ (forearms, calves): DOMS đỉnh 24-36h, hết sau 48-72h → half-life ~16h
// - Cơ trung bình (chest, shoulders): DOMS đỉnh 24-48h, hết sau 72-96h → half-life ~28h
// - Cơ lớn (quads, glutes, lats): DOMS đỉnh 48-72h, hết sau 96-120h → half-life ~40h
function getMuscleHalfLife(muscle: MuscleGroup, profile: UserProfile, lastLog?: ActivityLog): number {
  const size = MUSCLE_SIZE_GROUPS[muscle];
  // #8 FIX: Tăng base half-life để phản ánh đúng thời gian DOMS thực tế
  let baseHalfLife = size === 'small' ? 16 : size === 'medium' ? 28 : 40;

  // 1. Adjusted by Resting Heart Rate (RHR)
  // #8 FIX: RHR chuẩn hạ xuống 60 bpm (vận động viên thường có RHR 50-65)
  // Mỗi 10 bpm cao hơn chuẩn → phục hồi chậm hơn 5%
  const rhrFactor = 1 + (profile.rhr - 60) * 0.005;
  baseHalfLife *= Math.max(0.85, Math.min(1.30, rhrFactor)); // Giới hạn ±30%

  // 2. Adjusted by Injury History
  const pastInjury = profile.injuryHistory.find(i => i.muscle === muscle);
  if (pastInjury) {
    let penalty = 1.10;
    if (pastInjury.timeframe === 'recent') penalty = pastInjury.severity === 'severe' ? 1.5 : 1.3;
    else if (pastInjury.timeframe === 'subacute') penalty = pastInjury.severity === 'severe' ? 1.3 : 1.2;
    
    // NotebookLM Table Tennis Data: Hình phạt chậm phục hồi chấn thương đặc thù
    if (lastLog?.activityType === 'table_tennis' && TABLE_TENNIS_INJURY_HALF_LIFE[muscle]) {
      penalty *= TABLE_TENNIS_INJURY_HALF_LIFE[muscle]!;
    }
    
    baseHalfLife *= penalty;
  }

  // 3. Adjusted by Sleep Quality
  if (lastLog) {
    // #8 FIX: Tăng hiệu ứng ngủ tốt lên 20% (nghiên cứu Walker 2017: ngủ sâu tăng GH 20-25%)
    if (lastLog.sleep === 'good') baseHalfLife *= 0.80;
    else if (lastLog.sleep === 'poor') baseHalfLife *= 1.30; // Ngủ kém: chậm hơn 30%

    // 4. Adjusted by Nutrition
    // #8 FIX: Protein surplus rút ngắn DOMS rõ rệt (Tipton & Wolfe 2001)
    if (lastLog.nutrition === 'deficit') baseHalfLife *= 1.25; // Thiếu protein: chậm hơn 25%
    else if (lastLog.nutrition === 'surplus') baseHalfLife *= 0.80; // Dư protein: nhanh hơn 20%
    
    // 4.5 Adjusted by Training Style
    if (lastLog.trainingStyle) {
      if (lastLog.trainingStyle === 'strength') baseHalfLife *= 0.80; // Neural fatigue, phục hồi nhanh
      else if (lastLog.trainingStyle === 'endurance') baseHalfLife *= 0.85; // Metabolic stress, phục hồi khá nhanh
      else if (lastLog.trainingStyle === 'power' || lastLog.trainingStyle === 'general') baseHalfLife *= 0.90; // Mixed
    }
  }

  // 5. Adjusted by Age
  // #8 FIX: Bắt đầu từ 25 tuổi (không phải 30) vì MPS bắt đầu giảm từ giữa 20s
  // Tăng hệ số lên 2%/năm (nghiên cứu Bhasin et al. 2001)
  if (profile.age > 25) {
    const agePenalty = 1 + ((profile.age - 25) * 0.02);
    baseHalfLife *= Math.min(agePenalty, 2.0); // Tối đa 2x so với người trẻ
  }

  // #8 FIX: Tăng minimum lên 10h (không có cơ nào phục hồi hoàn toàn trong 8h)
  return Math.max(10, baseHalfLife);
}

// Phase 2, Task 2: Calculate Cortisol accumulation & decay
// #9 FIX: Sử dụng profile để cá nhân hóa cortisol decay theo tuổi, RHR và primarySport
export function getCortisolColor(zone: string): string {
  if (zone === 'catabolic') return '#f43f5e'; // Rose
  if (zone === 'normal') return '#3b82f6'; // Blue
  return '#10b981'; // Emerald
}

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
      let baseHalfLife = lastSleep === 'good' ? 4 : lastSleep === 'poor' ? 12 : 6;
      if (log.activityType === 'football') {
        baseHalfLife = FOOTBALL_CNS_HALF_LIFE;
      }
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
    
    // NotebookLM: Mỏi thần kinh từ Bài tập Gym (Isometric vs Dynamic Compound)
    if (log.activityType === 'gym' && log.detailedExercises) {
      let hasIsometric = false;
      let hasDynamicCompound = false;
      log.detailedExercises.forEach(ex => {
        if (ex.measureType === 'time') {
          hasIsometric = true;
        } else if (/squat|press|row|deadlift|lunge|pull-up|chin-up|push-up|dip/i.test(ex.name)) {
          hasDynamicCompound = true;
        }
      });
      if (hasDynamicCompound) {
        spike *= 1.5; // Dynamic Compound gây mỏi thần kinh lớn nhất
      } else if (hasIsometric) {
        spike *= 1.1; // Isometric ít thay đổi độ dài cơ, ít tác động CNS hơn
      }
    }
    
    // Mỏi thần kinh từ Bóng bàn theo nghiên cứu NotebookLM
    if (log.activityType === 'table_tennis') {
      spike *= TABLE_TENNIS_CNS_FATIGUE; 
    }

    // Mỏi thần kinh từ Bóng đá theo nghiên cứu NotebookLM
    if (log.activityType === 'football') {
      if (log.footballPitchSize) {
        spike *= FOOTBALL_SSG_MULTIPLIER[log.footballPitchSize]?.cns || 1.0;
      }
      if (log.footballHeadingFrequency) {
        spike *= FOOTBALL_HEADING_MULTIPLIER[log.footballHeadingFrequency]?.cns || 1.0;
      } else if (log.footballIncludesHeading) {
        spike *= FOOTBALL_HEADING_MULTIPLIER.medium.cns;
      }
      const matchType = log.footballMatchType || (log.footballIsMatch ? 'tournament' : 'training');
      if (FOOTBALL_MATCH_MULTIPLIER[matchType]) {
        spike *= FOOTBALL_MATCH_MULTIPLIER[matchType].cns;
      }
    }

    // Mỏi thần kinh từ Thời tiết (Heat Index & Cold)
    if (log.weather && ['football', 'running', 'basketball', 'cycling', 'swimming'].includes(log.activityType)) {
      const temp = log.weather.apparentTemp ?? log.weather.temp;
      if (temp >= WEATHER_HEAT_INDEX_MULTIPLIER.extreme_danger.min) {
        spike *= WEATHER_HEAT_INDEX_MULTIPLIER.extreme_danger.cns;
      } else if (temp >= WEATHER_HEAT_INDEX_MULTIPLIER.danger.min) {
        spike *= WEATHER_HEAT_INDEX_MULTIPLIER.danger.cns;
      } else if (temp >= WEATHER_HEAT_INDEX_MULTIPLIER.caution.min) {
        spike *= WEATHER_HEAT_INDEX_MULTIPLIER.caution.cns;
      } else if (temp <= WEATHER_COLD_MULTIPLIER.cold.max) {
        spike *= WEATHER_COLD_MULTIPLIER.cold.cns;
      }
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
    let baseHalfLife = lastSleep === 'good' ? 4 : lastSleep === 'poor' ? 12 : 6;
    if (lastLog?.activityType === 'football') {
      baseHalfLife = FOOTBALL_CNS_HALF_LIFE;
    }
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

// #11 FIX: Sử dụng profile để cá nhân hóa lời khuyên theo primarySport và injuryHistory
export function generateCoachAdvice(
  profile: UserProfile,
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

  // Áp dụng Synergy Matrix
  const finalSafeMuscles: MuscleGroup[] = [];
  safeMuscles.forEach(m => {
    const dependencies = MUSCLE_SYNERGY[m] || [];
    const hasFatiguedDependency = dependencies.some(dep => avoidMusclesSet.has(dep));
    if (hasFatiguedDependency) {
      avoidMusclesSet.add(m);
    } else {
      finalSafeMuscles.push(m);
    }
  });

  safeMuscles = finalSafeMuscles;
  const avoidMuscles = Array.from(avoidMusclesSet);

  // #11 FIX: Tạo suffix lời khuyên riêng theo primarySport
  const sportTip: Record<string, string> = {
    strength:    'Tập trung vào các bài compound nặng (Squat, Deadlift, Bench).',
    endurance:   'Giữ nhịp tim Zone 2, tránh sprint khi cơ chưa phục hồi.',
    team_sports: 'Tập kỹ thuật và phản xạ, hạn chế va chạm mạnh.',
    general:     'Giữ cân bằng giữa các nhóm cơ.',
  };
  const tip = sportTip[profile.primarySport] ?? '';

  // #11 FIX: Cảnh báo nếu có chấn thương gần đây trong danh sách an toàn
  const recentInjuryWarning = profile.injuryHistory
    .filter(i => i.timeframe === 'recent' && safeMuscles.includes(i.muscle))
    .map(i => MUSCLE_LABELS[i.muscle])
    .join(', ');
  const injuryNote = recentInjuryWarning
    ? ` ⚠️ Chấn thương gần đây: ${recentInjuryWarning} — giảm tải 30-40%.`
    : '';

  // Scenario 1: Catabolic Zone
  if (cortisol.zone === 'catabolic') {
    return {
      status: 'catabolic',
      title: 'CẢNH BÁO: NGHỈ NGƠI HOÀN TOÀN',
      advice: `Cortisol đạt ngưỡng nguy hiểm (${cortisol.currentLevel}%). CNS quá tải. KHÔNG tập nặng hôm nay. Ưu tiên ngủ và phục hồi.`,
      safeMuscles: [],
      avoidMuscles: MUSCLE_LIST,
    };
  }

  // Scenario 2: Normal Zone
  if (cortisol.zone === 'normal') {
    if (avoidMuscles.length > 5) {
      return {
        status: 'normal',
        title: 'Hồi Phục Chủ Động',
        advice: `Cơ bắp đang mỏi rã rời dù hệ thần kinh ổn định. Tập trung giãn cơ, bơi lội hoặc đi bộ nhẹ nhàng hôm nay. ${tip}`,
        safeMuscles: [],
        avoidMuscles: MUSCLE_LIST,
      };
    }
    const safeLabels = safeMuscles.map(m => MUSCLE_LABELS[m]);
    const avoidLabels = avoidMuscles.map(m => MUSCLE_LABELS[m]);
    return {
      status: 'normal',
      title: 'Tập Có Chọn Lọc',
      advice: `Sẵn sàng tập: ${safeLabels.join(', ')}. Tuyệt đối tránh: ${avoidLabels.join(', ')}.${injuryNote} ${tip}`,
      safeMuscles,
      avoidMuscles,
    };
  }

  // Scenario 3: Anabolic Zone
  const safeLabels = safeMuscles.map(m => MUSCLE_LABELS[m]);
  const avoidLabels = avoidMuscles.map(m => MUSCLE_LABELS[m]);

  if (safeMuscles.length >= 8) {
    return {
      status: 'anabolic',
      title: 'SẴN SÀNG BÙNG NỔ',
      advice: `Thể trạng HOÀN HẢO! Hệ thần kinh hồi phục 100%. Hãy bung sức hôm nay.${injuryNote} ${tip}`,
      safeMuscles,
      avoidMuscles,
    };
  }

  return {
    status: 'anabolic',
    title: 'Tập Cường Độ Cao',
    advice: `Hệ thần kinh đang hồi phục cực tốt. Có thể tập nặng: ${safeLabels.join(', ')}. Tránh: ${avoidLabels.join(', ')}.${injuryNote} ${tip}`,
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
