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
    glow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]',
    stroke: '#10b981',
    icon: <CheckCircle2 size={14} />,
    label: 'SẴN SÀNG',
  };

  if (state.status === 'injured') {
    statusConfig = {
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      glow: 'shadow-[0_0_15px_rgba(168,85,247,0.2)]',
      stroke: '#a855f7',
      icon: <AlertTriangle size={14} />,
      label: 'CHẤN THƯƠNG',
    };
  } else if (state.status === 'heavy') {
    statusConfig = {
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/30',
      glow: 'shadow-[0_0_15px_rgba(244,63,94,0.2)]',
      stroke: '#f43f5e',
      icon: <AlertTriangle size={14} />,
      label: 'QUÁ TẢI',
    };
  } else if (state.status === 'moderate') {
    statusConfig = {
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
      glow: 'shadow-[0_0_15px_rgba(249,115,22,0.1)]',
      stroke: '#f97316',
      icon: <Activity size={14} />,
      label: 'ĐANG PHỤC HỒI',
    };
  } else if (state.status === 'mild') {
    statusConfig = {
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      glow: 'shadow-[0_0_15px_rgba(245,158,11,0.1)]',
      stroke: '#f59e0b',
      icon: <Activity size={14} />,
      label: 'MỎI NHẸ',
    };
  }

  return (
    <div className={`relative p-4 bg-slate-900/50 backdrop-blur-sm border ${statusConfig.border} rounded-2xl flex flex-col transition-all duration-300 hover:bg-slate-900/50/60 ${statusConfig.glow} overflow-hidden ${state.status === 'injured' || state.status === 'heavy' ? 'animate-[pulse_3s_ease-in-out_infinite]' : ''}`}>
      
      {/* Nền gradient mờ */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none" 
        style={{ background: `linear-gradient(135deg, ${statusConfig.stroke}40 0%, transparent 100%)` }} 
      />

      <div className="relative z-10 flex items-start justify-between w-full mb-1">
        <div className="flex flex-col">
          <h4 className="text-sm font-black text-white tracking-wide">{name}</h4>
          
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${statusConfig.color}`}>
              {statusConfig.icon}
              {statusConfig.label}
            </span>
            
            {state.recoveryTimeRemaining > 0 && (
              <>
                <span className="text-slate-600 text-[8px]">•</span>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                  <Clock size={10} className={statusConfig.color} />
                  <span>Phục hồi: <strong className="text-white">{state.recoveryTimeRemaining}h</strong></span>
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className={`text-base font-black ${statusConfig.color} flex items-end leading-none`}>
          {state.fatigue}<span className="text-[10px] ml-0.5 mb-0.5 opacity-70">%</span>
        </div>
      </div>

      {/* Thanh Linear Glow Progress Bar */}
      <div className="absolute bottom-0 left-0 h-1 w-full bg-slate-800/40">
        <div 
          className="h-full transition-all duration-1000 ease-out relative"
          style={{ 
            width: `${state.fatigue}%`,
            backgroundColor: statusConfig.stroke,
            boxShadow: `0 0 10px ${statusConfig.stroke}, 0 0 20px ${statusConfig.stroke}80`
          }}
        />
      </div>
    </div>
  );
}
