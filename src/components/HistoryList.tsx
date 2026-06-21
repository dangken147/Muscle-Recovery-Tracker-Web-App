import type { ActivityLog, ActivityType } from '../types/recovery.types';
import { MUSCLE_LABELS } from '../utils/recovery.utils';
import { Trash2, Calendar, BedDouble, BrainCircuit, UtensilsCrossed, AlertOctagon, MessageSquare, Clipboard, Activity, Bike, Clock, Compass, Flame, CheckCircle2 } from 'lucide-react';
import { IconBallFootball, IconBallBasketball, IconShoe, IconSwimming, IconBarbell, IconBike } from '@tabler/icons-react';

interface HistoryListProps {
  logs: ActivityLog[];
  onDeleteLog: (id: string) => void;
  onResumeLog?: (log: ActivityLog, step: number) => void;
}

export default function HistoryList({ logs, onDeleteLog, onResumeLog }: HistoryListProps) {
  const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp);

  const getFormatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return {
      time: d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      date: d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }),
    };
  };

  const getActivityBadge = (type: ActivityType) => {
    const badges: Record<ActivityType, { label: string; color: string; icon: any; glowColor: string; dotColor: string }> = {
      gym: { label: 'Tập Gym', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', icon: IconBarbell, glowColor: 'hover:border-indigo-500/50 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]', dotColor: '#6366f1' },
      football: { label: 'Đá Bóng', color: 'text-teal-400 bg-teal-500/10 border-teal-500/20', icon: IconBallFootball, glowColor: 'hover:border-teal-500/50 group-hover:shadow-[0_0_30px_rgba(45,212,191,0.15)]', dotColor: '#2dd4bf' },
      running: { label: 'Chạy Bộ', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: IconShoe, glowColor: 'hover:border-amber-500/50 group-hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]', dotColor: '#f59e0b' },
      swimming: { label: 'Bơi Lội', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', icon: IconSwimming, glowColor: 'hover:border-cyan-500/50 group-hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]', dotColor: '#06b6d4' },
      basketball: { label: 'Bóng Rổ', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', icon: IconBallBasketball, glowColor: 'hover:border-orange-500/50 group-hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]', dotColor: '#f97316' },
      cycling: { label: 'Đạp Xe', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: IconBike, glowColor: 'hover:border-emerald-500/50 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]', dotColor: '#10b981' },
      other: { label: 'Hoạt Động Khác', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20', icon: Compass, glowColor: 'hover:border-slate-500/50 group-hover:shadow-[0_0_30px_rgba(148,163,184,0.15)]', dotColor: '#94a3b8' },
    };
    return badges[type] || badges.other;
  };

  if (logs.length === 0) {
    return (
      <div className="glass-card flex flex-col items-center justify-center p-10 text-center text-slate-400 border border-dashed border-white/10 rounded-2xl animate-fade-in">
        <Clipboard size={48} className="text-slate-400/50 mb-4" />
        <p className="text-base font-bold text-white mb-2">Chưa có nhật ký tập luyện nào</p>
        <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
          Nhật ký của bạn sẽ được lưu giữ tại đây. Nhấn nút "Ghi nhận buổi tập" để bắt đầu hành trình.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card space-y-4 rounded-2xl animate-fade-in">
      <div className="border-b border-white/5 pb-4">
        <h3 className="text-sm font-bold text-white tracking-widest uppercase flex items-center gap-2">
          <Calendar size={18} className="text-indigo-400" /> Nhật ký Hoạt động ({logs.length})
        </h3>
      </div>

      <div className="overflow-y-auto overflow-x-hidden pr-2 pb-4" style={{ maxHeight: '500px' }}>
        <div className="timeline ml-6 pt-2">
        {sortedLogs.map((log, index) => {
          const dt = getFormatDate(log.timestamp);
          const badge = getActivityBadge(log.activityType);
          const Icon = badge.icon;
          const opacityStyle = { opacity: Math.max(0.4, 1 - index * 0.15) };
          
          return (
            <div key={log.id} className="timeline-item group" style={opacityStyle}>
              <div className={`timeline-dot flex items-center justify-center ${log.activityType}`} style={{ width: '28px', height: '28px', left: '-31px', top: '20px', background: 'var(--bg-dark)', borderColor: badge.dotColor, boxShadow: `0 0 12px ${badge.dotColor}80`, zIndex: 10, transition: 'all 0.3s ease' }}>
                 <Icon size={14} strokeWidth={2.5} style={{ color: badge.dotColor }} />
              </div>
              
              <div className={`backdrop-blur-md bg-slate-900/40 p-6 rounded-3xl border border-white/5 ml-2 mb-8 transition-all duration-500 relative shadow-[0_8px_30px_rgb(0,0,0,0.12)] group-hover:opacity-100 hover:-translate-y-1 z-10 ${badge.glowColor}`} style={{ opacity: index > 0 ? 0.8 : 1 }}>
                
                {/* Delete button */}
                <button
                  onClick={() => onDeleteLog(log.id)}
                  className="absolute right-4 top-4 p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-20 cursor-pointer"
                  title="Xóa nhật ký này"
                >
                  <Trash2 size={16} strokeWidth={2.5} />
                </button>

                {/* Top Info Header */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border ${badge.color} flex items-center gap-1.5`}>
                    <Icon size={12} strokeWidth={2.5} /> {badge.label}
                  </span>
                  <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                    {dt.time} <span className="text-slate-600">•</span> {dt.date}
                  </span>
                  {log.weather && (
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${log.weather.temp > 32 ? 'border-rose-500/50 text-rose-400 bg-rose-500/10' : 'border-amber-500/50 text-amber-400 bg-amber-500/10'}`}>
                      <Compass size={12} strokeWidth={2.5} /> {log.weather.temp}°C • {log.weather.condition}
                    </span>
                  )}
                  {log.status === 'planned' && (
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border border-sky-500/50 text-sky-400 bg-sky-500/10 ml-auto flex items-center gap-1.5">
                      <Clock size={12} strokeWidth={2.5} /> CHƯA TẬP
                    </span>
                  )}
                </div>

                {log.status === 'planned' ? (
                  <div className="mb-4">
                     <p className="text-sm text-slate-400 mb-4">Bạn đã lên kế hoạch bài tập, nhưng chưa ghi nhận. Nhấn Bắt đầu để tập ngay!</p>
                     <button
                        onClick={() => onResumeLog && onResumeLog(log, 1.5)}
                        className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] flex items-center justify-center gap-2"
                     >
                        <Dumbbell size={18} /> BẮT ĐẦU TẬP
                     </button>
                  </div>
                ) : (
                  <>
                    {/* Workout volume stats */}
                    <div className="grid grid-cols-2 gap-4 text-xs mb-5">
                      <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-3.5 rounded-2xl border-t border-l border-white/5 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
                        <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px] block mb-1">Thời lượng</span>
                        <strong className="text-white text-lg drop-shadow-md">{log.duration} <span className="text-xs text-slate-400 font-medium">phút</span></strong>
                      </div>
                      <div className="bg-gradient-to-br from-rose-900/10 to-slate-900/40 p-3.5 rounded-2xl border-t border-l border-rose-500/5 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
                        <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px] block mb-1">Cường độ mệt mỏi</span>
                        <strong className="text-rose-400 text-lg drop-shadow-[0_0_8px_rgba(251,113,133,0.3)]">RPE {log.intensity}</strong>
                      </div>
                    </div>
                  </>
                )}

                {/* Muscles targeted */}
                <div className="text-xs mb-5">
                  <span className="text-slate-400 block mb-2.5 font-bold uppercase tracking-widest text-[10px]">Cơ bắp chịu tải:</span>
                  <div className="flex flex-wrap gap-2">
                    {log.targetMuscles.map((m) => (
                      <div key={m} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/40 border border-slate-700/50 rounded-lg text-[11px] font-medium text-slate-300 shadow-sm transition-colors hover:bg-slate-700/50 hover:border-slate-600">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: badge.dotColor, boxShadow: `0 0 8px ${badge.dotColor}` }}></div>
                        {MUSCLE_LABELS[m]}
                      </div>
                    ))}
                    {log.targetMuscles.length === 0 && (
                      <span className="text-slate-400 italic font-medium text-[11px]">Không ghi nhận nhóm cơ cụ thể</span>
                    )}
                  </div>
                </div>

                {/* Smartwatch Biometrics */}
                {log.status !== 'planned' && (
                  <div className="flex flex-wrap gap-2.5 text-[10px] border-t border-white/5 pt-5">
                    {/* Sleep pill */}
                    <div className="flex items-center gap-1.5 bg-slate-800/30 backdrop-blur-sm py-1.5 px-3.5 rounded-full border border-slate-700/50 shadow-sm transition-colors hover:bg-slate-800/50 hover:border-slate-600">
                      <BedDouble size={12} strokeWidth={2.5} className="text-blue-400" />
                      <span className="font-medium text-slate-400">Giấc ngủ:</span>
                      <span className={`font-bold drop-shadow-sm ${
                        log.sleep === 'good' ? 'text-emerald-400' : log.sleep === 'fair' ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {log.sleep === 'good' ? 'Tốt' : log.sleep === 'fair' ? 'Vừa' : 'Kém'}
                      </span>
                    </div>

                    {/* Stress pill */}
                    <div className="flex items-center gap-1.5 bg-slate-800/30 backdrop-blur-sm py-1.5 px-3.5 rounded-full border border-slate-700/50 shadow-sm transition-colors hover:bg-slate-800/50 hover:border-slate-600">
                      <BrainCircuit size={12} strokeWidth={2.5} className="text-purple-400" />
                      <span className="font-medium text-slate-400">Stress:</span>
                      <span className={`font-bold drop-shadow-sm ${log.stress === 'high' ? 'text-rose-400' : 'text-indigo-400'}`}>
                        {log.stress === 'high' ? 'Cao' : 'Thấp'}
                      </span>
                    </div>

                    {/* Nutrition pill */}
                    <div className="flex items-center gap-1.5 bg-slate-800/30 backdrop-blur-sm py-1.5 px-3.5 rounded-full border border-slate-700/50 shadow-sm transition-colors hover:bg-slate-800/50 hover:border-slate-600">
                      <UtensilsCrossed size={12} strokeWidth={2.5} className="text-emerald-400" />
                      <span className="font-medium text-slate-400">Dinh dưỡng:</span>
                      <span className={`font-bold drop-shadow-sm ${log.nutrition === 'good' || log.nutrition === 'surplus' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {log.nutrition === 'surplus' ? 'Protein tối ưu' : log.nutrition === 'good' ? 'Đủ chất' : 'Thâm hụt'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Pain / Injury callout */}
                {log.hasInjury && log.injuredMuscles && log.injuredMuscles.length > 0 && (
                  <div className="mt-4 p-3 bg-rose-950/30 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2.5 animate-pulse shadow-inner shadow-rose-900/20">
                    <AlertOctagon size={18} className="shrink-0 mt-0.5" />
                    <div>
                      <strong className="block mb-1 text-rose-200">Báo cáo chấn thương / đau nhức:</strong>
                      <div className="font-medium">
                        Cơ bị đau: {log.injuredMuscles.map(m => MUSCLE_LABELS[m]).join(', ')} (Độ đau: {log.painScale}/10)
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {log.notes && (
                  <div className="mt-4 text-xs text-slate-400 bg-indigo-950/20 p-3 rounded-xl border border-indigo-500/10 flex items-start gap-2.5 italic">
                    <MessageSquare size={16} strokeWidth={2.5} className="text-indigo-400 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">"{log.notes}"</div>
                  </div>
                )}

              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
