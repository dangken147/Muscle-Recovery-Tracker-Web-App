import { useState, useMemo } from 'react';
import type { UserProfile } from '../types/recovery.types';
import { TrendingUp, Activity, Scale } from 'lucide-react';

interface ProfileHistoryChartProps {
  profile: UserProfile;
}

export default function ProfileHistoryChart({ profile }: ProfileHistoryChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Reconstruct history points
  const points = useMemo(() => {
    const history = profile.updateHistory || [];
    
    // Default current stats if no history
    if (history.length === 0) {
      return [{
        time: Date.now(),
        label: 'Hiện tại',
        weight: profile.weight,
        rhr: profile.rhr
      }];
    }

    // We need to trace values back.
    // However, since we only record NEW values in changedFields, the current profile ALREADY has the latest.
    // Let's assume the base profile (before any updates) had some initial values. But we didn't store them.
    // A simple approximation: if a field isn't in changedFields, it remained the same as the previous known.
    // Actually, it's easier to just read forward. 
    // We will start with current profile values, then apply updates backwards? No, if changedFields has the NEW value, 
    // then to know the OLD value, we should have stored the OLD value.
    // Since we didn't, let's just plot the `updateHistory` points + `Current` point.
    // For any missing field in an update, we take the value from the NEXT available point or current profile.
    
    // Better: Build from right to left (Current -> oldest)
    const pts: { time: number; label: string; weight: number; rhr: number }[] = [];
    
    // Current point
    pts.push({
      time: Date.now(),
      label: 'Hiện tại',
      weight: profile.weight,
      rhr: profile.rhr
    });

    let currentWeight = profile.weight;
    let currentRhr = profile.rhr;

    // Go backwards
    for (let i = history.length - 1; i >= 0; i--) {
      const record = history[i];
      const d = new Date(record.timestamp);
      
      // If the record changed weight, the value BEFORE this record was different.
      // Wait, record.changedFields has the NEW value. 
      // This means AT record.timestamp, the value became record.changedFields.weight.
      // So AT record.timestamp, the point should plot record.changedFields.weight (or currentWeight if not changed).
      
      if (record.changedFields.weight !== undefined) {
        currentWeight = record.changedFields.weight;
      }
      if (record.changedFields.rhr !== undefined) {
        currentRhr = record.changedFields.rhr;
      }

      pts.unshift({
        time: record.timestamp,
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        weight: currentWeight,
        rhr: currentRhr
      });
    }

    return pts;
  }, [profile]);

  // SVG dimensions
  const svgWidth = 600;
  const svgHeight = 240;
  const paddingTop = 30;
  const paddingBottom = 40;
  const paddingLeft = 45;
  const paddingRight = 45;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Find min/max for scaling
  const weights = points.map(p => p.weight);
  const rhrs = points.map(p => p.rhr);
  
  const minWeight = Math.max(0, Math.min(...weights) - 5);
  const maxWeight = Math.max(...weights) + 5;
  
  const minRhr = Math.max(0, Math.min(...rhrs) - 5);
  const maxRhr = Math.max(...rhrs) + 5;

  const getX = (index: number) => {
    if (points.length === 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (points.length - 1)) * chartWidth;
  };

  const getYWeight = (value: number) => {
    const range = maxWeight - minWeight || 1;
    return chartHeight + paddingTop - ((value - minWeight) / range) * chartHeight;
  };

  const getYRhr = (value: number) => {
    const range = maxRhr - minRhr || 1;
    return chartHeight + paddingTop - ((value - minRhr) / range) * chartHeight;
  };

  const createPath = (key: 'weight' | 'rhr', getY: (v: number) => number) => {
    if (points.length === 1) {
      const y = getY(points[0][key]);
      return `M ${paddingLeft} ${y} L ${svgWidth - paddingRight} ${y}`; // horizontal line
    }
    return points.reduce((path, pt, index) => {
      const x = getX(index);
      const y = getY(pt[key]);
      return path + (index === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
    }, '');
  };

  const weightPath = createPath('weight', getYWeight);
  const rhrPath = createPath('rhr', getYRhr);

  return (
    <div className="glass-card p-6 flex flex-col gap-4 relative overflow-hidden transition-all duration-300 border border-emerald-500/20">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-emerald-400" size={20} />
          <h3 className="text-lg font-bold text-white">Lịch sử Cập nhật Hồ sơ</h3>
        </div>
        <div className="flex gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <Scale className="text-sky-400" size={14} />
            <span className="text-slate-400">Cân nặng (kg)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Activity className="text-rose-400" size={14} />
            <span className="text-slate-400">Nhịp tim tĩnh (bpm)</span>
          </div>
        </div>
      </div>

      {points.length === 1 && (
        <div className="text-xs text-slate-400 italic text-center mb-[-10px]">
          Chưa có lịch sử cập nhật. Đây là số liệu hiện tại của bạn.
        </div>
      )}

      {/* SVG Chart */}
      <div className="relative w-full mt-2">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible select-none">
          <defs>
            <linearGradient id="weightGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
            <linearGradient id="rhrGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
          </defs>

          {/* X Axis Labels */}
          {points.map((pt, i) => (
            <text
              key={i}
              x={getX(i)}
              y={svgHeight - 15}
              className="text-[10px] font-bold fill-slate-400"
              textAnchor="middle"
            >
              {pt.label}
            </text>
          ))}

          {/* Paths */}
          <path
            d={weightPath}
            fill="none"
            stroke="url(#weightGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="filter drop-shadow-[0_4px_6px_rgba(56,189,248,0.3)]"
          />
          <path
            d={rhrPath}
            fill="none"
            stroke="url(#rhrGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="6 6"
            className="filter drop-shadow-[0_4px_6px_rgba(225,29,72,0.3)]"
          />

          {/* Hover interaction points */}
          {points.map((pt, i) => (
            <g key={i}>
              <circle
                cx={getX(i)}
                cy={getYWeight(pt.weight)}
                r="6"
                fill="#0f172a"
                stroke="#38bdf8"
                strokeWidth="2"
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
              <circle
                cx={getX(i)}
                cy={getYRhr(pt.rhr)}
                r="6"
                fill="#0f172a"
                stroke="#fb7185"
                strokeWidth="2"
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            </g>
          ))}

          {hoveredIndex !== null && (
            <line
              x1={getX(hoveredIndex)}
              y1={paddingTop}
              x2={getX(hoveredIndex)}
              y2={chartHeight + paddingTop}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeDasharray="4 4"
              pointerEvents="none"
            />
          )}
        </svg>
      </div>

      {/* Floating Tooltip info */}
      <div className="grid grid-cols-2 gap-4 bg-slate-900/50/80 border border-slate-800/60 rounded-xl p-4 text-sm mt-2">
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            {hoveredIndex !== null ? points[hoveredIndex].label : 'Số liệu mới nhất'}
          </span>
          <div className="flex items-center gap-2">
            <Scale className="text-sky-400" size={16} />
            <span className="text-lg font-black text-white">
              {hoveredIndex !== null ? points[hoveredIndex].weight : points[points.length - 1].weight} <span className="text-xs text-slate-400 font-normal">kg</span>
            </span>
          </div>
        </div>
        <div className="flex flex-col border-l border-white/5 pl-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Nhịp tim tĩnh
          </span>
          <div className="flex items-center gap-2">
            <Activity className="text-rose-400" size={16} />
            <span className="text-lg font-black text-white">
              {hoveredIndex !== null ? points[hoveredIndex].rhr : points[points.length - 1].rhr} <span className="text-xs text-slate-400 font-normal">bpm</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
