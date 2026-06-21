import { useState, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import type { MuscleGroup, MuscleState, CortisolState } from '../types/recovery.types';
import { MUSCLE_LABELS } from '../utils/recovery.utils';

interface BodyMapProps {
  muscleStates?: MuscleState[]; // Optional: for display mode
  selectedMuscles?: MuscleGroup[]; // Optional: for selection mode
  onMuscleClick?: (muscle: MuscleGroup) => void; // Optional: interactive handler
  cortisolState?: CortisolState; // Optional: to drive systemic body glow
  interactive?: boolean;
}

const BodyMap = memo(function BodyMap({
  muscleStates = [],
  selectedMuscles = [],
  onMuscleClick,
  cortisolState,
  interactive = false,
}: BodyMapProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [hoveredMuscle, setHoveredMuscle] = useState<MuscleGroup | null>(null);

  // Map muscle to its current state
  const getState = (muscle: MuscleGroup): MuscleState | undefined => {
    return muscleStates.find((s) => s.muscle === muscle);
  };

  // Determine CSS class based on fatigue and injury status
  const getMuscleClass = (muscle: MuscleGroup, isFront?: boolean): string => {
    const state = getState(muscle);
    const isSelected = selectedMuscles.includes(muscle);
    const isTendon = muscle === 'acl' || muscle === 'achilles';
    
    let baseClass = isTendon ? 'muscle-path tendon-path' : 'muscle-path';
    if (isTendon && isFront) baseClass += ' tendon-front';
    if (isSelected) baseClass += ' selected';

    if (!state) return `${baseClass} ${isTendon ? '' : 'muscle-recovered'}`;

    switch (state.status) {
      case 'injured':
        return `${baseClass} muscle-injured`;
      case 'heavy':
        return `${baseClass} muscle-heavy`;
      case 'moderate':
        return `${baseClass} muscle-moderate`;
      case 'mild':
        return `${baseClass} muscle-mild`;
      default:
        return `${baseClass} ${isTendon ? '' : 'muscle-recovered'}`;
    }
  };

  const handleMuscleClick = (muscle: MuscleGroup) => {
    if (interactive && onMuscleClick) {
      onMuscleClick(muscle);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent, muscle: MuscleGroup) => {
    setHoveredMuscle(muscle);
    updateTooltipPosition(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    updateTooltipPosition(e);
  };

  const updateTooltipPosition = (e: React.MouseEvent) => {
    if (!tooltipRef.current) return;
    const svg = (e.currentTarget as SVGElement).ownerSVGElement;
    if (svg) {
      const rect = svg.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const isLeft = e.clientX < centerX;
      
      if (isLeft) {
        tooltipRef.current.style.left = 'auto';
        tooltipRef.current.style.right = `${window.innerWidth - e.clientX + 20}px`;
      } else {
        tooltipRef.current.style.left = `${e.clientX + 20}px`;
        tooltipRef.current.style.right = 'auto';
      }
      tooltipRef.current.style.top = `${e.clientY + 20}px`;
    }
  };

  const handleMouseLeave = () => {
    setHoveredMuscle(null);
  };

  // Systemic Cortisol Glow CSS Class
  const getGlowClass = (): string => {
    if (!cortisolState) return '';
    if (cortisolState.zone === 'catabolic') return 'catabolic-glow';
    if (cortisolState.zone === 'normal') return 'normal-glow';
    return 'anabolic-glow';
  };

  const renderMuscle = (muscle: MuscleGroup, d: string, isFront?: boolean) => {
    return (
      <path 
        d={d} 
        className={getMuscleClass(muscle, isFront)} 
        onClick={() => handleMuscleClick(muscle)}
        onMouseEnter={(e) => handleMouseEnter(e, muscle)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    );
  };

  const renderJoint = (cx: number, cy: number, muscle: MuscleGroup, radius: number) => {
    const cssClass = getMuscleClass(muscle);

    return (
      <g 
        className={`cursor-pointer ${cssClass}`} 
        onClick={() => handleMuscleClick(muscle)}
        onMouseEnter={(e) => handleMouseEnter(e, muscle)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Transparent Hit Box to prevent hover jitter */}
        <circle cx={cx} cy={cy} r={radius + 8} fill="transparent" stroke="none" />

        {/* Inner Solid Dot */}
        <circle cx={cx} cy={cy} r={radius} fill="currentColor" />
      </g>
    );
  };

  const renderTooltip = () => {
    const isVisible = !!hoveredMuscle;
    const muscleToRender = hoveredMuscle || 'neck'; // fallback for initial render
    const label = MUSCLE_LABELS[muscleToRender as MuscleGroup];
    const state = getState(muscleToRender as MuscleGroup);

    let bgClass = 'bg-slate-800/90 border-slate-700/50';
    let textClass = 'text-emerald-400';
    let statusText = 'Phục hồi 100%';
    let fatigueValue = 0;

    if (state) {
      fatigueValue = state.fatigue;
      if (state.status === 'injured') {
        bgClass = 'bg-purple-950/90 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]';
        textClass = 'text-purple-400';
        statusText = `Chấn thương (Nghỉ ${state.recoveryTimeRemaining}h)`;
      } else if (state.status === 'heavy') {
        bgClass = 'bg-rose-950/90 border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.3)]';
        textClass = 'text-rose-400';
        statusText = `Quá tải (Nghỉ ${state.recoveryTimeRemaining}h)`;
      } else if (state.status === 'moderate') {
        bgClass = 'bg-orange-950/90 border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.2)]';
        textClass = 'text-orange-400';
        statusText = `Đang mỏi (Nghỉ ${state.recoveryTimeRemaining}h)`;
      } else if (state.status === 'mild') {
        bgClass = 'bg-amber-950/90 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.1)]';
        textClass = 'text-amber-400';
        statusText = `Mỏi nhẹ (Nghỉ ${state.recoveryTimeRemaining}h)`;
      }
    }

    return createPortal(
      <div 
        ref={tooltipRef}
        className={`fixed pointer-events-none z-[9999] px-4 py-3 rounded-2xl border backdrop-blur-md transition-opacity duration-150 ${bgClass}`}
        style={{
          opacity: isVisible ? 1 : 0,
        }}
      >
        <div className="font-black text-sm text-white mb-0.5">{label}</div>
        <div className={`text-xs font-bold ${textClass}`}>{statusText}</div>
        {fatigueValue > 0 && (
          <div className="mt-2 h-1 w-full bg-black/40 rounded-full overflow-hidden">
             <div className="h-full bg-current opacity-80" style={{ width: `${fatigueValue}%` }} />
          </div>
        )}
      </div>,
      document.body
    );
  };

  return (
    <div className={`glass-card flex flex-col items-center gap-6 ${getGlowClass()}`}>
      <div className="text-center">
        <h3 className="text-md font-bold text-white tracking-wide uppercase">
          Bản đồ cơ bắp hoạt động
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          {interactive ? 'Click chọn các nhóm cơ để log bài tập' : 'Hover chuột để xem mức độ mệt mỏi từng cơ'}
        </p>
      </div>

      <div className="relative grid grid-cols-2 gap-2 w-full max-w-[690px] overflow-hidden rounded-xl bg-slate-900/50/20 border border-white/5 p-4">
        
        {/* Hologram Radar Grid Background */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `
            linear-gradient(rgba(148, 163, 184, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 163, 184, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
          backgroundPosition: 'center center'
        }}></div>
        
        {/* Radar Concentric Circles for Left (Front) and Right (Back) figures */}
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-slate-500/10 pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[150px] h-[150px] rounded-full border border-slate-500/15 pointer-events-none"></div>
        <div className="absolute top-1/2 left-3/4 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-slate-500/10 pointer-events-none"></div>
        <div className="absolute top-1/2 left-3/4 -translate-x-1/2 -translate-y-1/2 w-[150px] h-[150px] rounded-full border border-slate-500/15 pointer-events-none"></div>

        {/* Vertical Axis Lines */}
        <div className="absolute top-0 bottom-0 left-1/4 border-l border-slate-500/10 pointer-events-none"></div>
        <div className="absolute top-0 bottom-0 left-3/4 border-l border-slate-500/10 pointer-events-none"></div>

        {/* Scanner Radar Effect */}
        <div className="scanner-line z-0"></div>
        <div className="flex flex-col items-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Mặt trước</span>
          <svg viewBox="25 0 130 360" className="select-none w-full h-auto max-h-[540px]">
            {/* Neck */}
            {renderMuscle('neck', "M82 53 Q90 60 98 53 L96 65 Q90 68 84 65 Z")}

            {/* Shoulders (Left & Right Front Delts) */}
            {renderMuscle('front_shoulders', "M62 65 C50 70 48 85 54 95 C60 100 66 85 66 65 Z")}
            {renderMuscle('front_shoulders', "M118 65 C130 70 132 85 126 95 C120 100 114 85 114 65 Z")}

            {/* Chest (Left & Right Pectorals) */}
            {renderMuscle('upper_chest', "M66 66 Q80 70 88 72 L88 82 Q75 82 64 80 C64 75 66 66 66 66 Z")}
            {renderMuscle('lower_chest', "M64 80 Q75 82 88 82 L88 95 Q75 102 62 95 C62 85 64 82 64 80 Z")}
            {renderMuscle('upper_chest', "M114 66 Q100 70 92 72 L92 82 Q105 82 116 80 C116 75 114 66 114 66 Z")}
            {renderMuscle('lower_chest', "M116 80 Q105 82 92 82 L92 95 Q105 102 118 95 C118 85 116 82 116 80 Z")}

            {/* Abs (Cơ bụng) */}
            {renderMuscle('upper_abs', "M78 100 Q90 96 102 100 L101 125 Q90 125 79 125 Z")}
            {renderMuscle('lower_abs', "M79 125 Q90 125 101 125 L100 150 Q90 156 80 150 Z")}
            {renderMuscle('obliques', "M72 100 L78 100 L79 125 L80 150 L74 150 Q71 125 72 100 Z")}
            {renderMuscle('obliques', "M108 100 L102 100 L101 125 L100 150 L106 150 Q109 125 108 100 Z")}
            
            {/* Six pack lines (Cosmetic) */}
            <path d="M90 100 L90 150" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1" className="pointer-events-none" />
            <path d="M75 116 Q90 120 105 116" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1" className="pointer-events-none" />
            <path d="M75 133 Q90 137 105 133" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1" className="pointer-events-none" />

            {/* Biceps (Left & Right Front Arms) */}
            {renderMuscle('biceps', "M52 93 C42 105 45 120 48 125 C55 120 58 105 60 93 Z")}
            {renderMuscle('biceps', "M128 93 C138 105 135 120 132 125 C125 120 122 105 120 93 Z")}

            {/* Forearms (Left & Right Front Forearms) */}
            {renderMuscle('forearms', "M46 128 C38 140 32 160 36 172 C42 165 48 145 52 128 Z")}
            {renderMuscle('forearms', "M134 128 C142 140 148 160 144 172 C138 165 132 145 128 128 Z")}

            {/* Quadriceps (Left & Right Thighs) */}
            {renderMuscle('quadriceps', "M60 155 Q75 155 88 158 Q85 190 85 220 Q70 215 62 225 C55 200 50 170 60 155 Z")}
            {renderMuscle('quadriceps', "M120 155 Q105 155 92 158 Q95 190 95 220 Q110 215 118 225 C125 200 130 170 120 155 Z")}

            {/* Calves (Front - Left & Right Tibialis/Calves) */}
            {renderMuscle('calves', "M62 235 C58 260 62 290 66 315 L78 315 C80 290 82 260 84 235 Z")}
            {renderMuscle('calves', "M118 235 C122 260 118 290 114 315 L102 315 C100 290 98 260 96 235 Z")}

            {/* Feet (Left & Right) */}
            {renderMuscle('feet', "M66 324 L78 324 L76 345 L62 345 Z")}
            {renderMuscle('feet', "M114 324 L102 324 L104 345 L118 345 Z")}

            {/* Joints (Front) */}
            {renderJoint(55, 75, 'shoulder_joints', 5.5)}
            {renderJoint(125, 75, 'shoulder_joints', 5.5)}
            
            {renderJoint(51, 126, 'elbows', 5.5)}
            {renderJoint(129, 126, 'elbows', 5.5)}
            
            {renderJoint(39, 172, 'wrists', 4)}
            {renderJoint(141, 172, 'wrists', 4)}
            
            {renderJoint(73, 231, 'knees', 8)}
            {renderJoint(107, 231, 'knees', 8)}
            
            {renderJoint(72, 320, 'ankles', 4.5)}
            {renderJoint(108, 320, 'ankles', 4.5)}

            {/* Tendons & Ligaments (Front) - Rendered AFTER joints so they appear on top */}
            {/* ACL (Dây chằng gối) - X shape connecting quad and calf */}
            {renderMuscle('acl', "M 67 215 L 69 215 L 79 245 L 77 245 Z M 79 215 L 77 215 L 67 245 L 69 245 Z", true)}
            {renderMuscle('acl', "M 101 215 L 103 215 L 113 245 L 111 245 Z M 113 215 L 111 215 L 101 245 L 103 245 Z", true)}
            
            {/* Achilles (Gân gót) - Thick vertical band connecting calf to heel */}
            {renderMuscle('achilles', "M 70 290 L 74 290 L 74 335 L 70 335 Z", true)}
            {renderMuscle('achilles', "M 106 290 L 110 290 L 110 335 L 106 335 Z", true)}
          </svg>
        </div>

        {/* BACK VIEW */}
        <div className="flex flex-col items-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Mặt sau</span>
          <svg viewBox="25 0 130 360" className="select-none w-full h-auto max-h-[540px]">
            {/* Back Shoulders (Rear Delts) */}
            {renderMuscle('rear_shoulders', "M62 65 C50 70 48 85 54 95 C60 100 66 85 66 65 Z")}
            {renderMuscle('rear_shoulders', "M118 65 C130 70 132 85 126 95 C120 100 114 85 114 65 Z")}

            {/* Upper Back (Traps) */}
            {renderMuscle('traps', "M90 53 L100 63 L105 85 L90 105 L75 85 L80 63 Z")}

            {/* Lats (Left & Right) */}
            {renderMuscle('lats', "M75 85 L66 85 Q60 100 68 125 L88 135 Z")}
            {renderMuscle('lats', "M105 85 L114 85 Q120 100 112 125 L92 135 Z")}

            {/* Lower Back */}
            {renderMuscle('lower_back', "M70 132 L110 132 Q108 145 106 155 L74 155 Q72 145 70 132 Z")}

            {/* Triceps */}
            {renderMuscle('triceps', "M52 93 C42 105 45 120 48 125 C55 120 58 105 60 93 Z")}
            {renderMuscle('triceps', "M128 93 C138 105 135 120 132 125 C125 120 122 105 120 93 Z")}

            {/* Forearms (Back) */}
            {renderMuscle('forearms', "M46 128 C38 140 32 160 36 172 C42 165 48 145 52 128 Z")}
            {renderMuscle('forearms', "M134 128 C142 140 148 160 144 172 C138 165 132 145 128 128 Z")}

            {/* Glutes */}
            {renderMuscle('glutes', "M74 155 Q90 150 106 155 C115 165 110 185 92 188 L90 188 C72 185 65 165 74 155 Z")}

            {/* Hamstrings */}
            {renderMuscle('hamstrings', "M60 185 Q75 185 88 188 Q85 200 85 220 Q70 215 62 225 C55 200 50 190 60 185 Z")}
            {renderMuscle('hamstrings', "M120 185 Q105 185 92 188 Q95 200 95 220 Q110 215 118 225 C125 200 130 190 120 185 Z")}

            {/* Calves (Back) */}
            {renderMuscle('calves', "M62 235 C58 260 62 290 66 315 L78 315 C80 290 82 260 84 235 Z")}
            {renderMuscle('calves', "M118 235 C122 260 118 290 114 315 L102 315 C100 290 98 260 96 235 Z")}

            {/* Feet (Left & Right) */}
            {renderMuscle('feet', "M66 324 L78 324 L76 345 L62 345 Z")}
            {renderMuscle('feet', "M114 324 L102 324 L104 345 L118 345 Z")}

            {/* Joints (Back) */}
            {renderJoint(55, 75, 'shoulder_joints', 5.5)}
            {renderJoint(125, 75, 'shoulder_joints', 5.5)}
            
            {renderJoint(51, 126, 'elbows', 5.5)}
            {renderJoint(129, 126, 'elbows', 5.5)}
            
            {renderJoint(39, 172, 'wrists', 4)}
            {renderJoint(141, 172, 'wrists', 4)}
            
            {renderJoint(73, 231, 'knees', 8)}
            {renderJoint(107, 231, 'knees', 8)}
            
            {renderJoint(72, 320, 'ankles', 4.5)}
            {renderJoint(108, 320, 'ankles', 4.5)}

            {/* Tendons & Ligaments (Back) - Rendered AFTER joints so they appear on top */}
            {/* ACL (Dây chằng gối) - X shape connecting hamstrings and calf */}
            {renderMuscle('acl', "M 67 215 L 69 215 L 79 245 L 77 245 Z M 79 215 L 77 215 L 67 245 L 69 245 Z")}
            {renderMuscle('acl', "M 101 215 L 103 215 L 113 245 L 111 245 Z M 113 215 L 111 215 L 101 245 L 103 245 Z")}
            
            {/* Achilles (Gân gót) - Thick vertical band connecting calf to heel */}
            {renderMuscle('achilles', "M 70 290 L 74 290 L 74 335 L 70 335 Z")}
            {renderMuscle('achilles', "M 106 290 L 110 290 L 110 335 L 106 335 Z")}
          </svg>
        </div>
      </div>

      {/* Colors legend */}
      {!interactive && (
        <div className="flex flex-wrap justify-center gap-3 mt-2 text-xs border-t border-white/5 pt-4 w-full">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-3 h-3 rounded-sm bg-emerald-500/20 border border-emerald-500"></span> Phục hồi
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-3 h-3 rounded-sm bg-amber-500/20 border border-amber-500"></span> Mỏi nhẹ
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-3 h-3 rounded-sm bg-orange-500/30 border border-orange-500"></span> Mỏi vừa
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-3 h-3 rounded-sm bg-red-500/30 border border-red-500"></span> Mỏi nặng
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-3 h-3 rounded-sm bg-purple-500/30 border border-purple-500"></span> Đau/Chấn thương
          </div>
        </div>
      )}

      {/* Render the Custom Tooltip */}
      {renderTooltip()}
    </div>
  );
});

export default BodyMap;
