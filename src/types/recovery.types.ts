export type PrimarySport = 'strength' | 'endurance' | 'team_sports' | 'general';

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

export interface OneRepMaxes {
  benchPress: number;
  squat: number;
  deadlift: number;
  overheadPress: number;
}

export interface ProfileUpdateRecord {
  id: string;
  timestamp: number;
  changedFields: Partial<UserProfile>; // Chứa dữ liệu thay đổi
}

export interface InjuryRecord {
  id: string;
  muscle: MuscleGroup;
  side?: 'left' | 'right' | 'bilateral';
  timeframe: 'recent' | 'subacute' | 'chronic';
  severity: 'mild' | 'moderate' | 'severe';
}

export interface UserProfile {
  name: string;
  age: number;
  gender: 'male';
  height: number;
  weight: number;
  rhr: number; // Resting Heart Rate in bpm
  weeklyFrequency: number; // workouts per week
  primarySport: PrimarySport;
  oneRepMaxes: OneRepMaxes;
  injuryHistory: InjuryRecord[]; // Danh sách hồ sơ chấn thương chi tiết
  updateHistory?: ProfileUpdateRecord[]; // Lịch sử cập nhật hồ sơ
  updateCycleDays: number; // Chu kỳ cam kết cập nhật hồ sơ (VD: 14, 30, 60 ngày)
  lastProfileUpdateDate: number; // Thời điểm cập nhật cuối cùng
}

export type MuscleGroup =
  | 'neck' // Cổ
  | 'upper_chest' // Ngực trên
  | 'lower_chest' // Ngực dưới
  | 'traps' // Cầu vai
  | 'lats' // Xô
  | 'lower_back' // Thắt lưng
  | 'front_shoulders' // Vai trước
  | 'rear_shoulders' // Vai sau
  | 'biceps' // Tay trước
  | 'triceps' // Tay sau
  | 'forearms' // Cẳng tay
  | 'upper_abs' // Bụng trên
  | 'lower_abs' // Bụng dưới
  | 'obliques' // Cơ liên sườn
  | 'quadriceps' // Đùi trước
  | 'hamstrings' // Đùi sau
  | 'glutes' // Mông
  | 'calves' // Bắp chân
  | 'wrists' // Cổ tay
  | 'elbows' // Khuỷu tay
  | 'knees' // Đầu gối
  | 'ankles' // Cổ chân
  | 'feet' // Gan bàn chân
  | 'shoulder_joints' // Khớp vai
  | 'acl' // Dây chằng chéo trước
  | 'achilles'; // Gân gót chân

export type ActivityType =
  | 'gym'
  | 'football'
  | 'running'
  | 'swimming'
  | 'basketball'
  | 'cycling'
  | 'table_tennis'
  | 'other';

export type FootballPitchSize = '5v5' | '7v7' | '11v11';
export type FootballPosition = 'striker' | 'midfielder' | 'defender' | 'goalkeeper';

export type RunningType = 'base' | 'tempo' | 'interval' | 'recovery' | 'long';
export type RunningTerrain = 'road' | 'trail' | 'treadmill' | 'track';
export type RunningFootwear = 'normal' | 'cushioned';

export interface PositionPercentage {
  position: FootballPosition;
  percentage: number; // 0-100
}

export type SwimmingStroke = 'freestyle' | 'breaststroke' | 'butterfly' | 'backstroke';
export type SwimmingEnvironment = 'pool' | 'open_water';

export type TableTennisFormat = 'singles' | 'doubles';
export type TableTennisStyle = 'offensive' | 'defensive' | 'all_round';

export type SleepQuality = 'good' | 'fair' | 'poor';

export type MentalStress = 'low' | 'high';

export type NutritionQuality = 'surplus' | 'good' | 'deficit';

export type TrainingStyle = 'strength' | 'hypertrophy' | 'endurance' | 'power' | 'general' | 'deload';

export interface WeatherData {
  temp: number;
  humidity: number;
  apparentTemp?: number; // Heat Index / Cảm nhận nhiệt
  condition: string; // e.g., "Clear", "Rain", "Cloudy"
  source: 'auto' | 'manual';
}

