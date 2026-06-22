import { describe, it, expect } from 'vitest';
import { calculateMuscleStates } from './recovery.utils';
import type { UserProfile, ActivityLog, MuscleGroup } from '../types/recovery.types';

describe('Football Muscle Fatigue Calculation', () => {
  const mockProfile: UserProfile = {
    name: 'Test User',
    age: 25,
    gender: 'male',
    height: 175,
    weight: 70,
    rhr: 60,
    weeklyFrequency: 3,
    primarySport: 'team_sports',
    oneRepMaxes: { benchPress: 0, squat: 0, deadlift: 0, overheadPress: 0 },
    injuryHistory: [],
    updateCycleDays: 30,
    lastProfileUpdateDate: Date.now()
  };

  const createBaseLog = (overrides: Partial<ActivityLog>): ActivityLog => ({
    id: 'test-log',
    timestamp: Date.now(),
    activityType: 'football',
    intensity: 8,
    duration: 90,
    targetMuscles: ['quadriceps', 'hamstrings', 'calves', 'neck', 'glutes'],
    nutrition: 'good',
    sleep: 'good',
    stress: 'normal',
    hasInjury: false,
    injuredMuscles: [],
    ...overrides
  } as ActivityLog);

  const getFatigue = (result: any[], muscle: MuscleGroup) => 
    result.find(r => r.muscle === muscle)?.fatigue || 0;

  it('should calculate accurate fatigue for a single position (Striker)', () => {
    const log = createBaseLog({
      footballPositions: [{ position: 'striker', percentage: 100 }],
      footballIncludesHeading: true,
      footballMatchType: 'tournament'
    });

    const result = calculateMuscleStates(mockProfile, [log], Date.now());
    
    // Striker relies heavily on quadriceps and hamstrings
    expect(getFatigue(result, 'quadriceps')).toBeGreaterThan(0);
    expect(getFatigue(result, 'hamstrings')).toBeGreaterThan(0);
    
    // Heading should increase neck fatigue
    expect(getFatigue(result, 'neck')).toBeGreaterThan(0);
  });

  it('should calculate weighted fatigue for multi-position (50% Striker, 50% Midfielder)', () => {
    const logSingle = createBaseLog({
      footballPositions: [{ position: 'striker', percentage: 100 }]
    });

    const logMulti = createBaseLog({
      footballPositions: [
        { position: 'striker', percentage: 50 },
        { position: 'midfielder', percentage: 50 }
      ]
    });

    const resultSingle = calculateMuscleStates(mockProfile, [logSingle], Date.now());
    const resultMulti = calculateMuscleStates(mockProfile, [logMulti], Date.now());

    // Midfielders run more, so calves fatigue should theoretically change compared to a pure striker
    expect(getFatigue(resultMulti, 'calves')).toBeGreaterThan(0);
    expect(getFatigue(resultMulti, 'quadriceps')).toBeGreaterThan(0);
    
    // The total fatigue distributed should be different due to the 50/50 split
    expect(getFatigue(resultMulti, 'quadriceps')).not.toEqual(getFatigue(resultSingle, 'quadriceps'));
  });

  it('should cap fatigue at 100% for extreme inputs', () => {
    const extremeLog = createBaseLog({
      footballPositions: [{ position: 'midfielder', percentage: 100 }],
      intensity: 10,
      duration: 300, // 5 hours of football at intensity 10
      footballMatchType: 'tournament'
    });

    const result = calculateMuscleStates(mockProfile, [extremeLog], Date.now());

    // Even with extreme inputs, no muscle should exceed 100% fatigue
    result.forEach(state => {
      expect(state.fatigue).toBeLessThanOrEqual(100);
    });
  });

  it('should correctly handle zero positions edge case gracefully', () => {
    const emptyLog = createBaseLog({
      footballPositions: []
    });

    const result = calculateMuscleStates(mockProfile, [emptyLog], Date.now());

    // Should process without throwing errors, even if fatigues are 0
    expect(getFatigue(result, 'quadriceps')).toBeDefined();
  });
});

describe('Running Muscle Fatigue Calculation', () => {
  const mockProfile: UserProfile = {
    name: 'Runner',
    age: 28,
    gender: 'male',
    height: 170,
    weight: 65,
    rhr: 55,
    weeklyFrequency: 4,
    primarySport: 'endurance',
    oneRepMaxes: { benchPress: 0, squat: 0, deadlift: 0, overheadPress: 0 },
    injuryHistory: [],
    updateCycleDays: 30,
    lastProfileUpdateDate: Date.now()
  };

  const createRunningLog = (overrides: Partial<ActivityLog>): ActivityLog => ({
    id: 'run-log',
    timestamp: Date.now(),
    activityType: 'running',
    intensity: 1,
    duration: 50,
    distance: 5, // 5km in 50 mins -> 10:00 pace
    targetMuscles: ['quadriceps', 'hamstrings', 'calves', 'glutes', 'ankles', 'knees'],
    nutrition: 'good',
    sleep: 'good',
    stress: 'normal',
    hasInjury: false,
    injuredMuscles: [],
    runningType: 'interval',
    runningTerrain: 'trail',
    ...overrides
  } as ActivityLog);

  const getFatigue = (result: any[], muscle: MuscleGroup) => 
    result.find(r => r.muscle === muscle)?.fatigue || 0;

  it('should apply higher fatigue for zero-drop/normal shoes compared to cushioned shoes on Trail Interval run', () => {
    const normalShoeLog = createRunningLog({
      runningFootwear: 'normal'
    });

    const cushionedShoeLog = createRunningLog({
      runningFootwear: 'cushioned'
    });

    const resultNormal = calculateMuscleStates(mockProfile, [normalShoeLog], Date.now());
    const resultCushioned = calculateMuscleStates(mockProfile, [cushionedShoeLog], Date.now());

    const calvesNormal = getFatigue(resultNormal, 'calves');
    const calvesCushioned = getFatigue(resultCushioned, 'calves');

    const anklesNormal = getFatigue(resultNormal, 'ankles');
    const anklesCushioned = getFatigue(resultCushioned, 'ankles');
    
    console.log('Result Normal:', resultNormal.filter(r => r.fatigue > 0));

    // Thượng Đình / Zero-drop shoes should cause significantly higher strain on calves and ankles
    expect(calvesNormal).toBeGreaterThan(calvesCushioned * 1.3);
    expect(anklesNormal).toBeGreaterThan(anklesCushioned * 1.3);
  });
});
