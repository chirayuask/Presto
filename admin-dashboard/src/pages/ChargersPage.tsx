import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plug, Plus, Pencil, Trash2, Receipt, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ChargerFormDialog } from '@/components/chargers/ChargerFormDialog';
import { useChargers, useDeleteCharger } from '@/hooks/useChargers';
import { useStations } from '@/hooks/useStations';
import type { Charger } from '@/types/api';

export const ChargersPage = () => {
  const [params, setParams] = useSearchParams();
  const stationId = params.get('stationId') ?? '';
  const [search, setSearch] = useState('');
  const chargers = useChargers();
  const stations = useStations();
  const del = useDeleteCharger();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Charger | null>(null);
  const [toDelete, setToDelete] = useState<Charger | null>(null);

  const filtered = useMemo(() => {
    let list = chargers.data ?? [];
    if (stationId) list = list.filter((c) => c.stationId === stationId);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.serialNumber.toLowerCase().includes(q) ||
          (c.label ?? '').toLowerCase().includes(q) ||
          (c.connectorType ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [chargers.data, stationId, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, Charger[]>();
    for (const c of filtered) {
      const key = c.stationId;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return map;
  }, [filtered]);

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await del.mutateAsync(toDelete.id);
      toast.success('Charger deleted');
      setToDelete(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const setStationFilter = (v: string) => {
    if (!v || v === 'all') params.delete('stationId');
    else params.set('stationId', v);
    setParams(params, { replace: true });
  };

  return (
    <>
      <PageHeader
        title="Chargers"
        description="Individual charging endpoints. Each can have its own TOU pricing schedule."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            New charger
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by serial, label, connector…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={stationId || 'all'} onValueChange={setStationFilter}>
          <SelectTrigger className="w-56">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="All stations" />
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
      </div>

      {chargers.isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : !filtered.length ? (
        <EmptyState
          icon={<Plug className="h-6 w-6" />}
          title="No chargers found"
          description="Try adjusting filters or create a new charger."
        />
      ) : (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([sId, rows]) => {
            const station = stations.data?.find((s) => s.id === sId);
            return (
              <section key={sId}>
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {station?.name ?? 'Unknown station'}
                  </h2>
                  <Badge variant="outline">{station?.timezone ?? '—'}</Badge>
                  <Badge variant="secondary">{rows.length} chargers</Badge>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {rows.map((c, idx) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.02 }}
                    >
                      <Card className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-mono text-muted-foreground">
                              {c.serialNumber}
                            </div>
                            <div className="mt-1 text-base font-semibold truncate">
                              {c.label ?? 'Unnamed charger'}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {c.connectorType && (
                                <Badge variant="outline">{c.connectorType}</Badge>
                              )}
                              {c.powerKw && (
                                <Badge variant="secondary">{c.powerKw} kW</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" asChild title="Pricing">
                              <Link to={`/schedules/${c.id}`}>
                                <Receipt className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setEditing(c);
                                setFormOpen(true);
                              }}
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setToDelete(c)}
                              title="Delete"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <ChargerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        defaultStationId={stationId || undefined}
      />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title={`Delete ${toDelete?.label ?? toDelete?.serialNumber}?`}
        description="This removes the charger and all its pricing schedules. This can't be undone."
        confirmLabel="Delete charger"
        destructive
        onConfirm={confirmDelete}
        pending={del.isPending}
      />
    </>
  );
};
