import { useState, useEffect, useMemo, useRef } from 'react';
import type { UserProfile, ActivityLog, MuscleGroup, ExerciseGroup } from '../types/recovery.types';
import { calculateMuscleStates, calculateCortisolState } from '../utils/recovery.utils';

const API_BASE = 'http://localhost:3001/api';
const USE_BACKEND = false; // Set to true if you have the backend running

export function useRecoveryState() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [domsRecords, setDomsRecords] = useState<Record<MuscleGroup, number>>({} as any);
  const [exerciseGroups, setExerciseGroups] = useState<ExerciseGroup[]>([]);
  const [offsetHours, setOffsetHours] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load state from API on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        let profileRes, logsRes, domsRes;
        
        if (USE_BACKEND) {
          [profileRes, logsRes, domsRes] = await Promise.all([
            fetch(`${API_BASE}/profile`).catch(() => null),
            fetch(`${API_BASE}/logs`).catch(() => null),
            fetch(`${API_BASE}/doms`).catch(() => null)
          ]);
        }

        if (profileRes && profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
          localStorage.setItem('aurarecov_profile', JSON.stringify(profileData));
        } else {
          // Fallback
          const localProfile = localStorage.getItem('aurarecov_profile');
          if (localProfile) setProfile(JSON.parse(localProfile));
        }
        
        if (logsRes && logsRes.ok) {
          const logsData = await logsRes.json();
          setLogs(logsData);
          localStorage.setItem('aurarecov_logs', JSON.stringify(logsData));
        } else {
          // Fallback
          const localLogs = localStorage.getItem('aurarecov_logs');
          if (localLogs) setLogs(JSON.parse(localLogs));
        }

        if (domsRes && domsRes.ok) {
          const domsData = await domsRes.json();
          setDomsRecords(domsData);
          localStorage.setItem('aurarecov_doms', JSON.stringify(domsData));
        } else {
          // Fallback
          const localDoms = localStorage.getItem('aurarecov_doms');
          if (localDoms) setDomsRecords(JSON.parse(localDoms));
        }

        // Keep groups local for now
        const storedGroups = localStorage.getItem('aurarecov_exercise_groups');
        if (storedGroups) setExerciseGroups(JSON.parse(storedGroups));

        // Keep offset local for simulation
        const storedOffset = localStorage.getItem('aurarecov_offset');
        if (storedOffset) setOffsetHours(parseInt(storedOffset) || 0);

      } catch (e) {
        console.warn('Backend is offline, using LocalStorage fallback.');
        const localProfile = localStorage.getItem('aurarecov_profile');
        if (localProfile) setProfile(JSON.parse(localProfile));
        
        const localLogs = localStorage.getItem('aurarecov_logs');
        if (localLogs) setLogs(JSON.parse(localLogs));

        const localDoms = localStorage.getItem('aurarecov_doms');
        if (localDoms) setDomsRecords(JSON.parse(localDoms));
        
        const storedGroups = localStorage.getItem('aurarecov_exercise_groups');
        if (storedGroups) setExerciseGroups(JSON.parse(storedGroups));
        
        const storedOffset = localStorage.getItem('aurarecov_offset');
        if (storedOffset) setOffsetHours(parseInt(storedOffset) || 0);
        console.error('Error loading data from API', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Save states to API
  const saveProfile = async (newProfile: UserProfile | null) => {
    setProfile(newProfile);
    if (newProfile) {
      localStorage.setItem('aurarecov_profile', JSON.stringify(newProfile));
      if (USE_BACKEND) {
        await fetch(`${API_BASE}/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newProfile)
        }).catch(() => console.warn('Failed to save to backend, saved to LocalStorage instead.'));
      }
    } else {
      localStorage.removeItem('aurarecov_profile');
      if (USE_BACKEND) await fetch(`${API_BASE}/profile`, { method: 'DELETE' }).catch(() => null);
    }
  };

  const saveLogs = async (newLogs: ActivityLog[]) => {
    setLogs(newLogs);
    localStorage.setItem('aurarecov_logs', JSON.stringify(newLogs));
    if (USE_BACKEND) {
      await fetch(`${API_BASE}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLogs)
      }).catch(() => null);
    }
  };

  const saveDoms = async (newDoms: Record<MuscleGroup, number>) => {
    setDomsRecords(newDoms);
    localStorage.setItem('aurarecov_doms', JSON.stringify(newDoms));
    if (USE_BACKEND) {
      await fetch(`${API_BASE}/doms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDoms)
      }).catch(() => null);
    }
  };

  const saveExerciseGroups = (groups: ExerciseGroup[]) => {
    setExerciseGroups(groups);
    localStorage.setItem('aurarecov_exercise_groups', JSON.stringify(groups));
  };

  const saveOffset = (hours: number) => {
    setOffsetHours(hours);
    localStorage.setItem('aurarecov_offset', hours.toString());
  };

  const handleOnboardingComplete = async (newProfile: UserProfile) => {
    const timestamp = Date.now() + offsetHours * 60 * 60 * 1000;
    const finalProfile = { ...newProfile, lastProfileUpdateDate: timestamp };
    await saveProfile(finalProfile);
    const defaultDoms: Record<MuscleGroup, number> = {} as any;
    await saveDoms(defaultDoms);
  };

  const handleUpdateProfile = async (updatedProfile: UserProfile) => {
    if (!profile) return;
    const timestamp = Date.now() + offsetHours * 60 * 60 * 1000;
    
    // Determine changed fields
    const changedFields: Partial<UserProfile> = {};
    if (updatedProfile.weight !== profile.weight) changedFields.weight = updatedProfile.weight;
    if (updatedProfile.rhr !== profile.rhr) changedFields.rhr = updatedProfile.rhr;
    if (updatedProfile.weeklyFrequency !== profile.weeklyFrequency) changedFields.weeklyFrequency = updatedProfile.weeklyFrequency;
    
    // Add history record if there are meaningful changes
    let newHistory = profile.updateHistory || [];
    if (Object.keys(changedFields).length > 0) {
      const record = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp,
        changedFields
      };
      newHistory = [...newHistory, record];
    }
    
    const finalProfile: UserProfile = {
      ...updatedProfile,
      updateHistory: newHistory,
      lastProfileUpdateDate: timestamp
    };
    
    await saveProfile(finalProfile);
  };

  const handleLogSubmit = async (logData: Omit<ActivityLog, 'id' | 'timestamp'> & { id?: string }) => {
    const newLog: ActivityLog = {
      ...logData,
      id: logData.id || `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: logData.id ? (logs.find(l => l.id === logData.id)?.timestamp || Date.now() + offsetHours * 60 * 60 * 1000) : Date.now() + offsetHours * 60 * 60 * 1000,
    };
    
    let updatedLogs;
    if (logData.id && logs.some(l => l.id === logData.id)) {
      updatedLogs = logs.map(l => l.id === logData.id ? newLog : l);
    } else {
      updatedLogs = [...logs, newLog];
    }
    setLogs(updatedLogs);
    localStorage.setItem('aurarecov_logs', JSON.stringify(updatedLogs));

    // Save to API
    if (USE_BACKEND) {
      const res = await fetch(`${API_BASE}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog)
      }).catch(() => null);

      if (res && !res.ok) {
        console.error('Failed to save log to DB');
      }
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa buổi tập này khỏi lịch sử? Số liệu phục hồi sẽ tự động tính toán lại.')) {
      setLogs(prev => {
        const next = prev.filter(log => log.id !== id);
        localStorage.setItem('aurarecov_logs', JSON.stringify(next));
        return next;
      });
      if (USE_BACKEND) {
        await fetch(`${API_BASE}/logs/${id}`, { method: 'DELETE' }).catch(() => null);
      }
    }
  };

  const handleAdvanceTime = (hours: number) => {
    saveOffset(offsetHours + hours);
  };

  const handleSimulateSleep = async () => {
    saveOffset(offsetHours + 8);
    if (logs.length > 0) {
      const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp);
      const lastLog = sortedLogs[0];
      
      const updatedLog: ActivityLog = {
        ...lastLog,
        sleep: 'good' as const,
        nutrition: 'good' as const,
        notes: lastLog.notes ? `${lastLog.notes} (Đã phục hồi qua Giấc ngủ ngon)` : 'Phục hồi qua Giấc ngủ ngon',
      };

      const updatedLogs = logs.map((log) => log.id === lastLog.id ? updatedLog : log);

      // #14 FIX: Sync về cả localStorage và DB thay vì chỉ cập nhật UI state
      setLogs(updatedLogs);
      localStorage.setItem('aurarecov_logs', JSON.stringify(updatedLogs));
      if (USE_BACKEND) {
        await fetch(`${API_BASE}/logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedLog),
        }).catch(() => console.warn('Failed to sync sleep simulation to backend.'));
      }
    }
  };

  const handleResetTime = () => {
    saveOffset(0);
  };

  const handleResetProfile = async () => {
    if (window.confirm('Cảnh báo: Toàn bộ dữ liệu hồ sơ và lịch sử tập sẽ bị xóa vĩnh viễn. Bạn có chắc chắn?')) {
      localStorage.removeItem('aurarecov_profile');
      localStorage.removeItem('aurarecov_logs');
      localStorage.removeItem('aurarecov_doms');
      
      setProfile(null);
      setLogs([]);
      setDomsRecords({} as any);
      setOffsetHours(0);
      
      if (USE_BACKEND) {
        await Promise.all([
          fetch(`${API_BASE}/profile`, { method: 'DELETE' }).catch(() => null),
          fetch(`${API_BASE}/logs`, { method: 'DELETE' }).catch(() => null),
          fetch(`${API_BASE}/doms`, { method: 'DELETE' }).catch(() => null)
        ]);
      }
    }
  };

  // #14 FIX: targetTime cập nhật mỗi 60 giây qua interval
  // - Không dùng Date.now() trực tiếp trong useMemo (thay đổi mỗi ms)
  // - Dùng state để trigger re-render đúng lúc, giữ đồng hồ thực tế chạy
  const [currentMinute, setCurrentMinute] = useState(() => Math.floor(Date.now() / 60000));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentMinute(Math.floor(Date.now() / 60000));
    }, 60000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const targetTime = useMemo(() => {
    return currentMinute * 60000 + offsetHours * 60 * 60 * 1000;
  }, [currentMinute, offsetHours]);

  const muscleStates = useMemo(() => {
    if (!profile) return [];
    return calculateMuscleStates(profile, logs, targetTime);
  }, [profile, logs, targetTime]);

  const cortisolState = useMemo(() => {
    if (!profile) return null;
    return calculateCortisolState(profile, logs, targetTime);
  }, [profile, logs, targetTime]);

  return {
    profile,
    logs,
    domsRecords,
    exerciseGroups,
    offsetHours,
    isLoading,
    muscleStates,
    cortisolState,
    saveDoms,
    saveExerciseGroups,
    handleOnboardingComplete,
    handleUpdateProfile,
    handleLogSubmit,
    handleDeleteLog,
    handleAdvanceTime,
    handleSimulateSleep,
    handleResetTime,
    handleResetProfile,
  };
}
