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

export default function LotteryCard({ draw }) {
  const { drawNumber, drawDate, numbers, bonus, jackpot } = draw;
  const mainNumbers = numbers || [];

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs text-slate-400">攪珠 # {drawNumber}</div>
          <div className="text-sm text-slate-300 mt-0.5">{drawDate}</div>
        </div>
        {jackpot && (
          <div className="badge badge-up text-xs">
            {jackpot}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {mainNumbers.map((n, i) => (
          <Ball key={i} num={n} />
        ))}
        <span className="text-slate-500 mx-1">+</span>
        <Ball num={bonus} isBonus />
      </div>
    </div>
  );
}
