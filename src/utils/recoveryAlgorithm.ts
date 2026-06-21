export type ExerciseType = 'isolation' | 'compound' | 'isometric_compound';
export type MuscleSize = 'small' | 'large';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type Gender = 'male' | 'female';
export type AgeGroup = 'under_30' | '30_39' | '40_49' | 'over_50';

import type { WeatherData } from '../types/recovery.types';

export interface RecoveryInput {
  exerciseType: ExerciseType;
  muscleSize: MuscleSize;
  setsToFailure: number;
  amrapSets?: number;
  experienceLevel: ExperienceLevel;
  ageGroup: AgeGroup;
  gender: Gender;
  poorSleep: boolean; // Dưới 7 tiếng
  poorNutrition: boolean; // Tập lúc đói hoặc thiếu hụt năng lượng
  weather?: WeatherData;
}

export interface RecoveryOutput {
  predictedRecoveryHours: number;
  isRedAlert: boolean;
  warnings: string[];
}

export const BASE_RECOVERY_HOURS = 48;
export const MAX_SAFE_RECOVERY_HOURS = 96;

// ==========================================
// FOOTBALL SCIENTIFIC CONSTANTS
// Derived from NotebookLM Deep Research (72 sources)
// ==========================================

export const FOOTBALL_CNS_HALF_LIFE = 35.39; // Precise exponential decay half-life

export const FOOTBALL_POSITION_MATRIX = {
  striker: { quadriceps: 0.15, hamstrings: 0.22, calves: 0.10, glutes: 0.18, lower_abs: 0.05, front_shoulders: 0.05, achilles: 0.08, knees: 0.07, ankles: 0.06, feet: 0.04 },
  midfielder: { quadriceps: 0.22, hamstrings: 0.15, calves: 0.12, glutes: 0.10, lower_abs: 0.08, front_shoulders: 0.03, knees: 0.10, ankles: 0.08, achilles: 0.07, feet: 0.05 },
  defender: { quadriceps: 0.18, hamstrings: 0.15, calves: 0.10, glutes: 0.14, lower_abs: 0.10, front_shoulders: 0.03, knees: 0.10, ankles: 0.08, achilles: 0.07, feet: 0.05 },
  goalkeeper: { quadriceps: 0.22, hamstrings: 0.12, calves: 0.10, glutes: 0.15, lower_abs: 0.06, front_shoulders: 0.05, achilles: 0.09, knees: 0.08, ankles: 0.07, feet: 0.06 }
};

export const FOOTBALL_SSG_MULTIPLIER = {
  '11v11': { muscle: 1.0, cns: 1.0 },
  '7v7': { muscle: 1.15, cns: 1.20 },
  '5v5': { muscle: 1.25, cns: 1.35 }
};

export const FOOTBALL_SURFACE_MULTIPLIER = {
  grass: 1.0,
  artificial: 1.20 // Baseline muscle DOMS multiplier (Joints are higher but muscle is ~1.2)
};

export const FOOTBALL_HEADING_MULTIPLIER = {
  low: { neckDoms: 1.0, cns: 1.0 },
  medium: { neckDoms: 1.15, cns: 1.15 },
  high: { neckDoms: 1.30, cns: 1.30 }
};

export const FOOTBALL_MATCH_MULTIPLIER: Record<string, { muscle: number, cns: number }> = {
  training: { muscle: 1.0, cns: 0.8 },
  friendly: { muscle: 1.5, cns: 1.0 },
  tournament: { muscle: 2.5, cns: 1.5 },
  match: { muscle: 2.5, cns: 1.5 } // Backward compatibility
};

// ==========================================
// WEATHER SCIENTIFIC CONSTANTS
// Derived from Sports Science (Apparent Temperature / Heat Index)
// ==========================================

export const WEATHER_HEAT_INDEX_MULTIPLIER = {
  extreme_danger: { min: 38, muscle: 1.30, cns: 1.50 }, // > 38°C (Extreme Danger)
  danger: { min: 32, muscle: 1.15, cns: 1.30 },         // 32-38°C (Danger)
  caution: { min: 27, muscle: 1.05, cns: 1.10 }         // 27-32°C (Caution)
};

export const WEATHER_COLD_MULTIPLIER = {
  cold: { max: 10, muscle: 1.20, cns: 1.0 } // < 10°C (Cold, stiff muscles)
};

