import { RotateCcw, Moon, Calendar, HelpCircle, X } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';

interface TimeSimulatorProps {
  offsetHours: number;
  onAdvanceTime: (hours: number) => void;
  onSimulateSleep: () => void;
  onReset: () => void;
}

export default function TimeSimulator({
  offsetHours,
  onAdvanceTime,
  onSimulateSleep,
  onReset,
}: TimeSimulatorProps) {
  // Get formatted date strings for real vs simulated time
  const getFormattedTime = (offsetMs: number) => {
    const d = new Date(Date.now() + offsetMs);
    return {
      time: d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      date: d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }),
    };
  };

  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);

  const offsetMs = offsetHours * 60 * 60 * 1000;
  const simTime = getFormattedTime(offsetMs);

  return (
    <div className="glass-card flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden" style={{ borderLeft: '4px solid var(--secondary)' }}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none"></div>

      {/* Clock displays */}
      <div className="flex flex-col gap-1 w-full md:w-auto text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar size={14} className="text-teal-400" /> Giả lập thời gian phục hồi cơ bắp
          </div>
          <button 
            onClick={() => setShowInfoModal(true)}
            className="text-slate-400 hover:text-teal-400 transition-colors"
            title="Hướng dẫn sử dụng"
          >
            <HelpCircle size={14} />
          </button>
        </div>
        <div className="text-2xl font-black text-white tracking-tight mt-1">
          {simTime.time}
        </div>
        <div className="text-xs text-slate-400 font-medium">
          {simTime.date}
        </div>
        {offsetHours > 0 && (
          <div className="text-[10px] text-teal-400 font-semibold mt-1">
            Đã giả lập đi trước thời gian thực: +{offsetHours} giờ
          </div>
        )}
      </div>

      {/* Fast forward controls */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 w-full md:w-auto">
        <button
          type="button"
          onClick={() => onAdvanceTime(1)}
          className="toggle-btn text-xs py-2 px-3"
        >
          +1h
        </button>
        <button
          type="button"
          onClick={() => onAdvanceTime(6)}
          className="toggle-btn text-xs py-2 px-3"
        >
          +6h
        </button>
        <button
          type="button"
          onClick={() => onAdvanceTime(12)}
          className="toggle-btn text-xs py-2 px-3"
        >
          +12h
        </button>
        <button
          type="button"
          onClick={() => onAdvanceTime(24)}
          className="toggle-btn text-xs py-2 px-3"
        >
          +1 Ngày
        </button>
        <button
          type="button"
          onClick={() => onAdvanceTime(72)}
          className="toggle-btn text-xs py-2 px-3"
        >
          +3 Ngày
        </button>

        {/* Specialized sleep simulator */}
        <button
          type="button"
          onClick={onSimulateSleep}
          className="toggle-btn text-xs py-2 px-3 active good flex items-center gap-1 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
        >
          <Moon size={14} /> Giấc ngủ ngon (+8h)
        </button>

        {/* Reset */}
        {offsetHours > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="toggle-btn text-xs py-2 px-3 border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
            title="Trở lại thời gian thực"
          >
            <RotateCcw size={14} /> Reset
          </button>
        )}
      </div>

      {/* Info Modal */}
      {showInfoModal && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in" style={{ position: 'fixed' }}>
          <div className="bg-slate-900/50 border border-teal-500/30 rounded-2xl p-6 max-w-md w-full shadow-[0_0_40px_rgba(20,184,166,0.15)] relative">
            <button 
              onClick={() => setShowInfoModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-teal-500/20 p-2.5 rounded-xl border border-teal-500/30">
                <Calendar className="text-teal-400" size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">Tại sao có giả lập thời gian?</h3>
            </div>
            <div className="text-sm text-slate-400 space-y-4 leading-relaxed">
              <p>
                Quá trình phục hồi cơ bắp và hệ thần kinh thực tế diễn ra qua nhiều ngày. <strong>Đồng hồ giả lập</strong> là công cụ đặc biệt giúp bạn "tua nhanh" thời gian để thấy thuật toán của AuraRecov hoạt động thế nào mà không cần chờ đợi.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-slate-400">
                <li><strong className="text-white">+1h đến +3 Ngày:</strong> Tua nhanh thời gian thực tế. Bạn sẽ thấy mức độ mỏi cơ giảm dần theo từng giờ.</li>
                <li><strong className="text-white">Giấc ngủ ngon (+8h):</strong> Mô phỏng một giấc ngủ tiêu chuẩn. Hệ thần kinh (Cortisol) sẽ giảm mạnh và cơ bắp phục hồi nhanh hơn gấp nhiều lần so với thức.</li>
                <li><strong className="text-white">Reset:</strong> Trả thời gian về thực tại lúc này.</li>
              </ul>
              <p className="text-xs text-teal-400/80 bg-teal-500/10 p-3 rounded-lg border border-teal-500/20">
                Lưu ý: Mọi lịch sử và biểu đồ đều được tính dựa trên thời gian giả lập này!
              </p>
            </div>
            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full mt-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors shadow-[0_0_15px_rgba(20,184,166,0.4)]"
            >
              Đã hiểu
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
