import { type EditablePeriod, periodDurationMinutes, toMinutes } from './timeMath';
import { cn } from '@/lib/utils';

const priceTierColor = (price: number, minPrice: number, maxPrice: number) => {
  if (maxPrice === minPrice) return 'hsl(142 76% 48%)';
  const t = (price - minPrice) / (maxPrice - minPrice);
  const hue = 142 - t * 142;
  const sat = 60 + t * 20;
  const light = 48 - t * 8;
  return `hsl(${hue} ${sat}% ${light}%)`;
};

export const TimelineBar = ({
  periods,
  currency,
  selectedId,
  onSelect,
}: {
  periods: EditablePeriod[];
  currency: string;
  selectedId?: string;
  onSelect?: (id: string) => void;
}) => {
  if (!periods.length) {
    return (
      <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-border/60 text-sm text-muted-foreground">
        No periods yet
      </div>
    );
  }

  const prices = periods.map((p) => p.pricePerKwh);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);

  const segments = periods.flatMap((p) => {
    const s = toMinutes(p.startTime);
    const eRaw = toMinutes(p.endTime);
    const e = eRaw === 0 ? 1440 : eRaw;
    const wraps = e < s;
    if (wraps) {
      return [
        { id: p.id, start: s, end: 1440, price: p.pricePerKwh, label: `${p.startTime}-24:00` },
        { id: p.id, start: 0, end: e, price: p.pricePerKwh, label: `00:00-${p.endTime}` },
      ];
    }
    return [{ id: p.id, start: s, end: e, price: p.pricePerKwh, label: `${p.startTime}-${p.endTime}` }];
  });

  return (
    <div className="space-y-3">
      <div className="relative h-16 overflow-hidden rounded-xl border border-border/60 bg-card/40">
        {segments.map((seg, i) => {
          const widthPct = ((seg.end - seg.start) / 1440) * 100;
          const leftPct = (seg.start / 1440) * 100;
          const selected = seg.id === selectedId;
          return (
            <button
              key={`${seg.id}-${i}`}
              onClick={() => onSelect?.(seg.id)}
              className={cn(
                'absolute inset-y-0 flex items-center justify-center border-r border-background/40 text-[10px] font-medium transition-all hover:brightness-110',
                selected && 'ring-2 ring-ring ring-offset-1 ring-offset-background z-10',
              )}
              style={{
                left: `${leftPct}%`,
                width: `${widthPct}%`,
                background: priceTierColor(seg.price, minP, maxP),
              }}
              title={`${seg.label} · ${seg.price.toFixed(4)} ${currency}`}
            >
              {widthPct > 4 && (
                <span className="text-white/95 drop-shadow-sm">
                  {seg.price.toFixed(2)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="relative flex justify-between px-0.5 text-[10px] text-muted-foreground">
        {[0, 6, 12, 18, 24].map((h) => (
          <span key={h}>{h}:00</span>
        ))}
      </div>
    </div>
  );
};

export const totalCoverage = (periods: EditablePeriod[]) =>
  periods.reduce((sum, p) => sum + periodDurationMinutes(p.startTime, p.endTime), 0);
