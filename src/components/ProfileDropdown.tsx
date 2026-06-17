import { useState, useRef, useEffect } from 'react';
import type { UserProfile } from '../types/recovery.types';
import { User, Activity, TrendingUp, RefreshCw } from 'lucide-react';

interface ProfileDropdownProps {
  profile: UserProfile;
  offsetHours: number;
  onUpdateClick: () => void;
  onHistoryClick: () => void;
  onResetClick: () => void;
}

export default function ProfileDropdown({ profile, offsetHours, onUpdateClick, onHistoryClick, onResetClick }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Tính toán thời gian đếm ngược cập nhật hồ sơ
  const currentTime = Date.now() + offsetHours * 60 * 60 * 1000;
  const lastUpdate = profile.lastProfileUpdateDate || currentTime;
  const cycleDays = profile.updateCycleDays || 30;
  const nextUpdateDate = lastUpdate + cycleDays * 24 * 60 * 60 * 1000;
  const remainingDays = Math.ceil((nextUpdateDate - currentTime) / (1000 * 60 * 60 * 24));
  const isUrgentUpdate = remainingDays <= 3 && remainingDays >= 0;
  const isOverdue = remainingDays < 0;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button (Avatar) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950 rounded-full transition-transform hover:scale-105 active:scale-95"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black shadow-lg">
          {profile.name.charAt(0).toUpperCase()}
        </div>
        {/* Notification Dot */}
        {(isUrgentUpdate || isOverdue) && (
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500 border-2 border-slate-950"></span>
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+12px)] w-80 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-[100] animate-fade-in overflow-hidden">
          
          {/* Header Info */}
          <div className="p-5 border-b border-white/5 bg-slate-800/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-lg shrink-0">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white truncate">{profile.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{profile.age} tuổi • {profile.weight}kg</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5">
               <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5 flex flex-col items-center justify-center">
                  <div className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">RHR</div>
                  <div className="text-sm font-black text-white">{profile.rhr} <span className="text-[9px] text-rose-400 font-bold">bpm</span></div>
               </div>
               <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5 flex flex-col items-center justify-center">
                   <div className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Môn tập</div>
                   <div className="text-sm font-black text-white capitalize">{profile.primarySport === 'strength' ? 'Tạ' : profile.primarySport === 'endurance' ? 'Bền' : 'Team'}</div>
                </div>
             </div>
          </div>

          {/* Body Content */}
          <div className="p-3">
             {/* Update Cycle Alert */}
             <div className={`p-3 rounded-xl border flex items-center justify-between mb-3 ${isUrgentUpdate || isOverdue ? 'bg-rose-500/10 border-rose-500/30' : 'bg-slate-800/40 border-white/5'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isUrgentUpdate || isOverdue ? 'bg-rose-500/20 text-rose-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                    <Activity size={16} />
                  </div>
                  <div>
                    <div className={`text-xs font-bold ${isUrgentUpdate || isOverdue ? 'text-rose-400' : 'text-slate-300'}`}>
                      {isOverdue ? 'Đã quá hạn!' : 'Cập nhật tới'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">Chu kỳ: {cycleDays} ngày</div>
                  </div>
                </div>
                <div className={`text-lg font-black ${isUrgentUpdate || isOverdue ? 'text-rose-400 animate-pulse' : 'text-indigo-400'}`}>
                  {isOverdue ? '!' : `${remainingDays}d`}
                </div>
             </div>

            {/* Action Buttons */}
            <div className="space-y-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onUpdateClick();
                }}
                className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-semibold text-slate-300 hover:bg-indigo-500/10 hover:text-indigo-400 transition-colors"
              >
                <User size={16} /> Cập nhật Hồ sơ
              </button>
              
              <button
                onClick={() => {
                  setIsOpen(false);
                  onHistoryClick();
                }}
                className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-semibold text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors"
              >
                <TrendingUp size={16} /> Lịch sử Cập nhật
              </button>
              
              <div className="h-px bg-white/5 my-1 mx-2"></div>
              
              <button
                onClick={() => {
                  setIsOpen(false);
                  onResetClick();
                }}
                className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <RefreshCw size={16} /> Xóa toàn bộ dữ liệu (Reset)
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