export interface ActivityLog {
  id: string;
  timestamp: number; // Workout date/time
  status?: 'planned' | 'completed'; // For pre-workout planning
  activityType: ActivityType;
  duration: number; // in minutes
  intensity: number; // RPE 1-10
  targetMuscles: MuscleGroup[];
  muscleMapping?: Partial<Record<MuscleGroup, number>>; // Ánh xạ hệ số chi tiết (VD: { chest: 1.0, triceps: 0.6 })
  nutrition: NutritionQuality;
  sleep: SleepQuality;
  stress: MentalStress;
  hasInjury: boolean;
  injuredMuscles: MuscleGroup[]; // Mới dính thêm chấn thương sau buổi tập này
  painScale?: number; // 1-10 scale
  notes?: string;
  gymEquipment?: string[];
  gymExercises?: string[];
  trainingStyle?: TrainingStyle; // Mục tiêu buổi tập Gym (Strength, Hypertrophy, v.v.)
  detailedExercises?: ExerciseSession[]; // Danh sách bài tập đã tập kèm sets/reps
  dumbbellCount?: number;
  dumbbellWeight?: number;
  footballPitchSize?: FootballPitchSize;
  footballPositions?: PositionPercentage[];
  footballSurface?: 'grass' | 'artificial';
  footballIsMatch?: boolean;
  footballMatchType?: 'training' | 'friendly' | 'tournament';
  footballHeadingFrequency?: 'low' | 'medium' | 'high';
  footballIncludesHeading?: boolean;
  swimmingStroke?: SwimmingStroke;
  swimmingEnvironment?: SwimmingEnvironment;
  distance?: number; // meters for swimming, kilometers for running/cycling
  runningType?: RunningType;
  runningTerrain?: RunningTerrain;
  runningFootwear?: RunningFootwear;
  elevationGain?: number; // meters
  tableTennisFormat?: TableTennisFormat;
  tableTennisStyle?: TableTennisStyle;
  weather?: WeatherData; // Dữ liệu thời tiết cho outdoor sports
}

export type CortisolZone = 'anabolic' | 'normal' | 'catabolic';

export interface CortisolState {
  currentLevel: number; // Percentage: 20% to 100%
  zone: CortisolZone;
  description: string;
}

export type MuscleStatus = 'recovered' | 'mild' | 'moderate' | 'heavy' | 'injured';

export interface MuscleState {
  muscle: MuscleGroup;
  fatigue: number; // Percentage: 0% to 100%
  lastTrained: number | null; // timestamp of last training
  recoveryTimeRemaining: number; // in hours
  status: MuscleStatus;
}

export interface GymExercise {
  id: string;
  name: string;
  equipment: string[];
  movement_type: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  muscle_mapping: Partial<Record<MuscleGroup, number>>;
  joint_mapping?: Partial<Record<string, number>>;
  _joint_notes?: string;
  image_url?: string;
  isBodyweight?: boolean;
  bwFraction?: number; // VD: 0.65 cho Push-up, 0.7 cho Pull-up
  measureType?: 'reps' | 'time'; // 'time' cho tập tĩnh (Plank, Wall Sit...)
}

export interface ExerciseSet {
  reps: number;
  duration?: number; // Thời gian giữ (giây) cho bài tập tĩnh (Isometric)
  weight: number; // kg (0 nếu là bodyweight)
  rir?: number; // Reps In Reserve (thay thế cho rpe cũ)
  toFailure?: boolean; // Cờ đánh dấu tập đến failure
  isAmrap?: boolean; // Cờ báo hiệu tập AMRAP
  formRating?: number; // Đánh giá form của riêng hiệp này (0-100)
}

export interface ExerciseSession {
  exerciseId: string;
  name: string;
  muscle_mapping: Partial<Record<MuscleGroup, number>>;
  isBodyweight?: boolean;
  bwFraction?: number;
  measureType?: 'reps' | 'time'; // Thêm measureType để AI Coach và Recovery dùng
  sets: ExerciseSet[];
  restTime?: number; // in seconds (e.g. 120-240)
  tempo?: string; // e.g. "4/2/1/1", "2/0/1/0"
  formRating?: number; // Đánh giá form chung của toàn bài (0-100)
}

export interface ExerciseGroup {
  id: string;
  name: string;
  exerciseIds: string[];
}
