import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { DateTime } from 'luxon';
import { Zap, MapPin, Clock, Sparkles, ArrowRight, Wallet } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DayCurve } from '@/components/DayCurve';
import { useChargers, useCurrentPrice, useDailySchedule } from '@/hooks/usePricing';
import { formatPrice } from '@/lib/utils';

const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export const HomePage = () => {
  const chargers = useChargers();
  const [chargerId, setChargerId] = useState<string>('');
  const [mode, setMode] = useState<'now' | 'custom'>('now');
  const [customAt, setCustomAt] = useState<string>(DateTime.now().toISO({ suppressMilliseconds: true }) ?? '');

  useEffect(() => {
    if (!chargerId && chargers.data?.length) setChargerId(chargers.data[0].id);
  }, [chargers.data, chargerId]);

  const atIso = mode === 'now' ? undefined : customAt;
  const current = useCurrentPrice(chargerId || undefined, atIso);
  const daily = useDailySchedule(chargerId || undefined, current.data?.localDate);

  const selectedCharger = chargers.data?.find((c) => c.id === chargerId);

  const nowMinute = current.data ? toMin(current.data.localTime) : undefined;

  const nextChange = useMemo(() => {
    if (!current.data || !daily.data) return null;
    const now = nowMinute!;
    const endRaw = toMin(current.data.period.endTime);
    const end = endRaw === 0 ? 1440 : endRaw;
    const mins = (end - now + 1440) % 1440 || 1440;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return { label: h > 0 ? `${h}h ${m}m` : `${m}m`, endsAt: current.data.period.endTime };
  }, [current.data, daily.data, nowMinute]);

  return (
    <div className="relative min-h-screen bg-hero">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-8">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">Presto</div>
            <div className="text-xs text-muted-foreground">Time-of-Use Pricing</div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {DateTime.now().toFormat('ccc, d LLL · HH:mm')}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
            <Zap className="h-3.5 w-3.5" />
            Live TOU pricing
          </div>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
            Check what you'll pay to charge —
            <span className="block bg-gradient-to-r from-primary via-emerald-300 to-sky-400 bg-clip-text text-transparent">
              right now, at any charger.
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
            Pricing updates throughout the day. Lower rates during off-peak hours, higher during peak demand.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
        >
          <Card className="overflow-hidden p-6 md:p-8">
            <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Charger
                </label>
                <Select value={chargerId} onValueChange={setChargerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pick a charger" />
                  </SelectTrigger>
                  <SelectContent>
                    {chargers.data?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="font-medium">{c.label ?? c.serialNumber}</span>
                        <span className="ml-2 text-muted-foreground">{c.station?.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  When
                </label>
                <div className="flex h-12 rounded-lg border border-input bg-card/40 p-1">
                  <button
                    onClick={() => setMode('now')}
                    className={`rounded-md px-4 text-sm font-medium transition-colors ${
                      mode === 'now' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Now
                  </button>
                  <button
                    onClick={() => setMode('custom')}
                    className={`rounded-md px-4 text-sm font-medium transition-colors ${
                      mode === 'custom' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Custom
                  </button>
                </div>
              </div>

              {mode === 'custom' && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Date & time
                  </label>
                  <input
                    type="datetime-local"
                    value={customAt.slice(0, 16)}
                    onChange={(e) => setCustomAt(new Date(e.target.value).toISOString())}
                    className="h-12 w-full rounded-lg border border-input bg-card/40 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {current.isError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-center text-sm text-destructive"
          >
            {(current.error as Error).message}
          </motion.div>
        )}

        {current.isLoading && (
          <div className="mt-8 animate-pulse rounded-2xl border border-border/60 bg-card/40 p-10 text-center text-sm text-muted-foreground">
            Fetching live price…
          </div>
        )}

        {current.data && (
          <motion.div
            key={`${chargerId}-${atIso}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-8"
          >
            <Card className="relative overflow-hidden p-8 md:p-10">
              <div className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
              <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <Wallet className="h-3.5 w-3.5 text-primary" /> Current rate
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-bold tracking-tight text-primary md:text-7xl">
                      {formatPrice(current.data.period.pricePerKwh, current.data.period.currency ?? 'USD')}
                    </span>
                    <span className="text-lg text-muted-foreground">/kWh</span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      {current.data.stationName}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      {current.data.localTime} · {current.data.timezone}
                    </span>
                  </div>
                </div>

                <div className="md:text-right">
                  <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Active period
                  </div>
                  <div className="text-2xl font-semibold">
                    {current.data.period.startTime} → {current.data.period.endTime}
                  </div>
                  {nextChange && mode === 'now' && (
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground">
                      <ArrowRight className="h-3 w-3" />
                      Price changes in {nextChange.label}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {daily.data && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mt-8"
          >
            <Card className="p-6 md:p-8">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Today's full schedule</h2>
                  <p className="text-xs text-muted-foreground">
                    {daily.data.date} · {selectedCharger?.station?.name ?? ''}
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div>Lowest</div>
                  <div className="text-base font-semibold text-foreground">
                    {formatPrice(
                      Math.min(...daily.data.periods.map((p) => p.pricePerKwh)),
                      daily.data.schedule.currency,
                    )}
                  </div>
                </div>
              </div>
              <DayCurve
                periods={daily.data.periods}
                currency={daily.data.schedule.currency}
                nowMinute={mode === 'now' ? nowMinute : undefined}
              />
              <div className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-4">
                {daily.data.periods.map((p, i) => (
                  <div
                    key={i}
                    className={`rounded-lg border p-3 text-xs ${
                      current.data?.period.id === p.id
                        ? 'border-primary/60 bg-primary/10'
                        : 'border-border/60 bg-card/40'
                    }`}
                  >
                    <div className="font-mono text-muted-foreground">
                      {p.startTime} → {p.endTime}
                    </div>
                    <div className="mt-1 text-base font-semibold">
                      {formatPrice(p.pricePerKwh, daily.data!.schedule.currency)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
};
