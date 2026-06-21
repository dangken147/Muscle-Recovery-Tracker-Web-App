import { useState, useRef, useMemo } from 'react';
import type { UserProfile, MuscleState, CortisolState, MuscleGroup, ActivityLog } from '../types/recovery.types';
import { MUSCLE_LABELS, generateCoachAdvice, calibrateMuscleStatesWithDOMS, getCortisolColor } from '../utils/recovery.utils';
import BodyMap from './BodyMap';
import BiometricChart from './BiometricChart';
import ActiveRecovery from './ActiveRecovery';
import { WorkoutExportTemplate } from './WorkoutExportTemplate';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import MuscleBioCard from './MuscleBioCard';
import CortisolGaugeCard from './CortisolGaugeCard';
import { Heart, Activity, Target, AlertTriangle, Battery, ShieldAlert, CheckCircle2, ChevronRight, ActivitySquare, Dumbbell, Zap, Search, BatteryCharging, Clock, Download, Loader2, BrainCircuit } from 'lucide-react';

interface DashboardProps {
  profile: UserProfile;
  muscleStates: MuscleState[];
  cortisolState: CortisolState;
  onOpenLogForm: () => void;
  onOpenRetroLogForm?: () => void;
  domsRecords: DOMSRecord[];
  logs: ActivityLog[];
  offsetHours: number;
  onResumeLog?: (log: ActivityLog, step: number) => void;
  onStartLiveWorkout?: (log: ActivityLog) => void;
}

