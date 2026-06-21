import React, { useEffect, useState } from 'react';
import { BrainCircuit, ShieldAlert, Zap, BatteryCharging } from 'lucide-react';
import type { CortisolState } from '../types/recovery.types';
import { getCortisolColor } from '../utils/recovery.utils';

interface CortisolGaugeCardProps {
  cortisolState: CortisolState;
}

export default function CortisolGaugeCard({ cortisolState }: CortisolGaugeCardProps) {
  const percentage = cortisolState.currentLevel;
  const isDanger = cortisolState.zone === 'catabolic';
  
  // Custom neon classes based on zone
  const getNeonGlowClass = (zone: string) => {
    if (zone === 'catabolic') return 'drop-shadow-[0_0_15px_rgba(244,63,94,0.8)]';
    if (zone === 'normal') return 'drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]';
    return 'drop-shadow-[0_0_12px_rgba(16,185,129,0.6)]';
  };

  const getCardGlowClass = (zone: string) => {
    if (zone === 'catabolic') return 'shadow-[0_0_30px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/20';
    if (zone === 'normal') return 'shadow-[0_0_30px_rgba(59,130,246,0.1)]';
    return 'shadow-[0_0_30px_rgba(16,185,129,0.1)]';
  };

  const colorHex = getCortisolColor(cortisolState.zone);
  const strokeColor = isDanger ? '#fb7185' : colorHex; // Slightly brighter rose for danger

  // SVG Gauge calculations
  const radius = 90;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`glass-card bento-item col-span-12 lg:col-span-4 flex flex-col items-center justify-center text-center p-8 relative overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl ${getCardGlowClass(cortisolState.zone)}`}>
      {/* Background Pulse Effect for Danger Zone */}
      {isDanger && (
        <div className="absolute inset-0 bg-rose-500/5 animate-pulse pointer-events-none"></div>
      )}

      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 w-full text-left flex items-center gap-2 relative z-10">
        <BrainCircuit size={14} strokeWidth={2.5} className={isDanger ? 'text-rose-400 animate-pulse' : 'text-indigo-400'} />
        Thần kinh (CNS)
      </div>

      {/* Futuristic Gauge */}
      <div className="relative w-full max-w-[220px] aspect-square mb-6 scale-110 flex-shrink-0 group">
        <svg className={`w-full h-full -rotate-90 transition-all duration-500 ${getNeonGlowClass(cortisolState.zone)}`}>
          {/* Track (Segmented) */}
          <circle 
            cx="50%" 
            cy="50%" 
            r={normalizedRadius} 
            fill="none"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth={stroke}
            strokeDasharray="4 8"
          />
          {/* Progress Ring */}
          <circle
            cx="50%" 
            cy="50%" 
            r={normalizedRadius} 
            fill="none"
            stroke={strokeColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
            className={isDanger ? 'animate-pulse' : ''}
          />
        </svg>

        {/* Inner Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-6xl font-black tracking-tighter drop-shadow-lg flex items-start transition-colors duration-500 ${isDanger ? 'text-rose-400' : 'text-white'}`}>
            {percentage}<span className="text-2xl text-slate-400 mt-2 ml-1">%</span>
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Stress Load</span>
        </div>
      </div>

      {/* Status Pill */}
      <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest mb-3 relative z-10 border ${
        cortisolState.zone === 'catabolic' 
          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.3)]' 
          : cortisolState.zone === 'normal' 
            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' 
            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
      }`}>
        {cortisolState.zone === 'catabolic' && <ShieldAlert size={14} />}
        {cortisolState.zone === 'normal' && <BatteryCharging size={14} />}
        {cortisolState.zone === 'anabolic' && <Zap size={14} />}
        {cortisolState.zone === 'catabolic' ? 'Dị Hóa (Quá Tải)' : cortisolState.zone === 'normal' ? 'Cân Bằng' : 'Đồng Hóa (Tối Ưu)'}
      </div>

      {/* AI Description Context */}
      <p className="text-xs text-slate-400 font-medium leading-relaxed relative z-10 max-w-[200px]">
        {cortisolState.description}
      </p>
    </div>
  );
}
