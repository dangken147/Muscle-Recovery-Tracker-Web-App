import { forwardRef } from 'react';
import type { ActivityLog, GymExercise } from '../types/recovery.types';
import gymExercisesData from '../data/home_workouts.json';

const GYM_EXERCISES = gymExercisesData as GymExercise[];

interface Props {
  plannedWorkout: ActivityLog;
  profileName: string;
}

export const WorkoutExportTemplate = forwardRef<HTMLDivElement, Props>(
  ({ plannedWorkout, profileName }, ref) => {

    const detailedExercises = plannedWorkout.detailedExercises?.length ? plannedWorkout.detailedExercises :
      (plannedWorkout.gymExercises || []).map(exId => {
        const gymEx = GYM_EXERCISES.find(e => e.id === exId);
        return {
          exerciseId: exId,
          name: gymEx?.name || 'Unknown Exercise',
          muscle_mapping: gymEx?.muscle_mapping || {},
          sets: [{ reps: 10, weight: 0 }, { reps: 10, weight: 0 }, { reps: 10, weight: 0 }],
          restTime: 60
        } as any;
      });

    if (!detailedExercises || detailedExercises.length === 0) {
      return (
        <div ref={ref} style={{ width: '800px', backgroundColor: '#020617', padding: '40px', color: '#fff', textAlign: 'center' }} className="absolute top-0 left-[-9999px]">
          <h1 style={{ fontSize: '32px' }}>Chưa có dữ liệu bài tập</h1>
          <p>Giáo án này trống. Hãy thêm bài tập vào trước khi xuất PDF.</p>
        </div>
      );
    }
    const dateStr = new Date(plannedWorkout.timestamp).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

      // Calculate estimated time for PDF
      const estimatedWorkoutTimeInSeconds = detailedExercises.reduce((total, exSession) => {
        const dbEx = GYM_EXERCISES.find(e => e.id === exSession.exerciseId);
        const isTimeBased = dbEx?.measureType === 'time';
        const restTime = exSession.restTime || 60;
        const exTime = exSession.sets.reduce((setTotal, set) => {
          const activeTime = isTimeBased ? (set.duration || 60) : (set.reps * 3);
          return setTotal + activeTime + restTime;
        }, 0);
        return total + exTime + 60;
      }, 0);
      const estimatedMinutes = Math.round(estimatedWorkoutTimeInSeconds / 60);

    return (
      // The wrapper must have a fixed width to ensure stable rendering for html2canvas
      // 800px width is good for A4 aspect ratio when scaled down
      <div
        ref={ref}
        style={{ width: '800px', backgroundColor: '#020617', color: '#e2e8f0', padding: '40px', fontFamily: 'sans-serif' }}
        className="absolute top-0 left-[-9999px]" // Render off-screen
      >
        {/* Header Section */}
        <div style={{ borderBottom: '2px solid #334155', paddingBottom: '20px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff', margin: '0 0 8px 0', textTransform: 'uppercase' }}>
                Giáo Án Tập Luyện
              </h1>
              <p style={{ fontSize: '18px', color: '#94a3b8', margin: 0 }}>
                {plannedWorkout.trainingStyle ? `Mục tiêu: ${plannedWorkout.trainingStyle.toUpperCase()}` : 'Buổi tập Gym'}
              </p>
              <div style={{ fontSize: '16px', color: '#0ea5e9', fontWeight: 'bold', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ⏱ Thời gian dự kiến: ~{estimatedMinutes} phút
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0ea5e9', marginBottom: '4px' }}>
                AuraRecov PRO
              </div>
              <div style={{ fontSize: '14px', color: '#64748b' }}>
                VĐV: {profileName}
              </div>
              <div style={{ fontSize: '14px', color: '#64748b' }}>
                {dateStr}
              </div>
            </div>
          </div>
        </div>

        {/* Exercises List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {detailedExercises.map((exSession, index) => {
            const dbEx = GYM_EXERCISES.find(e => e.id === exSession.exerciseId);
            const totalSets = exSession.sets.length;
            const targetReps = exSession.sets[0]?.reps || 0;
            const targetWeight = exSession.sets[0]?.weight || 0;

            return (
              <div key={exSession.exerciseId + index} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Header: Name and Rest Time */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#0ea5e9', color: '#fff', textAlign: 'center', lineHeight: '40px', fontWeight: 'bold', fontSize: '20px' }}>
                      {index + 1}
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#f8fafc', margin: 0, lineHeight: '40px' }}>
                      {exSession.name.split(' / ')[0]}
                    </h2>
                  </div>

                  {exSession.restTime && (
                    <div style={{ backgroundColor: '#1e293b', color: '#cbd5e1', padding: '8px 16px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold' }}>
                      ⏱ Nghỉ: {exSession.restTime}s
                    </div>
                  )}
                </div>

                {/* Exercise Image / Placeholder */}
                <div style={{ width: '100%', height: '320px', flexShrink: 0, backgroundColor: '#1e293b', borderRadius: '16px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #475569' }}>
                  {dbEx?.image_url ? (
                    <img src={dbEx.image_url} alt={exSession.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} crossOrigin="anonymous" />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ fontSize: '64px', marginBottom: '12px', lineHeight: '1' }}>📸</div>
                      <div style={{ fontSize: '18px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '2px' }}>Chưa có ảnh minh họa</div>
                    </div>
                  )}
                </div>

                {/* Sets Table */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                  {exSession.sets.map((set, sIdx) => (
                    <div key={sIdx} style={{ backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '12px', padding: '16px', minWidth: '140px', flex: '1' }}>
                      <div style={{ fontSize: '14px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 'bold' }}>
                        Hiệp {sIdx + 1}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '24px', fontWeight: '900', color: '#fff' }}>
                          {dbEx?.measureType === 'time' ? (set.duration || 0) : set.reps} <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 'normal' }}>{dbEx?.measureType === 'time' ? 'giây' : 'reps'}</span>
                        </span>
                        {set.weight > 0 ? (
                          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#38bdf8' }}>{set.weight} <span style={{ fontSize: '14px', color: '#0284c7' }}>kg</span></span>
                        ) : (dbEx?.equipment?.includes('bodyweight') || dbEx?.isBodyweight) ? (
                          <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981' }}>Bodyweight</span>
                        ) : (
                          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#64748b' }}>___ <span style={{ fontSize: '14px', color: '#475569' }}>kg</span></span>
                        )}
                      </div>
                      {(set.rir !== undefined || set.toFailure) && (
                        <div style={{ marginTop: '12px', fontSize: '14px', color: set.toFailure ? '#f43f5e' : '#a855f7', fontWeight: 'bold', borderTop: '1px dashed #334155', paddingTop: '12px' }}>
                          {set.toFailure ? '🔥 Failure' : `🎯 RIR: ${set.rir}`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #334155', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
          Tạo bởi AuraRecov PRO - Chúc bạn một buổi tập hiệu quả!
        </div>
      </div>
    );
  }
);

WorkoutExportTemplate.displayName = 'WorkoutExportTemplate';