export default function Dashboard({
  profile,
  muscleStates,
  cortisolState,
  onOpenLogForm,
  onOpenRetroLogForm,
  domsRecords,
  logs,
  offsetHours,
  onResumeLog,
  onStartLiveWorkout,
}: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dismissedRetro, setDismissedRetro] = useState<string | null>(localStorage.getItem('aurarecov_dismissed_retro'));
  
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    if (!exportRef.current) {
      alert("Lỗi: Không tìm thấy dữ liệu giáo án để xuất PDF. Vui lòng thêm bài tập vào kế hoạch!");
      return;
    }
    setIsExporting(true);
    try {
      const canvas = await html2canvas(exportRef.current, { scale: 2, backgroundColor: '#020617', useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeightInMm = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeightInMm;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInMm);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeightInMm;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInMm);
        heightLeft -= pageHeight;
      }

      pdf.save(`Giao-An-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Lỗi khi xuất PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const advice = useMemo(() => generateCoachAdvice(profile, muscleStates, cortisolState), [profile, muscleStates, cortisolState]);
  
  // BUG-02 FIX: Truyền lastLog để áp dụng đúng hiệu chỉnh ngủ/dinh dưỡng khi tính DOMS half-life
  const sortedLogs = useMemo(() => [...logs].sort((a, b) => b.timestamp - a.timestamp), [logs]);
  
  const calibratedStates = useMemo(() => {
    const lastLog = sortedLogs[0];
    return calibrateMuscleStatesWithDOMS(profile, muscleStates, domsRecords, lastLog);
  }, [profile, muscleStates, domsRecords, sortedLogs]);

  // Filters
  const filteredMuscles = useMemo(() => {
    return calibratedStates.filter((m) => {
      const labelMatch = MUSCLE_LABELS[m.muscle].toLowerCase().includes(searchTerm.toLowerCase());
      const filterMatch = statusFilter === 'all' || m.status === statusFilter;
      return labelMatch && filterMatch;
    });
  }, [calibratedStates, searchTerm, statusFilter]);

  const fatiguedMuscles = useMemo(() => {
    return calibratedStates
      .filter(m => m.status === 'heavy' || m.status === 'injured' || m.status === 'moderate')
      .map(m => m.muscle);
  }, [calibratedStates]);

  const plannedWorkout = useMemo(() => sortedLogs.find(l => l.status === 'planned'), [sortedLogs]);

  // Gap Check for Retroactive Logging
  const simulatedTime = Date.now() + offsetHours * 60 * 60 * 1000;
  const today = new Date(simulatedTime);
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const hasLogYesterday = logs.some(log => {
    if (log.status === 'planned') return false;
    const logDate = new Date(log.timestamp);
    logDate.setHours(0, 0, 0, 0);
    return logDate.getTime() === yesterday.getTime();
  });

  const showRetroPrompt = !hasLogYesterday && dismissedRetro !== yesterdayStr && onOpenRetroLogForm;

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
              <BrainCircuit size={14} strokeWidth={2.5} className="text-indigo-400" /> Chẩn đoán
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
                <Dumbbell size={14} strokeWidth={2.5} /> Kế hoạch tập luyện
              </div>
              <h3 className="text-white font-bold text-lg">Bạn có giáo án chưa hoàn thành!</h3>
              <p className="text-slate-400 text-sm mt-1">Đã đến lúc thực hiện giáo án {plannedWorkout.activityType === 'gym' ? 'Gym' : ''} mà bạn đã tạo.</p>
            </div>
            <div className="relative z-10 flex flex-col md:flex-row gap-3 mt-4 md:mt-0">
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold border border-slate-700/50 transition-all flex items-center gap-2 w-full md:w-auto justify-center disabled:opacity-50"
              >
                {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} strokeWidth={2.5} />}
                Xuất PDF
              </button>
              <button
                onClick={() => {
                  if (onStartLiveWorkout && plannedWorkout.status === 'planned') {
                    onStartLiveWorkout(plannedWorkout);
                  } else if (onResumeLog) {
                    onResumeLog(plannedWorkout, 1.5);
                  }
                }}
                className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold shadow-[0_0_15px_rgba(14,165,233,0.3)] transition-all flex items-center gap-2 w-full md:w-auto justify-center"
              >
                Bắt đầu ngay <CheckCircle2 size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>
          
          {/* Hidden Template for PDF Export */}
          <div className="fixed top-[-9999px] left-[-9999px]">
            <WorkoutExportTemplate ref={exportRef} plannedWorkout={plannedWorkout} profileName={profile.name} />
          </div>
        </div>
      )}

      {/* --- ROW 1.3: Retroactive Logging Banner --- */}
      {showRetroPrompt && (
        <div className="col-span-12">
          <div className="glass-card flex flex-col md:flex-row items-start md:items-center justify-between p-5 border-l-4 border-indigo-500 bg-indigo-500/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-widest text-[10px] mb-2">
                <Clock size={14} strokeWidth={2.5} /> Phục hồi dữ liệu
              </div>
              <h3 className="text-white font-bold text-lg">Hôm qua sếp có tập không?</h3>
              <p className="text-slate-400 text-sm mt-1">AuraRecov thấy trống lịch ngày hôm qua. Khai báo bù ngay kẻo lỡ nhịp phục hồi nhé!</p>
            </div>
            <div className="relative z-10 flex flex-col md:flex-row gap-3 mt-4 md:mt-0">
              <button
                onClick={() => {
                  localStorage.setItem('aurarecov_dismissed_retro', yesterdayStr);
                  setDismissedRetro(yesterdayStr);
                }}
                className="px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold border border-slate-700/50 transition-all flex items-center justify-center w-full md:w-auto"
              >
                Hôm qua tui nghỉ
              </button>
              <button
                onClick={onOpenRetroLogForm}
                className="px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all flex items-center justify-center w-full md:w-auto"
              >
                Khai báo bù
              </button>
            </div>
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
          <Activity size={14} strokeWidth={2.5} /> Cơ bắp
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
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} strokeWidth={2.5} />
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
            <div className="flex-1 overflow-y-auto pr-2 space-y-6" style={{ maxHeight: '600px' }}>
              
              {attentionMuscles.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <AlertTriangle size={12} strokeWidth={2.5} className="text-rose-400" /> Nguy cơ ({attentionMuscles.length})
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {attentionMuscles.map(state => <MuscleBioCard key={state.muscle} state={state} />)}
                  </div>
                </div>
              )}

              {recoveringMuscles.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <BatteryCharging size={12} strokeWidth={2.5} className="text-amber-400" /> Đang mỏi ({recoveringMuscles.length})
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {recoveringMuscles.map(state => <MuscleBioCard key={state.muscle} state={state} />)}
                  </div>
                </div>
              )}

              {readyMuscles.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 size={12} strokeWidth={2.5} className="text-emerald-400" /> Sẵn sàng ({readyMuscles.length})
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
      <CortisolGaugeCard cortisolState={cortisolState} />
    </div>
  );
}
