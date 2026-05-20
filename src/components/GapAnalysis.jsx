import { useState } from 'react';

export default function GapAnalysis({ lastSeen, frequency }) {
  const [sortBy, setSortBy] = useState('gap'); // 'gap' | 'number' | 'freq'

  const numbers = Array.from({ length: 49 }, (_, i) => i + 1).map(n => ({
    number: n,
    gap: lastSeen?.[n] ?? 0,
    freq: frequency?.[n] ?? 0,
  }));

  const sorted = [...numbers].sort((a, b) => {
    if (sortBy === 'gap') return b.gap - a.gap;
    if (sortBy === 'freq') return b.freq - a.freq;
    return a.number - b.number;
  });

  const overdue = sorted.filter(n => n.gap > 5).slice(0, 10);
  const hot = sorted.filter(n => n.freq > 0).sort((a, b) => b.freq - a.freq).slice(0, 10);

  return (
    <div className="card">
      <h3 className="font-semibold text-slate-200 mb-3">📉 遺漏分析表</h3>

      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setSortBy('gap')}
          className={`text-xs px-2 py-1 rounded ${sortBy === 'gap' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}
        >
          按遺漏
        </button>
        <button
          onClick={() => setSortBy('freq')}
          className={`text-xs px-2 py-1 rounded ${sortBy === 'freq' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}
        >
          按頻率
        </button>
        <button
          onClick={() => setSortBy('number')}
          className={`text-xs px-2 py-1 rounded ${sortBy === 'number' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}
        >
          按號碼
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-500 border-b border-slate-700">
              <th className="text-left py-1">號碼</th>
              <th className="text-right">遺漏期數</th>
              <th className="text-right">出現次數</th>
              <th className="text-left py-1 pl-3">走勢</th>
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, 25).map(({ number, gap, freq }) => (
              <tr key={number} className="border-b border-slate-800">
                <td className="py-1 font-bold text-white">{number}</td>
                <td className={`text-right font-medium ${gap === 0 ? 'text-green-400' : gap > 5 ? 'text-red-400' : 'text-slate-300'}`}>
                  {gap === 0 ? '今期' : `${gap}期`}
                </td>
                <td className="text-right text-slate-300">{freq}</td>
                <td className="pl-3">
                  <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${Math.min(100, (freq / Math.max(...Object.values(frequency || {1:1}), 1)) * 100)}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-red-400 font-semibold mb-1">🔴 逾期號碼 (遺漏 &gt;5期)</p>
          <div className="flex gap-1 flex-wrap">
            {overdue.map(n => (
              <span key={n.number} className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-900/50 border border-red-500 text-white text-xs font-bold">
                {n.number}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-green-400 font-semibold mb-1">🟢 熱門號碼 (出現最多)</p>
          <div className="flex gap-1 flex-wrap">
            {hot.map(n => (
              <span key={n.number} className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-900/50 border border-green-500 text-white text-xs font-bold">
                {n.number}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
