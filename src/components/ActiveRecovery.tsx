import { useState, useEffect } from 'react';
import type { MuscleGroup } from '../types/recovery.types';
import { MUSCLE_LABELS } from '../utils/recovery.utils';
import { CheckCircle2, Activity, Flame } from 'lucide-react';

interface RecoveryProtocol {
  id: string;
  title: string;
  duration: number; // seconds
  targetMuscles: MuscleGroup[];
  imageUrl: string;
  description: string;
}

const UPPER_IMAGE = 'file:///C:/Users/tdken/.gemini/antigravity-ide/brain/7cf1ee9a-95c3-4de4-aed7-e2f3409a6907/upper_body_stretch_1781161244289.png';
const LOWER_IMAGE = 'file:///C:/Users/tdken/.gemini/antigravity-ide/brain/7cf1ee9a-95c3-4de4-aed7-e2f3409a6907/lower_body_stretch_1781161253793.png';

const PROTOCOLS: RecoveryProtocol[] = [
  {
    id: 'upper-1',
    title: 'Giãn cơ Ngực & Vai mở rộng',
    duration: 60,
    targetMuscles: ['upper_chest', 'lower_chest', 'front_shoulders', 'biceps'],
    imageUrl: UPPER_IMAGE,
    description: 'Dùng khung cửa hoặc tường, mở rộng lồng ngực và ép nhẹ vai về trước. Tăng tuần hoàn máu vùng ngực và giải phóng chèn ép dây thần kinh cơ đen-ta.',
  },
  {
    id: 'lower-1',
    title: 'Giãn cơ Đùi sau & Hông (Hamstring/Glute)',
    duration: 90,
    targetMuscles: ['hamstrings', 'glutes', 'calves', 'quadriceps'],
    imageUrl: LOWER_IMAGE,
    description: 'Gập người từ hông, giữ lưng thẳng. Bài tập ép sâu vào gân kheo (hamstring) và mông, giúp đẩy lùi acid lactic tích tụ sau các bài tập chân nặng.',
  },
  {
    id: 'core-1',
    title: 'Xoay cột sống & Giãn lưng dưới',
    duration: 60,
    targetMuscles: ['traps', 'lats', 'upper_abs', 'lower_abs'],
    imageUrl: UPPER_IMAGE,
    description: 'Nằm ngửa, gập một gối và vặn người sang bên đối diện. Thư giãn cơ dựng sống lưng và cơ bụng chữ V, phục hồi hệ thần kinh trung ương.',
  }
];

interface ActiveRecoveryProps {
  fatiguedMuscles: MuscleGroup[]; // Muscles with fatigue > 50 or injured
}

