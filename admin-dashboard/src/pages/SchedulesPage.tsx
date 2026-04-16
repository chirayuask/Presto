import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DateTime } from 'luxon';
import { toast } from 'sonner';
import { Copy, Plus, Receipt, Save, Trash2, Power, History } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PeriodEditor } from '@/components/pricing-editor/PeriodEditor';
import { toEditable, validatePeriods, type EditablePeriod } from '@/components/pricing-editor/timeMath';
import { useChargers } from '@/hooks/useChargers';
import {
  useCloneSchedule,
  useCreateSchedule,
  useCurrentPrice,
  useDeleteSchedule,
  useReplacePeriods,
  useSchedulesForCharger,
  useUpdateSchedule,
} from '@/hooks/useSchedules';
import type { PricingSchedule } from '@/types/api';

const DEFAULT_PERIODS: EditablePeriod[] = toEditable([
  { startTime: '00:00', endTime: '06:00', pricePerKwh: 0.15 },
  { startTime: '06:00', endTime: '12:00', pricePerKwh: 0.2 },
  { startTime: '12:00', endTime: '14:00', pricePerKwh: 0.25 },
  { startTime: '14:00', endTime: '18:00', pricePerKwh: 0.3 },
  { startTime: '18:00', endTime: '20:00', pricePerKwh: 0.25 },
  { startTime: '20:00', endTime: '22:00', pricePerKwh: 0.2 },
  { startTime: '22:00', endTime: '00:00', pricePerKwh: 0.15 },
]);

