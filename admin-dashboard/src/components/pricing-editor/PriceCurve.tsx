import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { type EditablePeriod, toMinutes } from './timeMath';

const priceAt = (periods: EditablePeriod[], minute: number): number | null => {
  for (const p of periods) {
    const s = toMinutes(p.startTime);
    const eRaw = toMinutes(p.endTime);
    const e = eRaw === 0 ? 1440 : eRaw;
    const contains = e > s ? minute >= s && minute < e : minute >= s || minute < e;
    if (contains) return p.pricePerKwh;
  }
  return null;
};

export const PriceCurve = ({
  periods,
  currency,
  nowMinute,
}: {
  periods: EditablePeriod[];
  currency: string;
  nowMinute?: number;
}) => {
  const data = useMemo(() => {
    const rows: { hour: number; price: number | null; label: string }[] = [];
    for (let m = 0; m <= 1440; m += 15) {
      rows.push({
        hour: m / 60,
        price: priceAt(periods, m % 1440),
        label: `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`,
      });
    }
    return rows;
  }, [periods]);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(142 76% 48%)" stopOpacity={0.6} />
              <stop offset="100%" stopColor="hsl(142 76% 48%)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis
            dataKey="hour"
            type="number"
            domain={[0, 24]}
            ticks={[0, 3, 6, 9, 12, 15, 18, 21, 24]}
            tickFormatter={(h) => `${h}:00`}
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickFormatter={(v) => `${v}`}
          />
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 8,
              fontSize: 12,
            }}
            labelFormatter={(h: number) => `${Math.floor(h).toString().padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`}
            formatter={(v: number) => [`${v?.toFixed(4)} ${currency}`, 'Price/kWh']}
          />
          <Area type="stepAfter" dataKey="price" stroke="hsl(142 76% 48%)" fill="url(#priceGrad)" strokeWidth={2} />
          {nowMinute != null && (
            <ReferenceLine
              x={nowMinute / 60}
              stroke="hsl(var(--destructive))"
              strokeDasharray="3 3"
              label={{ value: 'now', position: 'top', fill: 'hsl(var(--destructive))', fontSize: 10 }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