export default function ActiveRecovery({ fatiguedMuscles }: ActiveRecoveryProps) {
  const [activeProtocol, setActiveProtocol] = useState<RecoveryProtocol | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  // Lọc các bài tập phù hợp với nhóm cơ đang mỏi
  const recommendedProtocols = PROTOCOLS.filter(p => 
    p.targetMuscles.some(m => fatiguedMuscles.includes(m))
  );

  // Fallback nếu không có bài nào khớp (ví dụ mỏi cẳng tay) thì hiện toàn bộ
  const displayProtocols = recommendedProtocols.length > 0 ? recommendedProtocols : PROTOCOLS;

  useEffect(() => {
    let timer: any;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isPlaying && activeProtocol) {
      setIsPlaying(false);
      setCompleted(new Set(completed).add(activeProtocol.id));
      setActiveProtocol(null);
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, activeProtocol, completed]);

  const startProtocol = (protocol: RecoveryProtocol) => {
    setActiveProtocol(protocol);
    setTimeLeft(protocol.duration);
    setIsPlaying(true);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass-card flex flex-col relative overflow-hidden">
      <div className="border-b border-white/5 pb-4 mb-4">
        <h3 className="text-sm font-bold text-white tracking-widest uppercase flex items-center gap-2">
          <Activity size={18} className="text-emerald-400" /> Giao thức Hồi phục Chủ động
        </h3>
        <p className="text-xs text-slate-400 mt-1.5 font-medium leading-relaxed">
          Thực hiện các bài tập kích hoạt tuần hoàn máu và giãn cơ tĩnh để đẩy nhanh tốc độ đào thải Acid Lactic cho các nhóm cơ đang mỏi.
        </p>
      </div>

      {activeProtocol ? (
        // Active Timer Mode
        <div className="flex flex-col md:flex-row gap-6 animate-fade-in bg-slate-900/50/40 p-4 rounded-2xl border border-white/5">
          <div className="w-full md:w-1/3 aspect-video md:aspect-square rounded-xl overflow-hidden relative border border-white/10 shadow-lg">
            <img src={activeProtocol.imageUrl} alt={activeProtocol.title} className="w-full h-full object-cover opacity-80 mix-blend-screen" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <div className="absolute bottom-3 left-3 flex gap-1 flex-wrap">
               {activeProtocol.targetMuscles.map(m => (
                 <span key={m} className="text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                   {MUSCLE_LABELS[m]}
                 </span>
               ))}
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4">
             <h4 className="text-lg font-bold text-white">{activeProtocol.title}</h4>
             
             <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="60" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                  <circle 
                    cx="64" cy="64" r="60" fill="none" 
                    stroke="#10b981" strokeWidth="6" strokeLinecap="round"
                    strokeDasharray="377"
                    strokeDashoffset={377 - (timeLeft / activeProtocol.duration) * 377}
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
                <div className="text-3xl font-black text-white tracking-tighter tabular-nums drop-shadow-md">
                  {formatTime(timeLeft)}
                </div>
             </div>

             <div className="flex gap-3 mt-2">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-6 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-sm font-bold uppercase tracking-widest transition-colors"
                >
                  {isPlaying ? 'Tạm Dừng' : 'Tiếp Tục'}
                </button>
                <button 
                  onClick={() => setActiveProtocol(null)}
                  className="px-6 py-2.5 bg-slate-900/50 hover:bg-slate-700/50 text-slate-400 border border-white/5 rounded-xl text-sm font-bold uppercase tracking-widest transition-colors"
                >
                  Thoát
                </button>
             </div>
          </div>
        </div>
      ) : (
        // List Mode
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          {displayProtocols.map(protocol => {
            const isDone = completed.has(protocol.id);
            return (
              <div key={protocol.id} className="bg-slate-900/50 rounded-2xl border border-white/5 overflow-hidden hover:border-white/15 hover:bg-slate-900/50 transition-all duration-300 flex flex-col group relative">
                
                {isDone && (
                  <div className="absolute top-3 right-3 z-10 bg-emerald-500 text-white rounded-full p-1 shadow-lg shadow-emerald-500/30 animate-fade-in">
                    <CheckCircle2 size={16} />
                  </div>
                )}

                <div className="h-32 relative overflow-hidden border-b border-white/5">
                  <img 
                    src={protocol.imageUrl} 
                    alt={protocol.title} 
                    className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isDone ? 'opacity-40 grayscale' : 'opacity-70 mix-blend-screen'}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d111c] to-transparent"></div>
                  <div className="absolute bottom-2 left-2 right-2 flex gap-1 flex-wrap">
                    {protocol.targetMuscles.map(m => (
                      <span key={m} className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${isDone ? 'bg-slate-900/50 text-slate-400 border-white/5' : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'}`}>
                        {MUSCLE_LABELS[m]}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <h4 className={`font-bold text-sm mb-2 ${isDone ? 'text-slate-400 line-through' : 'text-white group-hover:text-indigo-300 transition-colors'}`}>
                    {protocol.title}
                  </h4>
                  <p className={`text-xs leading-relaxed mb-4 flex-1 ${isDone ? 'text-slate-600' : 'text-slate-400'}`}>
                    {protocol.description}
                  </p>
                  
                  <button 
                    onClick={() => startProtocol(protocol)}
                    disabled={isDone}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                      isDone 
                        ? 'bg-slate-900/50/30 text-slate-600 border border-white/5/50 cursor-not-allowed' 
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                    }`}
                  >
                    {isDone ? 'Đã hoàn thành' : (
                      <>
                        <Flame size={14} /> Tập {protocol.duration} giây
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
