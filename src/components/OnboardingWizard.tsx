import { useState } from 'react';
import type { UserProfile, MuscleGroup, PrimarySport, InjuryRecord } from '../types/recovery.types';
import { MUSCLE_LABELS, INJURY_SYMPTOMS_DICT } from '../utils/recovery.utils';
import { Heart, ShieldAlert, Award, Dumbbell, ArrowRight, ArrowLeft, Check, X } from 'lucide-react';

interface OnboardingWizardProps {
  onComplete: (profile: UserProfile) => void;
  initialProfile?: UserProfile;
  onCancel?: () => void;
}

export default function OnboardingWizard({ onComplete, initialProfile, onCancel }: OnboardingWizardProps) {
  const isUpdateMode = !!initialProfile;
  const [step, setStep] = useState<number>(1);
  
  // Form State
  const [name, setName] = useState<string>(initialProfile?.name || '');
  const [age, setAge] = useState<number>(initialProfile?.age || 25);
  const gender = 'male';
  const [height, setHeight] = useState<number>(initialProfile?.height || 170);
  const [weight, setWeight] = useState<number>(initialProfile?.weight || 70);
  const [rhr, setRhr] = useState<number>(initialProfile?.rhr || 65);
  const [weeklyFrequency, setWeeklyFrequency] = useState<number>(initialProfile?.weeklyFrequency || 4);
  const [isFlexible, setIsFlexible] = useState<boolean>(initialProfile ? initialProfile.weeklyFrequency === 0 : false);
  const [primarySport, setPrimarySport] = useState<PrimarySport>(initialProfile?.primarySport || 'general');
  const [injuryHistory, setInjuryHistory] = useState<InjuryRecord[]>(initialProfile?.injuryHistory || []);
  const [updateCycleDays, setUpdateCycleDays] = useState<number>(initialProfile?.updateCycleDays || 30);

  // Injury Modal State
  const [editingInjury, setEditingInjury] = useState<MuscleGroup | null>(null);
  const [injurySide, setInjurySide] = useState<'left'|'right'|'bilateral'>('left');
  const [injuryTimeframe, setInjuryTimeframe] = useState<'recent'|'subacute'|'chronic'>('recent');
  const [injurySeverity, setInjurySeverity] = useState<'mild'|'moderate'|'severe'>('mild');
  
  // 1RM Helper states
  const [liftInputs, setLiftInputs] = useState({
    benchWeight: 60, benchReps: 8, benchKnown: !!initialProfile?.oneRepMaxes?.benchPress, benchExact: initialProfile?.oneRepMaxes?.benchPress || 76,
    squatWeight: 80, squatReps: 8, squatKnown: !!initialProfile?.oneRepMaxes?.squat, squatExact: initialProfile?.oneRepMaxes?.squat || 101,
    deadliftWeight: 100, deadliftReps: 5, deadliftKnown: !!initialProfile?.oneRepMaxes?.deadlift, deadliftExact: initialProfile?.oneRepMaxes?.deadlift || 116,
    ohpWeight: 40, ohpReps: 8, ohpKnown: !!initialProfile?.oneRepMaxes?.overheadPress, ohpExact: initialProfile?.oneRepMaxes?.overheadPress || 50,
  });

  // Calculate 1RM using Epley formula
  const estimate1RM = (weightVal: number, repsVal: number): number => {
    if (repsVal <= 1) return weightVal;
    return Math.round(weightVal * (1 + repsVal / 30));
  };

  const handleInputChange = (field: string, value: any) => {
    setLiftInputs((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNext = () => {
    if (step === 1 && !name.trim()) {
      alert('Vui lòng nhập tên của bạn');
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    setStep((prev) => prev - 1);
  };

  const handleInjuryClick = (muscle: MuscleGroup) => {
    const existing = injuryHistory.find(i => i.muscle === muscle);
    if (existing) {
      // Bỏ chọn nếu đã có
      setInjuryHistory(prev => prev.filter(i => i.muscle !== muscle));
    } else {
      // Mở modal thêm mới
      setEditingInjury(muscle);
      setInjurySide('left');
      setInjuryTimeframe('recent');
      setInjurySeverity('mild');
    }
  };

  const saveInjury = () => {
    if (!editingInjury) return;
    const record: InjuryRecord = {
      id: Date.now().toString(),
      muscle: editingInjury,
      side: ['neck', 'lower_back', 'upper_chest', 'lower_chest', 'traps', 'lats', 'upper_abs', 'lower_abs', 'obliques'].includes(editingInjury) ? undefined : injurySide,
      timeframe: injuryTimeframe,
      severity: injurySeverity
    };
    setInjuryHistory(prev => [...prev, record]);
    setEditingInjury(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const profile: UserProfile = {
      name,
      age,
      gender,
      height,
      weight,
      rhr,
      weeklyFrequency: isFlexible ? 0 : weeklyFrequency,
      primarySport,
      oneRepMaxes: {
        benchPress: liftInputs.benchKnown ? liftInputs.benchExact : estimate1RM(liftInputs.benchWeight, liftInputs.benchReps),
        squat: liftInputs.squatKnown ? liftInputs.squatExact : estimate1RM(liftInputs.squatWeight, liftInputs.squatReps),
        deadlift: liftInputs.deadliftKnown ? liftInputs.deadliftExact : estimate1RM(liftInputs.deadliftWeight, liftInputs.deadliftReps),
        overheadPress: liftInputs.ohpKnown ? liftInputs.ohpExact : estimate1RM(liftInputs.ohpWeight, liftInputs.ohpReps),
      },
      injuryHistory,
      updateCycleDays,
      lastProfileUpdateDate: initialProfile ? initialProfile.lastProfileUpdateDate : Date.now()
    };

    onComplete(profile);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-2xl relative overflow-hidden" style={{ borderTop: '4px solid var(--primary)' }}>
        
        {/* Decorative Neon Background Blurs */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Progress bar */}
        <div className="flex justify-between items-center mb-8 relative z-10">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Heart className="text-rose-500 animate-pulse" size={24} />
            {isUpdateMode ? 'Cập nhật Hồ sơ Sinh học' : 'Thiết lập Hồ sơ Sinh học'}
          </h2>
          {isUpdateMode && onCancel && (
            <button onClick={onCancel} className="text-slate-400 hover:text-white p-2">
              <X size={20} />
            </button>
          )}
        </div>
        <div className="w-full bg-slate-900/50 h-1.5 rounded-full mb-8 overflow-hidden relative z-10">
          <div 
            className="bg-gradient-to-r from-indigo-500 to-teal-400 h-full rounded-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10">
          {/* STEP 1: BIOMETRICS */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-lg font-semibold text-white">1. Chỉ số sinh học cơ bản</h3>
                <p className="text-sm text-slate-400">Thiết lập dữ liệu nền tảng giúp bác sĩ thể thao đánh giá trao đổi chất của bạn.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Họ & Tên *</label>
                  <input 
                    type="text" 
                    placeholder="Nhập tên của bạn..." 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Tuổi (Năm sinh)</label>
                  <input 
                    type="number" 
                    value={age} 
                    onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Nhịp tim nghỉ ngơi (RHR) (bpm)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={rhr} 
                      onChange={(e) => setRhr(parseInt(e.target.value) || 0)}
                    />
                    <Heart className="absolute right-3 top-3.5 text-rose-500 animate-pulse" size={16} strokeWidth={2.5} />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <Award size={12} strokeWidth={2.5} className="text-teal-400" />
                    Lấy nhịp tim trung bình lúc ngủ dậy từ Apple Watch/Garmin của bạn.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Chiều cao (cm)</label>
                  <input 
                    type="number" 
                    value={height} 
                    onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Cân nặng (kg)</label>
                  <input 
                    type="number" 
                    value={weight} 
                    onChange={(e) => setWeight(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
              
              <div className="pt-2">
                <label className="block text-sm font-medium text-slate-400 mb-2">Chu kỳ cập nhật số đo (Khuyến nghị: 30 ngày)</label>
                <div className="flex gap-2">
                  {[14, 30, 60].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setUpdateCycleDays(days)}
                      className={`flex-1 py-3 rounded-xl border text-xs font-bold transition-all ${updateCycleDays === days ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-[0_0_10px_rgba(225,29,72,0.2)]' : 'bg-slate-900/50 border-white/10 text-slate-400 hover:border-white/20 hover:text-white'}`}
                    >
                      {days} ngày
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* STEP 2: EXPERIENCE & INJURIES */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-lg font-semibold text-white">2. Phong cách tập & Tiền sử chấn thương</h3>
                <p className="text-sm text-slate-400">Xác định tính đặc hiệu thích nghi của cơ bắp và định vị các điểm gân khớp yếu.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-3">Tần suất tập luyện</label>
                <div className="flex gap-2 mb-4">
                  <button type="button" onClick={() => setIsFlexible(false)} className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${!isFlexible ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/10'}`}>Lịch Cố Định</button>
                  <button type="button" onClick={() => setIsFlexible(true)} className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${isFlexible ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/10'}`}>Tùy hứng / Linh hoạt</button>
                </div>
                
                {!isFlexible ? (
                  <div className="flex items-center gap-4 animate-fade-in bg-slate-900/50/40 p-4 rounded-xl border border-white/5 mt-2">
                    <input 
                      type="range" 
                      min="1" 
                      max="7" 
                      value={weeklyFrequency} 
                      onChange={(e) => setWeeklyFrequency(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-lg font-bold text-teal-400 w-16 text-right">{weeklyFrequency} buổi</span>
                  </div>
                ) : (
                  <div className="animate-fade-in bg-indigo-900/20 p-4 rounded-xl border border-indigo-500/30 text-sm text-indigo-200 mt-2">
                    <Award className="inline-block mr-2 mb-1" size={16} strokeWidth={2.5} />
                    Hệ thống sẽ tự động học hỏi số buổi tập thực tế của bạn thông qua thuật toán <strong>ACWR</strong> để điều chỉnh khả năng phục hồi một cách linh hoạt.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-3">Môn Thể thao Ưu tiên (Sport Focus)</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(['strength', 'endurance', 'team_sports', 'general'] as PrimarySport[]).map((sport) => {
                    const labels: Record<PrimarySport, string> = {
                      strength: 'Tập tạ / Gym',
                      endurance: 'Chạy / Xe / Bơi',
                      team_sports: 'Đá bóng / Rổ',
                      general: 'Thể dục chung'
                    };
                    const active = primarySport === sport;
                    return (
                      <button
                        key={sport}
                        type="button"
                        onClick={() => setPrimarySport(sport)}
                        className={`p-4 rounded-2xl border text-xs font-semibold transition-all ${
                          active 
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                            : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/10 hover:text-white'
                        }`}
                      >
                        {labels[sport]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-1">
                  <ShieldAlert className="text-rose-500" size={16} strokeWidth={2.5} /> Tiền sử chấn thương gân khớp
                </label>
                <p className="text-xs text-slate-400 mb-3">Click chọn các khớp hoặc nhóm cơ từng bị chấn thương mãn tính. Thuật toán sẽ chủ động tăng độ nhạy cảnh báo chấn thương ở các vùng này thêm 20%.</p>
                <div className="space-y-4">
                  {[
                    { label: 'Khớp & Cột sống', muscles: ['neck', 'lower_back', 'elbows', 'wrists', 'knees', 'ankles'] as MuscleGroup[] },
                    { label: 'Cơ Thân trên', muscles: ['upper_chest', 'lower_chest', 'traps', 'lats', 'front_shoulders', 'rear_shoulders', 'biceps', 'triceps', 'forearms'] as MuscleGroup[] },
                    { label: 'Cơ Thân dưới', muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'upper_abs', 'lower_abs', 'obliques'] as MuscleGroup[] }
                  ].map(group => (
                    <div key={group.label} className="bg-slate-900/50/40 p-3 rounded-xl border border-white/5">
                      <h4 className="text-[11px] uppercase tracking-wider text-slate-400 mb-2 font-semibold">{group.label}</h4>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {group.muscles.map((m) => {
                          const active = injuryHistory.find(i => i.muscle === m);
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => handleInjuryClick(m)}
                              className={`p-2 rounded border text-xs font-medium text-center transition-all flex flex-col items-center justify-center gap-1 ${
                                active
                                  ? 'bg-rose-950/40 border-rose-500 text-rose-300'
                                  : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/10 hover:bg-white/10'
                              }`}
                            >
                              <span>{MUSCLE_LABELS[m]}</span>
                              {active && (
                                <span className="text-[9px] text-rose-400/80 bg-rose-900/30 px-1.5 py-0.5 rounded">
                                  {active.side === 'left' ? 'Trái' : active.side === 'right' ? 'Phải' : active.side === 'bilateral' ? 'Hai bên' : ''} 
                                  {active.side && ' • '}
                                  {active.severity === 'mild' ? 'Nhẹ' : active.severity === 'moderate' ? 'Vừa' : 'Nặng'}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* INJURY MODAL */}
          {editingInjury && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-slate-900/50 border border-white/10 p-5 rounded-2xl w-full max-w-lg shadow-2xl space-y-5">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <h3 className="font-bold text-lg text-white">Chi tiết chấn thương: <span className="text-rose-400">{MUSCLE_LABELS[editingInjury]}</span></h3>
                  <button type="button" onClick={() => setEditingInjury(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                </div>
                
                {/* Side Selection */}
                {!['neck', 'lower_back', 'upper_chest', 'lower_chest', 'traps', 'lats', 'upper_abs', 'lower_abs', 'obliques'].includes(editingInjury) && (
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">1. Vị trí bị đau?</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setInjurySide('left')} className={`flex-1 py-2 rounded border text-sm ${injurySide === 'left' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-white/5 border-white/5 text-slate-400'}`}>Bên Trái</button>
                      <button type="button" onClick={() => setInjurySide('right')} className={`flex-1 py-2 rounded border text-sm ${injurySide === 'right' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-white/5 border-white/5 text-slate-400'}`}>Bên Phải</button>
                      <button type="button" onClick={() => setInjurySide('bilateral')} className={`flex-1 py-2 rounded border text-sm ${injurySide === 'bilateral' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-white/5 border-white/5 text-slate-400'}`}>Cả 2 bên</button>
                    </div>
                  </div>
                )}

                {/* Timeframe Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">2. Chấn thương xảy ra khi nào?</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setInjuryTimeframe('recent')} className={`flex-1 py-2 rounded border text-xs ${injuryTimeframe === 'recent' ? 'bg-rose-500/20 border-rose-500 text-rose-300' : 'bg-white/5 border-white/5 text-slate-400'}`}>Mới đây {'(<2 tuần)'}</button>
                    <button type="button" onClick={() => setInjuryTimeframe('subacute')} className={`flex-1 py-2 rounded border text-xs ${injuryTimeframe === 'subacute' ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-white/5 border-white/5 text-slate-400'}`}>1-3 tháng trước</button>
                    <button type="button" onClick={() => setInjuryTimeframe('chronic')} className={`flex-1 py-2 rounded border text-xs ${injuryTimeframe === 'chronic' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-white/5 border-white/5 text-slate-400'}`}>Lâu rồi {'>6 tháng'}</button>
                  </div>
                </div>

                {/* Severity Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">3. Triệu chứng của bạn giống mức nào nhất?</label>
                  <div className="space-y-2">
                    {['mild', 'moderate', 'severe'].map((level) => {
                      const dict = INJURY_SYMPTOMS_DICT[editingInjury] || INJURY_SYMPTOMS_DICT['default'];
                      const symptomText = dict[level as keyof typeof dict];
                      const levelName = level === 'mild' ? 'Mức 1 (Nhẹ)' : level === 'moderate' ? 'Mức 2 (Vừa)' : 'Mức 3 (Nặng)';
                      const isSelected = injurySeverity === level;

                      let containerClass = 'bg-white/5 border-white/5 hover:bg-white/10';
                      let dotClass = 'border-slate-500';
                      let innerDotClass = '';
                      let textClass = 'text-slate-400';

                      if (isSelected) {
                        if (level === 'mild') {
                          containerClass = 'bg-emerald-900/30 border-emerald-500';
                          dotClass = 'border-emerald-500 bg-emerald-500/20';
                          innerDotClass = 'bg-emerald-400';
                          textClass = 'text-emerald-400';
                        } else if (level === 'moderate') {
                          containerClass = 'bg-amber-900/30 border-amber-500';
                          dotClass = 'border-amber-500 bg-amber-500/20';
                          innerDotClass = 'bg-amber-400';
                          textClass = 'text-amber-400';
                        } else {
                          containerClass = 'bg-rose-900/30 border-rose-500';
                          dotClass = 'border-rose-500 bg-rose-500/20';
                          innerDotClass = 'bg-rose-400';
                          textClass = 'text-rose-400';
                        }
                      }

                      return (
                        <div 
                          key={level}
                          onClick={() => setInjurySeverity(level as any)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all flex gap-3 ${containerClass}`}
                        >
                          <div className={`w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center ${dotClass}`}>
                            {isSelected && <div className={`w-2 h-2 rounded-full ${innerDotClass}`} />}
                          </div>
                          <div>
                            <div className={`text-sm font-bold ${textClass}`}>{levelName}</div>
                            <div className="text-xs text-slate-400 mt-1 leading-relaxed">{symptomText}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button type="button" onClick={saveInjury} className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl mt-4">
                  Lưu chấn thương
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: STRENGTH BASELINES (1RM) */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-lg font-semibold text-white">3. Thiết lập chỉ số Sức mạnh Cực đại (1RM)</h3>
                <p className="text-sm text-slate-400">Sức mạnh tối đa quyết định khả năng chịu lực của mô cơ gân. Chúng ta ước tính bằng bộ tính toán Epley.</p>
              </div>

              <div className="space-y-5 max-h-[350px] overflow-y-auto pr-2">
                
                {/* 1. BENCH PRESS */}
                <div className="p-4 rounded-lg bg-white/5 border border-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-indigo-300 flex items-center gap-1">
                      <Dumbbell size={16} strokeWidth={2.5} /> Bench Press (Ngực/Tay sau)
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleInputChange('benchKnown', !liftInputs.benchKnown)}
                      className="text-xs text-slate-400 underline hover:text-white"
                    >
                      {liftInputs.benchKnown ? 'Tính từ buổi tập' : 'Tôi biết rõ 1RM'}
                    </button>
                  </div>
                  {liftInputs.benchKnown ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-slate-400">1RM Bench Press (kg)</label>
                        <input
                          type="number"
                          value={liftInputs.benchExact}
                          onChange={(e) => handleInputChange('benchExact', parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="text-xs text-slate-400 block mb-1">Mức tạ tập thường ngày (kg)</label>
                        <input
                          type="number"
                          value={liftInputs.benchWeight}
                          onChange={(e) => handleInputChange('benchWeight', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Số reps tối đa</label>
                        <input
                          type="number"
                          value={liftInputs.benchReps}
                          onChange={(e) => handleInputChange('benchReps', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-3 text-[11px] text-teal-400">
                        1RM Ước tính (Epley): <strong>{estimate1RM(liftInputs.benchWeight, liftInputs.benchReps)} kg</strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. SQUAT */}
                <div className="p-4 rounded-lg bg-white/5 border border-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-indigo-300 flex items-center gap-1">
                      <Dumbbell size={16} strokeWidth={2.5} /> Back Squat (Đùi trước/Mông)
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleInputChange('squatKnown', !liftInputs.squatKnown)}
                      className="text-xs text-slate-400 underline hover:text-white"
                    >
                      {liftInputs.squatKnown ? 'Tính từ buổi tập' : 'Tôi biết rõ 1RM'}
                    </button>
                  </div>
                  {liftInputs.squatKnown ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-slate-400">1RM Squat (kg)</label>
                        <input
                          type="number"
                          value={liftInputs.squatExact}
                          onChange={(e) => handleInputChange('squatExact', parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="text-xs text-slate-400 block mb-1">Mức tạ tập thường ngày (kg)</label>
                        <input
                          type="number"
                          value={liftInputs.squatWeight}
                          onChange={(e) => handleInputChange('squatWeight', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Số reps tối đa</label>
                        <input
                          type="number"
                          value={liftInputs.squatReps}
                          onChange={(e) => handleInputChange('squatReps', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-3 text-[11px] text-teal-400">
                        1RM Ước tính (Epley): <strong>{estimate1RM(liftInputs.squatWeight, liftInputs.squatReps)} kg</strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. DEADLIFT */}
                <div className="p-4 rounded-lg bg-white/5 border border-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-indigo-300 flex items-center gap-1">
                      <Dumbbell size={16} strokeWidth={2.5} /> Deadlift (Lưng/Mông/Đùi sau)
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleInputChange('deadliftKnown', !liftInputs.deadliftKnown)}
                      className="text-xs text-slate-400 underline hover:text-white"
                    >
                      {liftInputs.deadliftKnown ? 'Tính từ buổi tập' : 'Tôi biết rõ 1RM'}
                    </button>
                  </div>
                  {liftInputs.deadliftKnown ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-slate-400">1RM Deadlift (kg)</label>
                        <input
                          type="number"
                          value={liftInputs.deadliftExact}
                          onChange={(e) => handleInputChange('deadliftExact', parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="text-xs text-slate-400 block mb-1">Mức tạ tập thường ngày (kg)</label>
                        <input
                          type="number"
                          value={liftInputs.deadliftWeight}
                          onChange={(e) => handleInputChange('deadliftWeight', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Số reps tối đa</label>
                        <input
                          type="number"
                          value={liftInputs.deadliftReps}
                          onChange={(e) => handleInputChange('deadliftReps', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-3 text-[11px] text-teal-400">
                        1RM Ước tính (Epley): <strong>{estimate1RM(liftInputs.deadliftWeight, liftInputs.deadliftReps)} kg</strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. OVERHEAD PRESS */}
                <div className="p-4 rounded-lg bg-white/5 border border-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-indigo-300 flex items-center gap-1">
                      <Dumbbell size={16} strokeWidth={2.5} /> Overhead Press (Vai/Tay sau)
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleInputChange('ohpKnown', !liftInputs.ohpKnown)}
                      className="text-xs text-slate-400 underline hover:text-white"
                    >
                      {liftInputs.ohpKnown ? 'Tính từ buổi tập' : 'Tôi biết rõ 1RM'}
                    </button>
                  </div>
                  {liftInputs.ohpKnown ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-slate-400">1RM Overhead Press (kg)</label>
                        <input
                          type="number"
                          value={liftInputs.ohpExact}
                          onChange={(e) => handleInputChange('ohpExact', parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="text-xs text-slate-400 block mb-1">Mức tạ tập thường ngày (kg)</label>
                        <input
                          type="number"
                          value={liftInputs.ohpWeight}
                          onChange={(e) => handleInputChange('ohpWeight', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Số reps tối đa</label>
                        <input
                          type="number"
                          value={liftInputs.ohpReps}
                          onChange={(e) => handleInputChange('ohpReps', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-3 text-[11px] text-teal-400">
                        1RM Ước tính (Epley): <strong>{estimate1RM(liftInputs.ohpWeight, liftInputs.ohpReps)} kg</strong>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-4 mt-8 pt-4 border-t border-white/5">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="toggle-btn"
                style={{ flex: 'none', width: '120px' }}
              >
                <ArrowLeft size={16} strokeWidth={2.5} /> Quay lại
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn-primary"
                style={{ width: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                Tiếp tục <ArrowRight size={16} strokeWidth={2.5} />
              </button>
            ) : (
              <button
                type="submit"
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition-all shadow-[0_0_15px_rgba(225,29,72,0.4)] hover:shadow-[0_0_25px_rgba(225,29,72,0.6)] flex items-center gap-2 transform hover:-translate-y-0.5"
              >
                {isUpdateMode ? 'Lưu cập nhật' : 'Hoàn tất Thiết lập'} <Check size={18} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
