import { describe, it, expect } from 'vitest';
import { calculateMuscleStates } from './recovery.utils';
import { UserProfile, ActivityLog, MuscleGroup } from '../types/recovery.types';

describe('Football Muscle Fatigue Calculation', () => {
  const mockProfile: UserProfile = {
    weight: 70,
    fitnessLevel: 'intermediate',
    trainingFrequency: 'moderate',
    injuryHistory: []
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
