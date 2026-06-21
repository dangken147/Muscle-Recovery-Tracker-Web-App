import { useState, useEffect } from 'react';
import type { ActivityLog } from './types/recovery.types';
import { useRecoveryState } from './hooks/useRecoveryState';
import OnboardingWizard from './components/OnboardingWizard';
import Dashboard from './components/Dashboard';
import ActivityForm from './components/ActivityForm';
import LiveWorkoutMode from './components/LiveWorkoutMode';
import TimeSimulator from './components/TimeSimulator';
import HistoryList from './components/HistoryList';
import ProfileDropdown from './components/ProfileDropdown';
import ProfileHistoryChart from './components/ProfileHistoryChart';
import { Heart, Activity, Clock, ShieldAlert, ArrowUp } from 'lucide-react';

export default function App() {
  const [isLogFormOpen, setIsLogFormOpen] = useState<boolean>(false);
  const [isRetroMode, setIsRetroMode] = useState<boolean>(false);
  const [resumeLogState, setResumeLogState] = useState<{ log: ActivityLog, step: number } | null>(null);
  const [activeLiveWorkout, setActiveLiveWorkout] = useState<ActivityLog | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState<boolean>(false);
  const [showTimeSimulator, setShowTimeSimulator] = useState<boolean>(false);
  const [showUpdateHistory, setShowUpdateHistory] = useState<boolean>(false);
  
  const [hasSeenReminder, setHasSeenReminder] = useState<boolean>(() => {
    return sessionStorage.getItem('aurarecov_reminder_seen') === 'true';
  });

  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const {
    profile,
    logs,
    domsRecords,
    offsetHours,
    isLoading,
    muscleStates,
    cortisolState,
    exerciseGroups,
    saveExerciseGroups,
    handleOnboardingComplete,
    handleUpdateProfile,
    handleLogSubmit,
    handleDeleteLog,
    handleAdvanceTime,
    handleSimulateSleep,
    handleResetTime,
    handleResetProfile,
  } = useRecoveryState();

  const onLogSubmit = (logData: Omit<ActivityLog, 'id' | 'timestamp'> & { id?: string }) => {
    handleLogSubmit(logData);
    setIsLogFormOpen(false);
    setResumeLogState(null);
  };

  const handleResumeLog = (log: ActivityLog, step: number) => {
    setResumeLogState({ log, step });
    setIsLogFormOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Heart className="text-rose-500 animate-pulse" size={48} />
        <span className="text-sm font-bold uppercase tracking-wider text-slate-400">Loading AuraRecov...</span>
      </div>
    );
  }

  // CortisolState might be null initially before profile is created
  if (!profile || !cortisolState) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  if (isUpdatingProfile) {
    return (
      <OnboardingWizard
        onComplete={(p) => {
          handleUpdateProfile(p);
          setIsUpdatingProfile(false);
        }}
        initialProfile={profile}
        onCancel={() => setIsUpdatingProfile(false)}
      />
    );
  }

  // Reminder Logic
  const currentTime = Date.now() + offsetHours * 60 * 60 * 1000;
  const lastUpdate = profile.lastProfileUpdateDate || currentTime;
  const cycleDays = profile.updateCycleDays || 30;
  const nextUpdateDate = lastUpdate + cycleDays * 24 * 60 * 60 * 1000;
  const remainingDays = Math.ceil((nextUpdateDate - currentTime) / (1000 * 60 * 60 * 24));
  const isUrgentUpdate = remainingDays <= 3 && remainingDays >= 0;
  const isOverdue = remainingDays < 0;
  const showReminderPopup = (isUrgentUpdate || isOverdue) && !hasSeenReminder;

  const handleDismissReminder = () => {
    sessionStorage.setItem('aurarecov_reminder_seen', 'true');
    setHasSeenReminder(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      
      {/* Smart Reminder Popup */}
      {showReminderPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900/50 border border-rose-500/30 rounded-2xl p-6 max-w-md w-full shadow-[0_0_40px_rgba(225,29,72,0.15)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-rose-500/20 p-2.5 rounded-xl border border-rose-500/30">
                <ShieldAlert className="text-rose-400" size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">Đến hạn Cập nhật Hồ sơ!</h3>
            </div>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              {isOverdue 
                ? `Đã quá hạn ${Math.abs(remainingDays)} ngày.`
                : `Còn ${remainingDays} ngày cập nhật.`}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  handleDismissReminder();
                  setIsUpdatingProfile(true);
                }}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors shadow-[0_0_15px_rgba(225,29,72,0.4)]"
              >
                Cập nhật Ngay
              </button>
              <button
                onClick={handleDismissReminder}
                className="w-full py-3 bg-slate-900/50 hover:bg-slate-700 text-slate-400 font-bold rounded-xl transition-colors"
              >
                Để sau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navbar Header */}
      <header className="sticky top-0 bg-[#07090e]/85 backdrop-blur-md border-b border-white/5 py-4 px-6 z-40">
        <div className="max-w-[1600px] w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600/10 p-2 rounded-lg border border-indigo-500/25">
              <Activity className="text-indigo-400" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                AuraRecov <span className="text-xs text-teal-400 font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20">PRO</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">Muscle Recovery & Cortisol stress analyzer</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
            <button
              onClick={() => setShowTimeSimulator(!showTimeSimulator)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${showTimeSimulator ? 'bg-teal-500/20 border-teal-500/50 text-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.2)]' : 'bg-slate-900/50 border-white/5 text-slate-400 hover:text-white hover:bg-slate-800/80'}`}
            >
              <Clock size={14} />
              <span className="hidden sm:inline">{showTimeSimulator ? 'Đóng Giả lập' : 'Giả lập thời gian'}</span>
            </button>
            
            {/* Profile Dropdown Component */}
            <ProfileDropdown 
              profile={profile} 
              offsetHours={offsetHours}
              onUpdateClick={() => setIsUpdatingProfile(true)}
              onHistoryClick={() => setShowUpdateHistory(!showUpdateHistory)}
              onResetClick={handleResetProfile}
            />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1600px] w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* Time Simulator Header Panel */}
        {showTimeSimulator && (
          <div className="animate-fade-in origin-top">
            <TimeSimulator
              offsetHours={offsetHours}
              onAdvanceTime={handleAdvanceTime}
              onSimulateSleep={handleSimulateSleep}
              onReset={handleResetTime}
            />
          </div>
        )}

        {/* Dashboard Center */}
        <Dashboard
          profile={profile}
          muscleStates={muscleStates}
          cortisolState={cortisolState}
          onOpenLogForm={() => {
            setResumeLogState(null);
            setIsRetroMode(false);
            setIsLogFormOpen(true);
          }}
          onOpenRetroLogForm={() => {
            setResumeLogState(null);
            setIsRetroMode(true);
            setIsLogFormOpen(true);
          }}
          domsRecords={domsRecords}
          logs={logs}
          offsetHours={offsetHours}
          onResumeLog={handleResumeLog}
          onStartLiveWorkout={setActiveLiveWorkout}
        />

        {/* Profile Update History (Lazy Rendered below Dashboard) */}
        {showUpdateHistory && (
          <div className="glass-card animate-fade-in mt-6">
            <ProfileHistoryChart profile={profile} />
          </div>
        )}

        <HistoryList
          logs={logs}
          onDeleteLog={handleDeleteLog}
          onResumeLog={handleResumeLog}
        />
      </main>

      {/* Back to Top FAB */}
      {showBackToTop && !isLogFormOpen && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="!fixed bottom-6 right-6 z-40 flex items-center justify-center p-3.5 rounded-full bg-indigo-900/40 hover:bg-indigo-600 text-indigo-300 hover:text-white shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.7)] border border-indigo-500/30 hover:border-indigo-400 hover:-translate-y-1 transition-all duration-300 group backdrop-blur-sm"
          title="Quay lại đầu trang"
        >
          <ArrowUp size={24} strokeWidth={2.5} className="group-hover:-translate-y-1 transition-transform duration-300" />
        </button>
      )}

      {isLogFormOpen && (
        <ActivityForm
          _profile={profile}
          logs={logs}
          simulatedTime={Date.now() + offsetHours * 60 * 60 * 1000}
          initialTimeMode={isRetroMode ? 'yesterday' : 'now'}
          exerciseGroups={exerciseGroups}
          saveExerciseGroups={saveExerciseGroups}
          muscleStates={muscleStates}
          onSubmit={onLogSubmit}
          onClose={() => {
            setIsLogFormOpen(false);
            setIsRetroMode(false);
            setResumeLogState(null);
          }}
          initialLog={resumeLogState?.log}
          initialStep={resumeLogState?.step}
        />
      )}

      {/* Live Workout Mode overlay */}
      {activeLiveWorkout && (
        <LiveWorkoutMode 
          plannedWorkout={activeLiveWorkout}
          onComplete={(completedLog) => {
            handleLogSubmit(completedLog);
            setActiveLiveWorkout(null);
          }}
          onCancel={() => setActiveLiveWorkout(null)}
        />
      )}
    </div>
  );
}
