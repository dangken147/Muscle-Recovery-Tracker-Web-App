import { useState } from 'react';
import type { UserProfile, MuscleState, CortisolState, MuscleGroup, ActivityLog } from '../types/recovery.types';
import { MUSCLE_LABELS, generateCoachAdvice, calibrateMuscleStatesWithDOMS } from '../utils/recovery.utils';
import BodyMap from './BodyMap';
import BiometricChart from './BiometricChart';
import ActiveRecovery from './ActiveRecovery';
import MuscleBioCard from './MuscleBioCard';
import { Dumbbell, Search, ShieldAlert, Activity, AlertTriangle, BatteryCharging, CheckCircle2 } from 'lucide-react';

interface DashboardProps {
  profile: UserProfile;
  muscleStates: MuscleState[];
  cortisolState: CortisolState;
  onOpenLogForm: () => void;
  domsRecords: Record<MuscleGroup, number>;
  logs: ActivityLog[];
  offsetHours: number;
  onResumeLog?: (log: ActivityLog, step: number) => void;
}

export default function Dashboard({
  profile,
  muscleStates,
  cortisolState,
  onOpenLogForm,
  domsRecords,
  logs,
  offsetHours,
  onResumeLog,
}: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const advice = generateCoachAdvice(profile, muscleStates, cortisolState);
  const calibratedStates = calibrateMuscleStatesWithDOMS(profile, muscleStates, domsRecords);

  // Cortisol Gauge Ring configuration
  const radius = 90;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const percentage = cortisolState.currentLevel;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getCortisolColor = (zone: string) => {
    if (zone === 'catabolic') return '#f43f5e';
    if (zone === 'normal') return '#3b82f6';
    return '#10b981';
  };

  // Filters
  const filteredMuscles = calibratedStates.filter((m) => {
    const labelMatch = MUSCLE_LABELS[m.muscle].toLowerCase().includes(searchTerm.toLowerCase());
    const filterMatch = statusFilter === 'all' || m.status === statusFilter;
    return labelMatch && filterMatch;
  });

  const fatiguedMuscles = calibratedStates
    .filter(m => m.status === 'heavy' || m.status === 'injured' || m.status === 'moderate')
    .map(m => m.muscle);

  const plannedWorkout = [...logs].sort((a, b) => b.timestamp - a.timestamp).find(l => l.status === 'planned');

  return (
    <div className="bento-grid animate-fade-in">
      
      {/* --- ROW 1: Hero Banner (12 cols) --- */}
      <div 
        className="glass-card bento-item col-span-12 border-l-4 relative overflow-hidden"
        style={{ 
          borderColor: getCortisolColor(cortisolState.zone),
          boxShadow: cortisolState.zone === 'catabolic' 
            ? '0 10px 40px rgba(244, 63, 94, 0.15)' 
            : cortisolState.zone === 'normal' 
              ? '0 10px 40px rgba(59, 130, 246, 0.1)' 
              : '0 10px 40px rgba(16, 185, 129, 0.1)'
        }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 flex-1">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <ShieldAlert size={14} className="text-indigo-400" /> Chẩn đoán
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight leading-tight">
              {advice.title}
            </h2>

          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full md:w-auto mt-4 md:mt-0">
            <button
              onClick={onOpenLogForm}
              className="btn-cta group"
            >
              <Dumbbell size={22} className="group-hover:animate-bounce" /> Ghi nhật ký
            </button>
          </div>
        </div>
      </div>

      {/* --- ROW 1.25: Planned Workout Banner --- */}
      {plannedWorkout && (
        <div className="col-span-12">
          <div className="glass-card flex flex-col md:flex-row items-start md:items-center justify-between p-5 border-l-4 border-sky-500 bg-sky-500/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-sky-400 font-bold uppercase tracking-widest text-[10px] mb-2">
                <Dumbbell size={14} /> Kế hoạch tập luyện
              </div>
              <h3 className="text-white font-bold text-lg">Bạn có giáo án chưa hoàn thành!</h3>
              <p className="text-slate-400 text-sm mt-1">Đã đến lúc thực hiện giáo án {plannedWorkout.activityType === 'gym' ? 'Gym' : ''} mà bạn đã tạo.</p>
            </div>
            <button
              onClick={() => onResumeLog && onResumeLog(plannedWorkout, 1.5)}
              className="relative z-10 mt-4 md:mt-0 px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold shadow-[0_0_15px_rgba(14,165,233,0.3)] transition-all flex items-center gap-2 w-full md:w-auto justify-center cursor-pointer"
            >
              Bắt đầu ngay <CheckCircle2 size={18} />
            </button>
          </div>
        </div>
      )}

      {/* --- ROW 1.5: Active Recovery (Hiển thị khi có cơ bị mỏi) --- */}
      {fatiguedMuscles.length > 0 && (
        <div className="col-span-12">
           <ActiveRecovery fatiguedMuscles={fatiguedMuscles} />
        </div>
      )}

      {/* --- ROW 3: Body Map & Muscle List --- */}
      <div className="glass-card bento-item col-span-12 lg:col-span-8 flex flex-col items-center">
        <div className="w-full text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <ShieldAlert size={14} /> Cơ bắp
        </div>
        <div className="w-full flex-1 flex items-center justify-center">
          <BodyMap muscleStates={calibratedStates} cortisolState={cortisolState} interactive={false} />
        </div>
      </div>

      <div className="glass-card bento-item col-span-12 lg:col-span-4 flex flex-col">
        <div className="flex flex-col items-start justify-between gap-4 border-b border-white/5 pb-5 mb-5">
          <h3 className="text-sm font-bold text-white tracking-widest uppercase">
            Trạng thái
          </h3>
          <div className="flex flex-col gap-3 w-full">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Tìm cơ bắp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-xs pl-9 pr-4 py-2 bg-slate-900/50 w-full"
              />
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs py-2 px-4 bg-slate-900/50"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="recovered">Phục hồi</option>
              <option value="mild">Mỏi nhẹ</option>
              <option value="moderate">Mỏi vừa</option>
              <option value="heavy">Mỏi nặng</option>
              <option value="injured">Chấn thương</option>
            </select>
          </div>
        </div>

        {(() => {
          const attentionMuscles = filteredMuscles.filter(m => m.status === 'injured' || m.status === 'heavy');
          const recoveringMuscles = filteredMuscles.filter(m => m.status === 'moderate' || m.status === 'mild');
          const readyMuscles = filteredMuscles.filter(m => m.status === 'recovered');

          return (
            <div className="flex-1 overflow-y-auto pr-2 space-y-6" style={{ maxHeight: '420px' }}>
              
              {attentionMuscles.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <AlertTriangle size={12} className="text-rose-400" /> Nguy cơ ({attentionMuscles.length})
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {attentionMuscles.map(state => <MuscleBioCard key={state.muscle} state={state} />)}
                  </div>
                </div>
              )}

              {recoveringMuscles.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <BatteryCharging size={12} className="text-amber-400" /> Đang mỏi ({recoveringMuscles.length})
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {recoveringMuscles.map(state => <MuscleBioCard key={state.muscle} state={state} />)}
                  </div>
                </div>
              )}

              {readyMuscles.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-emerald-400" /> Sẵn sàng ({readyMuscles.length})
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {readyMuscles.map(state => <MuscleBioCard key={state.muscle} state={state} />)}
                  </div>
                </div>
              )}

              {filteredMuscles.length === 0 && (
                <div className="flex items-center justify-center text-slate-400 py-10 text-sm font-medium">
                  Trống
                </div>
              )}

            </div>
          );
        })()}
      </div>

      {/* --- ROW 2: Cortisol Gauge & Chart --- */}
      <div className="glass-card bento-item col-span-12 lg:col-span-8 flex flex-col justify-center">
        <BiometricChart profile={profile} logs={logs} offsetHours={offsetHours} />
      </div>
      <div className="glass-card bento-item col-span-12 lg:col-span-4 flex flex-col items-center justify-center text-center p-8 relative overflow-hidden">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 w-full text-left flex items-center gap-2">
          <Activity size={14} /> Thần kinh (CNS)
        </div>
        <div className="gauge-container mb-6 scale-110">
          <svg className="gauge-svg w-full h-full">
            <circle cx="120" cy="120" r={normalizedRadius} className="gauge-bg" />
            <circle
              cx="120" cy="120" r={normalizedRadius} className="gauge-fill"
              stroke={getCortisolColor(cortisolState.zone)}
              strokeDasharray={`${circumference} ${circumference}`}
              style={{ strokeDashoffset }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-black text-white tracking-tighter drop-shadow-lg">
              {percentage}<span className="text-2xl text-slate-400">%</span>
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cortisol</span>
          </div>
        </div>
        <div className="text-sm font-extrabold text-white mb-2 uppercase tracking-wide">
          {cortisolState.zone === 'catabolic' ? 'Dị Hóa' : cortisolState.zone === 'normal' ? 'Cân Bằng' : 'Đồng Hóa'}
        </div>
      </div>
    </div>
  );
}
