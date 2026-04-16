import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { PricingPeriod } from '@/types/api';

const toMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const priceAt = (periods: PricingPeriod[], minute: number): number | null => {
  for (const p of periods) {
    const s = toMinutes(p.startTime);
    const eRaw = toMinutes(p.endTime);
    const e = eRaw === 0 ? 1440 : eRaw;
    const contains = e > s ? minute >= s && minute < e : minute >= s || minute < e;
    if (contains) return p.pricePerKwh;
  }
  return null;
};

export const DayCurve = ({
  periods,
  currency,
  nowMinute,
}: {
  periods: PricingPeriod[];
  currency: string;
  nowMinute?: number;
}) => {
  const data = useMemo(() => {
    const rows: { hour: number; price: number | null }[] = [];
    for (let m = 0; m <= 1440; m += 15) {
      rows.push({ hour: m / 60, price: priceAt(periods, m % 1440) });
    }
    return rows;
  }, [periods]);

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="cust-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(142 76% 48%)" stopOpacity={0.7} />
              <stop offset="100%" stopColor="hsl(142 76% 48%)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis
            dataKey="hour"
            type="number"
            domain={[0, 24]}
            ticks={[0, 6, 12, 18, 24]}
            tickFormatter={(h) => `${h}:00`}
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
          />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
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
          <Area type="stepAfter" dataKey="price" stroke="hsl(142 76% 48%)" fill="url(#cust-gradient)" strokeWidth={2} />
          {nowMinute != null && (
            <ReferenceLine
              x={nowMinute / 60}
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              label={{ value: 'now', position: 'top', fill: 'hsl(var(--primary))', fontSize: 11 }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
