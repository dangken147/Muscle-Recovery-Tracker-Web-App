import { useState, useEffect } from 'react';
import type { ActivityLog, ExerciseSession, ExerciseSet, MuscleGroup } from '../types/recovery.types';
import { Play, Check, X, Timer, Activity, Zap, CheckCircle2, ShieldAlert } from 'lucide-react';
import gymExercisesData from '../data/home_workouts.json';
import type { GymExercise } from '../types/recovery.types';

const GYM_EXERCISES = gymExercisesData as GymExercise[];

interface LiveWorkoutModeProps {
  plannedWorkout: ActivityLog;
  onComplete: (updatedLog: ActivityLog) => void;
  onCancel: () => void;
}

type ScreenStatus = 'overview' | 'active' | 'checkout';

export default function LiveWorkoutMode({ plannedWorkout, onComplete, onCancel }: LiveWorkoutModeProps) {
  const [screen, setScreen] = useState<ScreenStatus>('overview');
  
  // Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Local copy of exercises to track completion
  const [activeExercises, setActiveExercises] = useState<ExerciseSession[]>(() => {
    let exercises = plannedWorkout.detailedExercises;
    if (!exercises || exercises.length === 0) {
      if (plannedWorkout.gymExercises && plannedWorkout.gymExercises.length > 0) {
        exercises = plannedWorkout.gymExercises.map(exId => {
          const gymEx = GYM_EXERCISES.find(e => e.id === exId);
          return {
            exerciseId: exId,
            name: gymEx?.name || 'Unknown Exercise',
            muscle_mapping: gymEx?.muscle_mapping || {},
            sets: [{ reps: 10, weight: 0 }, { reps: 10, weight: 0 }, { reps: 10, weight: 0 }],
            restTime: 60
          };
        });
      } else {
        exercises = [];
      }
    }
    return JSON.parse(JSON.stringify(exercises));
  });

  // Track which sets are checked
  // Format: { [exerciseIndex]: { [setIndex]: boolean } }
  const [completedSets, setCompletedSets] = useState<Record<number, Record<number, boolean>>>({});

  // Checkout state
  const [intensity, setIntensity] = useState<number>(plannedWorkout.intensity || 5);

  useEffect(() => {
    let interval: number | undefined;
    if (isTimerRunning) {
      interval = window.setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartWorkout = () => {
    setScreen('active');
    setIsTimerRunning(true);
  };

  const handleFinishWorkout = () => {
    setScreen('checkout');
    setIsTimerRunning(false);
  };

  const handleToggleSet = (exIndex: number, setIndex: number) => {
    setCompletedSets(prev => {
      const exState = prev[exIndex] || {};
      return {
        ...prev,
        [exIndex]: {
          ...exState,
          [setIndex]: !exState[setIndex]
        }
      };
    });
  };

  const updateSetData = (exIndex: number, setIndex: number, field: keyof ExerciseSet, value: number) => {
    setActiveExercises(prev => {
      const newEx = [...prev];
      newEx[exIndex].sets[setIndex] = { ...newEx[exIndex].sets[setIndex], [field]: value };
      return newEx;
    });
  };

  const handleComplete = () => {
    // Collect target muscles from checked exercises
    const actualTargetMuscles = new Set<MuscleGroup>();
    const actualMuscleMapping: Partial<Record<MuscleGroup, number>> = {};
    
    // Just sum up muscle mapping from what was actually completed (for simplicity, we assume if they started an exercise they did it)
    activeExercises.forEach((ex, exIndex) => {
      const hasCompletedAnySet = Object.values(completedSets[exIndex] || {}).some(v => v);
      if (hasCompletedAnySet && ex.muscle_mapping) {
        Object.entries(ex.muscle_mapping).forEach(([m, val]) => {
          actualTargetMuscles.add(m as MuscleGroup);
          actualMuscleMapping[m as MuscleGroup] = Math.min(1.0, (actualMuscleMapping[m as MuscleGroup] || 0) + (val as number));
        });
      }
    });

    const finalLog: ActivityLog = {
      ...plannedWorkout,
      status: 'completed',
      timestamp: Date.now(), // Real completion time
      duration: Math.max(1, Math.floor(elapsedSeconds / 60)), // Convert to minutes
      intensity,
      detailedExercises: activeExercises,
      targetMuscles: Array.from(actualTargetMuscles),
      muscleMapping: actualMuscleMapping
    };
    onComplete(finalLog);
  };

  const renderOverview = () => (
    <div className="flex flex-col h-full items-center justify-center p-6 text-center animate-fade-in max-w-lg mx-auto mt-10">
      <div className="w-20 h-20 rounded-full bg-sky-500/10 flex items-center justify-center mb-6 border border-sky-500/20 shadow-[0_0_30px_rgba(14,165,233,0.2)]">
        <Play size={40} className="text-sky-400 ml-2" />
      </div>
      <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Sẵn sàng chưa?</h2>
      <p className="text-slate-400 mb-8">Giáo án <strong className="text-sky-400">{plannedWorkout.trainingStyle?.toUpperCase() || 'GYM'}</strong> với {activeExercises.length} bài tập.</p>
      
      <div className="w-full bg-slate-900/50 rounded-2xl border border-slate-800 p-4 mb-8 text-left max-h-[300px] overflow-y-auto">
        {activeExercises.map((ex, i) => (
          <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-800/50 last:border-0">
            <span className="text-sky-500 font-bold w-6">{i + 1}.</span>
            <span className="text-slate-200 font-semibold">{ex.name}</span>
            <span className="ml-auto text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">{ex.sets.length} Hiệp</span>
          </div>
        ))}
      </div>

      <button
        onClick={handleStartWorkout}
        className="w-full py-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-black text-lg shadow-[0_0_20px_rgba(14,165,233,0.4)] transition-all flex justify-center items-center gap-3"
      >
        <Zap size={24} /> BẮT ĐẦU TẬP
      </button>
      <button onClick={onCancel} className="mt-4 text-slate-500 font-semibold hover:text-slate-300">
        Để sau
      </button>
    </div>
  );

  const renderActive = () => (
    <div className="flex flex-col h-[85vh] sm:h-full animate-fade-in relative max-w-2xl mx-auto">
      {/* Floating Timer Header */}
      <div className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 p-4 flex items-center justify-between rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center animate-pulse">
            <Timer size={20} className="text-sky-400" />
          </div>
          <span className="text-2xl font-black text-white font-mono tracking-wider">{formatTime(elapsedSeconds)}</span>
        </div>
        <button
          onClick={handleFinishWorkout}
          className="px-4 py-2 bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg font-bold border border-rose-500/50 transition-all flex items-center gap-2"
        >
          <CheckCircle2 size={18} /> KẾT THÚC
        </button>
      </div>

      {/* Exercises List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        {activeExercises.map((ex, exIndex) => (
          <div key={exIndex} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold">
                {exIndex + 1}
              </div>
              <h3 className="text-lg font-bold text-white flex-1">{ex.name}</h3>
              {ex.restTime && (
                <span className="text-xs font-semibold bg-slate-800 text-slate-400 px-2 py-1 rounded-md">
                  Nghỉ {ex.restTime}s
                </span>
              )}
            </div>

            <div className="space-y-2">
              {ex.sets.map((set, setIndex) => {
                const isChecked = completedSets[exIndex]?.[setIndex] || false;
                return (
                  <div key={setIndex} className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${isChecked ? 'bg-sky-900/20 border-sky-500/30' : 'bg-slate-950/50 border-slate-800/50'}`}>
                    <div className="w-8 text-center text-xs font-bold text-slate-500">
                      #{setIndex + 1}
                    </div>
                    
                    <div className="flex-1 flex gap-2">
                      <div className="flex items-center bg-slate-900 rounded-lg px-2 flex-1 border border-slate-800 focus-within:border-sky-500">
                        <input 
                          type="number" 
                          value={set.weight} 
                          onChange={(e) => updateSetData(exIndex, setIndex, 'weight', Number(e.target.value))}
                          className="w-full bg-transparent text-white font-bold text-center py-2 outline-none"
                        />
                        <span className="text-xs text-slate-500 font-semibold pr-2">kg</span>
                      </div>
                      <div className="flex items-center bg-slate-900 rounded-lg px-2 flex-1 border border-slate-800 focus-within:border-sky-500">
                        <input 
                          type="number" 
                          value={set.reps} 
                          onChange={(e) => updateSetData(exIndex, setIndex, 'reps', Number(e.target.value))}
                          className="w-full bg-transparent text-white font-bold text-center py-2 outline-none"
                        />
                        <span className="text-xs text-slate-500 font-semibold pr-2">reps</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleToggleSet(exIndex, setIndex)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${isChecked ? 'bg-sky-500 text-white shadow-[0_0_15px_rgba(14,165,233,0.4)] scale-105' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
                    >
                      <Check size={20} strokeWidth={isChecked ? 3 : 2} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCheckout = () => (
    <div className="flex flex-col h-full items-center justify-center p-6 animate-slide-in max-w-lg mx-auto mt-10">
      <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/20">
        <CheckCircle2 size={32} className="text-emerald-400" />
      </div>
      <h2 className="text-2xl font-black text-white mb-2 uppercase">Hoàn tất buổi tập!</h2>
      <div className="flex gap-4 mb-8">
        <div className="bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-800 flex flex-col items-center">
          <span className="text-xs text-slate-500 font-bold uppercase">Thời gian</span>
          <span className="text-lg text-sky-400 font-bold font-mono">{formatTime(elapsedSeconds)}</span>
        </div>
        <div className="bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-800 flex flex-col items-center">
          <span className="text-xs text-slate-500 font-bold uppercase">Khối lượng</span>
          <span className="text-lg text-rose-400 font-bold">{activeExercises.length} bài</span>
        </div>
      </div>

      <div className="w-full bg-slate-900/40 border border-slate-800 rounded-3xl p-6 mb-8">
        <label className="flex justify-between text-sm font-semibold text-slate-300 mb-4">
          <span className="flex items-center gap-2"><Activity size={16} className="text-rose-400" /> Cảm nhận mệt mỏi (RPE)</span>
          <span className="bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-bold">{intensity}/10</span>
        </label>
        <input
          type="range"
          min="1"
          max="10"
          step="1"
          value={intensity}
          onChange={(e) => setIntensity(parseInt(e.target.value))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-700 custom-intensity-range"
          style={{
            background: `linear-gradient(to right, #f43f5e ${(intensity - 1) * 11.1}%, #334155 ${(intensity - 1) * 11.1}%)`
          }}
        />
        <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500 mt-2">
          <span>Khởi động</span>
          <span>Vừa phải</span>
          <span>Kiệt sức</span>
        </div>
      </div>

      <button
        onClick={handleComplete}
        className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-lg shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex justify-center items-center gap-2"
      >
        <Check size={24} strokeWidth={3} /> LƯU NHẬT KÝ
      </button>
      <button onClick={() => setScreen('active')} className="mt-4 text-slate-500 font-semibold hover:text-slate-300">
        Quay lại tập tiếp
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 overflow-hidden flex flex-col">
      {screen === 'overview' && renderOverview()}
      {screen === 'active' && renderActive()}
      {screen === 'checkout' && renderCheckout()}
    </div>
  );
}
