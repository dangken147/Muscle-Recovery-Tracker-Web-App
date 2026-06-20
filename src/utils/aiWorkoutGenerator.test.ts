import { describe, it, expect } from 'vitest';
import { 
  analyzeMuscleRecovery, 
  generateSmartWorkout, 
  generateDetailedWorkout 
} from './aiWorkoutGenerator';
import type { GymExercise, MuscleGroup, UserProfile, ActivityLog, TrainingStyle } from '../types/recovery.types';

// Mock exercises for isolated and predictable test environments
const mockExercises: GymExercise[] = [
  {
    id: "ex_bench_press",
    name: "Barbell Bench Press",
    equipment: ["barbell", "bench"],
    movement_type: "push",
    isBodyweight: false,
    muscle_mapping: { lower_chest: 10, upper_chest: 6, front_shoulders: 4, triceps: 4 },
    joint_mapping: { shoulder_joints: 0.6, elbows: 0.4 }
  },
  {
    id: "ex_squat",
    name: "Barbell Squat",
    equipment: ["barbell"],
    movement_type: "squat",
    isBodyweight: false,
    muscle_mapping: { quadriceps: 10, glutes: 7, hamstrings: 5, lower_back: 3 },
    joint_mapping: { knees: 0.5, lower_back: 0.3 }
  },
  {
    id: "ex_lat_pulldown",
    name: "Lat Pulldown",
    equipment: ["cables"],
    movement_type: "pull",
    isBodyweight: false,
    muscle_mapping: { lats: 10, biceps: 5, traps: 3 },
    joint_mapping: { shoulder_joints: 0.3 }
  },
  {
    id: "ex_plank",
    name: "Plank",
    equipment: ["bodyweight"],
    movement_type: "core",
    isBodyweight: true,
    bwFraction: 0.5,
    muscle_mapping: { upper_abs: 10, lower_back: 6 },
    joint_mapping: { shoulder_joints: 0.4 }
  },
  {
    id: "ex_romanian_deadlift",
    name: "Dumbbell Romanian Deadlift",
    equipment: ["dumbbells"],
    movement_type: "hinge",
    isBodyweight: false,
    muscle_mapping: { hamstrings: 10, glutes: 9, lower_back: 7 },
    joint_mapping: { lower_back: 0.8 }
  }
];

