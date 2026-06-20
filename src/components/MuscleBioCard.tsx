import { Activity, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import type { MuscleState } from '../types/recovery.types';
import { MUSCLE_LABELS } from '../utils/recovery.utils';

interface MuscleBioCardProps {
  state: MuscleState;
}

export default function MuscleBioCard({ state }: MuscleBioCardProps) {
  const name = MUSCLE_LABELS[state.muscle];

  let statusConfig = {
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    glow: 'shadow-[0_0_15px_rgba(16,185,129,0.05)]',
    stroke: '#10b981',
    icon: <CheckCircle2 size={12} strokeWidth={3} />,
    label: 'SẴN SÀNG',
    dropShadow: 'drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]'
  };

  if (state.status === 'injured') {
    statusConfig = {
      color: 'text-purple-400',
      bg: 'bg-purple-500/20',
      border: 'border-purple-500/30',
      glow: 'shadow-[0_0_15px_rgba(168,85,247,0.2)]',
      stroke: '#a855f7',
      icon: <AlertTriangle size={12} strokeWidth={3} />,
      label: 'CHẤN THƯƠNG',
      dropShadow: 'drop-shadow-[0_0_15px_rgba(168,85,247,0.6)] group-hover:drop-shadow-[0_0_25px_rgba(168,85,247,0.8)]'
    };
  } else if (state.status === 'heavy') {
    statusConfig = {
      color: 'text-rose-400',
      bg: 'bg-rose-500/20',
      border: 'border-rose-500/30',
      glow: 'shadow-[0_0_15px_rgba(244,63,94,0.2)]',
      stroke: '#f43f5e',
      icon: <AlertTriangle size={12} strokeWidth={3} />,
      label: 'QUÁ TẢI',
      dropShadow: 'drop-shadow-[0_0_15px_rgba(244,63,94,0.6)] group-hover:drop-shadow-[0_0_25px_rgba(244,63,94,0.8)]'
    };
  } else if (state.status === 'moderate') {
    statusConfig = {
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
      glow: 'shadow-[0_0_15px_rgba(249,115,22,0.05)]',
      stroke: '#f97316',
      icon: <Activity size={12} strokeWidth={3} />,
      label: 'ĐANG PHỤC HỒI',
      dropShadow: 'drop-shadow-[0_0_10px_rgba(249,115,22,0.4)]'
    };
  } else if (state.status === 'mild') {
    statusConfig = {
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      glow: 'shadow-[0_0_15px_rgba(245,158,11,0.05)]',
      stroke: '#f59e0b',
      icon: <Activity size={12} strokeWidth={3} />,
      label: 'MỎI NHẸ',
      dropShadow: 'drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]'
    };
  }

  const isAlert = state.status === 'injured' || state.status === 'heavy';

  return (
    <div className={`relative p-4 bg-slate-900/60 backdrop-blur-md border ${statusConfig.border} rounded-[1.25rem] flex flex-col transition-all duration-300 hover:-translate-y-1 hover:bg-slate-900/80 overflow-hidden group cursor-pointer ${statusConfig.glow} ${isAlert ? 'animate-[pulse_3s_ease-in-out_infinite]' : ''}`}>
      
      {/* Nền gradient nhiễu mờ */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none" 
        style={{ background: `radial-gradient(circle at top right, ${statusConfig.stroke} 0%, transparent 60%)` }} 
      />

      <div className="relative z-10 flex items-start justify-between w-full mb-3">
        <div className="flex flex-col gap-1.5">
          <h4 className="text-sm font-black text-white tracking-wider uppercase">{name}</h4>
          
          {/* Nhãn Badge */}
          <div className={`flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-md ${statusConfig.bg} border ${statusConfig.border} ${statusConfig.color}`}>
            {statusConfig.icon}
            <span className="text-[10px] font-black uppercase tracking-widest leading-none mt-0.5">{statusConfig.label}</span>
          </div>

          {/* Thông tin phụ */}
          {state.recoveryTimeRemaining > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium mt-1">
              <Clock size={10} strokeWidth={2.5} className={statusConfig.color} />
              <span>Phục hồi: <strong className="text-white">{state.recoveryTimeRemaining}h</strong></span>
            </div>
          )}
        </div>
        
        {/* % Fatigue (Điểm nhấn thị giác) */}
        <div className="flex flex-col items-end">
          <div className={`text-2xl sm:text-3xl font-black ${statusConfig.color} leading-none transition-all ${statusConfig.dropShadow}`}>
            {state.fatigue}<span className="text-xs sm:text-sm ml-0.5 opacity-60">%</span>
          </div>
          <span className="text-[8px] uppercase tracking-widest text-slate-500 font-bold mt-1">Độ Mỏi</span>
        </div>
      </div>

      {/* Segmented Bar (Thanh sinh trắc học) */}
      <div className="relative h-1.5 w-full bg-slate-800/60 rounded-full overflow-hidden mt-1">
        <div 
          className="absolute inset-0 pointer-events-none z-10" 
          style={{ backgroundImage: 'repeating-linear-gradient(to right, transparent, transparent 4px, rgba(15, 23, 42, 0.8) 4px, rgba(15, 23, 42, 0.8) 6px)' }}
        ></div>
        <div 
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ 
            width: `${state.fatigue}%`,
            backgroundColor: statusConfig.stroke,
            boxShadow: `0 0 10px ${statusConfig.stroke}${isAlert ? ', 0 0 20px ' + statusConfig.stroke : ''}`
          }}
        />
      </div>
    </div>
  );
}
