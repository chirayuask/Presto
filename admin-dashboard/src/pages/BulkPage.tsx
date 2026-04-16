import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DateTime } from 'luxon';
import { toast } from 'sonner';
import { ArrowRight, Check, CheckCircle2, ChevronLeft, XCircle, Zap } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PeriodEditor } from '@/components/pricing-editor/PeriodEditor';
import { toEditable, validatePeriods, type EditablePeriod } from '@/components/pricing-editor/timeMath';
import { useStations } from '@/hooks/useStations';
import { useChargers } from '@/hooks/useChargers';
import { useBulkByChargers } from '@/hooks/useBulk';
import type { BulkReport } from '@/types/api';
import { cn } from '@/lib/utils';

const DEFAULT_PERIODS: EditablePeriod[] = toEditable([
  { startTime: '00:00', endTime: '06:00', pricePerKwh: 0.15 },
  { startTime: '06:00', endTime: '22:00', pricePerKwh: 0.28 },
  { startTime: '22:00', endTime: '00:00', pricePerKwh: 0.15 },
]);

const STEPS = [
  { key: 'chargers', label: 'Select chargers' },
  { key: 'pricing', label: 'Design pricing' },
  { key: 'review', label: 'Review & apply' },
  { key: 'result', label: 'Result' },
] as const;

