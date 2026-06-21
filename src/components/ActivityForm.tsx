/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, useRef } from 'react';
import type { UserProfile, ActivityLog, MuscleGroup, ActivityType, SleepQuality, MentalStress, NutritionQuality, FootballPitchSize, SwimmingStroke, SwimmingEnvironment, GymExercise, ExerciseGroup, ExerciseSession, ExerciseSet, TrainingStyle, TableTennisFormat, TableTennisStyle } from '../types/recovery.types';
import { MUSCLE_LABELS, TABLE_TENNIS_BASE_MUSCLES } from '../utils/recovery.utils';
import gymExercisesData from '../data/home_workouts.json';

const GYM_EXERCISES = gymExercisesData as GymExercise[];

interface PrecomputedGymExercise extends GymExercise {
  viName: string;
  enName: string;
  topMuscles: string[];
  extraMuscleCount: number;
  searchString: string;
}

const PRECOMPUTED_GYM_EXERCISES: PrecomputedGymExercise[] = GYM_EXERCISES.map(ex => {
  const nameParts = ex.name.split(' / ');
  const mapping = ex.muscle_mapping || {};
  const topMuscles = Object.entries(mapping)
    .filter(([, val]) => typeof val === 'number')
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 2)
    .map(([m]) => MUSCLE_LABELS[m as MuscleGroup] || m);
  const extraMuscleCount = Object.keys(mapping).filter(k => typeof (mapping as any)[k] === 'number').length - 2;

  return {
    ...ex,
    viName: nameParts.length > 1 ? nameParts[1] : nameParts[0],
    enName: nameParts.length > 1 ? nameParts[0] : '',
    topMuscles,
    extraMuscleCount: extraMuscleCount > 0 ? extraMuscleCount : 0,
    searchString: ex.name.toLowerCase()
  };
});

import BodyMap from './BodyMap';
import {
  ArrowLeft, Trash2, Clock, Check, ChevronRight, ChevronLeft, Dumbbell, Activity, Zap, Target, Brain, Flame, Info, Moon, Apple, AlertTriangle, Plus, Search, ShieldAlert, LayoutGrid, Bookmark, BookmarkPlus, X, Compass, Waves, Footprints, Trophy, Bot, SlidersHorizontal, Timer, Box, Layout, Map as MapIcon, Handshake, Hand, Shield, Pin, PinOff
} from 'lucide-react';
import { buildDetailedExercisesForIds, generateDetailedWorkout } from '../utils/aiWorkoutGenerator';
import { calculateRecoveryTime, FOOTBALL_POSITION_MATRIX } from '../utils/recoveryAlgorithm';
import type { RecoveryInput } from '../utils/recoveryAlgorithm';
import { fetchCurrentWeather } from '../services/weather.service';

