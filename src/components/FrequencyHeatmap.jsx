import { useState } from 'react';

export default function FrequencyHeatmap({ frequency, lastSeen }) {
  const [showLastSeen, setShowLastSeen] = useState(false);

  // Build frequency data for 1-49
  const maxFreq = Math.max(...Object.values(frequency || {}), 1);
  const maxGap = Math.max(...Object.values(lastSeen || {}), 1);

  function getOpacity(val, max) {
    if (val === 0) return 'bg-slate-700';
    const ratio = val / max;
    if (ratio < 0.2) return 'bg-green-900';
    if (ratio < 0.4) return 'bg-green-700';
    if (ratio < 0.6) return 'bg-green-500';
    if (ratio < 0.8) return 'bg-green-400';
    return 'bg-green-300';
  }

  function getGapColor(gap, max) {
    if (gap === 0) return 'bg-red-500';
    if (gap < max * 0.3) return 'bg-yellow-500';
    if (gap < max * 0.6) return 'bg-yellow-400';
    if (gap < max * 0.8) return 'bg-green-500';
    return 'bg-green-300';
  }

  const data = showLastSeen ? lastSeen : frequency;
  const getter = showLastSeen ? getGapColor : (v => getOpacity(v, maxFreq));

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-200">📊 號碼頻率 / 遺漏分析</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowLastSeen(false)}
            className={`text-xs px-2 py-1 rounded ${!showLastSeen ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          >
            出現次數
          </button>
          <button
            onClick={() => setShowLastSeen(true)}
            className={`text-xs px-2 py-1 rounded ${showLastSeen ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          >
            遺漏期數
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 49 }, (_, i) => i + 1).map(num => {
          const val = data?.[num] ?? 0;
          return (
            <div
              key={num}
              className={`relative flex items-center justify-center rounded text-xs font-bold text-white w-8 h-8 ${getter(val)}`}
              title={`#${num}: ${showLastSeen ? `遺漏 ${val} 期` : `出現 ${val} 次`}`}
            >
              {num}
              {val > 0 && !showLastSeen && (
                <span className="absolute -bottom-1 -right-1 text-[8px] text-green-300">{val}</span>
              )}
              {showLastSeen && (
                <span className="absolute -bottom-1 -right-1 text-[8px] text-white">{val}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
        {showLastSeen ? (
          <>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block"></span> 最近開出</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-500 inline-block"></span> 遺漏少</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-300 inline-block"></span> 遺漏多</span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-900 inline-block"></span> 少</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block"></span> 中</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-300 inline-block"></span> 多</span>
          </>
        )}
      </div>
    </div>
  );
}