export const SchedulesPage = () => {
  const params = useParams();
  const navigate = useNavigate();
  const chargerId = params.chargerId;
  const chargers = useChargers();

  const selectedCharger = chargers.data?.find((c) => c.id === chargerId);
  const schedulesQ = useSchedulesForCharger(chargerId);
  const schedules = schedulesQ.data ?? [];

  const [activeScheduleId, setActiveScheduleId] = useState<string | null>(null);
  const [editingPeriods, setEditingPeriods] = useState<EditablePeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | undefined>();
  const [scheduleName, setScheduleName] = useState('');
  const [scheduleCurrency, setScheduleCurrency] = useState('USD');
  const [effectiveFrom, setEffectiveFrom] = useState(DateTime.now().toISODate() ?? '');
  const [isActive, setIsActive] = useState(true);
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [toDelete, setToDelete] = useState<PricingSchedule | null>(null);

  const create = useCreateSchedule();
  const replace = useReplacePeriods();
  const update = useUpdateSchedule();
  const del = useDeleteSchedule();
  const clone = useCloneSchedule();

  useEffect(() => {
    if (schedules.length && !activeScheduleId) {
      const active = schedules.find((s) => s.isActive) ?? schedules[0];
      setActiveScheduleId(active.id);
    }
    if (!schedules.length && chargerId && !schedulesQ.isLoading) {
      setMode('new');
      setEditingPeriods(DEFAULT_PERIODS);
      setScheduleName('Default TOU Schedule');
    }
  }, [schedules, activeScheduleId, chargerId, schedulesQ.isLoading]);

  useEffect(() => {
    if (mode === 'existing' && activeScheduleId) {
      const s = schedules.find((x) => x.id === activeScheduleId);
      if (s) {
        setEditingPeriods(toEditable(s.periods ?? []));
        setScheduleName(s.name ?? '');
        setScheduleCurrency(s.currency);
        setEffectiveFrom(s.effectiveFrom);
        setIsActive(s.isActive);
      }
    }
  }, [activeScheduleId, mode, schedules]);

  const current = useCurrentPrice(chargerId);
  const nowMinute = useMemo(() => {
    if (!current.data) return undefined;
    const [h, m] = current.data.localTime.split(':').map(Number);
    return h * 60 + m;
  }, [current.data]);

  const validation = validatePeriods(editingPeriods);

  const onCreateSchedule = async () => {
    if (!chargerId || !validation.ok) return;
    try {
      await create.mutateAsync({
        chargerId,
        body: {
          name: scheduleName || null,
          currency: scheduleCurrency,
          effectiveFrom,
          isActive,
          periods: editingPeriods.map((p) => ({
            startTime: p.startTime,
            endTime: p.endTime,
            pricePerKwh: p.pricePerKwh,
          })),
        },
      });
      toast.success('Schedule created');
      setMode('existing');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const onSaveExisting = async () => {
    if (!activeScheduleId || !validation.ok) return;
    try {
      await replace.mutateAsync({
        id: activeScheduleId,
        periods: editingPeriods.map((p) => ({
          startTime: p.startTime,
          endTime: p.endTime,
          pricePerKwh: p.pricePerKwh,
        })),
      });
      await update.mutateAsync({
        id: activeScheduleId,
        body: { name: scheduleName || null, currency: scheduleCurrency, effectiveFrom, isActive },
      });
      toast.success('Schedule updated');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const onClone = async () => {
    if (!activeScheduleId) return;
    try {
      await clone.mutateAsync({ id: activeScheduleId, body: {} });
      toast.success('Schedule cloned');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const onDelete = async () => {
    if (!toDelete) return;
    try {
      await del.mutateAsync(toDelete.id);
      toast.success('Schedule deleted');
      setToDelete(null);
      if (activeScheduleId === toDelete.id) setActiveScheduleId(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  if (!chargerId) {
    return (
      <>
        <PageHeader
          title="Pricing Schedules"
          description="Select a charger to design its time-of-use pricing."
        />
        {chargers.isLoading ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : !chargers.data?.length ? (
          <EmptyState
            icon={<Receipt className="h-6 w-6" />}
            title="No chargers yet"
            description="Create a station and charger first, then return here to set pricing."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {chargers.data.map((c, idx) => (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.02 }}
                onClick={() => navigate(`/schedules/${c.id}`)}
                className="group rounded-xl border border-border/60 bg-card/40 p-5 text-left transition-all hover:border-primary/50 hover:bg-card"
              >
                <div className="text-xs font-mono text-muted-foreground">{c.serialNumber}</div>
                <div className="mt-1 font-semibold">{c.label ?? 'Unnamed charger'}</div>
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="outline">{c.station?.name}</Badge>
                  <Badge variant="secondary">{c.station?.timezone}</Badge>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Pricing Schedule"
        description={
          selectedCharger
            ? `${selectedCharger.label ?? selectedCharger.serialNumber} · ${selectedCharger.station?.name} · ${selectedCharger.station?.timezone}`
            : ''
        }
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/schedules')}>
              Change charger
            </Button>
            {mode === 'existing' && activeScheduleId && (
              <>
                <Button variant="outline" onClick={onClone} disabled={clone.isPending}>
                  <Copy className="h-4 w-4" /> Clone
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setMode('new');
                    setScheduleName('');
                    setEffectiveFrom(DateTime.now().toISODate()!);
                    setIsActive(true);
                  }}
                >
                  <Plus className="h-4 w-4" /> New schedule
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>{mode === 'new' ? 'Create new schedule' : 'Edit schedule'}</CardTitle>
              {current.data && mode === 'existing' && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Current local time: <span className="font-mono">{current.data.localTime}</span> ·
                  now paying{' '}
                  <span className="font-semibold text-foreground">
                    {current.data.period.pricePerKwh.toFixed(4)} {current.data.period.currency}
                  </span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="active" className="text-xs text-muted-foreground">
                Active
              </Label>
              <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="schedname">Name</Label>
                <Input
                  id="schedname"
                  value={scheduleName}
                  onChange={(e) => setScheduleName(e.target.value)}
                  placeholder="Default TOU"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="currency">Currency</Label>
                <Select value={scheduleCurrency} onValueChange={setScheduleCurrency}>
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'JPY'].map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="effectiveFrom">Effective from</Label>
                <Input
                  id="effectiveFrom"
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                />
              </div>
            </div>

            <PeriodEditor
              periods={editingPeriods}
              currency={scheduleCurrency}
              onChange={setEditingPeriods}
              selectedId={selectedPeriodId}
              onSelectedIdChange={setSelectedPeriodId}
              nowMinute={nowMinute}
            />

            <div className="flex items-center justify-end gap-3 border-t border-border/60 pt-4">
              {mode === 'new' ? (
                <Button onClick={onCreateSchedule} disabled={!validation.ok || create.isPending}>
                  <Save className="h-4 w-4" /> {create.isPending ? 'Creating…' : 'Create schedule'}
                </Button>
              ) : (
                <Button
                  onClick={onSaveExisting}
                  disabled={!validation.ok || replace.isPending || update.isPending}
                >
                  <Save className="h-4 w-4" />
                  {replace.isPending || update.isPending ? 'Saving…' : 'Save changes'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4" /> History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {schedulesQ.isLoading && <Skeleton className="h-12" />}
            {schedules.map((s) => (
              <div
                key={s.id}
                className={`group flex items-start justify-between gap-2 rounded-lg border p-3 text-left ${
                  activeScheduleId === s.id && mode === 'existing'
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border/60 bg-card/40 hover:bg-card'
                }`}
              >
                <button
                  className="flex-1 text-left"
                  onClick={() => {
                    setActiveScheduleId(s.id);
                    setMode('existing');
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-medium">
                      {s.name ?? 'Unnamed'}
                    </div>
                    {s.isActive && <Badge variant="success">Active</Badge>}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    From {s.effectiveFrom} · {s.currency}
                  </div>
                </button>
                <div className="flex flex-col gap-1">
                  {!s.isActive && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => update.mutate({ id: s.id, body: { isActive: true } })}
                      title="Activate"
                    >
                      <Power className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => setToDelete(s)}
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            {!schedulesQ.isLoading && !schedules.length && (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No schedules yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="Delete schedule?"
        description="This permanently removes the schedule and its pricing periods."
        confirmLabel="Delete"
        destructive
        pending={del.isPending}
        onConfirm={onDelete}
      />
    </>
  );
};