// Extended mock exercises for Training Style tests — diverse pool
const styleTestExercises: GymExercise[] = [
  // Compound exercises
  {
    id: "st_bench_press",
    name: "Barbell Bench Press",
    equipment: ["barbell", "bench"],
    movement_type: "push",
    isBodyweight: false,
    muscle_mapping: { lower_chest: 10, upper_chest: 6, front_shoulders: 4, triceps: 4 },
    joint_mapping: { shoulder_joints: 0.6, elbows: 0.4 }
  },
  {
    id: "st_squat",
    name: "Barbell Squat",
    equipment: ["barbell"],
    movement_type: "squat",
    isBodyweight: false,
    muscle_mapping: { quadriceps: 10, glutes: 7, hamstrings: 5, lower_back: 3 },
    joint_mapping: { knees: 0.5, lower_back: 0.3 }
  },
  {
    id: "st_bent_row",
    name: "Barbell Bent-Over Row",
    equipment: ["barbell"],
    movement_type: "pull",
    isBodyweight: false,
    muscle_mapping: { lats: 10, traps: 7, biceps: 5, rear_shoulders: 4 },
    joint_mapping: { lower_back: 0.7, shoulder_joints: 0.4 }
  },
  {
    id: "st_deadlift",
    name: "Barbell Romanian Deadlift",
    equipment: ["barbell"],
    movement_type: "hinge",
    isBodyweight: false,
    muscle_mapping: { hamstrings: 10, glutes: 9, lower_back: 7 },
    joint_mapping: { lower_back: 0.8 }
  },
  // Isolation exercises
  {
    id: "st_bicep_curl",
    name: "Dumbbell Bicep Curl",
    equipment: ["dumbbells"],
    movement_type: "pull",
    isBodyweight: false,
    muscle_mapping: { biceps: 10, forearms: 6 },
    joint_mapping: { elbows: 0.6, wrists: 0.3 }
  },
  {
    id: "st_lateral_raise",
    name: "Dumbbell Lateral Raise",
    equipment: ["dumbbells"],
    movement_type: "push",
    isBodyweight: false,
    muscle_mapping: { front_shoulders: 10, traps: 4 },
    joint_mapping: { shoulder_joints: 0.5 }
  },
  {
    id: "st_tricep_ext",
    name: "Dumbbell Tricep Overhead Extension",
    equipment: ["dumbbells"],
    movement_type: "push",
    isBodyweight: false,
    muscle_mapping: { triceps: 10, forearms: 4 },
    joint_mapping: { elbows: 0.8, shoulder_joints: 0.5 }
  },
  // Bodyweight exercises
  {
    id: "st_pushup",
    name: "Push-up",
    equipment: ["bodyweight"],
    movement_type: "push",
    isBodyweight: true,
    bwFraction: 0.65,
    muscle_mapping: { lower_chest: 8, front_shoulders: 6, triceps: 5, upper_abs: 4 },
    joint_mapping: { shoulder_joints: 0.6, wrists: 0.6 }
  },
  {
    id: "st_plank",
    name: "Plank",
    equipment: ["bodyweight"],
    movement_type: "core",
    isBodyweight: true,
    bwFraction: 0.5,
    muscle_mapping: { upper_abs: 10, lower_back: 6 },
    joint_mapping: { shoulder_joints: 0.4 }
  },
  // Band exercises
  {
    id: "st_band_face_pull",
    name: "Resistance Band Face Pull",
    equipment: ["bands"],
    movement_type: "pull",
    isBodyweight: false,
    muscle_mapping: { rear_shoulders: 10, traps: 8, biceps: 4 },
    joint_mapping: { shoulder_joints: 0.4 }
  },
  // Explosive exercises
  {
    id: "st_push_press",
    name: "Dumbbell Push Press",
    equipment: ["dumbbells"],
    movement_type: "push",
    isBodyweight: false,
    muscle_mapping: { front_shoulders: 10, triceps: 6, upper_chest: 4, upper_abs: 4 },
    joint_mapping: { shoulder_joints: 0.7, lower_back: 0.4 }
  },
  {
    id: "st_burpee",
    name: "Burpee",
    equipment: ["bodyweight"],
    movement_type: "push",
    isBodyweight: true,
    bwFraction: 0.6,
    muscle_mapping: { lower_chest: 7, front_shoulders: 6, quadriceps: 8, glutes: 7, upper_abs: 8 },
    joint_mapping: { shoulder_joints: 0.5, knees: 0.6, ankles: 0.7 }
  }
];

// Helper to create all muscle states with a baseline value
const createMuscleStates = (value: number, overrides: Partial<Record<MuscleGroup, number>> = {}): Record<MuscleGroup, number> => {
  const allMuscles: MuscleGroup[] = [
    'neck', 'upper_chest', 'lower_chest', 'traps', 'lats', 'lower_back', 
    'front_shoulders', 'rear_shoulders', 'biceps', 'triceps', 'forearms', 
    'upper_abs', 'lower_abs', 'obliques', 'quadriceps', 'hamstrings', 
    'glutes', 'calves', 'wrists', 'elbows', 'knees', 'ankles', 'feet', 
    'shoulder_joints', 'acl', 'achilles'
  ];
  const states = {} as Record<MuscleGroup, number>;
  allMuscles.forEach(m => {
    states[m] = m in overrides ? overrides[m]! : value;
  });
  return states;
};

