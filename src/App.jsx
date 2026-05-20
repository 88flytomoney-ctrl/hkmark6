import { useState, useEffect } from 'react';
import AIPicks from './components/AIPicks.jsx';
import LotteryCard from './components/LotteryCard.jsx';
import FrequencyHeatmap from './components/FrequencyHeatmap.jsx';
import OddEvenSplit from './components/OddEvenSplit.jsx';
import GapAnalysis from './components/GapAnalysis.jsx';

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/data/draws.json')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-slate-400">載入中...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-red-400">載入失敗: {error}</div>
    </div>
  );

  const { draws = [], stats = {}, aiPicks = {}, archive = [] } = data || {};

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-700 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">🇭🇰 香港馬會 Mark Six</h1>
            <p className="text-xs text-slate-400">AI 智能分析 | 數據來源: lottolyzer.com</p>
          </div>
          <div className="text-right text-xs text-slate-400">
            <div>最後更新</div>
            <div>{data?.generatedAt ? new Date(data.generatedAt).toLocaleString('zh-HK') : '—'}</div>
            <div className="text-slate-500 mt-1">{draws.length} 筆記錄</div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* AI Picks — TOP OF PAGE */}
        <section>
          <h2 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">🤖 AI 精選預測</h2>
          <AIPicks picks={aiPicks} archivedPicks={archive} />
        </section>

        {/* Recent Draws */}
        <section>
          <h2 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">📋 近期攪珠結果</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {draws.slice(0, 12).map((d, i) => (
              <LotteryCard key={i} draw={d} />
            ))}
          </div>
        </section>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FrequencyHeatmap frequency={stats.frequency} lastSeen={stats.lastSeen} />
          <GapAnalysis lastSeen={stats.lastSeen} frequency={stats.frequency} />
        </div>

        {/* Odd/Even */}
        <section>
          <OddEvenSplit draws={draws} />
        </section>
      </main>

      <footer className="border-t border-slate-700 mt-8 py-4 px-4">
        <div className="max-w-6xl mx-auto text-center text-xs text-slate-500">
          數據僅供參考 · 請勿沉迷博彩 · 理性投注 | 資料來源 lottolyzer.com
        </div>
      </footer>
    </div>
  );
}
