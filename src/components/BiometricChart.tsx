import { useState, useMemo, memo } from 'react';
import type { UserProfile, ActivityLog } from '../types/recovery.types';
import { calculateMuscleStates, calculateCortisolState } from '../utils/recovery.utils';
import { TrendingUp } from 'lucide-react';

interface BiometricChartProps {
  profile: UserProfile;
  logs: ActivityLog[];
  offsetHours: number;
}

const BiometricChart = memo(function BiometricChart({ profile, logs, offsetHours }: BiometricChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const intervals = 7;

  const points = useMemo(() => {
    const targetTime = Date.now() + offsetHours * 60 * 60 * 1000;
    // Calculate start time as 6 days ago (7 points total)
    const startTimestamp = logs.length > 0
      ? Math.min(...logs.map((l) => l.timestamp))
      : targetTime - 6 * 24 * 60 * 60 * 1000;

    // Format date helper
    const formatDate = (timestamp: number) => {
      const d = new Date(timestamp);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    };

    const result: { time: number; label: string; cortisol: number; fatigue: number }[] = [];
    // Prevent division by zero if step is zero
    const step = targetTime > startTimestamp
      ? (targetTime - startTimestamp) / (intervals - 1)
      : 24 * 60 * 60 * 1000; // default 1 day step

    for (let i = 0; i < intervals; i++) {
      const time = startTimestamp + i * step;
      const cortisolObj = calculateCortisolState(profile, logs, time);
      const muscleStates = calculateMuscleStates(profile, logs, time);
      
      const avgFatigue = muscleStates.length > 0
        ? Math.round(muscleStates.reduce((sum, s) => sum + s.fatigue, 0) / muscleStates.length)
        : 0;

      result.push({
        time,
        label: formatDate(time),
        cortisol: cortisolObj.currentLevel,
        fatigue: avgFatigue,
      });
    }
    return result;
  }, [profile, logs, offsetHours]);

  // SVG dimensions
  const svgWidth = 600;
  const svgHeight = 260;
  const paddingTop = 20;
  const paddingBottom = 40;
  const paddingLeft = 45;
  const paddingRight = 20;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const getX = (index: number) => paddingLeft + (index / (intervals - 1)) * chartWidth;
  const getY = (value: number) => {
    // Value capped between 0 and 100
    const clamped = Math.max(0, Math.min(100, value));
    return chartHeight + paddingTop - (clamped / 100) * chartHeight;
  };

  // Build SVG path d string
  const createPath = (key: 'cortisol' | 'fatigue') => {
    return points.reduce((path, pt, index) => {
      const x = getX(index);
      const y = getY(pt[key]);
      return path + (index === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
    }, '');
  };

  const cortisolPath = createPath('cortisol');
  const fatiguePath = createPath('fatigue');

  // Build grid lines
  const gridValues = [0, 25, 50, 75, 100];

  return (
    <div className="glass-card p-6 flex flex-col gap-4 relative overflow-hidden transition-all duration-300 hover:border-sky-500/30">
      {/* Background radial highlight */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-purple-400" size={20} />
          <h3 className="text-lg font-bold text-white">Xu hướng Sinh học & Phục hồi</h3>
        </div>
        <div className="flex gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 shadow-[0_0_8px_rgba(236,72,153,0.5)]" />
            <span className="text-slate-400">Cortisol Hệ thống</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gradient-to-r from-sky-400 to-blue-500 shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
            <span className="text-slate-400">Mỏi cơ Trung bình</span>
          </div>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible select-none">
          <defs>
            {/* Gradients */}
            <linearGradient id="cortisolGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="fatigueGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>

            <linearGradient id="cortisolAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="fatigueAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines & Y Axis Labels */}
          {gridValues.map((val) => (
            <g key={val}>
              <line
                x1={paddingLeft}
                y1={getY(val)}
                x2={svgWidth - paddingRight}
                y2={getY(val)}
                stroke="rgba(255, 255, 255, 0.1)"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={paddingLeft - 8}
                y={getY(val) + 4}
                className="text-[10px] font-semibold fill-slate-500 text-right"
                textAnchor="end"
              >
                {val}%
              </text>
            </g>
          ))}

          {/* X Axis line */}
          <line
            x1={paddingLeft}
            y1={getY(0)}
            x2={svgWidth - paddingRight}
            y2={getY(0)}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="1.5"
          />

          {/* X Axis Labels */}
          {points.map((pt, i) => (
            <text
              key={i}
              x={getX(i)}
              y={svgHeight - 12}
              className="text-[10px] font-bold fill-slate-400"
              textAnchor="middle"
            >
              {pt.label}
            </text>
          ))}

          {/* Area under curves */}
          {points.length > 0 && (
            <>
              {/* Cortisol Area */}
              <path
                d={`${cortisolPath} L ${getX(points.length - 1)} ${getY(0)} L ${getX(0)} ${getY(0)} Z`}
                fill="url(#cortisolAreaGrad)"
              />
              {/* Fatigue Area */}
              <path
                d={`${fatiguePath} L ${getX(points.length - 1)} ${getY(0)} L ${getX(0)} ${getY(0)} Z`}
                fill="url(#fatigueAreaGrad)"
              />
            </>
          )}

          {/* Lines */}
          <path
            d={cortisolPath}
            fill="none"
            stroke="url(#cortisolGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="filter drop-shadow-[0_2px_4px_rgba(236,72,153,0.3)]"
          />
          <path
            d={fatiguePath}
            fill="none"
            stroke="url(#fatigueGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="filter drop-shadow-[0_2px_4px_rgba(56,189,248,0.3)]"
          />

          {/* Interactive vertical hover overlays */}
          {points.map((_, i) => (
            <rect
              key={i}
              x={getX(i) - chartWidth / (2 * (intervals - 1))}
              y={paddingTop}
              width={chartWidth / (intervals - 1)}
              height={chartHeight}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}

          {/* Highlight hovered points */}
          {hoveredIndex !== null && (
            <g>
              {/* Vertical guideline */}
              <line
                x1={getX(hoveredIndex)}
                y1={paddingTop}
                x2={getX(hoveredIndex)}
                y2={chartHeight + paddingTop}
                stroke="rgba(255, 255, 255, 0.1)"
                strokeDasharray="3 3"
                strokeWidth="1.5"
                pointerEvents="none"
              />

              {/* Cortisol Circle */}
              <circle
                cx={getX(hoveredIndex)}
                cy={getY(points[hoveredIndex].cortisol)}
                r="5"
                fill="#ec4899"
                stroke="#fff"
                strokeWidth="1.5"
                pointerEvents="none"
                className="filter drop-shadow-[0_0_4px_rgba(236,72,153,0.8)]"
              />

              {/* Fatigue Circle */}
              <circle
                cx={getX(hoveredIndex)}
                cy={getY(points[hoveredIndex].fatigue)}
                r="5"
                fill="#38bdf8"
                stroke="#fff"
                strokeWidth="1.5"
                pointerEvents="none"
                className="filter drop-shadow-[0_0_4px_rgba(56,189,248,0.8)]"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Floating Interactive Legend/Tooltip Details */}
      <div className="grid grid-cols-2 gap-4 bg-slate-900/50 border border-slate-800/40 rounded-xl p-3 text-sm">
        <div className="flex flex-col gap-0.5 border-r border-slate-800/80 pr-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Thời gian</span>
          <span className="font-bold text-slate-400">
            {hoveredIndex !== null ? (
              `Thời điểm: ${points[hoveredIndex].label}`
            ) : (
              'Di chuột vào biểu đồ để xem chi tiết'
            )}
          </span>
        </div>

        <div className="flex items-center justify-around">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-pink-400/80 uppercase">Cortisol</span>
            <span className="text-base font-extrabold text-pink-500">
              {hoveredIndex !== null ? `${points[hoveredIndex].cortisol}%` : `${points[points.length - 1].cortisol}%`}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-sky-400/80 uppercase">Mệt mỏi cơ</span>
            <span className="text-base font-extrabold text-sky-400">
              {hoveredIndex !== null ? `${points[hoveredIndex].fatigue}%` : `${points[points.length - 1].fatigue}%`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default BiometricChart;
