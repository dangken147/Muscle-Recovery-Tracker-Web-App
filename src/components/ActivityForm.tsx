import { useState, useEffect, useMemo } from 'react';
import type { UserProfile, ActivityLog, MuscleGroup, ActivityType, SleepQuality, MentalStress, NutritionQuality, FootballPitchSize, SwimmingStroke, SwimmingEnvironment, GymExercise, ExerciseGroup, ExerciseSession, ExerciseSet } from '../types/recovery.types';
import { MUSCLE_LABELS } from '../utils/recovery.utils';
import gymExercisesData from '../data/home_workouts.json';

const GYM_EXERCISES = gymExercisesData as GymExercise[];
import BodyMap from './BodyMap';
import { 
  ArrowLeft, Trash2, Clock, Check, ChevronRight, ChevronLeft, Calendar, User, Dumbbell, Activity, Star, Zap, Award, Target, Brain, Flame, Heart, Info, Moon, Apple, AlertTriangle, MessageSquare, Plus, Save, Play, Search, Filter, BookOpen, Layers, Maximize2, ShieldAlert, Pin, LayoutGrid, Bookmark, BookmarkPlus, X, Compass, Waves, Footprints, Trophy, Bot
} from 'lucide-react';
import { generateSmartWorkout } from '../utils/aiWorkoutGenerator';

const ACTIVITY_OPTIONS = [
  { value: 'gym', label: 'Tập Gym / Nâng tạ', icon: Dumbbell },
  { value: 'football', label: 'Đá bóng (Soccer)', icon: Trophy },
  { value: 'running', label: 'Chạy bộ', icon: Footprints },
  { value: 'swimming', label: 'Bơi lội', icon: Waves },
  { value: 'basketball', label: 'Bóng rổ', icon: Target },
  { value: 'other', label: 'Hoạt động khác', icon: Compass }
];

const getActiveTheme = (type: string) => {
  const themes: Record<string, { color: string, bg: string, icon: any, label: string, hex: string, pillActive: string, glow: string }> = {
    gym: { 
      color: 'text-rose-400', bg: 'bg-rose-500', icon: Dumbbell, label: 'Tập Gym', 
      hex: '#f43f5e', 
      pillActive: 'bg-rose-500/20 border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.3)] text-rose-300',
      glow: 'from-rose-500/10 via-rose-500/5 to-transparent'
    },
    football: { 
      color: 'text-emerald-400', bg: 'bg-emerald-500', icon: Trophy, label: 'Đá bóng', 
      hex: '#10b981', 
      pillActive: 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)] text-emerald-300',
      glow: 'from-emerald-500/10 via-emerald-500/5 to-transparent'
    },
    running: { 
      color: 'text-cyan-400', bg: 'bg-cyan-500', icon: Footprints, label: 'Chạy bộ', 
      hex: '#06b6d4', 
      pillActive: 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)] text-cyan-300',
      glow: 'from-cyan-500/10 via-cyan-500/5 to-transparent'
    },
    swimming: { 
      color: 'text-sky-400', bg: 'bg-sky-500', icon: Waves, label: 'Bơi lội', 
      hex: '#0ea5e9', 
      pillActive: 'bg-sky-500/20 border-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.3)] text-sky-300',
      glow: 'from-sky-500/10 via-sky-500/5 to-transparent'
    },
    basketball: { 
      color: 'text-amber-400', bg: 'bg-amber-500', icon: Target, label: 'Bóng rổ', 
      hex: '#f59e0b', 
      pillActive: 'bg-amber-500/20 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)] text-amber-300',
      glow: 'from-amber-500/10 via-amber-500/5 to-transparent'
    },
    other: { 
      color: 'text-purple-400', bg: 'bg-purple-500', icon: Compass, label: 'Khác', 
      hex: '#a855f7', 
      pillActive: 'bg-purple-500/20 border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)] text-purple-300',
      glow: 'from-purple-500/10 via-purple-500/5 to-transparent'
    }
  };
  return themes[type] || themes.other;
};