export function calculateRecoveryTime(input: RecoveryInput): RecoveryOutput {
  let multiplier = 1.0;
  const warnings: string[] = [];

  // 1. Phân loại Bài tập & Nhóm cơ (CNS Fatigue)
  let exerciseMultiplier = 1.0;
  if (input.exerciseType === 'compound') exerciseMultiplier = 1.5;
  else if (input.exerciseType === 'isometric_compound') exerciseMultiplier = 1.1; // NotebookLM: Isometric causes less CNS fatigue

  const muscleMultiplier = input.muscleSize === 'large' ? 1.2 : 1.0;
  multiplier *= exerciseMultiplier * muscleMultiplier;

  // 2. Tích lũy Sập tạ (Cumulative Failure)
  let failureMultiplier = 1.0;
  if (input.setsToFailure === 1) {
    failureMultiplier = 1.2;
  } else if (input.setsToFailure === 2) {
    failureMultiplier = 1.5;
  } else if (input.setsToFailure >= 3) {
    failureMultiplier = 2.5; // Tăng đột biến Cortisol
    warnings.push("Phát hiện Sập tạ (Failure) quá 2 hiệp với tạ nặng. Hệ thần kinh trung ương (CNS) đang chịu tải cực nặng.");
  }

  // 2.5. Xử lý AMRAP (Failure với tạ nhẹ)
  if (input.amrapSets && input.amrapSets > 0) {
    // AMRAP gây metabolic stress thay vì neural stress
    let amrapMultiplier = 1.0;
    if (input.amrapSets <= 2) amrapMultiplier = 1.1;
    else if (input.amrapSets <= 4) amrapMultiplier = 1.2;
    else amrapMultiplier = 1.35; // Nhiều hơn 4 sets AMRAP vẫn gây mệt

    // Nếu chưa bị phạt nặng bởi tạ nặng, ta áp dụng phạt AMRAP
    if (failureMultiplier < 1.5) {
      failureMultiplier = Math.max(failureMultiplier, amrapMultiplier);
    }

    if (input.amrapSets >= 3 && input.setsToFailure === 0) {
      warnings.push("Tập AMRAP cường độ cao. Tốt cho sức bền và trao đổi chất (Metabolic Stress), ít gây áp lực lên hệ thần kinh trung ương (CNS) hơn tạ nặng.");
    }
  }

  multiplier *= failureMultiplier;

  // 3. Hệ số Cá nhân hoá (Personal Modifiers)
  let experienceMultiplier = 1.0;
  if (input.experienceLevel === 'beginner') experienceMultiplier = 1.2;
  if (input.experienceLevel === 'advanced') experienceMultiplier = 0.8;

  let ageMultiplier = 1.0;
  if (input.ageGroup === '30_39') ageMultiplier = 1.1;
  else if (input.ageGroup === '40_49') ageMultiplier = 1.2;
  else if (input.ageGroup === 'over_50') ageMultiplier = 1.3;

  let genderMultiplier = input.gender === 'female' ? 1.2 : 1.0;

  multiplier *= experienceMultiplier * ageMultiplier * genderMultiplier;

  // 4. Tác động chéo (Sleep & Nutrition)
  let sleepMultiplier = input.poorSleep ? 1.5 : 1.0;
  let nutritionMultiplier = input.poorNutrition ? 1.5 : 1.0;

  if (input.poorSleep && input.poorNutrition) {
    warnings.push("Trạng thái dị hóa: Mất ngủ kết hợp Dinh dưỡng kém làm khuyếch đại tổn thương cơ học.");
  } else if (input.poorSleep) {
    warnings.push("Giấc ngủ kém (< 7h) làm chậm tốc độ tổng hợp Protein và phục hồi sụn khớp.");
  } else if (input.poorNutrition) {
    warnings.push("Tập luyện khi cạn kiệt năng lượng làm tăng nồng độ Cortisol dị hoá cơ bắp.");
  }

  multiplier *= sleepMultiplier * nutritionMultiplier;

  // 5. Tính toán Kết quả
  const predictedRecoveryHours = Math.round(BASE_RECOVERY_HOURS * multiplier);
  const isRedAlert = predictedRecoveryHours > MAX_SAFE_RECOVERY_HOURS;

  if (isRedAlert) {
    warnings.push(`CẢNH BÁO ĐỎ: Thời gian phục hồi dự kiến là ${predictedRecoveryHours} giờ. Đã vượt qua ngưỡng an toàn sinh lý (96 giờ). Vui lòng kích hoạt quy trình Deload hoặc nghỉ ngơi hoàn toàn.`);
  }

  return {
    predictedRecoveryHours,
    isRedAlert,
    warnings
  };
}
