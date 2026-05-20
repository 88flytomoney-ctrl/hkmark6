function getBallColor(num) {
  if (num <= 9) return 'bg-blue-500';
  if (num <= 19) return 'bg-purple-500';
  if (num <= 29) return 'bg-pink-500';
  if (num <= 39) return 'bg-orange-500';
  return 'bg-emerald-500';
}

function Ball({ num, isBonus = false }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold text-white ${isBonus ? 'bg-yellow-400 text-black text-xs w-7 h-7' : getBallColor(num) + ' w-9 h-9 text-sm'}`}
    >
      {num}
    </span>
  );
}

export default function AIPicks({ picks, archivedPicks = [] }) {
  const { setA, setB, generatedAt } = picks || {};

  return (
    <div className="space-y-4">
      {/* Set A */}
      <div className="card border-2 border-blue-500/50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-blue-400">🤖 AI 精選 A 組</h2>
          <span className="text-xs text-slate-400">Set A</span>
        </div>
        <div className="flex gap-3 flex-wrap">
          {(setA || []).map((n, i) => (
            <Ball key={i} num={n} />
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-2">預測生成 {generatedAt ? new Date(generatedAt).toLocaleString('zh-HK') : '—'}</p>
      </div>

      {/* Set B */}
      <div className="card border-2 border-purple-500/50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-purple-400">🤖 AI 精選 B 組</h2>
          <span className="text-xs text-slate-400">Set B</span>
        </div>
        <div className="flex gap-3 flex-wrap">
          {(setB || []).map((n, i) => (
            <Ball key={i} num={n} />
          ))}
        </div>
      </div>

      {/* Archive Review */}
      {archivedPicks.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">📜 歷史預測回顧</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {archivedPicks.map((entry, idx) => (
              <div key={idx} className="border border-slate-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">
                    預測 {entry.pickDate ? new Date(entry.pickDate).toLocaleDateString('zh-HK') : `Draw #${entry.drawNumber}`}
                  </span>
                  <span className="text-xs text-slate-400">
                    開獎 {entry.drawDate ? new Date(entry.drawDate).toLocaleDateString('zh-HK') : '—'}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-400 w-6">A組</span>
                    <div className="flex gap-1">
                      {entry.setA.map((n, i) => (
                        <span key={i}>
                          <span className={`inline-flex items-center justify-center rounded-full text-white text-xs w-6 h-6 ${getBallColor(n)} ${entry.actualNumbers?.includes(n) ? 'ring-2 ring-green-400' : 'opacity-40'}`}>
                            {n}
                          </span>
                        </span>
                      ))}
                      <span className="text-xs text-slate-500 ml-2">
                        {entry.matchA || 0} 匹配
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-purple-400 w-6">B組</span>
                    <div className="flex gap-1">
                      {entry.setB.map((n, i) => (
                        <span key={i}>
                          <span className={`inline-flex items-center justify-center rounded-full text-white text-xs w-6 h-6 ${getBallColor(n)} ${entry.actualNumbers?.includes(n) ? 'ring-2 ring-green-400' : 'opacity-40'}`}>
                            {n}
                          </span>
                        </span>
                      ))}
                      <span className="text-xs text-slate-500 ml-2">
                        {entry.matchB || 0} 匹配
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