const PillSelector = ({ value, onChange, options, theme }: any) => {
  const getColorClasses = (isSelected: boolean) => {
    if (!isSelected) return 'bg-slate-900/50 border-slate-700/50 hover:bg-slate-800 text-slate-400';
    return theme ? theme.pillActive : 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)] text-emerald-300';
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt: any) => (
        <div 
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 min-w-fit flex items-center justify-center px-2 py-2.5 rounded-xl cursor-pointer transition-all border text-[10px] sm:text-xs font-semibold text-center ${getColorClasses(opt.value === value)}`}
        >
          {opt.label}
        </div>
      ))}
    </div>
  );
};

const MultiPillSelector = ({ value, onChange, options, theme, maxSelections = 3 }: any) => {
  const selectedValues = value.map((v: any) => v.position);
  
  const handleToggle = (optValue: string) => {
    if (selectedValues.includes(optValue)) {
      if (selectedValues.length === 1) return; // Must have at least 1
      const newValues = value.filter((v: any) => v.position !== optValue);
      // Auto-balance
      const perItem = Math.floor(100 / newValues.length);
      const balanced = newValues.map((v: any, idx: number) => ({
        ...v,
        percentage: idx === 0 ? 100 - (perItem * (newValues.length - 1)) : perItem
      }));
      onChange(balanced);
    } else {
      if (selectedValues.length >= maxSelections) return; // Max limit
      const newValues = [...value, { position: optValue, percentage: 0 }];
      const perItem = Math.floor(100 / newValues.length);
      const balanced = newValues.map((v: any, idx: number) => ({
        ...v,
        percentage: idx === 0 ? 100 - (perItem * (newValues.length - 1)) : perItem
      }));
      onChange(balanced);
    }
  };

  const getColorClasses = (isSelected: boolean) => {
    if (!isSelected) return 'bg-slate-900/50 border-slate-700/50 hover:bg-slate-800 text-slate-400';
    return theme ? theme.pillActive : 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)] text-emerald-300';
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt: any) => {
        const isSelected = selectedValues.includes(opt.value);
        return (
          <div 
            key={opt.value}
            onClick={() => handleToggle(opt.value)}
            className={`flex-1 min-w-fit flex items-center justify-center px-2 py-2.5 rounded-xl cursor-pointer transition-all border text-[10px] sm:text-xs font-semibold text-center ${getColorClasses(isSelected)}`}
          >
            {opt.label}
          </div>
        );
      })}
    </div>
  );
};

const EquipmentSelector = ({ value, onChange, options, theme }: any) => {
  const handleToggle = (optValue: string) => {
    if (value.includes(optValue)) {
      if (value.length === 1) return; // Must have at least 1
      onChange(value.filter((v: string) => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt: any) => {
        const isSelected = value.includes(opt.value);
        return (
          <div 
            key={opt.value}
            onClick={() => handleToggle(opt.value)}
            className={`flex-1 min-w-fit flex items-center justify-center px-2 py-2.5 rounded-xl cursor-pointer transition-all border text-[10px] sm:text-xs font-semibold text-center ${
              isSelected ? theme.pillActive : 'bg-slate-900/50 border-slate-700/50 hover:bg-slate-800 text-slate-400'
            }`}
          >
            {opt.label}
          </div>
        );
      })}
    </div>
  );
};

const PositionPercentageSliders = ({ value, onChange, options, theme }: any) => {
  if (value.length <= 1) return null;

  const handleSliderChange = (idx: number, newVal: number) => {
    if (value.length === 2) {
      const otherIdx = idx === 0 ? 1 : 0;
      const newArr = [...value];
      newArr[idx].percentage = newVal;
      newArr[otherIdx].percentage = 100 - newVal;
      onChange(newArr);
    } else if (value.length === 3) {
      const newArr = [...value];
      // diff is not needed

      newArr[idx].percentage = newVal;
      
      const otherIndices = [0, 1, 2].filter(i => i !== idx);
      const remainingTotal = 100 - newVal;
      const otherOldTotal = newArr[otherIndices[0]].percentage + newArr[otherIndices[1]].percentage;
      
      if (otherOldTotal === 0) {
        newArr[otherIndices[0]].percentage = Math.floor(remainingTotal / 2);
        newArr[otherIndices[1]].percentage = remainingTotal - Math.floor(remainingTotal / 2);
      } else {
        const ratio0 = newArr[otherIndices[0]].percentage / otherOldTotal;
        newArr[otherIndices[0]].percentage = Math.floor(remainingTotal * ratio0);
        newArr[otherIndices[1]].percentage = remainingTotal - newArr[otherIndices[0]].percentage;
      }
      onChange(newArr);
    }
  };

  return (
    <div className="space-y-4 mt-3 p-3 bg-slate-900/40 rounded-xl border border-slate-800 col-span-full">
      <div className="text-[11px] font-semibold text-slate-400 mb-2">Tỉ lệ thời gian:</div>
      {value.map((v: any, idx: number) => {
        const opt = options.find((o: any) => o.value === v.position);
        return (
          <div key={v.position} className="space-y-1">
            <div className="flex justify-between text-[11px] font-semibold">
              <span className="text-slate-300">{opt?.label}</span>
              <span className={theme?.color || "text-emerald-400"}>{v.percentage}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={v.percentage}
              onChange={(e) => handleSliderChange(idx, parseInt(e.target.value))}
              className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-700"
              style={{
                background: `linear-gradient(to right, ${theme?.hex || '#10b981'} ${v.percentage}%, #334155 ${v.percentage}%)`
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

const DynamicGlowSlider = ({ value, onChange, min, max }: any) => {
  const percentage = ((value - min) / (max - min)) * 100;
  
  const getColor = () => {
    if (value <= 3) return '16, 185, 129';
    if (value <= 6) return '245, 158, 11';
    if (value <= 8) return '249, 115, 22';
    return '239, 68, 68';
  };
  
  const color = getColor();
  
  return (
    <div className="relative pt-6 pb-2">
      <div 
        className="absolute inset-0 blur-xl opacity-20 pointer-events-none transition-all duration-300"
        style={{ 
          background: `radial-gradient(circle at ${percentage}% 50%, rgb(${color}), transparent 70%)`,
          opacity: value > 7 ? 0.3 + (value - 7) * 0.15 : 0.1
        }}
      />
      
      <div 
        className="absolute top-0 -ml-3 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg transition-all duration-200 z-20"
        style={{ 
          left: `calc(${percentage}% + (${8 - percentage * 0.15}px))`,
          backgroundColor: `rgb(${color})`,
          boxShadow: `0 0 ${value > 7 ? '15px' : '5px'} rgba(${color}, 0.6)`
        }}
      >
        {value}
      </div>
      
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer relative z-10 custom-range"
        style={{ 
          background: `linear-gradient(to right, rgb(16,185,129) 0%, rgb(245,158,11) 50%, rgb(239,68,68) 100%)` 
        }}
      />
      <style>{`
        .custom-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          border: 3px solid rgb(${color});
          box-shadow: 0 0 10px rgba(${color}, 0.5);
          transition: border-color 0.2s, box-shadow 0.2s;
        }
      `}</style>
    </div>
  );
};



// Rich Selection Cards Component for Step 2
const RichSelectionCards = ({ value, onChange, options, theme }: any) => {
  const semanticThemes: Record<string, { color: string, bg: string, hex: string, glow: string }> = {
    good: { color: 'text-emerald-400', bg: 'bg-emerald-500', hex: '#10b981', glow: 'from-emerald-500/10 via-emerald-500/5 to-transparent' },
    fair: { color: 'text-amber-400', bg: 'bg-amber-500', hex: '#f59e0b', glow: 'from-amber-500/10 via-amber-500/5 to-transparent' },
    poor: { color: 'text-rose-400', bg: 'bg-rose-500', hex: '#f43f5e', glow: 'from-rose-500/10 via-rose-500/5 to-transparent' }
  };

  return (
    <div className={`grid gap-2 sm:gap-3 ${options.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
      {options.map((opt: any) => {
        const isActive = value === opt.value;
        const activeTheme = opt.semantic ? semanticThemes[opt.semantic] : theme;
        
        return (
          <div
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl cursor-pointer transition-all duration-300 border relative overflow-hidden group ${
              isActive 
                ? 'bg-slate-900 scale-105 z-10'
                : 'bg-slate-900/40 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
            }`}
            style={isActive ? { borderColor: activeTheme.hex, boxShadow: `0 8px 20px -5px ${activeTheme.hex}50, inset 0 0 15px ${activeTheme.hex}20` } : {}}
          >
            {isActive && (
              <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${activeTheme.glow}`}></div>
            )}
            <div className={`mb-2 p-2.5 rounded-full transition-all duration-300 relative z-10 ${isActive ? '' : 'bg-slate-800 group-hover:bg-slate-700'}`} style={isActive ? { backgroundColor: `${activeTheme.hex}30` } : {}}>
              <opt.icon size={22} className={`transition-all duration-300 ${isActive ? activeTheme.color : 'text-slate-400 group-hover:text-slate-300'}`} />
            </div>
            <span className={`text-[10px] sm:text-xs font-bold text-center relative z-10 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>
              {opt.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

interface ActivityFormProps {
  _profile?: UserProfile | null;
  logs: ActivityLog[];
  exerciseGroups: ExerciseGroup[];
  saveExerciseGroups: (groups: ExerciseGroup[]) => void;
  muscleStates: Record<MuscleGroup, number>;
  onSubmit: (log: Omit<ActivityLog, 'id' | 'timestamp'> & { status?: 'planned' | 'completed', id?: string }) => void;
  onClose: () => void;
  initialLog?: ActivityLog;
  initialStep?: number;
}

export default function ActivityForm({ _profile, logs, exerciseGroups, saveExerciseGroups, muscleStates, onSubmit, onClose, initialLog, initialStep = 0 }: ActivityFormProps) {
  const [step, setStep] = useState<number>(initialStep);
  const [gymIntent, setGymIntent] = useState<'plan' | 'log'>('log');
  const [gymLocation, setGymLocation] = useState<'gym' | 'home' | null>(null);
  
  // Step 1: Workout
  const [activityType, setActivityType] = useState<ActivityType>('gym');
  const theme = getActiveTheme(activityType);
  const [footballPitchSize, setFootballPitchSize] = useState<FootballPitchSize>('5v5');
  const [footballPositions, setFootballPositions] = useState<any[]>([{ position: 'midfielder', percentage: 100 }]);
  const [footballIncludesHeading, setFootballIncludesHeading] = useState<boolean>(false);
  const [swimmingStroke, setSwimmingStroke] = useState<SwimmingStroke>('freestyle');
  const [swimmingEnvironment, setSwimmingEnvironment] = useState<SwimmingEnvironment>('pool');
  const [distance, setDistance] = useState<number | ''>(initialLog?.distance || '');
  const [duration, setDuration] = useState<number>(initialLog?.duration || 60);
  const [intensity, setIntensity] = useState<number>(initialLog?.intensity || 7);
  
  // Gym Specific Step 1.25
  const [detailExercise, setDetailExercise] = useState<GymExercise | null>(null);
  const [gymTab, setGymTab] = useState<'all' | 'recent' | 'groups'>('all');
  const [newGroupName, setNewGroupName] = useState('');
  const [showNewGroupInput, setShowNewGroupInput] = useState(false);
  const [targetMuscles, setTargetMuscles] = useState<MuscleGroup[]>([]);
  
  // Gym specific
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(['bodyweight']);
  const [dumbbellWeight, setDumbbellWeight] = useState<number>(10);
  const [selectedExercises, setSelectedExercises] = useState<string[]>(initialLog?.gymExercises || []);
  const [muscleMapping, setMuscleMapping] = useState<Partial<Record<MuscleGroup, number>>>(initialLog?.muscleMapping || {});
  const [gymSearchTerm, setGymSearchTerm] = useState<string>('');
  const [gymFilterType, setGymFilterType] = useState<string>('all');
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [detailedExercises, setDetailedExercises] = useState<ExerciseSession[]>(initialLog?.detailedExercises || []);

  useEffect(() => {
    if (activityType !== 'gym') return;
    setDetailedExercises(prev => {
      const existingMap = new Map(prev.map(ex => [ex.exerciseId, ex]));
      const newDetailed = selectedExercises.map(exId => {
        if (existingMap.has(exId)) return existingMap.get(exId)!;
        
        const gymEx = GYM_EXERCISES.find(e => e.id === exId);
        if (!gymEx) return null;

        // Auto-fill logic from logs
        const pastLogs = logs
          .filter(log => log.activityType === 'gym' && log.detailedExercises)
          .sort((a, b) => b.timestamp - a.timestamp);
        
        let pastSets: ExerciseSet[] = [];
        for (const log of pastLogs) {
          const pastEx = log.detailedExercises!.find(e => e.exerciseId === exId);
          if (pastEx && pastEx.sets) {
            pastSets = pastEx.sets.map(s => ({ ...s })); // Deep copy
            break;
          }
        }

        return {
          exerciseId: exId,
          name: gymEx.name,
          muscle_mapping: gymEx.muscle_mapping,
          isBodyweight: gymEx.isBodyweight,
          bwFraction: gymEx.bwFraction,
          sets: pastSets.length > 0 ? pastSets : [{ reps: 0, weight: 0, rpe: 7 }]
        };
      }).filter(Boolean) as ExerciseSession[];
      return newDetailed;
    });
  }, [selectedExercises, logs, activityType]);

  const handleAiCoach = () => {
    if (!muscleStates) return;
    const result = generateSmartWorkout(GYM_EXERCISES, selectedEquipment, muscleStates, _profile, 5, dumbbellWeight, 2);
    setSelectedExercises(result.workoutIds);
    setAiMessage(result.message);
  };

  const recentExerciseIds = useMemo(() => {
    const now = Date.now();
    const recentLogs = logs.filter(log => log.activityType === 'gym' && (now - log.timestamp) < 48 * 60 * 60 * 1000);
    const ids = new Set<string>();
    recentLogs.forEach(log => {
      if (log.gymExercises) {
        log.gymExercises.forEach(id => ids.add(id));
      }
    });
    return Array.from(ids);
  }, [logs]);

  // Initialize Gym Prefs
  useEffect(() => {
    try {
      const prefs = localStorage.getItem('aurarecov_gym_prefs');
      if (prefs) {
        const parsed = JSON.parse(prefs);
        if (parsed.equipment) setSelectedEquipment(parsed.equipment);
        if (parsed.dumbbellWeight) setDumbbellWeight(parsed.dumbbellWeight);
      }
    } catch (e) {
      // ignore
    }
  }, []);


  
  // Step 2: Body State
  const [sleep, setSleep] = useState<SleepQuality>('good');
  const [stress, setStress] = useState<MentalStress>('low');
  const [nutrition, setNutrition] = useState<NutritionQuality>('good');
  
  // Step 3: Injury & Notes
  const [hasInjury, setHasInjury] = useState<boolean>(false);
  const [injuredMuscles, setInjuredMuscles] = useState<MuscleGroup[]>([]);
  const [painScale, setPainScale] = useState<number>(3);
  const [notes, setNotes] = useState<string>('');

  // Auto-apply Smart Presets based on selected activity type
  useEffect(() => {
    if (activityType === 'gym') {
      const newMapping: Partial<Record<MuscleGroup, number>> = {};
      const newTargets = new Set<MuscleGroup>();

      selectedExercises.forEach(exId => {
        const ex = GYM_EXERCISES.find(e => e.id === exId);
        if (ex && ex.muscle_mapping) {
          Object.entries(ex.muscle_mapping).forEach(([muscle, weight]) => {
            const m = muscle as MuscleGroup;
            if (typeof weight === 'number') {
              newTargets.add(m);
              newMapping[m] = Math.max(newMapping[m] || 0, weight);
            }
          });
        }
      });

      setMuscleMapping(newMapping);
      setTargetMuscles(Array.from(newTargets));
    } else if (activityType === 'football') {
      let mergedMuscles = new Set<MuscleGroup>();
      footballPositions.forEach(p => {
        if (p.position === 'striker') {
          ['hamstrings', 'calves', 'glutes'].forEach(m => mergedMuscles.add(m as MuscleGroup));
        } else if (p.position === 'midfielder') {
          ['quadriceps', 'hamstrings', 'calves', 'glutes', 'upper_abs', 'lower_abs'].forEach(m => mergedMuscles.add(m as MuscleGroup));
        } else if (p.position === 'defender') {
          ['quadriceps', 'glutes', 'upper_abs', 'lower_abs', 'lower_back', 'knees'].forEach(m => mergedMuscles.add(m as MuscleGroup));
        } else if (p.position === 'goalkeeper') {
          ['glutes', 'quadriceps', 'front_shoulders', 'lats', 'upper_chest'].forEach(m => mergedMuscles.add(m as MuscleGroup));
        }
      });
      
      const hasStrikerOrDefender = footballPositions.some(p => p.position === 'striker' || p.position === 'defender');
      if (!hasStrikerOrDefender && footballIncludesHeading) {
        setFootballIncludesHeading(false);
      } else if (footballIncludesHeading) {
        mergedMuscles.add('neck');
      }

      setTargetMuscles(Array.from(mergedMuscles));
    } else if (activityType === 'basketball') {
      setTargetMuscles(['quadriceps', 'hamstrings', 'glutes', 'calves', 'upper_abs', 'lower_abs', 'obliques']);
    } else if (activityType === 'running' || activityType === 'cycling') {
      setTargetMuscles(['quadriceps', 'hamstrings', 'calves', 'glutes']);
    } else if (activityType === 'swimming') {
      let baseMuscles: MuscleGroup[] = ['lats', 'front_shoulders', 'quadriceps', 'upper_abs', 'calves'];
      if (swimmingStroke === 'breaststroke') {
        baseMuscles = ['glutes', 'hamstrings', 'upper_chest', 'lats', 'lower_back'];
      } else if (swimmingStroke === 'butterfly') {
        baseMuscles = ['lats', 'lower_back', 'front_shoulders', 'upper_chest', 'quadriceps'];
      } else if (swimmingStroke === 'backstroke') {
        baseMuscles = ['lats', 'rear_shoulders', 'quadriceps', 'lower_back', 'calves'];
      }
      setTargetMuscles(baseMuscles);
    } else {
      setTargetMuscles([]);
    }
  }, [activityType, footballPositions, footballIncludesHeading, swimmingStroke, selectedExercises]);

  const handleMuscleToggle = (muscle: MuscleGroup) => {
    setTargetMuscles((prev) =>
      prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle]
    );
  };

  const handleInjuredMuscleToggle = (muscle: MuscleGroup) => {
    setInjuredMuscles((prev) =>
      prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle]
    );
  };

  const getIntensityLabel = (val: number): string => {
    if (val <= 2) return '1-2: Rất nhẹ (Chỉ như đi dạo, không đổ mồ hôi)';
    if (val <= 4) return '3-4: Nhẹ vừa (Ấm người, vừa tập vừa chém gió được)';
    if (val <= 6) return '5-6: Mệt vừa (Thở dốc nhẹ, bắt đầu khó nói chuyện dài)';
    if (val <= 8) return '7-8: Rất mệt (Thở hồng hộc, sát ngưỡng thất bại)';
    return '9-10: Cực đại (Vắt kiệt 100% sức, không lết nổi nữa)';
  };

  const handleNext = () => {
    if (step === 0) {
      if (activityType === 'gym') {
        setStep(0.5);
      } else {
        setStep(1);
      }
    } else if (step === 0.5) {
      setStep(1);
    } else if (step === 1) {
      if (activityType === 'gym') {
        setStep(1.25);
      } else {
        if (targetMuscles.length === 0) {
          const confirm = window.confirm('Bạn chưa chọn nhóm cơ nào. Vẫn tiếp tục?');
          if (!confirm) return;
        }
        setStep(2);
      }
    } else if (step === 1.25) {
      if (selectedExercises.length === 0) {
        const confirm = window.confirm('Bạn chưa chọn bài tập nào. Vẫn tiếp tục?');
        if (!confirm) return;
      }
      setStep(1.3);
    } else if (step === 1.3) {
      setStep(1.5);
    } else if (step === 1.5) {
      if (targetMuscles.length === 0 && activityType === 'gym') {
        const confirm = window.confirm('Bạn chưa chọn bài tập nào. Vẫn tiếp tục?');
        if (!confirm) return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step === 0.5) setStep(0);
    else if (step === 0.75) setStep(0.5);
    else if (step === 1) {
      if (initialLog && initialLog.status === 'planned') {
        onClose();
      } else if (activityType === 'gym') setStep(0.75);
      else setStep(0);
    }
    else if (step === 1.25) {
      if (gymLocation === 'gym') setStep(0.75);
      else setStep(1);
    }
    else if (step === 1.3) setStep(1.25);
    else if (step === 1.5) {
      if (initialLog && initialLog.status === 'planned') {
        setStep(1); // can go back to modify exercises if they want
      } else {
        if (gymIntent === 'log' && gymLocation === 'gym') setStep(1.3);
        else setStep(1.3);
      }
    }
    else if (step === 2) {
      if (activityType === 'gym') setStep(1.5);
      else setStep(1);
    }
    else if (step === 3) setStep(2);
  };

  const handleSavePlan = () => {
    if (selectedExercises.length === 0) {
      alert('Vui lòng chọn ít nhất 1 bài tập để lưu kế hoạch.');
      return;
    }
    
    // Submit as planned
    onSubmit({
      id: initialLog?.id,
      status: 'planned',
      activityType: 'gym',
      duration: 0,
      intensity: 0,
      targetMuscles,
      muscleMapping,
      nutrition: 'good',
      sleep: 'good',
      stress: 'low',
      hasInjury: false,
      injuredMuscles: [],
      gymEquipment: selectedEquipment,
      gymExercises: selectedExercises,
      dumbbellCount: 2,
      dumbbellWeight,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasInjury && injuredMuscles.length === 0) {
      alert('Vui lòng chọn nhóm cơ bị chấn thương/đau nhức');
      return;
    }

    onSubmit({
      id: initialLog?.id,
      status: 'completed',
      activityType,
      duration,
      intensity,
      targetMuscles,
      muscleMapping,
      detailedExercises,
      nutrition,
      sleep,
      stress,
      hasInjury,
      injuredMuscles: hasInjury ? injuredMuscles : [],
      painScale: hasInjury ? painScale : undefined,
      notes,
      gymEquipment: selectedEquipment,
      gymExercises: selectedExercises,
      dumbbellCount: 2,
      dumbbellWeight,
      footballPitchSize,
      footballPositions,
      footballIncludesHeading,
      swimmingStroke,
      swimmingEnvironment,
      distance: distance === '' ? undefined : distance,
    });
  };

  // Content for Step 0 (Select Activity Type)
  const renderStep0 = () => {
    const getCardStyles = (type: string) => {
      const styles: Record<string, { bg: string, text: string, shadow: string, gradient: string }> = {
        gym: { bg: 'bg-rose-500/10', text: 'text-rose-400', shadow: 'hover:shadow-[0_0_30px_rgba(244,63,94,0.15)]', gradient: 'group-hover:from-rose-500/20 group-hover:to-orange-500/5' },
        football: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', shadow: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]', gradient: 'group-hover:from-emerald-500/20 group-hover:to-teal-500/5' },
        running: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', shadow: 'hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]', gradient: 'group-hover:from-cyan-500/20 group-hover:to-blue-500/5' },
        swimming: { bg: 'bg-sky-500/10', text: 'text-sky-400', shadow: 'hover:shadow-[0_0_30px_rgba(14,165,233,0.15)]', gradient: 'group-hover:from-sky-500/20 group-hover:to-indigo-500/5' },
        basketball: { bg: 'bg-amber-500/10', text: 'text-amber-400', shadow: 'hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]', gradient: 'group-hover:from-amber-500/20 group-hover:to-orange-500/5' },
        cycling: { bg: 'bg-lime-500/10', text: 'text-lime-400', shadow: 'hover:shadow-[0_0_30px_rgba(132,204,22,0.15)]', gradient: 'group-hover:from-lime-500/20 group-hover:to-green-500/5' },
        other: { bg: 'bg-purple-500/10', text: 'text-purple-400', shadow: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]', gradient: 'group-hover:from-purple-500/20 group-hover:to-fuchsia-500/5' }
      };
      return styles[type] || styles.other;
    };

    return (
      <div className="animate-fade-in py-2 sm:py-6">
        <div className="text-center mb-8 sm:mb-12">
          <h3 className="text-2xl sm:text-3xl font-black text-white mb-3 tracking-tight">Hôm nay Sếp tập món gì?</h3>
          <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto">Mỗi bộ môn sẽ có phương pháp đo lường chấn động và phục hồi cơ bắp chuyên biệt.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto px-2">
          {ACTIVITY_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const style = getCardStyles(opt.value);
            return (
              <div 
                key={opt.value}
                onClick={() => {
                  setActivityType(opt.value as ActivityType);
                  setStep(opt.value === 'gym' ? 0.5 : 1);
                }}
                className={`group relative flex flex-col items-center justify-center p-6 rounded-3xl cursor-pointer transition-all duration-300 ease-out border overflow-hidden ${
                  style.shadow
                } bg-slate-900/40 border-slate-800/60 hover:-translate-y-2 hover:border-slate-600/80`}
              >
                {/* Background Gradient Hover Effect */}
                <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${style.gradient}`} />
                
                <div className={`relative z-10 p-4 rounded-2xl mb-4 transition-all duration-300 ${style.bg} ${style.text} group-hover:scale-110 group-hover:shadow-lg`}>
                  <Icon size={32} strokeWidth={2} />
                </div>
                <span className="relative z-10 text-sm sm:text-base font-bold text-slate-300 group-hover:text-white transition-colors text-center">
                  {opt.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Content for Step 0.5 (Gym Intent)
  const renderStep0_5 = () => {
    return (
      <div className="flex flex-col gap-8 animate-slide-in max-w-5xl mx-auto w-full mt-4 sm:mt-10">
        <div className="text-center space-y-2 mb-8">
          <h3 className="text-3xl sm:text-4xl font-black text-white">Bạn muốn làm gì?</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10">
          <div
            onClick={() => {
              setGymIntent('plan');
              setStep(0.75);
            }}
            className="aspect-square flex flex-col items-center justify-center p-6 sm:p-10 rounded-[3rem] cursor-pointer transition-all duration-300 border-2 border-slate-700 hover:border-sky-500 hover:bg-sky-500/10 bg-slate-900/50 group text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center mb-6 sm:mb-8 group-hover:scale-110 transition-transform shadow-xl shadow-sky-500/20">
              <Target className="w-12 h-12 sm:w-16 sm:h-16" />
            </div>
            <h4 className="text-2xl sm:text-4xl font-black text-white mb-2 sm:mb-4">Lên Kế Hoạch</h4>
            <p className="text-sm sm:text-base text-slate-400 px-2 sm:px-6 leading-relaxed font-medium">Tạo giáo án luyện tập. Có thể sử dụng AI Coach.</p>
          </div>

          <div
            onClick={() => {
              setGymIntent('log');
              setStep(0.75);
            }}
            className="aspect-square flex flex-col items-center justify-center p-6 sm:p-10 rounded-[3rem] cursor-pointer transition-all duration-300 border-2 border-slate-700 hover:border-emerald-500 hover:bg-emerald-500/10 bg-slate-900/50 group text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 sm:mb-8 group-hover:scale-110 transition-transform shadow-xl shadow-emerald-500/20">
              <Check className="w-12 h-12 sm:w-16 sm:h-16" />
            </div>
            <h4 className="text-2xl sm:text-4xl font-black text-white mb-2 sm:mb-4">Đã Tập Xong</h4>
            <p className="text-sm sm:text-base text-slate-400 px-2 sm:px-6 leading-relaxed font-medium">Ghi nhận đầy đủ thông số cho một buổi tập đã hoàn thành.</p>
          </div>
        </div>
      </div>
    );
  };

  // Content for Step 0.75 (Gym Location)
  const renderStep0_75 = () => {
    return (
      <div className="flex flex-col gap-8 animate-slide-in max-w-5xl mx-auto w-full mt-4 sm:mt-10">
        <div className="text-center space-y-2 mb-8">
          <h3 className="text-3xl sm:text-4xl font-black text-white">Bạn tập ở đâu?</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10">
          <div
            onClick={() => {
              setGymLocation('gym');
              setSelectedEquipment(['bodyweight', 'dumbbells', 'bands', 'pull_up_bar', 'cables', 'machines', 'barbell']); // Assume full equipment for now
              setStep(gymIntent === 'plan' ? 1.25 : 1.5); // Skip equipment selection since it's full equipment
            }}
            className="aspect-square flex flex-col items-center justify-center p-6 sm:p-10 rounded-[3rem] cursor-pointer transition-all duration-300 border-2 border-slate-700 hover:border-indigo-500 hover:bg-indigo-500/10 bg-slate-900/50 group text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 sm:mb-8 group-hover:scale-110 transition-transform shadow-xl shadow-indigo-500/20">
              <Dumbbell className="w-12 h-12 sm:w-16 sm:h-16" />
            </div>
            <h4 className="text-2xl sm:text-4xl font-black text-white mb-2 sm:mb-4">Phòng Gym</h4>
            <p className="text-sm sm:text-base text-slate-400 px-2 sm:px-6 leading-relaxed font-medium">Đầy đủ dụng cụ & thiết bị luyện tập chuyên nghiệp.</p>
          </div>

          <div
            onClick={() => {
              setGymLocation('home');
              setStep(1); // Go to equipment selection
            }}
            className="aspect-square flex flex-col items-center justify-center p-6 sm:p-10 rounded-[3rem] cursor-pointer transition-all duration-300 border-2 border-slate-700 hover:border-orange-500 hover:bg-orange-500/10 bg-slate-900/50 group text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center mb-6 sm:mb-8 group-hover:scale-110 transition-transform shadow-xl shadow-orange-500/20">
              <Activity className="w-12 h-12 sm:w-16 sm:h-16" />
            </div>
            <h4 className="text-2xl sm:text-4xl font-black text-white mb-2 sm:mb-4">Ở Nhà</h4>
            <p className="text-sm sm:text-base text-slate-400 px-2 sm:px-6 leading-relaxed font-medium">Chỉ có các dụng cụ cơ bản (tạ đơn) hoặc tập không tạ (bodyweight).</p>
          </div>
        </div>
      </div>
    );
  };

    // Content for Step 1
  const renderStep1 = () => {
    if (activityType === 'gym') {
      return (
        <div className="animate-slide-in max-w-5xl mx-auto w-full mt-4 sm:mt-8">
          <div className="text-center space-y-2 mb-8 sm:mb-10">
            <h3 className="text-3xl sm:text-4xl font-black text-white">Thiết lập Dụng cụ</h3>
            <p className="text-sm sm:text-base text-slate-400 font-medium">Hãy cho AI biết bạn đang có những gì để lên giáo án chuẩn nhất.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div className="w-full space-y-6 bg-slate-900/40 p-6 sm:p-8 rounded-[2.5rem] border border-slate-800 shadow-xl">
              <label className="text-lg font-black text-white flex items-center gap-3 mb-4"><Dumbbell size={24} className="text-rose-400"/> Dụng cụ hiện có</label>
              <EquipmentSelector 
                value={selectedEquipment} 
                onChange={setSelectedEquipment}
                options={[
                  { value: 'bodyweight', label: 'Cơ thể (Bodyweight)' },
                  { value: 'dumbbells', label: 'Tạ đơn (Dumbbells)' }
                ]}
                theme={theme}
              />
            </div>

            {selectedEquipment.includes('dumbbells') ? (
              <div className="w-full space-y-8 p-6 sm:p-8 rounded-[2.5rem] bg-slate-800/40 border border-slate-700/50 animate-fade-in shadow-inner backdrop-blur-sm">
                <label className="text-lg font-black text-white flex items-center gap-3"><Target size={24} className="text-orange-400"/> Chi tiết Tạ đơn</label>
                
                <div className="space-y-4">
                  <label className="text-sm font-semibold text-slate-300">Trọng lượng mỗi tạ:</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={dumbbellWeight}
                      onChange={(e) => setDumbbellWeight(Number(e.target.value))}
                      className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl px-6 py-4 text-xl font-black text-white outline-none focus:border-rose-500 focus:shadow-[0_0_20px_rgba(244,63,94,0.2)] transition-all placeholder:text-slate-600 text-center"
                      placeholder="VD: 10"
                      min="1"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                      kg
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 font-medium text-center italic mt-2">
                    *Hệ thống mặc định bạn đang có 2 tạ (1 cặp).
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full hidden md:flex flex-col items-center justify-center p-8 rounded-[2.5rem] bg-slate-800/10 border border-slate-700/30 border-dashed text-slate-500 text-center">
                <Dumbbell size={48} className="mb-4 opacity-20" />
                <p className="font-medium text-sm">Chọn "Tạ đơn" để thiết lập chi tiết</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-in">
        {/* Left Column: Form Controls */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">

            {['swimming', 'running', 'cycling'].includes(activityType) && (
              <div className="space-y-2 animate-fade-in w-full sm:w-1/2">
                <label className="flex justify-between items-center text-sm font-semibold text-slate-300">
                  <span>Khoảng cách ({activityType === 'swimming' ? 'mét' : 'km'})</span>
                  {distance !== '' && Number(distance) > 0 && (
                    <span className="text-emerald-400 text-[10px] font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      Pace: {
                        activityType === 'swimming' 
                        ? `${Math.floor((duration * 60) / (Number(distance) / 100) / 60)}:${Math.floor((duration * 60) / (Number(distance) / 100) % 60).toString().padStart(2, '0')}/100m`
                        : activityType === 'running'
                        ? `${Math.floor(duration / Number(distance))}:${Math.floor((duration / Number(distance) % 1) * 60).toString().padStart(2, '0')}/km`
                        : `${(Number(distance) / (duration / 60)).toFixed(1)} km/h`
                      }
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={activityType === 'swimming' ? "VD: 1500" : "VD: 5.0"}
                  step={activityType === 'swimming' ? "50" : "0.1"}
                  min="0"
                  className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl p-3 text-sm font-semibold text-white outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            )}
          </div>

          {activityType === 'football' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400">Loại sân</label>
                <PillSelector 
                  value={footballPitchSize} 
                  onChange={(val: FootballPitchSize) => setFootballPitchSize(val)}
                  options={[
                    { value: '5v5', label: 'Sân 5' },
                    { value: '7v7', label: 'Sân 7' },
                    { value: '11v11', label: 'Sân 11' }
                  ]}
                  theme={theme}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400">Vị trí thi đấu (Tối đa 3)</label>
                <MultiPillSelector 
                  value={footballPositions} 
                  onChange={(val: any) => setFootballPositions(val)}
                  options={[
                    { value: 'striker', label: 'Tiền đạo' },
                    { value: 'midfielder', label: 'Tiền vệ' },
                    { value: 'defender', label: 'Hậu vệ' },
                    { value: 'goalkeeper', label: 'Thủ môn' }
                  ]}
                  theme={theme}
                  maxSelections={3}
                />
              </div>
              {/* Show percentage sliders if > 1 position selected */}
              {footballPositions.length > 1 && (
                <PositionPercentageSliders
                  value={footballPositions}
                  onChange={(val: any) => setFootballPositions(val)}
                  options={[
                    { value: 'striker', label: 'Tiền đạo' },
                    { value: 'midfielder', label: 'Tiền vệ' },
                    { value: 'defender', label: 'Hậu vệ' },
                    { value: 'goalkeeper', label: 'Thủ môn' }
                  ]}
                  theme={theme}
                />
              )}
              {/* Show heading toggle only for striker/defender */}
              {footballPositions.some(p => p.position === 'striker' || p.position === 'defender') && (
                <div className="col-span-full mt-2 flex items-center justify-between p-3 bg-slate-900/50 border border-slate-700/50 rounded-xl">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-300">Có đánh đầu</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFootballIncludesHeading(!footballIncludesHeading)}
                    className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${
                      footballIncludesHeading ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`absolute w-5 h-5 bg-white rounded-full transition-transform transform ${
                        footballIncludesHeading ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>
          )}

          {activityType === 'swimming' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400">Kiểu bơi chính</label>
                <PillSelector 
                  value={swimmingStroke} 
                  onChange={(val: SwimmingStroke) => setSwimmingStroke(val)}
                  options={[
                    { value: 'freestyle', label: 'Bơi Sải' },
                    { value: 'breaststroke', label: 'Bơi Ếch' },
                    { value: 'butterfly', label: 'Bơi Bướm' },
                    { value: 'backstroke', label: 'Bơi Ngửa' }
                  ]}
                  theme={theme}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400">Môi trường</label>
                <PillSelector 
                  value={swimmingEnvironment} 
                  onChange={(val: SwimmingEnvironment) => setSwimmingEnvironment(val)}
                  options={[
                    { value: 'pool', label: 'Hồ bơi' },
                    { value: 'open_water', label: 'Nước mở/Biển' }
                  ]}
                  theme={theme}
                />
              </div>
            </div>
          )}

          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="flex justify-between text-sm font-semibold text-slate-300 mb-3">
                <span>Thời lượng</span>
                <span className={`${theme.color} px-2 py-0.5 rounded font-bold`} style={{ backgroundColor: `${theme.hex}20` }}>{duration} phút</span>
              </label>
              <input
                type="range"
                min="10"
                max="180"
                step="5"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-700 custom-duration-range"
                style={{
                  background: `linear-gradient(to right, ${theme.hex} ${((duration - 10) / 170) * 100}%, #334155 ${((duration - 10) / 170) * 100}%)`
                }}
              />
              <style>{`
                .custom-duration-range::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  appearance: none;
                  width: 16px;
                  height: 16px;
                  border-radius: 50%;
                  background: #fff;
                  cursor: pointer;
                  border: 3px solid ${theme.hex};
                  box-shadow: 0 0 10px ${theme.hex}80;
                }
              `}</style>
            </div>

            <div>
              <label className="flex justify-between text-sm font-semibold text-slate-300 mb-1">
                <span>Cường độ (RPE)</span>
              </label>
              <DynamicGlowSlider
                min={1}
                max={10}
                value={intensity}
                onChange={(val: number) => setIntensity(val)}
              />
              <p className="text-[10px] font-medium text-slate-400 mt-1 text-center">
                {getIntensityLabel(intensity)}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: BodyMap */}
        <div className="space-y-4 flex flex-col h-full">
          <div className="flex justify-between items-end">
            <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Target size={16} className="text-indigo-400" />
              Vùng cơ chịu tải
            </label>
          </div>
          
          <div className="bg-black/20 rounded-2xl p-2 border border-slate-800/50 shadow-inner flex justify-center items-start flex-1 overflow-hidden h-[320px] sm:h-[380px]">
            <div className="transform scale-[0.65] sm:scale-75 origin-top mt-2">
              <BodyMap
                selectedMuscles={targetMuscles}
                onMuscleClick={handleMuscleToggle}
                interactive={true}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Content for Step 1.25 (Gym Exercise Selection)
  const renderStep1_25 = () => {

    const displayedExercises = GYM_EXERCISES.filter(ex => {
      const matchSearch = ex.name.toLowerCase().includes(gymSearchTerm.toLowerCase());
      const matchEquipment = ex.equipment.some(eq => selectedEquipment.includes(eq));
      const matchFilter = gymFilterType === 'all' || ex.movement_type.toLowerCase() === gymFilterType.toLowerCase();
      
      if (!matchSearch || !matchEquipment || !matchFilter) return false;
      if (gymTab === 'recent') {
        return recentExerciseIds.includes(ex.id);
      }
      return true;
    });

    return (
      <div className="flex flex-col sm:flex-row h-[500px] sm:h-[550px] animate-slide-in gap-4 sm:gap-6">
        
        {/* Left Sidebar (Nav & Search) */}
        <div className="flex flex-col shrink-0 w-full sm:w-48 md:w-56 gap-3 sm:gap-4">
          {/* Gym Tabs */}
          <div className="flex sm:flex-col bg-slate-900/50 p-1.5 sm:p-2 rounded-2xl border border-slate-800/50 shrink-0 gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setGymTab('all')}
              className={`flex-1 flex items-center sm:justify-start justify-center gap-2 py-2.5 sm:py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${gymTab === 'all' ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
            >
              <LayoutGrid size={18} className="shrink-0" /> <span className="truncate">Tất cả</span>
            </button>
            <button
              type="button"
              onClick={() => setGymTab('groups')}
              className={`flex-1 flex items-center sm:justify-start justify-center gap-2 py-2.5 sm:py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${gymTab === 'groups' ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
            >
              <Bookmark size={18} className="shrink-0" /> <span className="truncate">Nhóm của tôi</span>
            </button>
            <button
              type="button"
              onClick={() => setGymTab('recent')}
              className={`flex-1 flex items-center sm:justify-start justify-center gap-2 py-2.5 sm:py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${gymTab === 'recent' ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
            >
              <Clock size={18} className="shrink-0" /> <span className="truncate">Gần đây</span>
            </button>
          </div>

          {/* Search Bar & Quick Filters */}
          {gymTab !== 'groups' && (
            <div className="space-y-3 shrink-0">
              <div className="flex gap-2 w-full">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Tìm bài tập..."
                    value={gymSearchTerm}
                    onChange={(e) => setGymSearchTerm(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl pl-11 pr-4 py-3.5 sm:py-4 text-xs sm:text-sm font-semibold text-white outline-none focus:border-rose-500 transition-colors shadow-inner"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                </div>
                <button
                  type="button"
                  onClick={handleAiCoach}
                  className="flex flex-col items-center justify-center bg-indigo-500/20 text-indigo-400 border border-indigo-500/50 rounded-2xl px-3 hover:bg-indigo-500 hover:text-white transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                  title="AI Gợi ý bài tập dựa trên trạng thái cơ bắp"
                >
                  <Bot size={20} className="mb-0.5" />
                  <span className="text-[9px] font-bold">AI Coach</span>
                </button>
              </div>

              {aiMessage && (
                <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-3 text-xs text-indigo-300 relative">
                  <span className="font-bold block mb-1">🤖 AI Huấn Luyện Viên:</span>
                  {aiMessage}
                  <button type="button" onClick={() => setAiMessage(null)} className="absolute top-2 right-2 text-indigo-400/50 hover:text-indigo-400">
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Quick Filters */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {['All', 'Push', 'Pull', 'Squat', 'Hinge', 'Core'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={(e) => { e.preventDefault(); setGymFilterType(type.toLowerCase()); }}
                    className={`px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all border ${gymFilterType === type.toLowerCase() ? 'bg-rose-500 text-white border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]' : 'bg-slate-900/50 text-slate-400 border-slate-700/50 hover:bg-slate-800 hover:text-slate-200'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Content Area (Exercises List) */}
        <div className="flex-1 overflow-y-auto pr-2 border border-slate-800 rounded-2xl p-3 sm:p-5 bg-slate-900/30 custom-scrollbar flex flex-col">
          {gymTab === 'groups' ? (
              <div className="space-y-6">
                {/* Save Group Area */}
                {selectedExercises.length > 0 && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-rose-400 font-bold flex items-center gap-2 text-sm">
                        <BookmarkPlus size={18} /> Lưu {selectedExercises.length} bài đang chọn thành Nhóm
                      </h4>
                    </div>
                    {showNewGroupInput ? (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <input 
                          type="text" 
                          value={newGroupName} 
                          onChange={e => setNewGroupName(e.target.value)}
                          placeholder="Ví dụ: Lưng xô thứ 3..."
                          className="flex-1 bg-black/40 border border-rose-500/30 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-rose-500"
                          autoFocus
                        />
                        <div className="flex items-center gap-2">
                          <button 
                            type="button"
                            onClick={() => {
                              if (!newGroupName.trim()) return;
                              const newGroup = { id: Date.now().toString(), name: newGroupName.trim(), exerciseIds: selectedExercises };
                              saveExerciseGroups([...exerciseGroups, newGroup]);
                              setNewGroupName('');
                              setShowNewGroupInput(false);
                            }}
                            className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold px-4 py-3 rounded-xl text-sm transition-colors"
                          >Lưu</button>
                          <button type="button" onClick={() => setShowNewGroupInput(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-3 rounded-xl text-sm transition-colors">Hủy</button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => setShowNewGroupInput(true)}
                        className="w-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 border-dashed rounded-xl py-3 font-bold text-sm transition-colors flex justify-center items-center gap-2"
                      >
                        <BookmarkPlus size={16} /> Tạo Nhóm Mới
                      </button>
                    )}
                  </div>
                )}

                {/* Group List */}
                {exerciseGroups.length === 0 ? (
                  <div className="text-center py-10 opacity-50">
                    <Bookmark size={48} className="mx-auto mb-4" />
                    <p className="text-sm font-semibold">Sếp chưa có nhóm bài tập nào.<br/>Hãy chọn các bài ở Tab "Tất cả" và lưu thành nhóm mới nhé!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {exerciseGroups.map(group => (
                      <div key={group.id} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 flex flex-col gap-3 group/card transition-colors hover:border-slate-600">
                        <div className="flex justify-between items-center">
                          <h4 className="text-white font-bold text-lg">{group.name}</h4>
                          <button 
                            type="button"
                            onClick={() => {
                              if (window.confirm('Chắc chắn xóa nhóm này?')) {
                                saveExerciseGroups(exerciseGroups.filter(g => g.id !== group.id));
                              }
                            }}
                            className="text-slate-500 hover:text-rose-400 p-2 sm:opacity-0 group-hover/card:opacity-100 transition-all bg-slate-900/50 rounded-lg"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 flex-1 items-start content-start">
                          {group.exerciseIds.map(exId => {
                            const ex = GYM_EXERCISES.find(e => e.id === exId);
                            if (!ex) return null;
                            return (
                              <span key={exId} className="text-[10px] sm:text-xs bg-slate-900/80 text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-700/80">
                                {ex.name.split(' / ')[0]}
                              </span>
                            );
                          })}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            // Merge selection
                            const newSelected = new Set([...selectedExercises, ...group.exerciseIds]);
                            setSelectedExercises(Array.from(newSelected));
                          }}
                          className="mt-2 w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl text-xs sm:text-sm transition-colors flex items-center justify-center gap-2"
                        >
                          <Check size={16} /> Chọn tất cả vào buổi tập
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : displayedExercises.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {displayedExercises.map(ex => {
                  const isSelected = selectedExercises.includes(ex.id);
                  return (
                    <div 
                      key={ex.id}
                      onClick={() => setSelectedExercises(prev => isSelected ? prev.filter(id => id !== ex.id) : [...prev, ex.id])}
                      className={`group relative flex flex-col cursor-pointer rounded-2xl overflow-hidden border transition-all duration-300 ${isSelected ? 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)] scale-[1.02] bg-rose-500/10' : 'border-slate-800 bg-slate-900/50 hover:border-slate-600 hover:scale-[1.01]'}`}
                    >
                      {/* Checkbox indicator */}
                      <div className="absolute top-2 right-2 z-20">
                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center backdrop-blur-md transition-colors ${isSelected ? 'bg-rose-500 border-rose-500 text-white' : 'border-slate-500/50 bg-black/20 text-transparent'}`}>
                          <Check size={14} strokeWidth={3} />
                        </div>
                      </div>

                      {/* Info Button */}
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDetailExercise(ex); }}
                        className="group/btn absolute top-3 left-3 z-20 w-8 h-8 rounded-full bg-black/50 border border-white/20 flex items-center justify-center text-white/90 hover:text-white hover:bg-black/80 hover:scale-110 transition-all shadow-lg backdrop-blur-md"
                      >
                        <Info size={16} />
                        <span className="absolute left-10 opacity-0 group-hover/btn:opacity-100 group-hover/btn:left-12 transition-all bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap pointer-events-none border border-white/10 shadow-lg">
                          Xem chi tiết
                        </span>
                      </button>

                      {/* Image Placeholder */}
                      <div className="w-full aspect-[4/3] bg-slate-800 relative flex items-center justify-center overflow-hidden">
                        {(ex as any).image_url ? (
                          <img 
                            src={(ex as any).image_url} 
                            alt={ex.name} 
                            className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${isSelected ? 'opacity-100' : 'opacity-70 group-hover:opacity-100 mix-blend-luminosity hover:mix-blend-normal'}`}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <Dumbbell size={32} className="text-slate-700 absolute" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent pointer-events-none"></div>
                        <div className="absolute bottom-2 left-2 right-2 z-10 pointer-events-none">
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-black/60 text-rose-300 backdrop-blur-md uppercase tracking-wider border border-white/10">{ex.movement_type}</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-3 flex flex-col flex-1">
                        <h4 className={`text-sm font-bold leading-tight mb-2 line-clamp-2 ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                          {ex.name}
                        </h4>
                        <div className="mt-auto">
                          <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">
                            {Object.keys(ex.muscle_mapping).filter(k => typeof (ex.muscle_mapping as any)[k] === 'number').map(m => MUSCLE_LABELS[m as MuscleGroup] || m).join(', ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-3">
                <Dumbbell size={48} className="opacity-20" />
                <p>Không tìm thấy bài tập phù hợp</p>
              </div>
            )}
          </div>
      </div>
    );
  };

  // Content for Step 1.3: Detailed Sets & Reps
  const renderStep1_3 = () => {
    const updateSet = (exerciseId: string, setIndex: number, field: keyof ExerciseSet, value: number) => {
      setDetailedExercises(prev => prev.map(ex => {
        if (ex.exerciseId !== exerciseId) return ex;
        const newSets = [...ex.sets];
        newSets[setIndex] = { ...newSets[setIndex], [field]: value };
        return { ...ex, sets: newSets };
      }));
    };

    const addSet = (exerciseId: string) => {
      setDetailedExercises(prev => prev.map(ex => {
        if (ex.exerciseId !== exerciseId) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet = lastSet ? { ...lastSet } : { reps: 0, weight: 0, rpe: 7 };
        return { ...ex, sets: [...ex.sets, newSet] };
      }));
    };

    const removeSet = (exerciseId: string, setIndex: number) => {
      setDetailedExercises(prev => prev.map(ex => {
        if (ex.exerciseId !== exerciseId) return ex;
        return { ...ex, sets: ex.sets.filter((_, i) => i !== setIndex) };
      }));
    };

    return (
      <div className="flex flex-col gap-6 animate-slide-in max-w-lg mx-auto">
        <div className="text-center mb-2">
          <h3 className="text-lg font-bold text-white mb-1">Chi Tiết Sets & Reps</h3>
          <p className="text-[11px] sm:text-xs text-slate-400">Điều chỉnh mức tạ, số lần lặp và RPE cho từng bài tập. Dữ liệu mặc định được lấy từ buổi tập gần nhất của bạn.</p>
        </div>

        <div className="space-y-4">
          {detailedExercises.map(ex => (
            <div key={ex.exerciseId} className="bg-slate-900/40 border border-slate-800 rounded-3xl p-4 sm:p-5 overflow-hidden shadow-lg">
              <h4 className="font-bold text-sm text-rose-400 mb-4 flex items-center gap-2">
                <Dumbbell size={16} /> {ex.name.split(' / ')[0]}
              </h4>
              <div className="space-y-3">
                {ex.sets.map((set, idx) => (
                  <div key={idx} className="flex flex-wrap items-end gap-2 sm:gap-3 bg-slate-800/30 p-2.5 sm:p-3 rounded-2xl relative group">
                    <div className="w-6 text-center text-[10px] font-bold text-slate-500 mt-1 sm:mt-0 flex-shrink-0 pt-2">
                      #{idx + 1}
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-[120px]">
                      <div className="flex flex-col flex-1">
                        <label className="text-[10px] font-semibold text-slate-500 mb-1 pl-1">Kg {ex.isBodyweight ? '(Tạ thêm)' : ''}</label>
                        <input 
                          type="number" min="0" step="0.5"
                          value={set.weight}
                          onChange={e => updateSet(ex.exerciseId, idx, 'weight', parseFloat(e.target.value) || 0)}
                          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 sm:py-2.5 text-xs sm:text-sm text-white focus:border-rose-500 w-full outline-none"
                        />
                      </div>
                      <span className="text-slate-600 font-black mt-4">x</span>
                      <div className="flex flex-col flex-1">
                        <label className="text-[10px] font-semibold text-slate-500 mb-1 pl-1">Reps</label>
                        <input 
                          type="number" min="0"
                          value={set.reps}
                          onChange={e => updateSet(ex.exerciseId, idx, 'reps', parseInt(e.target.value) || 0)}
                          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 sm:py-2.5 text-xs sm:text-sm text-white focus:border-rose-500 w-full outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:w-auto w-full">
                      <div className="flex flex-col flex-1 sm:w-20 pl-8 sm:pl-0">
                        <label className="text-[10px] font-semibold text-slate-500 mb-1 pl-1 flex justify-between">
                          RPE
                          <span className="text-[9px] text-slate-600 hidden sm:inline">(1-10)</span>
                        </label>
                        <input 
                          type="number" min="1" max="10"
                          value={set.rpe || 7}
                          onChange={e => updateSet(ex.exerciseId, idx, 'rpe', parseInt(e.target.value) || 7)}
                          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 sm:py-2.5 text-xs sm:text-sm text-white focus:border-rose-500 w-full outline-none"
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeSet(ex.exerciseId, idx)}
                        className="mt-4 p-2 sm:p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                <button 
                  type="button"
                  onClick={() => addSet(ex.exerciseId)}
                  className="w-full mt-3 py-3 border border-dashed border-slate-600 hover:border-rose-500/50 text-slate-400 hover:text-rose-300 rounded-xl text-[11px] sm:text-xs font-bold bg-slate-800/30 hover:bg-rose-500/10 flex justify-center items-center gap-2 transition-colors"
                >
                  <Plus size={14} /> Thêm Set
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

// Content for Step 1.5 (Gym BodyMap & Duration)
  const renderStep1_5 = () => {
    return (
      <div className="flex flex-col gap-6 animate-slide-in max-w-lg mx-auto">
        {/* Top: BodyMap */}
        <div className="space-y-4 flex flex-col h-[350px] sm:h-[400px]">
          <div className="flex justify-between items-end shrink-0">
            <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Target size={18} className="text-rose-400" />
              Vùng cơ chịu tải
            </label>
          </div>
          
          <div className="bg-black/20 rounded-3xl p-4 border border-slate-800/50 shadow-inner flex justify-center items-start flex-1 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-rose-500/5 to-transparent pointer-events-none"></div>
            <div className="transform scale-[0.75] sm:scale-90 origin-top mt-4 relative z-10">
              <BodyMap
                selectedMuscles={targetMuscles}
                onMuscleClick={handleMuscleToggle}
                interactive={true}
              />
            </div>
          </div>
        </div>

        {/* Bottom: Duration & Intensity */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div>
            <label className="flex justify-between text-sm font-semibold text-slate-300 mb-4">
              <span className="flex items-center gap-2"><Activity size={16} className="text-sky-400"/> Thời lượng</span>
              <span className={`${theme.color} px-2 py-0.5 rounded font-bold`} style={{ backgroundColor: `${theme.hex}20` }}>{duration} phút</span>
            </label>
            <input
              type="range"
              min="10"
              max="180"
              step="5"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-700 custom-duration-range"
              style={{
                background: `linear-gradient(to right, ${theme.hex} ${((duration - 10) / 170) * 100}%, #334155 ${((duration - 10) / 170) * 100}%)`
              }}
            />
          </div>

          <div>
            <label className="flex justify-between text-sm font-semibold text-slate-300 mb-2">
              <span className="flex items-center gap-2"><Activity size={16} className="text-orange-400"/> Cường độ (RPE)</span>
            </label>
            <DynamicGlowSlider
              min={1}
              max={10}
              value={intensity}
              onChange={(val: number) => setIntensity(val)}
            />
            <p className="text-[10px] font-medium text-slate-400 mt-3 text-center">
              {getIntensityLabel(intensity)}
            </p>
          </div>
        </div>
      </div>
    );
  };

// Content for Step 2
  const renderStep2 = () => (
    <div className="space-y-6 sm:space-y-8 animate-slide-in max-w-lg mx-auto">
      {/* SLEEP */}
      <div className="space-y-3 bg-slate-900/40 border border-slate-800 p-4 sm:p-5 rounded-3xl">
        <label className="flex items-center gap-2 text-sm font-black text-white mb-2">
          <Moon size={20} className="text-sky-400" /> Giấc ngủ
        </label>
        <RichSelectionCards 
          value={sleep}
          onChange={setSleep}
          theme={theme}
          options={[
            { value: 'good', label: 'Tốt (7-8h)', icon: Moon, semantic: 'good' },
            { value: 'fair', label: 'Tạm (5-6h)', icon: Moon, semantic: 'fair' },
            { value: 'poor', label: 'Kém (<5h)', icon: Moon, semantic: 'poor' }
          ]}
        />
      </div>

      {/* STRESS */}
      <div className="space-y-3 bg-slate-900/40 border border-slate-800 p-4 sm:p-5 rounded-3xl">
        <label className="flex items-center gap-2 text-sm font-black text-white mb-2">
          <Brain size={20} className="text-purple-400" /> Stress
        </label>
        <RichSelectionCards 
          value={stress}
          onChange={setStress}
          theme={theme}
          options={[
            { value: 'low', label: 'Bình thường', icon: Brain, semantic: 'good' },
            { value: 'high', label: 'Căng thẳng', icon: AlertTriangle, semantic: 'poor' }
          ]}
        />
      </div>

      {/* NUTRITION */}
      <div className="space-y-3 bg-slate-900/40 border border-slate-800 p-4 sm:p-5 rounded-3xl">
        <label className="flex items-center gap-2 text-sm font-black text-white mb-2">
          <Apple size={20} className="text-emerald-400" /> Dinh dưỡng
        </label>
        <RichSelectionCards 
          value={nutrition}
          onChange={setNutrition}
          theme={theme}
          options={[
            { value: 'surplus', label: 'Dư Protein', icon: Apple, semantic: 'good' },
            { value: 'good', label: 'Đủ chất', icon: Apple, semantic: 'good' },
            { value: 'deficit', label: 'Ăn kiêng', icon: Apple, semantic: 'fair' }
          ]}
        />
      </div>
    </div>
  );

  // Content for Step 3
  const renderStep3 = () => (
    <div className="space-y-6 animate-slide-in max-w-lg mx-auto">
      {/* Dynamic Theme Summary Card */}
      <div className={`p-6 rounded-3xl border border-slate-700/50 flex flex-col items-center justify-center text-center space-y-3 bg-slate-900/60 relative overflow-hidden`}>
        <div className={`absolute inset-0 bg-gradient-to-b ${theme.glow} opacity-50`}></div>
        <div className={`relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)] ${theme.bg} animate-[pulse_3s_ease-in-out_infinite]`}>
          <HeaderIcon className="text-white" size={32} strokeWidth={2.5} />
        </div>
        <div className="relative z-10">
          <h3 className={`text-lg sm:text-xl font-black ${theme.color} mb-1`}>Gần xong rồi Sếp!</h3>
          <p className="text-xs sm:text-sm font-medium text-slate-300">Buổi tập <span className="font-bold text-white">{theme.label}</span> đã được ghi nhận vào hệ thống.</p>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-900/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-rose-400">
            <AlertTriangle size={18} /> Chấn thương / Đau nhức
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={hasInjury}
              onChange={(e) => setHasInjury(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-5 after:h-5 after:width-5 after:transition-all peer-checked:bg-rose-500"></div>
          </label>
        </div>

        {hasInjury && (
          <div className="pt-4 border-t border-rose-900/30 space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-3">
                Mức độ đau
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={painScale}
                onChange={(e) => setPainScale(parseInt(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{ 
                  background: `linear-gradient(to right, #f59e0b 0%, #ef4444 100%)` 
                }}
              />
              <div className="text-center text-rose-400 font-bold mt-2">{painScale} / 10</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-3 text-center">
                Chọn cơ đau trên BodyMap
              </label>
              <div className="flex justify-center bg-black/30 rounded-xl p-2 sm:p-4">
                <div className="transform scale-75 sm:scale-90 origin-top">
                  <BodyMap
                    selectedMuscles={injuredMuscles}
                    onMuscleClick={handleInjuredMuscleToggle}
                    interactive={true}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* NOTES */}
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2">Ghi chú</label>
        <textarea
          rows={4}
          placeholder="Hôm nay tập rep cuối hơi cố, cảm thấy hơi nhói..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full p-4 bg-slate-900/60 border border-slate-700/50 rounded-xl text-sm text-white placeholder:text-slate-600 outline-none focus:border-indigo-500 focus:bg-slate-900 transition-all resize-none shadow-inner"
        />
      </div>
    </div>
  );

  const HeaderIcon = step > 0 ? theme.icon : Activity;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Ambient Backdrop Glow */}
      <div className={`absolute inset-0 bg-gradient-to-tr ${step > 0 ? theme.glow : 'from-slate-900/10 via-slate-900/5 to-transparent'} transition-all duration-1000 ease-in-out pointer-events-none`} />
      <div className="absolute inset-0 bg-[#05070a]/80 backdrop-blur-md -z-10" onClick={onClose} />
      
      <div className={`glass-card w-full ${step === 0 || step === 0.5 || step === 0.75 ? 'max-w-4xl' : step === 1 ? 'max-w-5xl' : step === 1.25 ? 'max-w-[95vw] xl:max-w-7xl' : 'max-w-2xl'} relative bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] transition-all duration-300`}>
        
        {/* Header */}
        <div className="p-3 sm:p-4 sm:px-5 border-b border-slate-800/60 flex justify-between items-center bg-slate-900/20 rounded-t-3xl">
          <div className="flex items-center gap-2 sm:gap-3">
            {step > 0 && (
              <button 
                onClick={handleBack} 
                className="p-1.5 sm:p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-transparent hover:border-slate-700"
                title="Quay lại"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <HeaderIcon className={step > 0 ? theme.color : 'text-teal-400'} size={20} /> 
              {step > 0 ? `Ghi nhận: ${theme.label}` : 'Ghi nhận buổi tập'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors bg-slate-900/50">
            <X size={20} />
          </button>
        </div>

        {/* Step Indicator */}
        {step > 0 && (
          <div className="py-2 sm:py-3 flex items-center justify-center gap-4 sm:gap-12 bg-slate-900/10 border-b border-slate-800/40 relative">
            <div className="absolute top-1/2 left-[20%] right-[20%] h-[2px] bg-slate-800 -translate-y-1/2 hidden sm:block" />
          
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex items-center gap-2 relative z-10 bg-slate-900/10 sm:bg-slate-950 px-2 sm:px-4 rounded-full">
              <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                step === num 
                  ? `${theme.bg} text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]` 
                  : step > num 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-slate-800 text-slate-500'
              }`}>
                {step > num ? <Check size={12} strokeWidth={3} /> : num}
              </div>
              <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider hidden sm:block ${
                step === num ? theme.color : 'text-slate-500'
              }`}>
                {num === 1 ? 'Bài tập' : num === 2 ? 'Cơ thể' : 'Hoàn tất'}
              </span>
            </div>
          ))}
          </div>
        )}

        {/* Main Content Area */}
        <div className="p-3 sm:p-4 pb-16 sm:pb-20 overflow-y-auto custom-scrollbar flex-1">
          <form id="activity-form" onSubmit={handleSubmit} className="h-full">
            {step === 0 && renderStep0()}
            {step === 0.5 && renderStep0_5()}
            {step === 0.75 && renderStep0_75()}
            {step === 1 && renderStep1()}
            {step === 1.25 && renderStep1_25()}
            {step === 1.3 && renderStep1_3()}
            {step === 1.5 && renderStep1_5()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </form>
        </div>

        {/* Detail Modal Overlay */}
        {detailExercise && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-[#05070a]/90 backdrop-blur-sm cursor-pointer"
              onClick={() => setDetailExercise(null)}
            ></div>
            
            {/* Content */}
            <div className="relative w-full max-w-sm sm:max-w-md bg-slate-900 border border-slate-700/50 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col animate-scale-in z-10">
              <button 
                onClick={() => setDetailExercise(null)}
                className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 border border-white/10 text-white hover:bg-black/80 hover:scale-110 transition-all backdrop-blur-md"
              >
                <X size={18} />
              </button>
              
              {/* Image */}
              <div className="w-full aspect-video relative bg-slate-800 flex items-center justify-center border-b border-slate-800/50">
                 {(detailExercise as any).image_url ? (
                    <img src={(detailExercise as any).image_url} alt={detailExercise.name} className="w-full h-full object-cover" />
                 ) : (
                    <Dumbbell size={48} className="text-slate-700" />
                 )}
                 <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent pointer-events-none"></div>
              </div>

              {/* Info */}
              <div className="p-5 flex flex-col gap-4">
                <div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-wider mb-2 inline-block">
                    {detailExercise.movement_type}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1">{detailExercise.name.split(' / ')[0]}</h3>
                  {detailExercise.name.includes(' / ') && (
                    <p className="text-xs sm:text-sm text-slate-400 font-medium">{detailExercise.name.split(' / ')[1]}</p>
                  )}
                </div>

                <div className="space-y-3 mt-1">
                  <div className="bg-slate-800/30 rounded-2xl p-3 sm:p-4 border border-slate-700/30">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Target size={14} className="text-emerald-400" /> Nhóm cơ tác động
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(detailExercise.muscle_mapping)
                        .filter(([_, val]) => typeof val === 'number')
                        .sort((a, b) => (b[1] as number) - (a[1] as number))
                        .map(([muscle, value]) => (
                          <span key={muscle} className="text-[11px] font-semibold px-2.5 py-1.5 bg-slate-800/80 text-slate-300 rounded-xl border border-slate-700/50 flex items-center gap-1.5 shadow-sm">
                            {MUSCLE_LABELS[muscle as MuscleGroup] || muscle}
                            <span className="text-[10px] text-emerald-400/90 bg-emerald-500/10 px-1.5 rounded-md">{(value as number * 10).toFixed(0)}</span>
                          </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-800/30 rounded-2xl p-3 sm:p-4 border border-slate-700/30">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Dumbbell size={14} className="text-amber-400" /> Dụng cụ yêu cầu
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {detailExercise.equipment.map(eq => (
                        <span key={eq} className="text-[11px] font-semibold px-2.5 py-1.5 bg-slate-800/80 text-slate-300 rounded-xl border border-slate-700/50 capitalize shadow-sm">
                          {eq.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer actions */}
        {step > 0 && step !== 0.5 && step !== 0.75 && (
          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 border-t border-slate-800/60 flex justify-between gap-3 bg-slate-950/90 backdrop-blur-lg rounded-b-3xl">
            <button 
              type="button" 
              onClick={handleBack} 
              className="px-4 sm:px-5 py-2.5 rounded-xl font-bold text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              <ChevronLeft size={18} /> Quay lại
            </button>

            <div className="flex items-center gap-2 sm:gap-3 ml-auto">
              {step === 1.25 && selectedExercises.length > 0 && gymTab !== 'groups' && (
                <button
                  type="button"
                  onClick={() => {
                    setGymTab('groups');
                    setShowNewGroupInput(true);
                  }}
                  className="px-3 sm:px-4 py-2.5 rounded-xl font-bold text-[11px] sm:text-sm text-rose-300 bg-rose-500/20 hover:bg-rose-500/30 transition-all flex items-center gap-1 sm:gap-2 border border-rose-500/30"
                >
                  <BookmarkPlus size={16} className="hidden sm:block" /> Lưu Nhóm ({selectedExercises.length})
                </button>
              )}

              {step === 1.25 && gymIntent === 'plan' ? (
                <button
                  type="button"
                  onClick={handleSavePlan}
                  className="px-4 sm:px-6 py-2.5 rounded-xl font-bold text-[13px] sm:text-sm text-white bg-sky-500 hover:bg-sky-400 transition-all shadow-lg flex items-center gap-1 sm:gap-2"
                >
                  <Check size={18} /> Lưu Kế Hoạch
                </button>
              ) : step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className={`px-4 sm:px-6 py-2.5 rounded-xl font-bold text-[13px] sm:text-sm text-white transition-all flex items-center gap-1 sm:gap-2 ${theme.bg} hover:opacity-80 shadow-lg`}
                >
                  Tiếp tục <ChevronRight size={18} />
                </button>
              ) : (
                <button
                  type="submit"
                  form="activity-form"
                  className="px-4 sm:px-6 py-2.5 rounded-xl font-bold text-[13px] sm:text-sm text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center gap-1 sm:gap-2"
                >
                  <Check size={18} /> Lưu Nhật Ký
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