const ACTIVITY_OPTIONS = [
  { value: 'gym', label: 'Tập Gym / Nâng tạ', icon: Dumbbell },
  { value: 'football', label: 'Đá bóng', icon: Trophy },
  { value: 'running', label: 'Chạy bộ', icon: Footprints },
  { value: 'swimming', label: 'Bơi lội', icon: Waves },
  { value: 'basketball', label: 'Bóng rổ', icon: Target },
  { value: 'table_tennis', label: 'Bóng bàn', icon: Activity },
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
    table_tennis: {
      color: 'text-pink-400', bg: 'bg-pink-500', icon: Activity, label: 'Bóng bàn',
      hex: '#ec4899',
      pillActive: 'bg-pink-500/20 border-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.3)] text-pink-300',
      glow: 'from-pink-500/10 via-pink-500/5 to-transparent'
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
            className={`flex-1 min-w-fit flex items-center justify-center px-2 py-2.5 rounded-xl cursor-pointer transition-all border text-[10px] sm:text-xs font-semibold text-center ${isSelected ? theme.pillActive : 'bg-slate-900/50 border-slate-700/50 hover:bg-slate-800 text-slate-400'
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
    } else {
      const newArr = [...value];
      newArr[idx].percentage = newVal;

      const otherIndices = newArr.map((_, i) => i).filter(i => i !== idx);
      const remainingTotal = 100 - newVal;
      const otherOldTotal = otherIndices.reduce((sum, i) => sum + newArr[i].percentage, 0);

      if (otherOldTotal === 0) {
        const share = Math.floor(remainingTotal / otherIndices.length);
        let currentSum = 0;
        otherIndices.forEach((i, loopIdx) => {
          if (loopIdx === otherIndices.length - 1) {
            newArr[i].percentage = remainingTotal - currentSum;
          } else {
            newArr[i].percentage = share;
            currentSum += share;
          }
        });
      } else {
        let currentSum = 0;
        otherIndices.forEach((i, loopIdx) => {
          if (loopIdx === otherIndices.length - 1) {
            newArr[i].percentage = remainingTotal - currentSum;
          } else {
            const ratio = newArr[i].percentage / otherOldTotal;
            const share = Math.floor(remainingTotal * ratio);
            newArr[i].percentage = share;
            currentSum += share;
          }
        });
      }
      onChange(newArr);
    }
  };

  const hexColor = theme?.hex || '#10b981';

  return (
    <div className="space-y-6 mt-4 p-6 sm:p-10 bg-slate-900/60 rounded-[2rem] border-2 border-slate-700/50 backdrop-blur-md col-span-full shadow-2xl relative overflow-hidden group">
      <style>{`
        .aaa-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          border: 4px solid ${hexColor};
          box-shadow: 0 0 10px ${hexColor};
          transition: transform 0.1s;
        }
        .aaa-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        @media (min-width: 640px) {
          .aaa-slider::-webkit-slider-thumb {
            width: 36px;
            height: 36px;
            border-width: 6px;
          }
        }
      `}</style>
      {/* Background glow effect */}
      <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${theme?.glow || 'from-emerald-500/10 via-emerald-500/5 to-transparent'}`}></div>

      <div className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-400 mb-4 relative z-10">Tỉ lệ thời gian:</div>
      <div className="space-y-6 sm:space-y-8 relative z-10">
        {value.map((v: any, idx: number) => {
          const opt = options.find((o: any) => o.value === v.position);
          return (
            <div key={v.position} className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center text-sm sm:text-lg font-black uppercase tracking-wider">
                <span className="text-slate-300 drop-shadow-md">{opt?.label}</span>
                <span className={`${theme?.color || "text-emerald-400"} drop-shadow-[0_0_8px_currentColor] text-xl sm:text-2xl`}>{v.percentage}%</span>
              </div>

              <div className="relative pt-2 pb-2">
                <div
                  className="absolute inset-0 blur-xl opacity-30 pointer-events-none transition-all duration-300"
                  style={{
                    background: `radial-gradient(circle at ${v.percentage}% 50%, ${hexColor}, transparent 70%)`
                  }}
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={v.percentage}
                  onChange={(e) => handleSliderChange(idx, parseInt(e.target.value))}
                  className="aaa-slider w-full h-3 sm:h-4 rounded-xl appearance-none cursor-pointer bg-slate-800 shadow-inner relative z-10"
                  style={{
                    background: `linear-gradient(to right, ${hexColor} ${v.percentage}%, #1e293b ${v.percentage}%)`,
                    boxShadow: `inset 0 2px 4px rgba(0,0,0,0.5), 0 0 15px ${hexColor}40`
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
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
            className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl cursor-pointer transition-all duration-300 border relative overflow-hidden group ${isActive
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
  _profile: UserProfile | null;
  logs: ActivityLog[];
  simulatedTime?: number;
  initialTimeMode?: 'now' | 'yesterday' | 'custom';
  exerciseGroups: ExerciseGroup[];
  saveExerciseGroups: (groups: ExerciseGroup[]) => void;
  muscleStates: Record<MuscleGroup, number>;
  onSubmit: (log: Omit<ActivityLog, 'id' | 'timestamp'> & { status?: 'planned' | 'completed', id?: string, timestamp?: number }) => void;
  onClose: () => void;
  initialLog?: ActivityLog;
  initialStep?: number;
}

const ExerciseImageThumbnail = ({ imageUrl, name }: { imageUrl?: string; name: string }) => {
  const [hasError, setHasError] = useState(false);

  // Reset error when imageUrl changes
  useEffect(() => setHasError(false), [imageUrl]);

  if (!imageUrl || hasError) {
    return (
      <div className="w-14 h-14 shrink-0 rounded-xl border border-slate-700 bg-slate-800 shadow-md flex items-center justify-center text-slate-500">
        <Dumbbell size={20} />
      </div>
    );
  }

  return (
    <div className="w-14 h-14 shrink-0 rounded-xl overflow-hidden border border-slate-700 bg-slate-800 shadow-md bg-slate-900">
      <img
        src={imageUrl}
        alt={name}
        className="w-full h-full object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  );
};

export default function ActivityForm({ _profile, logs, simulatedTime = Date.now(), initialTimeMode = 'now', exerciseGroups, saveExerciseGroups, muscleStates, onSubmit, onClose, initialLog, initialStep = 0 }: ActivityFormProps) {
  const getInitialState = () => {
    if (initialLog) return { type: initialLog.activityType, step: initialStep };
    return { type: 'gym' as ActivityType, step: initialStep };
  };

  const initialState = getInitialState();
  const [step, setStep] = useState<number>(initialState.step);
  const [activityType, setActivityType] = useState<ActivityType>(initialState.type);
  const [pinnedActivities, setPinnedActivities] = useState<ActivityType[]>(() => {
    try {
      const stored = localStorage.getItem('pinnedActivities');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [gymIntent, setGymIntent] = useState<'plan' | 'log'>('log');
  const [gymLocation, setGymLocation] = useState<'gym' | 'home' | null>(null);
  const theme = getActiveTheme(activityType);
  const [footballPitchSize, setFootballPitchSize] = useState<FootballPitchSize>('5v5');
  const [footballMatchType, setFootballMatchType] = useState<'training' | 'friendly' | 'tournament'>(initialLog?.footballMatchType || 'friendly');
  const [footballPositions, setFootballPositions] = useState<any[]>([{ position: 'midfielder', percentage: 100 }]);
  const [footballIncludesHeading, setFootballIncludesHeading] = useState<boolean>(false);
  const [swimmingStroke, setSwimmingStroke] = useState<SwimmingStroke>('freestyle');
  const [swimmingEnvironment, setSwimmingEnvironment] = useState<SwimmingEnvironment>('pool');
  const [distance, setDistance] = useState<number | ''>(initialLog?.distance || '');
  const [duration, setDuration] = useState<number>(initialLog?.duration || 60);
  const [intensity, setIntensity] = useState<number>(initialLog?.intensity || 7);
  const [trainingStyle, setTrainingStyle] = useState<TrainingStyle>(initialLog?.trainingStyle || 'hypertrophy');
  const [tableTennisFormat, setTableTennisFormat] = useState<TableTennisFormat>(initialLog?.tableTennisFormat || 'singles');
  const [tableTennisStyle, setTableTennisStyle] = useState<TableTennisStyle>(initialLog?.tableTennisStyle || 'all_round');
  const aiModalTrackRef = useRef<HTMLDivElement>(null);

  // Retroactive Logging State
  const [timeMode, setTimeMode] = useState<'now' | 'yesterday' | 'custom'>(initialTimeMode);
  const [customTimestamp, setCustomTimestamp] = useState<number>(simulatedTime);

  // Sync customTimestamp initially if simulatedTime changes
  useEffect(() => {
    if (timeMode === 'now') {
      setCustomTimestamp(simulatedTime);
    }
  }, [simulatedTime, timeMode]);

  const scrollAiModal = (dir: 'left' | 'right') => {
    if (aiModalTrackRef.current) {
      const scrollAmount = aiModalTrackRef.current.clientWidth * 0.8;
      aiModalTrackRef.current.scrollBy({ left: dir === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  // Weather State
  const [weather, setWeather] = useState<ActivityLog['weather']>(initialLog?.weather);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const handleFetchWeather = () => {
    if (!navigator.geolocation) {
      setWeatherError('Trình duyệt không hỗ trợ vị trí.');
      return;
    }

    setIsFetchingWeather(true);
    setWeatherError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const data = await fetchCurrentWeather(position.coords.latitude, position.coords.longitude);
          setWeather(data);
        } catch (err) {
          setWeatherError('Lỗi tải dữ liệu thời tiết.');
        } finally {
          setIsFetchingWeather(false);
        }
      },
      () => {
        setWeatherError('Vui lòng cấp quyền vị trí.');
        setIsFetchingWeather(false);
      }
    );
  };

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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [gymAdvDifficulty, setGymAdvDifficulty] = useState<string>('all');
  const [gymAdvMuscle, setGymAdvMuscle] = useState<string>('all');
  const [gymAdvMeasureType, setGymAdvMeasureType] = useState<string>('all');
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [detailedExercises, setDetailedExercises] = useState<ExerciseSession[]>(initialLog?.detailedExercises || []);
  const [isProMode, setIsProMode] = useState<boolean>(false);
  const [explainModal, setExplainModal] = useState<'failure' | 'rir' | null>(null);
  const [showAiStyleModal, setShowAiStyleModal] = useState<boolean>(false);
  const [autoFillTrigger, setAutoFillTrigger] = useState<number>(0);
  const [formRatingMode, setFormRatingMode] = useState<'exercise' | 'set'>('exercise');
  const [activeDetailExId, setActiveDetailExId] = useState<string | null>(null);

  const [visibleCount, setVisibleCount] = useState<number>(18);

  useEffect(() => {
    setVisibleCount(18);
  }, [gymSearchTerm, gymFilterType, gymTab, gymAdvDifficulty, gymAdvMuscle, gymAdvMeasureType]);

  // 1. Thêm useRef để lưu lại cấu hình của lần render trước
  const prevConfigRef = useRef({ trainingStyle, dumbbellWeight, gymLocation });

  useEffect(() => {
    if (activityType !== 'gym') return;

    // 2. Kiểm tra xem có phải thay đổi cấu hình toàn cục không?
    // ĐƯA RA NGOÀI VÒNG LẶP ĐỂ KHÔNG BỊ REACT STRICT MODE LÀM SAI LỆCH KẾT QUẢ
    const isConfigChanged =
      prevConfigRef.current.trainingStyle !== trainingStyle ||
      prevConfigRef.current.dumbbellWeight !== dumbbellWeight ||
      prevConfigRef.current.gymLocation !== gymLocation;

    // Cập nhật lại ref ngay lập tức nếu có thay đổi
    if (isConfigChanged) {
      prevConfigRef.current = { trainingStyle, dumbbellWeight, gymLocation };
    }

    setDetailedExercises(prev => {
      // 3. Nếu cấu hình đổi -> Xóa map để tính lại hết. Nếu chỉ thêm bài tập -> Giữ map.
      const existingMap = isConfigChanged
        ? new Map()
        : new Map(prev.map(ex => [ex.exerciseId, ex]));

      // Fix lỗi Unexpected any
      const muscleStateRecord = {} as Record<MuscleGroup, number>;
      if (muscleStates) {
        muscleStates.forEach(m => {
          muscleStateRecord[m.muscle] = m.recoveryLevel;
        });
      }

      const newDetailed = buildDetailedExercisesForIds(
        selectedExercises,
        existingMap,
        GYM_EXERCISES,
        muscleStateRecord,
        _profile,
        logs,
        dumbbellWeight,
        trainingStyle,
        gymLocation
      );

      // We don't want an infinite loop. So we only update if the new array is different from prev.
      // But since we are inside setDetailedExercises, we just return newDetailed.
      setAutoFillTrigger(Date.now());
      return newDetailed;
    });
    // 4. Bổ sung đầy đủ dependencies để xóa cảnh báo ESLint
  }, [selectedExercises, logs, activityType, trainingStyle, _profile, dumbbellWeight, gymLocation, muscleStates]);

  const handleAiCoach = () => {
    setShowAiStyleModal(true);
  };

  const handleAiCoachConfirm = (style: TrainingStyle) => {
    setTrainingStyle(style);
    setShowAiStyleModal(false);

    if (!muscleStates) return;
    const muscleStateRecord = {} as Record<MuscleGroup, number>;
    muscleStates.forEach(m => {
      muscleStateRecord[m.muscle] = m.recoveryLevel;
    });

    const result = generateDetailedWorkout(
      GYM_EXERCISES,
      selectedEquipment,
      muscleStateRecord,
      _profile,
      logs,
      5,
      dumbbellWeight,
      undefined,
      style
    );

    // Ghi đè toàn bộ bằng dữ liệu AI
    setSelectedExercises(result.detailedExercises.map(e => e.exerciseId));
    setDetailedExercises(result.detailedExercises);
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
    } catch {
      // ignore
    }
  }, []);



  // Step 2: Body State
  const [sleep, setSleep] = useState<SleepQuality>('good');
  const [stress, setStress] = useState<MentalStress>('low');
  const [nutrition, setNutrition] = useState<NutritionQuality>('good');

  const recoveryAlert = useMemo(() => {
    if (activityType !== 'gym' || detailedExercises.length === 0) return null;

    // Check if any compound exercises are selected
    const hasCompound = detailedExercises.some(ex => {
      const gymEx = GYM_EXERCISES.find(e => e.id === ex.exerciseId);
      return gymEx && gymEx.movement_type === 'compound';
    });

    // Check if any large muscles are involved
    const largeMuscles = ['quadriceps', 'lats', 'glutes', 'hamstrings'];
    const hasLargeMuscle = targetMuscles.some(m => largeMuscles.includes(m as string));

    // Count total sets to failure
    let setsToFailure = 0;
    let amrapSets = 0;
    detailedExercises.forEach(ex => {
      ex.sets.forEach(set => {
        if (set.isAmrap) {
          amrapSets++;
        } else if (set.rir === 0 || set.toFailure) {
          setsToFailure++;
        }
      });
    });

    const input: RecoveryInput = {
      exerciseType: hasCompound ? 'compound' : 'isolation',
      muscleSize: hasLargeMuscle ? 'large' : 'small',
      setsToFailure,
      amrapSets,
      experienceLevel: _profile?.weeklyFrequency ? (_profile.weeklyFrequency <= 2 ? 'beginner' : _profile.weeklyFrequency <= 4 ? 'intermediate' : 'advanced') : 'intermediate',
      ageGroup: _profile?.age && _profile.age < 30 ? 'under_30' : _profile?.age && _profile.age < 40 ? '30_39' : _profile?.age && _profile.age < 50 ? '40_49' : 'over_50',
      gender: _profile?.gender || 'male',
      poorSleep: sleep !== 'good',
      poorNutrition: nutrition === 'deficit'
    };

    return calculateRecoveryTime(input);
  }, [activityType, detailedExercises, targetMuscles, _profile, sleep, nutrition]);

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
      const mergedMuscles = new Set<MuscleGroup>();
      footballPositions.forEach(p => {
        const posKey = p.position as keyof typeof FOOTBALL_POSITION_MATRIX;
        if (FOOTBALL_POSITION_MATRIX[posKey]) {
          Object.keys(FOOTBALL_POSITION_MATRIX[posKey]).forEach(m => mergedMuscles.add(m as MuscleGroup));
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
    } else if (activityType === 'table_tennis') {
      setTargetMuscles(TABLE_TENNIS_BASE_MUSCLES);
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
      if (activityType === 'football') setStep(1.1);
      else setStep(1);
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
    } else if (step === 1.1) {
      setStep(1.2);
    } else if (step === 1.2) {
      setStep(1.3);
    } else if (step === 1.3) {
      if (footballPositions.length > 1) setStep(1.4);
      else setStep(1.5);
    } else if (step === 1.4) {
      setStep(1.5);
    } else if (step === 1.5) {
      setStep(2);
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
    // 1. Luồng sửa Log (Planned)
    if (initialLog && initialLog.status === 'planned') {
      if (step === 1) onClose();
      else if (step === 1.5) setStep(1); // can go back to modify exercises if they want
      else if (step === 2) setStep(1.5);
      else if (step === 3) setStep(2);
      return;
    }

    // 2. Nhánh riêng cho GYM
    if (activityType === 'gym') {
      if (step === 0.5) setStep(0);
      else if (step === 0.75) setStep(0.5);
      else if (step === 1) setStep(0.75);
      else if (step === 1.25) {
        if (gymLocation === 'gym') setStep(0.75);
        else setStep(1);
      }
      else if (step === 1.3) setStep(1.25);
      else if (step === 1.5) {
        if (gymIntent === 'log' && gymLocation === 'gym') setStep(1.3);
        else setStep(1.3);
      }
      else if (step === 2) setStep(1.5);
      else if (step === 3) setStep(2);
      return;
    }

    // 3. Nhánh CỰC KỲ RÕ RÀNG cho BÓNG ĐÁ
    if (activityType === 'football') {
      if (step === 1.1) setStep(0);
      else if (step === 1.2) setStep(1.1);
      else if (step === 1.3) setStep(1.2);
      else if (step === 1.4) setStep(1.3);
      else if (step === 1.5) {
        if (footballPositions.length > 1) setStep(1.4);
        else setStep(1.3);
      }
      else if (step === 2) setStep(1.5);
      else if (step === 3) setStep(2);
      return;
    }

    // 4. Nhánh cho CÁC MÔN CÒN LẠI (Chạy bộ, Bơi lội...)
    if (step === 1) setStep(0);
    else if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasInjury && injuredMuscles.length === 0) {
      alert('Vui lòng chọn nhóm cơ bị chấn thương/đau nhức');
      return;
    }

    // Auto-fill RIR for Lazy Logging mode
    let finalDetailedExercises = detailedExercises;
    if (activityType === 'gym' && !isProMode) {
      const mappedRir = intensity <= 4 ? 4 : intensity <= 6 ? 3 : intensity <= 8 ? 2 : intensity === 9 ? 1 : 0;
      finalDetailedExercises = detailedExercises.map(ex => ({
        ...ex,
        sets: ex.sets.map(set => ({
          ...set,
          // Keep failure if user explicitly checked the "Last Set Failure" (rir === 0)
          rir: set.rir === 0 ? 0 : mappedRir,
          toFailure: set.rir === 0 ? true : mappedRir === 0
        }))
      }));
    }

    let finalTimestamp: number | undefined = undefined;
    const status = gymIntent === 'plan' ? 'planned' : 'completed';
    if (gymIntent !== 'plan' && status !== 'planned') {
      if (timeMode === 'yesterday') {
        const y = new Date(simulatedTime);
        y.setDate(y.getDate() - 1);
        y.setHours(19, 0, 0, 0); // Default to 7 PM yesterday
        finalTimestamp = y.getTime();
      } else if (timeMode === 'custom') {
        finalTimestamp = customTimestamp;
      }
    }

    onSubmit({
      id: initialLog?.id,
      timestamp: finalTimestamp,
      status,
      activityType,
      weather,
      duration,
      intensity,
      targetMuscles,
      muscleMapping,
      detailedExercises: finalDetailedExercises,
      trainingStyle,
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
      footballMatchType,
      footballPositions,
      footballIncludesHeading,
      swimmingStroke,
      swimmingEnvironment,
      distance: distance === '' ? undefined : distance,
      tableTennisFormat,
      tableTennisStyle,
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
          <h3 className="text-2xl sm:text-3xl font-black text-white mb-3 tracking-tight">Hôm nay bạn tập bộ môn nào?</h3>
          <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto">Mỗi bộ môn sẽ có phương pháp đo lường chấn động và phục hồi cơ bắp chuyên biệt.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto px-2">
          {[...ACTIVITY_OPTIONS].map((opt, idx) => ({ ...opt, originalIndex: idx })).sort((a, b) => {
            const aPinned = pinnedActivities.includes(a.value as ActivityType);
            const bPinned = pinnedActivities.includes(b.value as ActivityType);
            if (aPinned && !bPinned) return -1;
            if (!aPinned && bPinned) return 1;
            return a.originalIndex - b.originalIndex;
          }).map((opt) => {
            const Icon = opt.icon;
            const style = getCardStyles(opt.value);
            const isPinned = pinnedActivities.includes(opt.value as ActivityType);
            return (
              <div
                key={opt.value}
                onClick={() => {
                  setActivityType(opt.value as ActivityType);
                  if (opt.value === 'gym') setStep(0.5);
                  else if (opt.value === 'football') setStep(1.1);
                  else setStep(1);
                }}
                className={`group relative flex flex-col items-center justify-center p-6 rounded-3xl cursor-pointer transition-all duration-300 ease-out border overflow-hidden ${style.shadow
                  } bg-slate-900/40 border-slate-800/60 hover:-translate-y-2 hover:border-slate-600/80`}
              >
                {/* Background Gradient Hover Effect */}
                <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${style.gradient}`} />

                {/* Pin Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    let newPinned;
                    if (isPinned) {
                      newPinned = pinnedActivities.filter(p => p !== opt.value);
                    } else {
                      newPinned = [...pinnedActivities, opt.value as ActivityType];
                    }
                    localStorage.setItem('pinnedActivities', JSON.stringify(newPinned));
                    setPinnedActivities(newPinned);
                  }}
                  className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-300 z-20 ${isPinned ? 'bg-indigo-500/20 text-indigo-400 opacity-100' : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300 opacity-100 sm:opacity-0 group-hover:opacity-100'}`}
                >
                  <Pin size={16} className={isPinned ? 'fill-indigo-400/20' : ''} />
                </button>

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
              setStep(1.25); // Always go to exercise selection
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
              // LỌC SẠCH tàn dư của Phòng Gym (cáp, máy, tạ đòn,...)
              setSelectedEquipment(prev => {
                const homeEqs = prev.filter(eq => ['bodyweight', 'dumbbells'].includes(eq));
                return homeEqs.length > 0 ? homeEqs : ['bodyweight'];
              });
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

  // --- FOOTBALL WIZARD STEPS ---

  const renderStep1_1_fb = () => (
    <div className="animate-slide-in max-w-5xl mx-auto w-full mt-4 sm:mt-12">
      <div className="text-center space-y-2 mb-8 sm:mb-16">
        <h3 className="text-3xl sm:text-5xl font-black text-white">Quy mô sân đấu</h3>
        <p className="text-sm sm:text-lg text-slate-400 font-medium">Hôm nay bạn thi đấu ở sân mấy người?</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 px-4">
        {[
          { id: '5v5', label: 'Sân 5', icon: Box, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/50', hoverBorder: 'hover:border-teal-400', hoverGlow: 'group-hover:shadow-[0_0_30px_rgba(45,212,191,0.3)]', active: 'border-teal-400 bg-gradient-to-br from-teal-900/40 to-teal-900/10 shadow-[0_0_40px_rgba(45,212,191,0.5)] ring-1 ring-teal-400', neon: 'text-teal-300 drop-shadow-[0_0_10px_rgba(45,212,191,0.8)]', hoverNeon: 'group-hover:text-teal-300 group-hover:drop-shadow-[0_0_10px_rgba(45,212,191,0.8)]' },
          { id: '7v7', label: 'Sân 7', icon: Layout, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/50', hoverBorder: 'hover:border-emerald-400', hoverGlow: 'group-hover:shadow-[0_0_30px_rgba(52,211,153,0.3)]', active: 'border-emerald-400 bg-gradient-to-br from-emerald-900/40 to-emerald-900/10 shadow-[0_0_40px_rgba(52,211,153,0.5)] ring-1 ring-emerald-400', neon: 'text-emerald-300 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]', hoverNeon: 'group-hover:text-emerald-300 group-hover:drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]' },
          { id: '11v11', label: 'Sân 11', icon: MapIcon, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/50', hoverBorder: 'hover:border-blue-400', hoverGlow: 'group-hover:shadow-[0_0_30px_rgba(96,165,250,0.3)]', active: 'border-blue-400 bg-gradient-to-br from-blue-900/40 to-blue-900/10 shadow-[0_0_40px_rgba(96,165,250,0.5)] ring-1 ring-blue-400', neon: 'text-blue-300 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]', hoverNeon: 'group-hover:text-blue-300 group-hover:drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]' }
        ].map(opt => {
          const Icon = opt.icon;
          const isActive = footballPitchSize === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => { setFootballPitchSize(opt.id as any); handleNext(); }}
              className={`w-full flex flex-row sm:flex-col items-center justify-start sm:justify-center p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] sm:aspect-square transition-all duration-300 border-2 overflow-hidden relative group backdrop-blur-md ${isActive ? opt.active : `bg-slate-900/60 border-slate-700/50 ${opt.hoverBorder} ${opt.hoverGlow} hover:-translate-y-1 hover:bg-slate-800/80`}`}
            >
              {/* Background Watermark Icon */}
              <Icon className={`absolute -right-4 sm:-bottom-8 sm:-right-8 w-24 h-24 sm:w-48 sm:h-48 opacity-[0.03] transition-transform duration-500 group-hover:scale-110 ${opt.color} group-hover:rotate-12`} strokeWidth={1} />

              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-x-[-100%] group-hover:translate-x-[100%] skew-x-12" />

              <div className={`relative z-10 w-14 h-14 sm:w-28 sm:h-28 rounded-xl sm:rounded-full ${opt.bg} ${opt.color} flex items-center justify-center mr-4 sm:mr-0 sm:mb-8 transition-all duration-300 group-hover:scale-110 ${isActive ? 'scale-110 ring-2 sm:ring-4 ring-current/20' : ''}`}>
                <Icon className={`w-7 h-7 sm:w-14 sm:h-14 transition-colors duration-300 ${isActive ? opt.neon : opt.hoverNeon}`} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`relative z-10 text-xl sm:text-4xl font-black uppercase tracking-widest transition-colors duration-300 ${isActive ? opt.neon : `text-slate-300 ${opt.hoverNeon}`}`}>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderStep1_2_fb = () => (
    <div className="animate-slide-in max-w-5xl mx-auto w-full mt-4 sm:mt-12">
      <div className="text-center space-y-2 mb-8 sm:mb-16">
        <h3 className="text-3xl sm:text-5xl font-black text-white">Tính chất trận đấu</h3>
        <p className="text-sm sm:text-lg text-slate-400 font-medium">Cường độ thi đấu ảnh hưởng lớn đến mức tiêu hao thể lực.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 px-4">
        {[
          { id: 'training', label: 'Tập Luyện', sub: 'Dưỡng sinh', icon: Target, color: 'text-slate-300', bg: 'bg-slate-500/10', border: 'border-slate-500/50', hoverBorder: 'hover:border-slate-400', hoverGlow: 'group-hover:shadow-[0_0_30px_rgba(148,163,184,0.3)]', active: 'border-slate-400 bg-gradient-to-br from-slate-900/40 to-slate-900/10 shadow-[0_0_40px_rgba(148,163,184,0.4)] ring-1 ring-slate-400', neon: 'text-slate-200 drop-shadow-[0_0_10px_rgba(203,213,225,0.8)]', hoverNeon: 'group-hover:text-slate-200 group-hover:drop-shadow-[0_0_10px_rgba(203,213,225,0.8)]' },
          { id: 'friendly', label: 'Giao Hữu', sub: 'Phủi chill', icon: Handshake, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/50', hoverBorder: 'hover:border-amber-400', hoverGlow: 'group-hover:shadow-[0_0_30px_rgba(251,191,36,0.3)]', active: 'border-amber-400 bg-gradient-to-br from-amber-900/40 to-amber-900/10 shadow-[0_0_40px_rgba(251,191,36,0.4)] ring-1 ring-amber-400', neon: 'text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]', hoverNeon: 'group-hover:text-amber-300 group-hover:drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]' },
          { id: 'tournament', label: 'Đá Giải', sub: 'Căng thẳng', icon: Trophy, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/50', hoverBorder: 'hover:border-rose-400', hoverGlow: 'group-hover:shadow-[0_0_30px_rgba(244,63,94,0.3)]', active: 'border-rose-400 bg-gradient-to-br from-rose-900/40 to-rose-900/10 shadow-[0_0_40px_rgba(244,63,94,0.4)] ring-1 ring-rose-400', neon: 'text-rose-300 drop-shadow-[0_0_10px_rgba(251,113,133,0.8)]', hoverNeon: 'group-hover:text-rose-300 group-hover:drop-shadow-[0_0_10px_rgba(251,113,133,0.8)]' }
        ].map(opt => {
          const Icon = opt.icon;
          const isActive = footballMatchType === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => { setFootballMatchType(opt.id as any); handleNext(); }}
              className={`w-full flex flex-row sm:flex-col items-center justify-start sm:justify-center p-4 sm:py-8 sm:px-4 rounded-[1.5rem] sm:rounded-[2.5rem] sm:aspect-square transition-all duration-300 border-2 overflow-hidden relative group backdrop-blur-md ${isActive ? opt.active : `bg-slate-900/60 border-slate-700/50 ${opt.hoverBorder} ${opt.hoverGlow} hover:-translate-y-1 hover:bg-slate-800/80`}`}
            >
              {/* Background Watermark Icon */}
              <Icon className={`absolute -right-2 sm:-bottom-4 sm:-right-4 w-24 h-24 sm:w-48 sm:h-48 opacity-[0.04] transition-transform duration-500 group-hover:scale-125 ${opt.color} group-hover:-rotate-12`} strokeWidth={1} />

              <div className={`relative z-10 w-14 h-14 sm:w-28 sm:h-28 rounded-xl sm:rounded-3xl sm:rotate-3 group-hover:rotate-0 ${opt.bg} ${opt.color} flex items-center justify-center mr-4 sm:mr-0 sm:mb-8 transition-all duration-300 group-hover:scale-110 ${isActive ? 'scale-110 ring-2 ring-current/30 rotate-0' : ''}`}>
                <Icon className={`w-7 h-7 sm:w-14 sm:h-14 transition-colors ${isActive ? opt.neon : opt.hoverNeon}`} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <div className="flex flex-col items-start sm:items-center text-left sm:text-center">
                <span className={`relative z-10 text-lg sm:text-3xl font-black uppercase tracking-wider mb-0.5 sm:mb-2 transition-colors duration-300 ${isActive ? opt.neon : `text-slate-300 ${opt.hoverNeon}`}`}>{opt.label}</span>
                <span className={`relative z-10 text-xs sm:text-base font-bold tracking-widest uppercase transition-colors duration-300 ${isActive ? 'text-white/80' : 'text-slate-500 group-hover:text-slate-300'}`}>{opt.sub}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderStep1_3_fb = () => (
    <div className="animate-slide-in max-w-5xl mx-auto w-full mt-4 sm:mt-12 flex flex-col h-full">
      <div className="text-center space-y-2 mb-8 sm:mb-16">
        <h3 className="text-3xl sm:text-5xl font-black text-white">Vị trí thi đấu</h3>
        <p className="text-xs sm:text-sm text-amber-400 font-bold mt-2">*Có thể chọn nhiều vị trí nếu bạn chơi đa năng</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 px-4">
        {[
          { id: 'striker', label: 'Tiền Đạo', icon: Flame, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/50', hoverBorder: 'hover:border-rose-400', hoverGlow: 'group-hover:shadow-[0_0_30px_rgba(244,63,94,0.3)]', active: 'border-rose-400 bg-gradient-to-br from-rose-900/40 to-rose-900/10 shadow-[0_0_30px_rgba(244,63,94,0.4)] ring-1 ring-rose-400', neon: 'text-rose-300 drop-shadow-[0_0_10px_rgba(251,113,133,0.8)]', hoverNeon: 'group-hover:text-rose-300 group-hover:drop-shadow-[0_0_10px_rgba(251,113,133,0.8)]' },
          { id: 'midfielder', label: 'Tiền Vệ', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/50', hoverBorder: 'hover:border-amber-400', hoverGlow: 'group-hover:shadow-[0_0_30px_rgba(251,191,36,0.3)]', active: 'border-amber-400 bg-gradient-to-br from-amber-900/40 to-amber-900/10 shadow-[0_0_30px_rgba(251,191,36,0.4)] ring-1 ring-amber-400', neon: 'text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]', hoverNeon: 'group-hover:text-amber-300 group-hover:drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]' },
          { id: 'defender', label: 'Hậu Vệ', icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/50', hoverBorder: 'hover:border-blue-400', hoverGlow: 'group-hover:shadow-[0_0_30px_rgba(96,165,250,0.3)]', active: 'border-blue-400 bg-gradient-to-br from-blue-900/40 to-blue-900/10 shadow-[0_0_30px_rgba(96,165,250,0.4)] ring-1 ring-blue-400', neon: 'text-blue-300 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]', hoverNeon: 'group-hover:text-blue-300 group-hover:drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]' },
          { id: 'goalkeeper', label: 'Thủ Môn', icon: Hand, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/50', hoverBorder: 'hover:border-emerald-400', hoverGlow: 'group-hover:shadow-[0_0_30px_rgba(52,211,153,0.3)]', active: 'border-emerald-400 bg-gradient-to-br from-emerald-900/40 to-emerald-900/10 shadow-[0_0_30px_rgba(52,211,153,0.4)] ring-1 ring-emerald-400', neon: 'text-emerald-300 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]', hoverNeon: 'group-hover:text-emerald-300 group-hover:drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]' }
        ].map(opt => {
          const Icon = opt.icon;
          const isActive = footballPositions.some(p => p.position === opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                let newPositions = [...footballPositions];
                if (isActive) {
                  newPositions = newPositions.filter(p => p.position !== opt.id);
                  if (newPositions.length === 0) return; // Must have at least 1
                } else {
                  newPositions.push({ position: opt.id, percentage: 0 });
                }
                newPositions = newPositions.map(p => ({ ...p, percentage: 100 / newPositions.length }));
                setFootballPositions(newPositions);
              }}
              className={`w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] sm:aspect-square transition-all duration-300 border-2 overflow-hidden relative group backdrop-blur-md ${isActive ? opt.active : `bg-slate-900/60 border-slate-700/50 ${opt.hoverBorder} ${opt.hoverGlow} hover:-translate-y-1 hover:bg-slate-800/80`}`}
            >
              {/* Background Glow */}
              {isActive && <div className={`absolute inset-0 opacity-20 blur-xl transition-all duration-500 ${opt.bg}`} />}

              <div className={`relative z-10 w-12 h-12 sm:w-20 sm:h-20 lg:w-24 lg:h-24 shrink-0 rounded-[1rem] sm:rounded-[1.5rem] lg:rounded-[2rem] ${opt.bg} ${opt.color} flex items-center justify-center mb-3 sm:mb-6 transition-all duration-300 group-hover:scale-110 ${isActive ? 'scale-110 ring-2 ring-current/30 sm:rotate-3' : ''}`}>
                <Icon className={`w-6 h-6 sm:w-10 sm:h-10 lg:w-12 lg:h-12 transition-colors ${isActive ? opt.neon : opt.hoverNeon}`} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`relative z-10 text-lg sm:text-xl lg:text-2xl whitespace-nowrap font-black uppercase tracking-wider transition-colors duration-300 ${isActive ? opt.neon : `text-slate-300 ${opt.hoverNeon}`}`}>{opt.label}</span>

              {/* Checkmark for active state */}
              {isActive && (
                <div className={`absolute bottom-4 right-4 w-6 h-6 sm:w-10 sm:h-10 rounded-full bg-slate-900 border-2 ${opt.border} flex items-center justify-center z-20 shadow-lg`}>
                  <Check size={20} strokeWidth={4} className={opt.neon} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderStep1_4_fb = () => (
    <div className="animate-slide-in max-w-3xl mx-auto w-full mt-4 sm:mt-10 flex flex-col h-full">
      <div className="flex-1 px-4">
        <div className="text-center space-y-2 mb-6 sm:mb-10">
          <h3 className="text-3xl sm:text-4xl font-black text-white">Phân bổ thời gian</h3>
          <p className="text-sm sm:text-base text-slate-400 font-medium">Bạn dành bao nhiêu % thời gian cho từng vị trí?</p>
        </div>
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
      </div>
    </div>
  );

  const renderStep1_5_fb = () => (
    <div className="animate-slide-in max-w-lg mx-auto w-full mt-4 sm:mt-8 flex flex-col h-full">
      <div className="flex-1 space-y-8">
        <div className="text-center space-y-2 mb-8 sm:mb-10">
          <h3 className="text-3xl sm:text-4xl font-black text-white">Điều kiện & Môi trường</h3>
          <p className="text-sm sm:text-base text-slate-400 font-medium mt-2">Yếu tố ngoại cảnh tác động trực tiếp đến tốc độ phục hồi cơ bắp.</p>
        </div>

        {/* Weather Block */}
        <div className="p-6 rounded-3xl bg-slate-800/40 border border-slate-700/50 space-y-4">
          <label className="text-base font-semibold text-slate-300 flex items-center justify-between">
            <span>🌤️ Thời Tiết Tại Sân</span>
            <button
              type="button"
              onClick={handleFetchWeather}
              disabled={isFetchingWeather}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors"
            >
              {isFetchingWeather ? 'Đang lấy...' : 'Lấy tự động'}
            </button>
          </label>

          {weatherError && <div className="text-rose-400 text-sm">{weatherError}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-2 block">Nhiệt độ (°C)</label>
              <input
                type="number"
                value={weather?.temp || ''}
                onChange={(e) => setWeather(prev => ({ ...(prev || { humidity: 50, condition: 'Clear', source: 'manual' }), temp: Number(e.target.value), source: 'manual' }))}
                className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl px-4 py-3 text-lg font-semibold text-white outline-none focus:border-indigo-500"
                placeholder="VD: 32"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-2 block">Độ ẩm (%)</label>
              <input
                type="number"
                value={weather?.humidity || ''}
                onChange={(e) => setWeather(prev => ({ ...(prev || { temp: 30, condition: 'Clear', source: 'manual' }), humidity: Number(e.target.value), source: 'manual' }))}
                className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl px-4 py-3 text-lg font-semibold text-white outline-none focus:border-indigo-500"
                placeholder="VD: 80"
              />
            </div>
          </div>

          {weather?.apparentTemp !== undefined && weather.source === 'auto' && (
            <div className="text-sm text-emerald-400 font-medium">
              Cảm nhận nhiệt: <span className="font-bold">{weather.apparentTemp}°C</span> ({weather.condition})
            </div>
          )}
        </div>

        {/* Heading Block */}
        {footballPositions.some(p => p.position === 'striker' || p.position === 'defender') && (
          <div className="p-6 rounded-3xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between cursor-pointer" onClick={() => setFootballIncludesHeading(!footballIncludesHeading)}>
            <div className="flex flex-col">
              <span className="text-base font-bold text-white">Có đánh đầu không?</span>
              <span className="text-sm text-slate-400">Tăng độ mỏi cổ/vai gáy</span>
            </div>
            <button
              type="button"
              className={`w-14 h-8 rounded-full transition-colors relative flex items-center ${footballIncludesHeading ? 'bg-emerald-500' : 'bg-slate-700'}`}
            >
              <span className={`absolute w-6 h-6 bg-white rounded-full transition-transform transform ${footballIncludesHeading ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // --- END FOOTBALL WIZARD STEPS ---

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
              <label className="text-lg font-black text-white flex items-center gap-3 mb-4"><Dumbbell size={24} className="text-rose-400" /> Dụng cụ hiện có</label>
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
                <label className="text-lg font-black text-white flex items-center gap-3"><Target size={24} className="text-orange-400" /> Chi tiết Tạ đơn</label>

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

          {['running', 'basketball', 'cycling', 'swimming'].includes(activityType) && (
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 space-y-3">
              <label className="text-sm font-semibold text-slate-300 flex items-center justify-between">
                <span>🌤️ Thời Tiết Tại Sân</span>
                <button
                  type="button"
                  onClick={handleFetchWeather}
                  disabled={isFetchingWeather}
                  className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg text-[11px] font-bold transition-colors"
                >
                  {isFetchingWeather ? 'Đang lấy...' : 'Lấy tự động'}
                </button>
              </label>

              {weatherError && <div className="text-rose-400 text-xs">{weatherError}</div>}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1 block">Nhiệt độ (°C)</label>
                  <input
                    type="number"
                    value={weather?.temp || ''}
                    onChange={(e) => setWeather(prev => ({ ...(prev || { humidity: 50, condition: 'Clear', source: 'manual' }), temp: Number(e.target.value), source: 'manual' }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-semibold text-white outline-none focus:border-indigo-500"
                    placeholder="VD: 32"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1 block">Độ ẩm (%)</label>
                  <input
                    type="number"
                    value={weather?.humidity || ''}
                    onChange={(e) => setWeather(prev => ({ ...(prev || { temp: 30, condition: 'Clear', source: 'manual' }), humidity: Number(e.target.value), source: 'manual' }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-semibold text-white outline-none focus:border-indigo-500"
                    placeholder="VD: 80"
                  />
                </div>
              </div>

              {weather?.apparentTemp !== undefined && weather.source === 'auto' && (
                <div className="text-xs text-emerald-400 font-medium">
                  Cảm nhận nhiệt (Heat Index): <span className="font-bold">{weather.apparentTemp}°C</span> ({weather.condition})
                </div>
              )}
            </div>
          )}

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

          {activityType === 'table_tennis' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400">Hình thức thi đấu</label>
                <PillSelector
                  value={tableTennisFormat}
                  onChange={(val: TableTennisFormat) => setTableTennisFormat(val)}
                  options={[
                    { value: 'singles', label: 'Đánh Đơn' },
                    { value: 'doubles', label: 'Đánh Đôi' }
                  ]}
                  theme={theme}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400">Phong cách chơi</label>
                <PillSelector
                  value={tableTennisStyle}
                  onChange={(val: TableTennisStyle) => setTableTennisStyle(val)}
                  options={[
                    { value: 'offensive', label: 'Tấn công (Topspin)' },
                    { value: 'defensive', label: 'Phòng thủ (Chopper)' },
                    { value: 'all_round', label: 'Toàn diện (All-round)' }
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
              {intensity <= 3 && duration <= 45 && (
                <div className="mt-3 flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 py-1.5 px-3 rounded-lg animate-fade-in shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                  <span className="text-sm">🍃</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Phục hồi Chủ động (Giảm mỏi cơ)</span>
                </div>
              )}
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

    const selectedSet = new Set(selectedExercises);

    const searchLower = gymSearchTerm.toLowerCase();
    const isFilterAll = gymFilterType === 'all';
    const filterLower = gymFilterType.toLowerCase();

    const displayedExercises = PRECOMPUTED_GYM_EXERCISES.filter(ex => {
      if (!ex.searchString.includes(searchLower)) return false;

      // Chuyển .some thành .every: Phải có ĐỦ MỌI dụng cụ mà bài tập yêu cầu
      const matchEquipment = ex.equipment.every(eq => selectedEquipment.includes(eq));
      if (!matchEquipment) return false;

      const matchFilter = isFilterAll || ex.movement_type.toLowerCase() === filterLower;
      if (!matchFilter) return false;

      // Advanced filters
      const matchDifficulty = gymAdvDifficulty === 'all' || ex.difficulty === gymAdvDifficulty;
      if (!matchDifficulty) return false;

      const mapping = ex.muscle_mapping || {};
      const matchMuscle = gymAdvMuscle === 'all' || Object.keys(mapping).includes(gymAdvMuscle);
      if (!matchMuscle) return false;

      const matchMeasureType = gymAdvMeasureType === 'all' || (gymAdvMeasureType === 'reps' ? ex.measureType === 'reps' || ex.measureType === 'both' : ex.measureType === 'time' || ex.measureType === 'both');
      if (!matchMeasureType) return false;

      if (gymTab === 'recent') {
        return recentExerciseIds.includes(ex.id);
      }
      return true;
    });

    return (
      <>
        <div className="flex flex-col sm:flex-row h-[500px] sm:h-[550px] animate-slide-in gap-4 sm:gap-6">

          {/* Left Sidebar (Nav & Search) */}
          <div className="flex flex-col shrink-0 w-full sm:w-64 md:w-72 gap-3 sm:gap-4 sm:h-full">
            {/* Gym Tabs (Top Segmented Control) */}
            <div className="flex flex-row bg-slate-950/80 p-1 rounded-xl border border-slate-800 shrink-0 gap-1 relative z-10 shadow-inner">
              <button
                type="button"
                onClick={() => setGymTab('all')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-colors duration-150 ${gymTab === 'all' ? 'bg-slate-800 text-white shadow-sm border border-slate-700/50' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}
              >
                <LayoutGrid size={16} className={gymTab === 'all' ? 'text-rose-400' : 'opacity-70'} /> Tất cả
              </button>
              <button
                type="button"
                onClick={() => setGymTab('groups')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-colors duration-150 ${gymTab === 'groups' ? 'bg-slate-800 text-white shadow-sm border border-slate-700/50' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}
              >
                <Bookmark size={16} className={gymTab === 'groups' ? 'text-indigo-400' : 'opacity-70'} /> Nhóm
              </button>
              <button
                type="button"
                onClick={() => setGymTab('recent')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-colors duration-150 ${gymTab === 'recent' ? 'bg-slate-800 text-white shadow-sm border border-slate-700/50' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}
              >
                <Clock size={16} className={gymTab === 'recent' ? 'text-amber-400' : 'opacity-70'} /> Gần đây
              </button>
            </div>

            {/* Top Section: Search & Filters */}
            <div className="space-y-3 flex-1 flex flex-col min-h-0">
              <div className="space-y-3 flex flex-col min-h-0">
                {/* Search and Filters inline */}
                <div className="flex gap-2 w-full shrink-0">
                  <div className="relative flex-1 group">
                    <input
                      type="text"
                      placeholder={gymTab === 'groups' ? "Tìm tên nhóm..." : "Tìm bài tập..."}
                      value={gymSearchTerm}
                      onChange={(e) => setGymSearchTerm(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl pr-3 py-2.5 sm:py-3 text-xs font-semibold text-white outline-none focus:border-rose-500 transition-colors shadow-inner"
                      style={{ paddingLeft: '2.5rem' }}
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-400 transition-colors" size={16} strokeWidth={2.5} />
                  </div>
                  {gymTab !== 'groups' && (
                    <button
                      type="button"
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className={`px-3 bg-slate-900/50 border rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center shrink-0 ${showAdvancedFilters ? 'border-rose-500 text-rose-400 bg-rose-500/5' : 'border-slate-700/50 text-slate-400'}`}
                      title="Bộ lọc nâng cao"
                    >
                      <SlidersHorizontal size={16} />
                    </button>
                  )}
                </div>

                {gymTab !== 'groups' && (
                  <>
                    {/* Quick Filters - Horizontal Scroll */}
                    <div className="flex flex-nowrap overflow-x-auto gap-1.5 pb-1 custom-scrollbar shrink-0">
                      {['All', 'Push', 'Pull', 'Squat', 'Hinge', 'Core'].map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={(e) => { e.preventDefault(); setGymFilterType(type.toLowerCase()); }}
                          className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${gymFilterType === type.toLowerCase() ? 'bg-rose-500/10 text-rose-400 border-rose-500/50' : 'bg-transparent text-slate-400 border-slate-700/50 hover:bg-slate-800 hover:text-slate-300 hover:border-slate-600'}`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>

                    {/* AI Coach floating banner */}
                    <button
                      type="button"
                      onClick={handleAiCoach}
                      className="w-full relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-500 to-red-700 border-b-4 border-b-red-900 hover:border-b-red-800 p-3 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0 active:border-b active:mt-[3px] shadow-[0_5px_20px_rgba(225,29,72,0.4)] hover:shadow-[0_8px_30px_rgba(225,29,72,0.6)] group shrink-0"
                      title="AI Gợi ý bài tập"
                    >
                      {/* Industrial/Carbon-fiber mesh overlay */}
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.3)_50%,transparent_75%,transparent_100%)] bg-[length:4px_4px] pointer-events-none mix-blend-overlay"></div>

                      {/* Pulse ring for constant attention */}
                      <div className="absolute inset-0 border border-white/20 rounded-xl pointer-events-none opacity-50 group-hover:animate-ping"></div>

                      <Bot size={20} className="text-white group-hover:rotate-12 group-hover:scale-110 transition-all drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] z-10 relative" />
                      <span className="text-xs sm:text-sm font-black tracking-[0.2em] uppercase text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] z-10 relative">AI COACH</span>
                      <Zap size={14} className="absolute top-1/2 -translate-y-1/2 right-4 text-yellow-400 fill-yellow-400 group-hover:scale-125 transition-all pointer-events-none animate-pulse drop-shadow-[0_0_10px_rgba(250,204,21,0.8)] z-10" />
                    </button>
                  </>
                )}

                {/* Advanced Filters Panel */}
                {showAdvancedFilters && gymTab !== 'groups' && (
                  <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 space-y-4 animate-fade-in shrink-0 overflow-y-auto max-h-[300px] custom-scrollbar">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs sm:text-sm font-bold text-slate-300">Bộ lọc nâng cao</span>
                      <button
                        type="button"
                        onClick={() => {
                          setGymAdvDifficulty('all');
                          setGymAdvMuscle('all');
                          setGymAdvMeasureType('all');
                        }}
                        className="text-xs text-slate-500 hover:text-rose-400 font-bold transition-colors"
                      >
                        Đặt lại
                      </button>
                    </div>

                    {/* Difficulty */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 block">Độ khó</label>
                      <div className="flex bg-slate-950/50 p-1 rounded-xl border border-slate-800 gap-1">
                        {[
                          { value: 'all', label: 'Tất cả' },
                          { value: 'beginner', label: 'Dễ' },
                          { value: 'intermediate', label: 'Vừa' },
                          { value: 'advanced', label: 'Khó' }
                        ].map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setGymAdvDifficulty(opt.value)}
                            className={`flex-1 py-2 rounded text-xs font-bold transition-all ${gymAdvDifficulty === opt.value ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-slate-400 border border-transparent hover:text-slate-200'}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Muscle Groups */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 block">Nhóm cơ tác động</label>
                      <select
                        value={gymAdvMuscle}
                        onChange={(e) => setGymAdvMuscle(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-slate-300 outline-none focus:border-rose-500 transition-colors cursor-pointer"
                      >
                        <option value="all">Tất cả nhóm cơ</option>
                        <optgroup label="Ngực & Vai">
                          <option value="upper_chest">Ngực trên</option>
                          <option value="lower_chest">Ngực dưới</option>
                          <option value="front_shoulders">Vai trước</option>
                          <option value="rear_shoulders">Vai sau</option>
                        </optgroup>
                        <optgroup label="Lưng & Bụng">
                          <option value="lats">Cơ xô (Lưng bên)</option>
                          <option value="traps">Cầu vai</option>
                          <option value="lower_back">Thắt lưng</option>
                          <option value="upper_abs">Bụng trên</option>
                          <option value="lower_abs">Bụng dưới</option>
                          <option value="obliques">Cơ liên sườn</option>
                        </optgroup>
                        <optgroup label="Tay">
                          <option value="biceps">Tay trước (Biceps)</option>
                          <option value="triceps">Tay sau (Triceps)</option>
                          <option value="forearms">Cẳng tay</option>
                        </optgroup>
                        <optgroup label="Chân & Mông">
                          <option value="quadriceps">Đùi trước (Quads)</option>
                          <option value="hamstrings">Đùi sau (Hamstrings)</option>
                          <option value="glutes">Mông (Glutes)</option>
                          <option value="calves">Bắp chân</option>
                        </optgroup>
                      </select>
                    </div>

                    {/* Measure Type */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 block">Kiểu bài tập</label>
                      <div className="flex bg-slate-950/50 p-1 rounded-xl border border-slate-800 gap-1">
                        {[
                          { value: 'all', label: 'Tất cả' },
                          { value: 'reps', label: 'Reps' },
                          { value: 'time', label: 'Thời gian' }
                        ].map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setGymAdvMeasureType(opt.value)}
                            className={`flex-1 py-2 rounded text-xs font-bold transition-all ${gymAdvMeasureType === opt.value ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-slate-400 border border-transparent hover:text-slate-200'}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Content Area (Exercises List) */}
          <div className="flex-1 overflow-y-auto pr-2 border border-slate-800 rounded-2xl p-3 sm:p-5 bg-slate-900/30 custom-scrollbar flex flex-col relative">
            {/* AI Message Banner */}
            {aiMessage && gymTab !== 'groups' && (
              <div className={`border rounded-2xl p-4 mb-4 sm:mb-6 shadow-lg relative animate-slide-in shrink-0 ${aiMessage.includes('[CẢNH BÁO ĐỎ]')
                ? 'bg-gradient-to-r from-rose-500/10 to-orange-500/10 border-rose-500/30 shadow-[0_0_30px_rgba(244,63,94,0.15)]'
                : 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.1)]'
                }`}>
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className={`p-2 sm:p-3 rounded-xl shrink-0 ${aiMessage.includes('[CẢNH BÁO ĐỎ]') ? 'bg-rose-500/20 text-rose-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                    {aiMessage.includes('[CẢNH BÁO ĐỎ]') ? <ShieldAlert size={24} className="animate-pulse" /> : <Bot size={24} />}
                  </div>
                  <div className={`flex-1 text-sm leading-relaxed pr-6 ${aiMessage.includes('[CẢNH BÁO ĐỎ]') ? 'text-rose-200/90' : 'text-indigo-200/90'}`}>
                    <strong className={`block mb-1 font-extrabold tracking-wide uppercase text-xs ${aiMessage.includes('[CẢNH BÁO ĐỎ]') ? 'text-rose-400' : 'text-indigo-300'}`}>
                      {aiMessage.includes('[CẢNH BÁO ĐỎ]') ? '🚨 CẢNH BÁO QUÁ TẢI (OVERTRAINING)' : '🤖 AI Huấn Luyện Viên:'}
                    </strong>
                    {aiMessage.replace('🚨 [CẢNH BÁO ĐỎ]', '')}
                  </div>
                </div>
                <button type="button" onClick={() => setAiMessage(null)} className="absolute top-4 right-4 text-slate-400/50 hover:text-white bg-slate-500/10 hover:bg-slate-500/30 rounded-lg p-1.5 transition-colors">
                  <X size={16} />
                </button>
              </div>
            )}

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
                    <p className="text-sm font-semibold">Sếp chưa có nhóm bài tập nào.<br />Hãy chọn các bài ở Tab "Tất cả" và lưu thành nhóm mới nhé!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {exerciseGroups.filter(g => g.name.toLowerCase().includes(gymSearchTerm.toLowerCase())).map(group => (
                      <div key={group.id} className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/60 rounded-2xl p-5 flex flex-col gap-4 group/card transition-all hover:border-indigo-500/40 hover:shadow-[0_0_20px_rgba(79,70,229,0.1)] relative overflow-hidden">
                        {/* Decorative glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl"></div>

                        <div className="flex justify-between items-start relative z-10">
                          <div>
                            <h4 className="text-white font-extrabold text-base sm:text-lg">{group.name}</h4>
                            <span className="text-xs font-semibold text-slate-400 mt-0.5 inline-block">{group.exerciseIds.length} bài tập</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Chắc chắn xóa nhóm này?')) {
                                saveExerciseGroups(exerciseGroups.filter(g => g.id !== group.id));
                              }
                            }}
                            className="text-slate-500 hover:text-rose-400 p-2 opacity-50 sm:opacity-0 group-hover/card:opacity-100 transition-all bg-slate-900/80 rounded-lg shadow-inner"
                            title="Xóa nhóm"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="flex flex-col gap-2 flex-1 relative z-10 mt-1">
                          {group.exerciseIds.map((exId, idx) => {
                            const ex = PRECOMPUTED_GYM_EXERCISES.find(e => e.id === exId);
                            if (!ex) return null;
                            return (
                              <div key={exId} className="group/item flex items-center gap-2 text-xs bg-slate-950/40 hover:bg-slate-900/80 text-slate-300 px-3 py-2 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors">
                                <span className="text-slate-500 font-bold w-4 text-center shrink-0">{idx + 1}.</span>
                                <span className="font-medium truncate flex-1" title={ex.name}>{ex.viName}</span>
                                <button
                                  type="button"
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDetailExercise(ex); }}
                                  className="text-slate-500 hover:text-indigo-400 p-1.5 bg-black/40 hover:bg-black/60 rounded-lg transition-colors shrink-0 opacity-50 sm:opacity-0 group-hover/item:opacity-100"
                                  title="Xem chi tiết bài tập"
                                >
                                  <Info size={14} />
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const newSelected = new Set([...selectedExercises, ...group.exerciseIds]);
                            setSelectedExercises(Array.from(newSelected));
                          }}
                          className="mt-3 w-full relative group/btn overflow-hidden rounded-xl"
                        >
                          <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-90 group-hover/btn:opacity-100 transition-opacity"></span>
                          <div className="relative py-2.5 px-4 flex items-center justify-center gap-2 text-white font-bold text-xs sm:text-sm shadow-inner">
                            <Plus size={16} className="group-hover/btn:scale-110 transition-transform" /> Tải nhóm này vào buổi tập
                          </div>
                        </button>
                      </div>
                    ))}

                    {exerciseGroups.filter(g => g.name.toLowerCase().includes(gymSearchTerm.toLowerCase())).length === 0 && exerciseGroups.length > 0 && (
                      <div className="col-span-full text-center py-10 opacity-50">
                        <p className="text-sm font-semibold text-slate-400">Không tìm thấy nhóm nào khớp với từ khóa.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : displayedExercises.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {displayedExercises.slice(0, visibleCount).map(ex => {
                  const isSelected = selectedSet.has(ex.id);
                  const { viName, enName, topMuscles, extraMuscleCount } = ex;

                  return (
                    <div
                      key={ex.id}
                      onClick={() => setSelectedExercises(prev => prev.includes(ex.id) ? prev.filter(id => id !== ex.id) : [...prev, ex.id])}
                      className={`group relative flex flex-col cursor-pointer rounded-2xl overflow-hidden border transition-colors duration-200 ${isSelected ? 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)] bg-rose-500/10' : 'border-slate-800 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800/50'}`}
                    >
                      {/* Checkbox indicator */}
                      <div className="absolute top-3 right-3 z-20">
                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center backdrop-blur-md transition-colors shadow-sm ${isSelected ? 'bg-rose-500 border-rose-500 text-white' : 'border-white/30 bg-black/40 text-transparent group-hover:border-white/50'}`}>
                          <Check size={14} strokeWidth={3} />
                        </div>
                      </div>

                      {/* Info Button */}
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDetailExercise(ex); }}
                        className="group/btn absolute top-3 left-3 z-20 w-8 h-8 rounded-full bg-black/50 border border-white/20 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/70 transition-colors shadow-lg backdrop-blur-md"
                        title="Xem chi tiết"
                      >
                        <Info size={16} />
                      </button>

                      {/* Image Area */}
                      <div className="w-full aspect-[4/3] bg-slate-900 relative flex items-center justify-center overflow-hidden">
                        {ex.image_url ? (
                          <img
                            src={ex.image_url}
                            alt={ex.name}
                            loading="lazy"
                            decoding="async"
                            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out will-change-transform group-hover:scale-105 ${isSelected ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <Dumbbell size={32} className="text-slate-700 absolute" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent pointer-events-none"></div>

                        {/* Tags over image */}
                        <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none flex flex-col gap-1.5">
                          <div className="flex justify-between items-end w-full">
                            <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-black/80 text-rose-300 uppercase tracking-wider border border-white/10 shadow-sm flex items-center gap-1">
                              <Activity size={10} /> {ex.movement_type}
                            </span>
                            {ex.equipment && ex.equipment.length > 0 && (
                              <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-black/80 text-slate-300 border border-white/10 shadow-sm flex items-center gap-1 capitalize">
                                <Dumbbell size={10} /> {ex.equipment[0].replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="p-4 flex flex-col flex-1 bg-slate-950/40 relative z-10">
                        <div className="mb-3">
                          <h4 className={`text-[15px] font-black leading-tight mb-1 line-clamp-1 transition-colors ${isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                            {viName}
                          </h4>
                          {enName && (
                            <p className="text-[11px] font-bold text-slate-500 line-clamp-1 uppercase tracking-wider">
                              {enName}
                            </p>
                          )}
                        </div>

                        <div className="mt-auto pt-3 border-t border-slate-800/60 flex flex-wrap gap-1.5">
                          {topMuscles.map(m => (
                            <span key={m} className="text-[10px] font-semibold px-2 py-1 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/50 whitespace-nowrap flex items-center gap-1 shadow-sm">
                              <Target size={10} className="text-emerald-400" /> {m}
                            </span>
                          ))}
                          {extraMuscleCount > 0 && (
                            <span className="text-[10px] font-medium px-1.5 py-1 rounded-md bg-transparent text-slate-500">
                              +{extraMuscleCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {visibleCount < displayedExercises.length && (
                  <div className="col-span-full pt-4 pb-2 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisibleCount(prev => prev + 18)}
                      className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-full border border-slate-700 transition-colors shadow-sm flex items-center gap-2 text-sm"
                    >
                      Xem thêm bài tập ({displayedExercises.length - visibleCount})
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-3">
                <Dumbbell size={48} className="opacity-20" />
                <p>Không tìm thấy bài tập phù hợp</p>
              </div>
            )}
          </div>
        </div>

        {/* AI Style Modal */}
        {showAiStyleModal && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-indigo-500/30 rounded-[2.5rem] py-8 px-4 sm:px-6 max-w-[95vw] lg:max-w-7xl w-full animate-slide-in shadow-[0_0_80px_rgba(99,102,241,0.2)] relative overflow-hidden group/modal">
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover/modal:opacity-100 transition-opacity duration-1000 translate-x-[-100%] group-hover/modal:translate-x-[100%] skew-x-12 pointer-events-none" />

              <h4 className="text-3xl font-black text-indigo-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)] mb-2 text-center flex items-center justify-center gap-3">
                <Bot size={32} className="animate-pulse" /> Chọn Mục Tiêu
              </h4>
              <p className="text-slate-400 text-sm sm:text-base text-center mb-8 font-medium">AI sẽ lên giáo án dựa theo phong cách tập này.</p>
              
              <div className="relative group/carousel">
                {/* Left Button (Only visible on mobile/tablet where scroll is needed) */}
                <button
                  type="button"
                  onClick={() => scrollAiModal('left')}
                  className="xl:hidden absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-4 w-10 h-10 sm:w-12 sm:h-12 bg-slate-900/80 hover:bg-indigo-500 text-slate-300 hover:text-white rounded-full flex items-center justify-center z-20 border border-slate-700 hover:border-indigo-400 transition-all shadow-lg opacity-0 group-hover/carousel:opacity-100 translate-x-4 group-hover/carousel:translate-x-0 disabled:opacity-0"
                >
                  <ChevronLeft size={24} />
                </button>

                {/* Carousel Track */}
                <div 
                  ref={aiModalTrackRef}
                  className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-4 sm:gap-6 px-2 pt-4 pb-6 xl:justify-center"
                >
                  {[
                    { value: 'strength', label: 'Sức mạnh', reps: '3-5 Reps', desc: 'Tối đa lực đẩy', icon: Dumbbell, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', hoverBorder: 'hover:border-rose-500', glow: 'hover:shadow-[0_0_20px_rgba(244,63,94,0.3)]', gradient: 'from-rose-500/20 to-rose-500/5' },
                    { value: 'hypertrophy', label: 'Cơ bắp', reps: '8-12 Reps', desc: 'Tăng khối lượng', icon: Target, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', hoverBorder: 'hover:border-amber-500', glow: 'hover:shadow-[0_0_20px_rgba(251,191,36,0.3)]', gradient: 'from-amber-500/20 to-amber-500/5' },
                    { value: 'endurance', label: 'Sức bền', reps: '15-20 Reps', desc: 'Tăng thể lực', icon: Timer, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', hoverBorder: 'hover:border-emerald-500', glow: 'hover:shadow-[0_0_20px_rgba(52,211,153,0.3)]', gradient: 'from-emerald-500/20 to-emerald-500/5' },
                    { value: 'power', label: 'Bùng nổ', reps: 'Tốc độ', desc: 'Phát lực nhanh', icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', hoverBorder: 'hover:border-cyan-500', glow: 'hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]', gradient: 'from-cyan-500/20 to-cyan-500/5' },
                    { value: 'general', label: 'Tổng hợp', reps: 'Full Body', desc: 'Phát triển đều', icon: LayoutGrid, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', hoverBorder: 'hover:border-indigo-500', glow: 'hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]', gradient: 'from-indigo-500/20 to-indigo-500/5' }
                  ].map((opt, idx) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleAiCoachConfirm(opt.value as TrainingStyle)}
                        className={`snap-center shrink-0 w-[calc(80vw-2rem)] sm:w-[calc(40vw-1rem)] md:w-[calc(33.333%-1rem)] xl:w-[220px] group relative flex flex-col items-center justify-center gap-4 p-6 sm:p-8 rounded-[2rem] border ${opt.border} ${opt.bg} ${opt.hoverBorder} transition-all duration-300 overflow-hidden text-center bg-slate-900/60 ${opt.glow} hover:-translate-y-2`}
                      >
                        {/* Hover Gradient */}
                        <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${opt.gradient} pointer-events-none`} />
                        
                        {/* Content */}
                        <div className={`relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center ${opt.bg} ${opt.color} group-hover:scale-110 transition-transform duration-300 mb-2`}>
                          <Icon size={36} strokeWidth={2} />
                        </div>
                        
                        <div className="relative z-10 flex flex-col items-center w-full">
                          <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full ${opt.color} ${opt.bg} border ${opt.border} mb-4 shadow-sm`}>
                            {opt.reps}
                          </span>
                          <span className={`font-black text-slate-200 group-hover:text-white transition-colors mb-2 text-xl sm:text-2xl`}>
                            {opt.label}
                          </span>
                          <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors font-medium">
                            {opt.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Right Button */}
                <button
                  type="button"
                  onClick={() => scrollAiModal('right')}
                  className="xl:hidden absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-4 w-10 h-10 sm:w-12 sm:h-12 bg-slate-900/80 hover:bg-indigo-500 text-slate-300 hover:text-white rounded-full flex items-center justify-center z-20 border border-slate-700 hover:border-indigo-400 transition-all shadow-lg opacity-0 group-hover/carousel:opacity-100 -translate-x-4 group-hover/carousel:translate-x-0 disabled:opacity-0"
                >
                  <ChevronRight size={24} />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowAiStyleModal(false)}
                className="mt-6 w-full text-slate-500 hover:text-slate-300 font-bold text-sm tracking-wider uppercase transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        )}
      </>
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
        const newSet = lastSet ? { ...lastSet } : { reps: 0, weight: 0, rir: 2, toFailure: false };
        return { ...ex, sets: [...ex.sets, newSet] };
      }));
    };

    const removeSet = (exerciseId: string, setIndex: number) => {
      setDetailedExercises(prev => prev.map(ex => {
        if (ex.exerciseId !== exerciseId) return ex;
        return { ...ex, sets: ex.sets.filter((_, i) => i !== setIndex) };
      }));
    };

    // Auto-select first exercise if none is active
    const currentActiveId = activeDetailExId && detailedExercises.some(e => e.exerciseId === activeDetailExId)
      ? activeDetailExId
      : detailedExercises[0]?.exerciseId || null;

    const activeEx = detailedExercises.find(ex => ex.exerciseId === currentActiveId);
    const estimatedMinutes = Math.round(
      detailedExercises.reduce((acc, ex) => {
        let executionTimePerSet = 0.75;
        if (trainingStyle === 'strength' || trainingStyle === 'power') executionTimePerSet = 0.5;
        else if (trainingStyle === 'endurance') executionTimePerSet = 1.0;
        const executionTime = ex.sets.length * executionTimePerSet; 
        
        const restSeconds = ex.restTime || 90;
        const restTime = Math.max(0, ex.sets.length - 1) * (restSeconds / 60); 
        
        const transitionTime = gymLocation === 'home' ? 1 : 2.5;
        
        return acc + executionTime + restTime + transitionTime;
      }, gymLocation === 'home' ? 5 : 10)
    );
    const isTimeBased = activeEx ? PRECOMPUTED_GYM_EXERCISES.find(e => e.id === activeEx.exerciseId)?.measureType === 'time' : false;

    return (
      <div className="flex flex-col sm:flex-row h-[500px] sm:h-[550px] animate-slide-in gap-4 sm:gap-6">

        {/* ===== LEFT SIDEBAR: Exercise List & Controls ===== */}
        <div className="flex flex-col shrink-0 w-full sm:w-64 md:w-72 gap-3 sm:gap-4">
          {/* Header Controls */}
          <div className="flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-xs font-bold" title="Thời gian tập dự kiến"><Timer size={16} strokeWidth={2.5} /> ~{estimatedMinutes} phút</div>
              {isProMode && (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExplainModal('rir'); }}
                  className="text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1 text-[10px] bg-slate-800/50 px-2 py-1.5 rounded-full border border-slate-700 relative z-20 cursor-pointer"
                >
                  <Info size={12} className="pointer-events-none" /> RIR
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsProMode(!isProMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${isProMode ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'} border`}
              >
                <Bot size={12} /> {isProMode ? 'Pro' : 'Pro'}
              </button>
            </div>
          </div>

          {/* Form Rating Toggle */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 shrink-0">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2.5">
              <Activity size={14} className="text-emerald-400" /> Đánh giá Form
            </label>
            <div className="flex bg-slate-800 rounded-xl p-1 border border-slate-700">
              <button type="button" onClick={() => setFormRatingMode('exercise')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${formRatingMode === 'exercise' ? 'bg-emerald-500/20 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
              >Theo Bài</button>
              <button type="button" onClick={() => setFormRatingMode('set')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${formRatingMode === 'set' ? 'bg-emerald-500/20 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
              >Theo Hiệp</button>
            </div>
          </div>

          {/* Training Style Selector */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 shrink-0">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2.5">
              <Target size={14} className="text-purple-400" /> Mục tiêu
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'strength', label: 'Sức mạnh' },
                { value: 'hypertrophy', label: 'Cơ bắp' },
                { value: 'endurance', label: 'Sức bền' },
                { value: 'power', label: 'Bùng nổ' },
                { value: 'general', label: 'Tổng hợp' }
              ].map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => setTrainingStyle(opt.value as TrainingStyle)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${trainingStyle === opt.value ? 'bg-rose-500 text-white border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.3)]' : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:bg-slate-800 hover:text-slate-200'}`}
                >{opt.label}</button>
              ))}
            </div>
          </div>

          {/* Exercise Navigation List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar px-1 py-1 -mx-1">
            {detailedExercises.map((ex, i) => {
              const isActive = ex.exerciseId === currentActiveId;
              const totalSets = ex.sets.length;
              const hasFail = ex.sets.some(s => s.rir === 0 || s.toFailure);
              return (
                <button key={ex.exerciseId} type="button"
                  onClick={() => setActiveDetailExId(ex.exerciseId)}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-xl transition-all duration-300 border ${isActive ? 'bg-rose-500/15 border-rose-500/70 shadow-[0_0_25px_rgba(244,63,94,0.25)] translate-x-1 z-10 relative' : 'opacity-70 hover:opacity-100 bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/50'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-[11px] font-black w-6 h-6 flex items-center justify-center rounded-md shrink-0 ${isActive ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-800 text-slate-500'}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm sm:text-base font-black truncate tracking-wide ${isActive ? 'text-white' : 'text-slate-300'}`}>
                        {ex.name.split(' / ')[0]}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-slate-500">{totalSets} sets</span>
                        {hasFail && <Flame size={10} className="text-rose-500" />}
                        {ex.sets.some(s => s.isAmrap) && <span className="text-[8px] font-bold text-orange-400">AMRAP</span>}
                      </div>
                    </div>
                    {isActive && <ChevronRight size={14} className="text-rose-400 shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Red Alert (compact) */}
          {recoveryAlert && recoveryAlert.isRedAlert && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-2.5 shrink-0 animate-fade-in">
              <div className="flex items-center gap-1.5 text-rose-400 font-black">
                <ShieldAlert size={14} className="animate-pulse shrink-0" />
                <span className="uppercase tracking-wider text-[10px]">Red Alert</span>
              </div>
              <p className="text-[9px] text-rose-300 mt-1 leading-relaxed line-clamp-2">
                {recoveryAlert.warnings[recoveryAlert.warnings.length - 1]}
              </p>
            </div>
          )}
        </div>

        {/* ===== RIGHT PANEL: Exercise Detail Form ===== */}
        <div className="flex-1 overflow-y-auto pr-1 border border-slate-800 rounded-2xl p-4 sm:p-5 bg-slate-900/30 custom-scrollbar">
          {activeEx ? (
            <div className="space-y-4 animate-fade-in" key={`${activeEx.exerciseId}-${autoFillTrigger}`}>
              {/* Exercise Header */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-3 w-full">
                  {/* Image Thumbnail */}
                  {(() => {
                    const fullExDef = GYM_EXERCISES.find(e => e.id === activeEx.exerciseId);
                    return <ExerciseImageThumbnail imageUrl={fullExDef?.image_url} name={activeEx.name} />;
                  })()}
                  <div className="flex-1">
                    <h4 className="font-bold text-base text-rose-400 leading-tight">
                      {activeEx.name.split(' / ')[0]}
                    </h4>
                    {activeEx.restTime && (
                      <span className="inline-flex mt-1.5 text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 items-center gap-1">
                        <Clock size={10} /> Nghỉ: {activeEx.restTime}s
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Exercise Level Form Rating */}
              {formRatingMode === 'exercise' && (
                <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-semibold text-slate-400">Chất lượng Form</span>
                    <span className={`text-[11px] font-bold ${activeEx.formRating && activeEx.formRating >= 80 ? 'text-emerald-400' : activeEx.formRating && activeEx.formRating >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {activeEx.formRating || 100}%
                    </span>
                  </div>
                  <input
                    type="range" min="0" max="100" step="10"
                    value={activeEx.formRating || 100}
                    onChange={e => {
                      setDetailedExercises(prev => prev.map(pEx => pEx.exerciseId === activeEx.exerciseId ? { ...pEx, formRating: parseInt(e.target.value) } : pEx));
                    }}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-medium">
                    <span>Tệ</span>
                    <span>Hoàn hảo</span>
                  </div>
                </div>
              )}

              {/* Sets List */}
              <div className="space-y-4">
                {activeEx.sets.map((set, idx) => (
                  <div key={idx} className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-6 bg-slate-900/40 hover:bg-slate-800/60 transition-all p-3 sm:p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700/80 relative group shadow-sm">
                      <div className="w-10 sm:w-12 text-center text-sm font-black text-slate-400 flex flex-col justify-center shrink-0">
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest mb-0.5">Set</span>
                        #{idx + 1}
                      </div>

                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 flex-1">
                        <div className="flex flex-col relative w-[45%] sm:w-24 shrink-0">
                          <label className="text-[10px] font-bold text-slate-500 mb-1 ml-1 uppercase tracking-widest">Kg {activeEx.isBodyweight ? '(Tạ thêm)' : ''}</label>
                          <input
                            type="number" min="0" step="0.5"
                            value={set.weight}
                            onChange={e => updateSet(activeEx.exerciseId, idx, 'weight', parseFloat(e.target.value) || 0)}
                            className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-base sm:text-lg font-black text-white focus:border-indigo-500 focus:bg-slate-700 transition-all outline-none text-center shadow-inner w-full"
                          />
                        </div>

                        <div className="flex flex-col relative w-[45%] sm:w-28 shrink-0">
                          <label className="text-[10px] font-bold text-slate-500 mb-1 ml-1 uppercase tracking-widest flex justify-between">
                            {isTimeBased ? 'Giây' : 'Reps'}
                            {set.isAmrap && <span className="text-orange-400 font-black">AMRAP</span>}
                          </label>
                          <input
                            type="number" min="0"
                            value={isTimeBased ? (set.duration || 0) : set.reps}
                            onChange={e => updateSet(activeEx.exerciseId, idx, isTimeBased ? 'duration' : 'reps', parseInt(e.target.value) || 0)}
                            className={`bg-slate-800 border ${set.isAmrap ? 'border-orange-500 text-orange-400 focus:border-orange-400 focus:bg-slate-700' : 'border-slate-700 text-white focus:border-rose-500 focus:bg-slate-700'} rounded-xl px-4 py-3 text-base sm:text-lg font-black transition-all outline-none text-center shadow-inner w-full`}
                          />
                        </div>

                        {isProMode && (
                          <div className="flex flex-col relative animate-fade-in w-full sm:w-24 shrink-0 mt-2 sm:mt-0">
                            <label className="text-[10px] font-bold text-slate-500 mb-1 ml-1 uppercase tracking-widest flex justify-between">
                              RIR <span className="text-[9px] text-slate-500 font-medium hidden sm:inline">(0 = Fail)</span>
                            </label>
                            <input
                              type="number" min="0" max="10"
                              value={set.rir ?? 2}
                              onChange={e => {
                                const rirVal = parseInt(e.target.value) || 0;
                                updateSet(activeEx.exerciseId, idx, 'rir', rirVal);
                                if (rirVal === 0) updateSet(activeEx.exerciseId, idx, 'toFailure', 1);
                              }}
                              className={`bg-slate-800 border rounded-xl px-4 py-3 text-base sm:text-lg font-black transition-all outline-none text-center shadow-inner w-full ${set.rir === 0 ? 'border-rose-500 text-rose-400 bg-rose-500/10' : 'border-slate-700 text-white focus:border-rose-500 focus:bg-slate-700'}`}
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end shrink-0 ml-auto w-full sm:w-auto mt-2 sm:mt-0">
                        <button
                          type="button"
                          onClick={() => removeSet(activeEx.exerciseId, idx)}
                          className="p-3 rounded-xl bg-slate-800/50 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/50 border border-transparent opacity-60 group-hover:opacity-100 transition-all flex items-center justify-center w-full sm:w-auto"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Set Level Form Rating */}
                    {formRatingMode === 'set' && (
                      <div className="w-full bg-slate-900/50 p-2.5 rounded-xl border border-slate-700/50">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[10px] font-semibold text-slate-400">Chất lượng Form hiệp này</span>
                          <span className={`text-[11px] font-bold ${set.formRating && set.formRating >= 80 ? 'text-emerald-400' : set.formRating && set.formRating >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                            {set.formRating || 100}%
                          </span>
                        </div>
                        <input
                          type="range" min="0" max="100" step="10"
                          value={set.formRating || 100}
                          onChange={e => updateSet(activeEx.exerciseId, idx, 'formRating', parseInt(e.target.value))}
                          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 shadow-inner outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-400 [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(129,140,248,0.6)] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-indigo-200"
                        />
                      </div>
                    )}
                  </div>
                ))}
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => addSet(activeEx.exerciseId)}
                    className="flex-1 py-3 border border-dashed border-slate-600 hover:border-rose-500/50 text-slate-400 hover:text-rose-300 rounded-xl text-[11px] sm:text-xs font-bold bg-slate-800/30 hover:bg-rose-500/10 flex justify-center items-center gap-2 transition-colors"
                  >
                    <Plus size={14} /> Thêm Set
                  </button>

                  {!isProMode && (
                    <div className="flex-1 flex">
                      <button
                        type="button"
                        onClick={() => {
                          const lastIdx = activeEx.sets.length - 1;
                          if (lastIdx >= 0) {
                            const isCurrentlyFailure = activeEx.sets[lastIdx].rir === 0;
                            updateSet(activeEx.exerciseId, lastIdx, 'rir', isCurrentlyFailure ? 2 : 0);
                            updateSet(activeEx.exerciseId, lastIdx, 'toFailure', isCurrentlyFailure ? 0 : 1);
                          }
                        }}
                        className={`flex-1 py-3 border rounded-l-xl text-[11px] sm:text-xs font-bold flex justify-center items-center gap-2 transition-all border-r-0 ${activeEx.sets.length > 0 && activeEx.sets[activeEx.sets.length - 1].rir === 0
                          ? 'bg-rose-500/20 border-rose-500/50 border-r-transparent text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                          : 'bg-slate-800/50 border-slate-700 border-r-transparent text-slate-400 hover:border-slate-500 hover:bg-slate-800'
                          }`}
                      >
                        <Flame size={14} className={activeEx.sets.length > 0 && activeEx.sets[activeEx.sets.length - 1].rir === 0 ? 'text-rose-500 animate-pulse' : ''} />
                        Hiệp cuối kiệt sức
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExplainModal('failure'); }}
                        className={`px-3 border rounded-r-xl transition-all flex items-center justify-center relative z-20 cursor-pointer ${activeEx.sets.length > 0 && activeEx.sets[activeEx.sets.length - 1].rir === 0
                          ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 hover:bg-rose-500/30'
                          : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500 hover:bg-slate-700 hover:text-white'
                          }`}
                      >
                        <Info size={14} className="pointer-events-none" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-3">
              <Dumbbell size={48} className="opacity-20" />
              <p className="text-sm">Chọn bài tập ở bên trái để chỉnh sửa</p>
            </div>
          )}
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
              <span className="flex items-center gap-2"><Activity size={16} className="text-sky-400" /> Thời lượng</span>
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
              <span className="flex items-center gap-2"><Activity size={16} className="text-orange-400" /> Mức độ kiệt sức (Tổng quan RPE)</span>
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

      {/* TIME LOGGING (Retroactive) */}
      {gymIntent === 'log' && (
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
          <label className="flex items-center gap-2 text-sm font-black text-white mb-2">
            <Clock size={18} className="text-indigo-400" /> Thời điểm diễn ra
          </label>
          <div className="flex flex-wrap gap-2">
            {(['now', 'yesterday', 'custom'] as const).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setTimeMode(mode)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  timeMode === mode 
                    ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' 
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {mode === 'now' ? 'Vừa xong' : mode === 'yesterday' ? 'Hôm qua' : 'Tùy chỉnh'}
              </button>
            ))}
          </div>
          {timeMode === 'custom' && (
            <div className="mt-3 animate-fade-in">
              <input 
                type="datetime-local" 
                value={new Date(customTimestamp - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                onChange={(e) => setCustomTimestamp(new Date(e.target.value).getTime())}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          )}
        </div>
      )}

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
      <div className="absolute inset-0 bg-[#05070a]/80 backdrop-blur-md -z-10" onClick={step === 0 ? onClose : undefined} />

      <div className={`backdrop-blur-2xl w-full ${step === 0 || step === 0.5 || step === 0.75 || step === 1.4 ? 'max-w-4xl' : step === 1 || step === 1.1 || step === 1.2 || step === 1.3 ? 'max-w-5xl' : step === 1.25 ? 'max-w-[95vw] xl:max-w-7xl' : 'max-w-2xl'} relative bg-slate-950/80 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] transition-all duration-300`}>

        {/* Header */}
        <div className="px-5 sm:px-8 py-4 sm:py-5 border-b border-slate-800/60 flex justify-between items-center bg-slate-900/20 rounded-t-3xl">
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
                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step === num
                  ? `${theme.bg} text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]`
                  : step > num
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-500'
                  }`}>
                  {step > num ? <Check size={12} strokeWidth={3} /> : num}
                </div>
                <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider hidden sm:block ${step === num ? theme.color : 'text-slate-500'
                  }`}>
                  {num === 1 ? 'Bài tập' : num === 2 ? 'Cơ thể' : 'Hoàn tất'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Main Content Area */}
        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1">
          <form id="activity-form" onSubmit={handleSubmit} className="h-full">
            {step === 0 && renderStep0()}
            {step === 0.5 && renderStep0_5()}
            {step === 0.75 && renderStep0_75()}
            {step === 1 && renderStep1()}
            {step === 1.1 && renderStep1_1_fb()}
            {step === 1.2 && renderStep1_2_fb()}
            {step === 1.3 && activityType === 'football' && renderStep1_3_fb()}
            {step === 1.4 && activityType === 'football' && renderStep1_4_fb()}
            {step === 1.5 && activityType === 'football' && renderStep1_5_fb()}
            {step === 1.25 && renderStep1_25()}
            {step === 1.3 && activityType === 'gym' && renderStep1_3()}
            {step === 1.5 && activityType === 'gym' && renderStep1_5()}
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
                {detailExercise.image_url ? (
                  <img src={detailExercise.image_url} alt={detailExercise.name} className="w-full h-full object-cover" />
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
                        .filter(([, val]) => typeof val === 'number')
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
        {step > 0 && step !== 0.5 && step !== 0.75 && !(activityType === 'football' && (step === 1.1 || step === 1.2)) && (
          <div className="shrink-0 p-3 sm:p-4 border-t border-slate-800/60 flex justify-between gap-3 bg-slate-950/90 backdrop-blur-lg rounded-b-3xl z-40 mt-auto">
            <button
              type="button"
              onClick={handleBack}
              className="px-4 sm:px-5 py-2.5 rounded-xl font-bold text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              <ChevronLeft size={18} /> Quay lại
            </button>

            <div className="flex items-center gap-2 sm:gap-3 ml-auto">
              {step === 1.25 && selectedExercises.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedExercises([])}
                  className="px-3 sm:px-4 py-2.5 rounded-xl font-bold text-[11px] sm:text-sm text-slate-400 bg-slate-800/80 hover:bg-slate-700 hover:text-white transition-all flex items-center gap-1 sm:gap-2 border border-slate-700/50"
                  title="Bỏ chọn tất cả các bài tập"
                >
                  <X size={16} className="hidden sm:block text-slate-500" /> Bỏ chọn ({selectedExercises.length})
                </button>
              )}

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

              {step < 3 ? (
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
                  className={`px-4 sm:px-6 py-2.5 rounded-xl font-bold text-[13px] sm:text-sm text-white transition-all flex items-center gap-1 sm:gap-2 ${gymIntent === 'plan' ? 'bg-sky-500 hover:bg-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.4)]' : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]'}`}
                >
                  <Check size={18} /> {gymIntent === 'plan' ? 'Lưu Kế Hoạch' : 'Lưu Nhật Ký'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Explanation Modal */}
      {explainModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setExplainModal(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => setExplainModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X size={24} />
            </button>
            {explainModal === 'failure' ? (
              <>
                <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center mb-4">
                  <Flame size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Hiệp cuối kiệt sức (Failure)</h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">
                  Trạng thái <strong>Thất bại cơ học</strong> xảy ra khi bạn không thể thực hiện thêm bất kỳ một lần nâng (rep) nào nữa với chuẩn form.
                </p>
                <ul className="text-sm text-slate-400 space-y-2 list-disc pl-4">
                  <li>Tăng cường tối đa việc phá hủy sợi cơ (Sát thương cơ học cao).</li>
                  <li>Phạt nặng hệ thần kinh trung ương (Tăng CNS Fatigue).</li>
                  <li>Khuyên dùng: Chỉ nên áp dụng cho hiệp cuối cùng của mỗi bài tập để tránh kiệt sức quá sớm.</li>
                </ul>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                  <Brain size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">RIR (Reps In Reserve)</h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">
                  <strong>Số lần dự trữ:</strong> Là số lần (reps) bạn <em>còn có thể nâng thêm</em> trước khi cơ bắp hoàn toàn kiệt sức ở một hiệp tập.
                </p>
                <div className="space-y-3 text-sm text-slate-400">
                  <div className="flex gap-3"><span className="text-emerald-400 font-bold min-w-[50px]">RIR 3-4</span> <span>Tập nhẹ nhàng, dư sức, phù hợp khởi động.</span></div>
                  <div className="flex gap-3"><span className="text-sky-400 font-bold min-w-[50px]">RIR 1-2</span> <span>Tối ưu cho tăng cơ (Hypertrophy), an toàn thần kinh.</span></div>
                  <div className="flex gap-3"><span className="text-rose-400 font-bold min-w-[50px]">RIR 0</span> <span>Sập tạ (Max Effort). Không thể đẩy thêm 1 rep nào.</span></div>
                </div>
              </>
            )}
            <button type="button" onClick={() => setExplainModal(null)} className="w-full mt-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors">
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
