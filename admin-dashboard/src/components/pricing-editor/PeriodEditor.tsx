import { Trash2, Plus, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  type EditablePeriod,
  makeNewPeriod,
  sortByStart,
  validatePeriods,
} from './timeMath';
import { TimelineBar, totalCoverage } from './TimelineBar';
import { PriceCurve } from './PriceCurve';

export const PeriodEditor = ({
  periods,
  currency,
  onChange,
  selectedId,
  onSelectedIdChange,
  nowMinute,
}: {
  periods: EditablePeriod[];
  currency: string;
  onChange: (next: EditablePeriod[]) => void;
  selectedId?: string;
  onSelectedIdChange?: (id: string | undefined) => void;
  nowMinute?: number;
}) => {
  const validation = validatePeriods(periods);
  const coverage = totalCoverage(periods);

  const updatePeriod = (id: string, patch: Partial<EditablePeriod>) => {
    onChange(periods.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const removePeriod = (id: string) => {
    onChange(periods.filter((p) => p.id !== id));
    if (selectedId === id) onSelectedIdChange?.(undefined);
  };

  const addPeriod = () => {
    const next = makeNewPeriod(periods);
    onChange([...periods, next]);
    onSelectedIdChange?.(next.id);
  };

  const sorted = sortByStart(periods);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Daily timeline
          </Label>
          <div className="flex items-center gap-2 text-xs">
            {validation.ok ? (
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Covers 24h
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" /> {coverage}/1440 min
              </span>
            )}
          </div>
        </div>
        <TimelineBar
          periods={sorted}
          currency={currency}
          selectedId={selectedId}
          onSelect={onSelectedIdChange}
        />
      </div>

      <div>
        <Label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">
          Price curve
        </Label>
        <div className="rounded-xl border border-border/60 bg-card/40 p-2">
          <PriceCurve periods={sorted} currency={currency} nowMinute={nowMinute} />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Periods ({periods.length})
          </Label>
          <Button size="sm" variant="outline" onClick={addPeriod}>
            <Plus className="h-4 w-4" /> Add period
          </Button>
        </div>

        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {sorted.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
              >
                <div
                  className={`grid grid-cols-12 items-end gap-3 rounded-lg border p-3 ${
                    selectedId === p.id
                      ? 'border-primary/60 bg-primary/5'
                      : 'border-border/60 bg-card/40'
                  }`}
                  onClick={() => onSelectedIdChange?.(p.id)}
                >
                  <div className="col-span-3">
                    <Label className="text-xs text-muted-foreground">Start</Label>
                    <Input
                      type="time"
                      value={p.startTime}
                      onChange={(e) => updatePeriod(p.id, { startTime: e.target.value })}
                    />
                  </div>
                  <div className="col-span-3">
                    <Label className="text-xs text-muted-foreground">End</Label>
                    <Input
                      type="time"
                      value={p.endTime}
                      onChange={(e) => updatePeriod(p.id, { endTime: e.target.value })}
                    />
                  </div>
                  <div className="col-span-5">
                    <Label className="text-xs text-muted-foreground">Price / kWh ({currency})</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      min="0"
                      value={p.pricePerKwh}
                      onChange={(e) =>
                        updatePeriod(p.id, { pricePerKwh: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        removePeriod(p.id);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {validation.errors.length > 0 && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-300">
          <div className="mb-1 font-semibold">Fix before saving:</div>
          <ul className="list-inside list-disc space-y-0.5">
            {validation.errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