describe('AI Coach - aiWorkoutGenerator Unit Tests', () => {

  describe('analyzeMuscleRecovery', () => {
    it('should recommend Full Body when upper and lower fresh counts are balanced', () => {
      // UPPER_MUSCLES has 10 items, LOWER_MUSCLES has 5 items.
      // To get 'full', we need freshUpper <= freshLower + 1 AND freshLower <= freshUpper + 1.
      // Let's set 4 upper muscles to 100 (fresh) and all 5 lower muscles to 100 (fresh).
      // freshUpper = 4, freshLower = 5.
      // 4 <= 5 + 1 (true) and 5 <= 4 + 1 (true).
      const states = createMuscleStates(30, {
        // 4 upper muscles fresh
        upper_chest: 100,
        lower_chest: 100,
        lats: 100,
        traps: 100,
        // 5 lower muscles fresh
        quadriceps: 100,
        hamstrings: 100,
        glutes: 100,
        calves: 100,
        knees: 100
      });
      const result = analyzeMuscleRecovery(states);
      expect(result.targetRegion).toBe('full');
      expect(result.suggestionMessage).toContain('Toàn Thân');
    });

    it('should recommend Upper Body when upper muscles are recovered and lower muscles are fatigued', () => {
      const states = createMuscleStates(100, {
        quadriceps: 20,
        hamstrings: 20,
        glutes: 20,
        calves: 20,
        knees: 20
      });
      const result = analyzeMuscleRecovery(states);
      expect(result.targetRegion).toBe('upper');
      expect(result.suggestionMessage).toContain('Thân Trên');
    });

    it('should recommend Lower Body when lower muscles are recovered and upper muscles are fatigued', () => {
      // Fatigue all 10 upper muscles (value = 30) and keep all lower muscles fresh (value = 100)
      const states = createMuscleStates(100, {
        neck: 30,
        upper_chest: 30,
        lower_chest: 30,
        traps: 30,
        lats: 30,
        front_shoulders: 30,
        rear_shoulders: 30,
        biceps: 30,
        triceps: 30,
        forearms: 30
      });
      const result = analyzeMuscleRecovery(states);
      expect(result.targetRegion).toBe('lower');
      expect(result.suggestionMessage).toContain('Thân Dưới');
    });

    it('should recommend light Full Body recovery when many muscles are fatigued', () => {
      const states = createMuscleStates(40); // all muscles fatigued (<= 50)
      const result = analyzeMuscleRecovery(states);
      expect(result.suggestionMessage).toContain('nhẹ nhàng');
    });
  });

  describe('generateSmartWorkout', () => {
    it('should filter exercises based on available equipment', () => {
      const states = createMuscleStates(100);
      const equipment = ["barbell", "bench"];
      const result = generateSmartWorkout(mockExercises, equipment, states, null, 2);
      
      // Bench press needs barbell + bench, Squat needs barbell. Lat pulldown needs cables.
      // So only Bench Press and Squat should be picked.
      expect(result.workoutIds).toContain("ex_bench_press");
      expect(result.workoutIds).toContain("ex_squat");
      expect(result.workoutIds).not.toContain("ex_lat_pulldown");
    });

    it('should avoid exercises targeting fatigued muscles', () => {
      // Make chest and triceps fatigued (value <= 50)
      const states = createMuscleStates(100, {
        lower_chest: 30,
        triceps: 30
      });
      const equipment = ["barbell", "bench", "cables"];
      // Should pick Squat and Lat pulldown, avoid Bench Press because it targets chest/triceps (weight >= 5)
      const result = generateSmartWorkout(mockExercises, equipment, states, null, 2);
      expect(result.workoutIds).not.toContain("ex_bench_press");
      expect(result.workoutIds).toContain("ex_squat");
      expect(result.workoutIds).toContain("ex_lat_pulldown");
    });

    it('should avoid exercises targeting injured joints from user profile', () => {
      const states = createMuscleStates(100);
      const profile: UserProfile = {
        name: "Test User",
        age: 25,
        gender: "male",
        height: 175,
        weight: 70,
        rhr: 60,
        weeklyFrequency: 3,
        primarySport: "strength",
        oneRepMaxes: { benchPress: 100, squat: 120, deadlift: 150, overheadPress: 60 },
        updateCycleDays: 30,
        lastProfileUpdateDate: Date.now(),
        injuryHistory: [
          { id: "inj_1", muscle: "knees", timeframe: "recent", severity: "moderate" }
        ]
      };
      const equipment = ["barbell", "bench", "cables"];
      // Squat targets knees (joint mapping load >= 0.4). It should be avoided.
      const result = generateSmartWorkout(mockExercises, equipment, states, profile, 2);
      expect(result.workoutIds).not.contain("ex_squat");
      expect(result.workoutIds).toContain("ex_bench_press");
      expect(result.workoutIds).toContain("ex_lat_pulldown");
      expect(result.message).toContain("loại bỏ các bài tập gây áp lực lên khớp");
    });
  });

  describe('generateDetailedWorkout', () => {
    const defaultProfile: UserProfile = {
      name: "Test User",
      age: 25,
      gender: "male",
      height: 175,
      weight: 70,
      rhr: 60,
      weeklyFrequency: 3,
      primarySport: "strength",
      oneRepMaxes: { benchPress: 100, squat: 120, deadlift: 150, overheadPress: 60 },
      updateCycleDays: 30,
      lastProfileUpdateDate: Date.now(),
      injuryHistory: []
    };

    it('should apply Reactive Deload by skipping exercises with heavily fatigued muscles', () => {
      // lower_chest fatigue <= 30 (which triggers reactive deload for Chest exercises)
      const statesChestFatigued = createMuscleStates(100, {
        lower_chest: 20
      });
      const equipment = ["barbell", "bench", "cables"];
      
      const result = generateDetailedWorkout(mockExercises, equipment, statesChestFatigued, defaultProfile, [], 2);
      
      // ex_bench_press has lower_chest mapping of 10. Since it's <= 30, it should be skipped under Reactive Deload.
      const exerciseIds = result.detailedExercises.map(e => e.exerciseId);
      expect(exerciseIds).not.toContain("ex_bench_press");
    });

    it('should calculate Progressive Overload based on RPE deviation from target (RIR=2, RPE=8)', () => {
      const states = createMuscleStates(100);
      const equipment = ["barbell", "bench"];
      
      // Scenario: Last session RIR was 0 (RPE 10). Target is RIR 2 (RPE 8).
      // Deviation = 10 - 8 = 2 (too heavy). 
      // Reduction should be -(2/0.5) * 2% = -8% weight. 100kg should become 92kg.
      
      const historyLogsTooHeavy: ActivityLog[] = [
        {
          id: "log_1",
          timestamp: Date.now() - 86400000,
          activityType: "gym",
          duration: 60,
          intensity: 10,
          targetMuscles: ["lower_chest"],
          nutrition: "good",
          sleep: "good",
          stress: "low",
          hasInjury: false,
          injuredMuscles: [],
          detailedExercises: [
            {
              exerciseId: "ex_bench_press",
              name: "Barbell Bench Press",
              muscle_mapping: {},
              sets: [
                { reps: 10, weight: 100, rir: 0 } // RIR = 0 (RPE 10)
              ]
            }
          ]
        }
      ];

      const result = generateDetailedWorkout(mockExercises, equipment, states, defaultProfile, historyLogsTooHeavy, 1, undefined, undefined, 'hypertrophy');
      const workingSet = result.detailedExercises[0].sets[1]; // First set is warmup (80% of target), second set is working set
      expect(workingSet.weight).toBe(92);
    });

    it('should customize sets and reps based on the trainingStyle', () => {
      const states = createMuscleStates(100);
      const equipment = ["barbell"];
      
      // We pass dumbbellWeight = 20 to ensure targetWeight > 0, which triggers warm-up set generation.
      // Strength: 5 reps, 4 working sets + 1 warmup = 5 sets total
      const strengthResult = generateDetailedWorkout(mockExercises, equipment, states, defaultProfile, [], 1, 20, undefined, 'strength');
      expect(strengthResult.detailedExercises[0].sets.length).toBe(5);
      expect(strengthResult.detailedExercises[0].sets[1].reps).toBe(5);
      expect(strengthResult.detailedExercises[0].tempo).toBe('2/0/1/0');

      // Endurance: 15 reps, 3 working sets + 1 warmup = 4 sets total
      const enduranceResult = generateDetailedWorkout(mockExercises, equipment, states, defaultProfile, [], 1, 20, undefined, 'endurance');
      expect(enduranceResult.detailedExercises[0].sets.length).toBe(4);
      expect(enduranceResult.detailedExercises[0].sets[1].reps).toBe(15);
      expect(enduranceResult.detailedExercises[0].tempo).toBe('4/2/1/1');
    });
  });

  describe('Training Style-based Exercise Selection (Phương án B)', () => {
    // All equipment available
    const allEquipment = ["barbell", "bench", "cables", "dumbbells", "bodyweight", "bands"];

    it('should prioritize compound exercises for Strength style', () => {
      const states = createMuscleStates(100);
      const result = generateSmartWorkout(styleTestExercises, allEquipment, states, null, 5, undefined, undefined, 'strength');
      
      // Compound exercises (Bench Press, Squat, Row, Deadlift) should appear before isolation
      const compoundIds = ['st_bench_press', 'st_squat', 'st_bent_row', 'st_deadlift'];
      const selectedCompounds = result.workoutIds.filter(id => compoundIds.includes(id));
      
      // Strength should have at least 2 compound exercises out of 5
      expect(selectedCompounds.length).toBeGreaterThanOrEqual(2);
    });

    it('should include isolation exercises for Hypertrophy style', () => {
      const states = createMuscleStates(100);
      const result = generateSmartWorkout(styleTestExercises, allEquipment, states, null, 5, undefined, undefined, 'hypertrophy');
      
      const isolationIds = ['st_bicep_curl', 'st_lateral_raise', 'st_tricep_ext'];
      const selectedIsolation = result.workoutIds.filter(id => isolationIds.includes(id));
      
      // Hypertrophy should include at least 1 isolation exercise
      expect(selectedIsolation.length).toBeGreaterThanOrEqual(1);
    });

    it('should prioritize bodyweight/band exercises for Endurance style', () => {
      const states = createMuscleStates(100);
      const result = generateSmartWorkout(styleTestExercises, allEquipment, states, null, 5, undefined, undefined, 'endurance');
      
      const lightExIds = ['st_pushup', 'st_plank', 'st_band_face_pull', 'st_burpee'];
      const selectedLight = result.workoutIds.filter(id => lightExIds.includes(id));
      
      // Endurance should favor bodyweight/band — at least 2 light exercises
      expect(selectedLight.length).toBeGreaterThanOrEqual(2);
    });

    it('should select explosive movements for Power style', () => {
      const states = createMuscleStates(100);
      const result = generateSmartWorkout(styleTestExercises, allEquipment, states, null, 5, undefined, undefined, 'power');
      
      // Power should include Push Press (explosive) and prefer compound/hinge
      const explosiveAndCompound = ['st_push_press', 'st_bench_press', 'st_squat', 'st_deadlift', 'st_burpee'];
      const selectedExplosive = result.workoutIds.filter(id => explosiveAndCompound.includes(id));
      
      expect(selectedExplosive.length).toBeGreaterThanOrEqual(2);
      // Isolation exercises should be deprioritized
      const isolationIds = ['st_bicep_curl', 'st_lateral_raise', 'st_tricep_ext'];
      const selectedIsolation = result.workoutIds.filter(id => isolationIds.includes(id));
      expect(selectedIsolation.length).toBeLessThanOrEqual(1);
    });

    it('should change exercise selection when training style changes', () => {
      const states = createMuscleStates(100);
      
      const strengthResult = generateSmartWorkout(styleTestExercises, allEquipment, states, null, 5, undefined, undefined, 'strength');
      const enduranceResult = generateSmartWorkout(styleTestExercises, allEquipment, states, null, 5, undefined, undefined, 'endurance');
      
      // The two results should NOT be identical — core test for Phương án B
      const strengthSet = new Set(strengthResult.workoutIds);
      const enduranceSet = new Set(enduranceResult.workoutIds);
      
      // At least 1 exercise should differ between strength and endurance
      let differences = 0;
      strengthSet.forEach(id => { if (!enduranceSet.has(id)) differences++; });
      enduranceSet.forEach(id => { if (!strengthSet.has(id)) differences++; });
      
      expect(differences).toBeGreaterThanOrEqual(1);
      
      // Messages should also differ
      expect(strengthResult.message).toContain('Sức Mạnh');
      expect(enduranceResult.message).toContain('Sức Bền');
    });

    it('should sequence exercises correctly (Power -> Lower Compound -> Upper Compound -> Isolation -> Core)', () => {
      const states = createMuscleStates(100);
      // Pick exactly 5 exercises with 1 from each category to ensure deterministic selection
      const specificExercises: GymExercise[] = [
        { ...styleTestExercises.find(e => e.id === 'st_plank')!, id: 'test_core' }, // Core (5)
        { ...styleTestExercises.find(e => e.id === 'st_bench_press')!, id: 'test_upper_compound' }, // Upper Compound (3)
        { ...styleTestExercises.find(e => e.id === 'st_bicep_curl')!, id: 'test_isolation' }, // Isolation (4)
        { ...styleTestExercises.find(e => e.id === 'st_squat')!, id: 'test_lower_compound' }, // Lower Compound (2)
        { ...styleTestExercises.find(e => e.id === 'st_push_press')!, id: 'test_power' } // Power (1)
      ];
      
      const result = generateSmartWorkout(specificExercises, allEquipment, states, null, 5, undefined, undefined, 'general');
      
      // Ensure we got all 5
      expect(result.workoutIds.length).toBe(5);
      
      // Check sequence
      expect(result.workoutIds[0]).toBe('test_power');
      expect(result.workoutIds[1]).toBe('test_lower_compound');
      expect(result.workoutIds[2]).toBe('test_upper_compound');
      expect(result.workoutIds[3]).toBe('test_isolation');
      expect(result.workoutIds[4]).toBe('test_core');
    });
  });
});
