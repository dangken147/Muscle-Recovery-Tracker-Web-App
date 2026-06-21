const fs = require('fs');
const filePath = './src/components/ActivityForm.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const newSteps = `
  // --- FOOTBALL WIZARD STEPS ---

  const renderStep1_1 = () => (
    <div className="animate-slide-in max-w-lg mx-auto w-full mt-4 sm:mt-8">
      <div className="text-center space-y-2 mb-8 sm:mb-10">
        <h3 className="text-3xl sm:text-4xl font-black text-white">Sân bãi</h3>
        <p className="text-sm sm:text-base text-slate-400 font-medium">Hôm nay sếp đá sân mấy người?</p>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {[
          { id: '5v5', label: 'Sân 5' },
          { id: '7v7', label: 'Sân 7' },
          { id: '11v11', label: 'Sân 11' }
        ].map(opt => (
          <button
            key={opt.id}
            type="button"
            onClick={() => { setFootballPitchSize(opt.id as any); handleNext(); }}
            className={\`p-6 rounded-2xl border-2 transition-all flex items-center justify-between \${footballPitchSize === opt.id ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-slate-800/40 border-slate-700 hover:border-slate-500 text-slate-300'}\`}
          >
            <span className="text-xl font-bold">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep1_2 = () => (
    <div className="animate-slide-in max-w-lg mx-auto w-full mt-4 sm:mt-8">
      <div className="text-center space-y-2 mb-8 sm:mb-10">
        <h3 className="text-3xl sm:text-4xl font-black text-white">Tính chất</h3>
        <p className="text-sm sm:text-base text-slate-400 font-medium">Trận này đá chill hay đá căng?</p>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {[
          { id: 'training', label: 'Tập luyện (Dưỡng sinh)' },
          { id: 'friendly', label: 'Đá Giao Hữu (Phủi chill)' },
          { id: 'tournament', label: 'Đá Giải (Căng thẳng)' }
        ].map(opt => (
          <button
            key={opt.id}
            type="button"
            onClick={() => { setFootballMatchType(opt.id as any); handleNext(); }}
            className={\`p-6 rounded-2xl border-2 transition-all flex items-center justify-between \${footballMatchType === opt.id ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-slate-800/40 border-slate-700 hover:border-slate-500 text-slate-300'}\`}
          >
            <span className="text-xl font-bold">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep1_3 = () => (
    <div className="animate-slide-in max-w-lg mx-auto w-full mt-4 sm:mt-8 flex flex-col h-full">
      <div className="flex-1">
        <div className="text-center space-y-2 mb-8 sm:mb-10">
          <h3 className="text-3xl sm:text-4xl font-black text-white">Vị trí</h3>
          <p className="text-sm sm:text-base text-slate-400 font-medium">Sếp bao thầu vị trí nào trên sân?</p>
          <p className="text-xs text-amber-400 italic font-medium">*Có thể chọn nhiều vị trí nếu sếp đá bao sân</p>
        </div>
        <div className="flex justify-center">
          <MultiPillSelector
            value={footballPositions}
            onChange={(val: any) => setFootballPositions(val)}
            options={[
              { value: 'striker', label: 'Tiền đạo' },
              { value: 'midfielder', label: 'Tiền vệ' },
              { value: 'defender', label: 'Hậu vệ' },
              { value: 'goalkeeper', label: 'Thủ môn' }
            ]}
            theme={theme}
            maxSelections={4}
          />
        </div>
      </div>
      <div className="mt-12 flex justify-center">
        <button
          type="button"
          onClick={handleNext}
          disabled={footballPositions.length === 0}
          className="px-12 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xl rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all"
        >
          Tiếp tục
        </button>
      </div>
    </div>
  );

  const renderStep1_4 = () => (
    <div className="animate-slide-in max-w-lg mx-auto w-full mt-4 sm:mt-8 flex flex-col h-full">
      <div className="flex-1">
        <div className="text-center space-y-2 mb-8 sm:mb-10">
          <h3 className="text-3xl sm:text-4xl font-black text-white">Tỷ lệ thời gian</h3>
          <p className="text-sm sm:text-base text-slate-400 font-medium">Sếp chia thời gian đá thế nào?</p>
        </div>
        <PositionPercentageSliders
          value={footballPositions}
          onChange={(val: any) => setFootballPositions(val)}
          options={[
            { value: 'striker', label: 'Tiền đạo' },
            { value: 'midfielder', label: 'Tiền vệ' },
            { value: 'defender', label: 'Hậu vệ' },
            { value: 'goalkeeper', label: 'Thủ môn' }
          ]}
          theme={theme}
        />
      </div>
      <div className="mt-12 flex justify-center">
        <button
          type="button"
          onClick={handleNext}
          className="px-12 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xl rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all"
        >
          Tiếp tục
        </button>
      </div>
    </div>
  );

  const renderStep1_5 = () => (
    <div className="animate-slide-in max-w-lg mx-auto w-full mt-4 sm:mt-8 flex flex-col h-full">
      <div className="flex-1 space-y-8">
        <div className="text-center space-y-2 mb-8 sm:mb-10">
          <h3 className="text-3xl sm:text-4xl font-black text-white">Thời tiết & Đánh đầu</h3>
        </div>

        {/* Weather Block */}
        <div className="p-6 rounded-3xl bg-slate-800/40 border border-slate-700/50 space-y-4">
          <label className="text-base font-semibold text-slate-300 flex items-center justify-between">
            <span>🌤️ Thời Tiết Tại Sân</span>
            <button
              type="button"
              onClick={handleFetchWeather}
              disabled={isFetchingWeather}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors"
            >
              {isFetchingWeather ? 'Đang lấy...' : 'Lấy tự động'}
            </button>
          </label>
          
          {weatherError && <div className="text-rose-400 text-sm">{weatherError}</div>}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-2 block">Nhiệt độ (°C)</label>
              <input
                type="number"
                value={weather?.temp || ''}
                onChange={(e) => setWeather(prev => ({ ...(prev || { humidity: 50, condition: 'Clear', source: 'manual' }), temp: Number(e.target.value), source: 'manual' }))}
                className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl px-4 py-3 text-lg font-semibold text-white outline-none focus:border-indigo-500"
                placeholder="VD: 32"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-2 block">Độ ẩm (%)</label>
              <input
                type="number"
                value={weather?.humidity || ''}
                onChange={(e) => setWeather(prev => ({ ...(prev || { temp: 30, condition: 'Clear', source: 'manual' }), humidity: Number(e.target.value), source: 'manual' }))}
                className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl px-4 py-3 text-lg font-semibold text-white outline-none focus:border-indigo-500"
                placeholder="VD: 80"
              />
            </div>
          </div>
          
          {weather?.apparentTemp !== undefined && weather.source === 'auto' && (
            <div className="text-sm text-emerald-400 font-medium">
              Cảm nhận nhiệt: <span className="font-bold">{weather.apparentTemp}°C</span> ({weather.condition})
            </div>
          )}
        </div>

        {/* Heading Block */}
        {footballPositions.some(p => p.position === 'striker' || p.position === 'defender') && (
          <div className="p-6 rounded-3xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between cursor-pointer" onClick={() => setFootballIncludesHeading(!footballIncludesHeading)}>
            <div className="flex flex-col">
              <span className="text-base font-bold text-white">Có đánh đầu không?</span>
              <span className="text-sm text-slate-400">Tăng độ mỏi cổ/vai gáy</span>
            </div>
            <button
              type="button"
              className={\`w-14 h-8 rounded-full transition-colors relative flex items-center \${footballIncludesHeading ? 'bg-emerald-500' : 'bg-slate-700'}\`}
            >
              <span className={\`absolute w-6 h-6 bg-white rounded-full transition-transform transform \${footballIncludesHeading ? 'translate-x-7' : 'translate-x-1'}\`} />
            </button>
          </div>
        )}
      </div>

      <div className="mt-12 flex justify-center">
        <button
          type="button"
          onClick={handleNext}
          className="px-12 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xl rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all"
        >
          Tiếp tục
        </button>
      </div>
    </div>
  );

  // --- END FOOTBALL WIZARD STEPS ---

  // Content for Step 1
`;

content = content.replace('  // Content for Step 1', newSteps);
fs.writeFileSync(filePath, content, 'utf8');
