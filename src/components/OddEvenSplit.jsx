import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function OddEvenSplit({ draws }) {
  const counts = { odd: 0, even: 0 };

  (draws || []).forEach(d => {
    (d.numbers || []).forEach(n => {
      if (n % 2 === 0) counts.even++;
      else counts.odd++;
    });
  });

  const total = counts.odd + counts.even;
  const data = [
    { name: '單數 Odd', value: counts.odd, pct: total > 0 ? (counts.odd / total * 100).toFixed(1) : 0 },
    { name: '雙數 Even', value: counts.even, pct: total > 0 ? (counts.even / total * 100).toFixed(1) : 0 },
  ];

  return (
    <div className="card">
      <h3 className="font-semibold text-slate-200 mb-3">🥊 單雙分佈</h3>
      <div className="flex items-center gap-6">
        <div className="w-40 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                dataKey="value"
                stroke="#1e293b"
              >
                <Cell fill="#22c55e" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: 12 }}
                formatter={(v, n) => [`${v} (${data.find(d => d.name === n)?.pct}%)`, n]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-slate-300 text-sm">單數 Odd</span>
            <span className="text-green-400 font-bold ml-2">{counts.odd}</span>
            <span className="text-slate-500 text-xs">{data[0].pct}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-slate-300 text-sm">雙數 Even</span>
            <span className="text-red-400 font-bold ml-2">{counts.even}</span>
            <span className="text-slate-500 text-xs">{data[1].pct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