export const BulkPage = () => {
  const stations = useStations();
  const chargers = useChargers();
  const bulk = useBulkByChargers();

  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [stationFilter, setStationFilter] = useState<string>('all');
  const [periods, setPeriods] = useState<EditablePeriod[]>(DEFAULT_PERIODS);
  const [currency, setCurrency] = useState('USD');
  const [effectiveFrom, setEffectiveFrom] = useState(DateTime.now().toISODate() ?? '');
  const [scheduleName, setScheduleName] = useState('Bulk Schedule');
  const [result, setResult] = useState<BulkReport | null>(null);

  const visibleChargers = useMemo(() => {
    const list = chargers.data ?? [];
    return stationFilter === 'all' ? list : list.filter((c) => c.stationId === stationFilter);
  }, [chargers.data, stationFilter]);

  const toggleAllVisible = () => {
    const next = new Set(selected);
    const allSelected = visibleChargers.every((c) => next.has(c.id));
    if (allSelected) visibleChargers.forEach((c) => next.delete(c.id));
    else visibleChargers.forEach((c) => next.add(c.id));
    setSelected(next);
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const validation = validatePeriods(periods);
  const canAdvance =
    (step === 0 && selected.size > 0) ||
    (step === 1 && validation.ok) ||
    step === 2 ||
    step === 3;

  const apply = async () => {
    try {
      const res = await bulk.mutateAsync({
        chargerIds: Array.from(selected),
        schedule: {
          name: scheduleName || null,
          currency,
          effectiveFrom,
          periods: periods.map((p) => ({
            startTime: p.startTime,
            endTime: p.endTime,
            pricePerKwh: p.pricePerKwh,
          })),
        },
      });
      setResult(res.data);
      setStep(3);
      if (res.data.failedCount === 0) toast.success(`Applied to ${res.data.succeededCount} chargers`);
      else if (res.data.succeededCount === 0) toast.error('All updates failed');
      else toast.warning(`Partial success: ${res.data.succeededCount}/${res.data.total}`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const restart = () => {
    setStep(0);
    setResult(null);
    setSelected(new Set());
  };

  return (
    <>
      <PageHeader
        title="Bulk Operations"
        description="Apply one TOU schedule to many chargers in a single transactional run."
      />

      <div className="mb-6 flex items-center">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex flex-1 items-center last:flex-initial">
            <div
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                i <= step
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-card text-muted-foreground',
              )}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <div className={cn('ml-3 text-sm', i <= step ? 'text-foreground' : 'text-muted-foreground')}>
              {s.label}
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('mx-4 h-px flex-1', i < step ? 'bg-primary' : 'bg-border')} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="s0"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Select chargers</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{selected.size} selected</Badge>
                  <Select value={stationFilter} onValueChange={setStationFilter}>
                    <SelectTrigger className="w-52">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All stations</SelectItem>
                      {stations.data?.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={toggleAllVisible}>
                    Toggle all visible
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid max-h-[60vh] gap-2 overflow-auto scrollbar-thin pr-1 md:grid-cols-2 xl:grid-cols-3">
                  {visibleChargers.map((c) => {
                    const isSelected = selected.has(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggleOne(c.id)}
                        className={cn(
                          'group flex items-start gap-3 rounded-lg border p-3 text-left transition-all',
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-border/60 bg-card/40 hover:bg-card',
                        )}
                      >
                        <div
                          className={cn(
                            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
                            isSelected
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border',
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">
                            {c.label ?? c.serialNumber}
                          </div>
                          <div className="mt-0.5 truncate text-xs text-muted-foreground">
                            {c.station?.name} · {c.serialNumber}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="s1"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Design the pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>Schedule name</Label>
                    <Input
                      value={scheduleName}
                      onChange={(e) => setScheduleName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'JPY'].map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Effective from</Label>
                    <Input
                      type="date"
                      value={effectiveFrom}
                      onChange={(e) => setEffectiveFrom(e.target.value)}
                    />
                  </div>
                </div>
                <PeriodEditor periods={periods} currency={currency} onChange={setPeriods} />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="s2"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Applying <strong>{scheduleName}</strong> to{' '}
                  <Badge variant="secondary">{selected.size} chargers</Badge>
                </div>
                <div>
                  <div className="text-muted-foreground">Effective from</div>
                  <div className="font-medium">{effectiveFrom}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Pricing preview</div>
                  <div className="mt-2">
                    <PeriodEditor periods={periods} currency={currency} onChange={() => {}} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 3 && result && (
          <motion.div
            key="s3"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Result</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-border/60 bg-card/40 p-4">
                    <div className="text-xs text-muted-foreground">Total</div>
                    <div className="mt-1 text-2xl font-bold">{result.total}</div>
                  </div>
                  <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-4">
                    <div className="text-xs text-emerald-300">Succeeded</div>
                    <div className="mt-1 text-2xl font-bold text-emerald-300">{result.succeededCount}</div>
                  </div>
                  <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
                    <div className="text-xs text-destructive">Failed</div>
                    <div className="mt-1 text-2xl font-bold text-destructive">{result.failedCount}</div>
                  </div>
                </div>

                {result.succeeded.length > 0 && (
                  <details className="rounded-lg border border-border/60 bg-card/40">
                    <summary className="cursor-pointer p-3 text-sm font-medium">
                      <CheckCircle2 className="mr-2 inline h-4 w-4 text-emerald-400" />
                      Succeeded ({result.succeeded.length})
                    </summary>
                    <ul className="space-y-1 p-3 pt-0 text-xs">
                      {result.succeeded.map((s) => (
                        <li key={s.chargerId} className="font-mono text-muted-foreground">
                          {s.chargerId} → schedule {s.scheduleId.slice(0, 8)}…
                        </li>
                      ))}
                    </ul>
                  </details>
                )}

                {result.failed.length > 0 && (
                  <details open className="rounded-lg border border-destructive/40 bg-destructive/5">
                    <summary className="cursor-pointer p-3 text-sm font-medium">
                      <XCircle className="mr-2 inline h-4 w-4 text-destructive" />
                      Failed ({result.failed.length})
                    </summary>
                    <ul className="space-y-1 p-3 pt-0 text-xs">
                      {result.failed.map((f) => (
                        <li key={f.chargerId} className="font-mono">
                          <span className="text-muted-foreground">{f.chargerId}</span>{' '}
                          <span className="text-destructive">— {f.error.message}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 flex items-center justify-between">
        {step > 0 && step < 3 ? (
          <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))}>
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
        ) : (
          <div />
        )}
        {step < 2 && (
          <Button disabled={!canAdvance} onClick={() => setStep((s) => s + 1)}>
            Next <ArrowRight className="h-4 w-4" />
          </Button>
        )}
        {step === 2 && (
          <Button onClick={apply} disabled={bulk.isPending}>
            {bulk.isPending ? 'Applying…' : `Apply to ${selected.size} chargers`}
          </Button>
        )}
        {step === 3 && (
          <Button onClick={restart}>Start another</Button>
        )}
      </div>
    </>
  );
};
