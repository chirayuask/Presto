import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Plus, Pencil, Trash2, Search, Plug } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { StationFormDialog } from '@/components/stations/StationFormDialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useDeleteStation, useStations } from '@/hooks/useStations';
import type { Station } from '@/types/api';

export const StationsPage = () => {
  const [search, setSearch] = useState('');
  const stations = useStations();
  const del = useDeleteStation();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Station | null>(null);
  const [toDelete, setToDelete] = useState<Station | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return stations.data ?? [];
    return (stations.data ?? []).filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.address ?? '').toLowerCase().includes(q) ||
        s.timezone.toLowerCase().includes(q),
    );
  }, [stations.data, search]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (s: Station) => {
    setEditing(s);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await del.mutateAsync(toDelete.id);
      toast.success('Station deleted');
      setToDelete(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <>
      <PageHeader
        title="Stations"
        description="Physical locations that host your EV chargers. Timezone on the station determines TOU behavior."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New station
          </Button>
        }
      />

      <div className="mb-5 flex gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, address, or timezone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {stations.isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : !filtered.length ? (
        <EmptyState
          icon={<Building2 className="h-6 w-6" />}
          title={search ? 'No matches' : 'No stations yet'}
          description={
            search
              ? 'Try a different search term.'
              : 'Get started by creating your first station.'
          }
          action={
            !search && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Create station
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((s, idx) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.03 }}
            >
              <Card className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-base font-semibold">{s.name}</h3>
                      <Badge variant="secondary">{s.chargerCount ?? 0} chargers</Badge>
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">{s.address}</p>
                    <div className="mt-3 flex items-center gap-3 text-xs">
                      <Badge variant="outline">{s.timezone}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" asChild title="Chargers">
                      <Link to={`/chargers?stationId=${s.id}`}>
                        <Plug className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(s)} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setToDelete(s)}
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
      )}

      <StationFormDialog open={formOpen} onOpenChange={setFormOpen} initial={editing} />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title={`Delete ${toDelete?.name}?`}
        description="This permanently removes the station and all its chargers, schedules, and pricing periods."
        confirmLabel="Delete station"
        destructive
        onConfirm={confirmDelete}
        pending={del.isPending}
      />
    </>
  );
};
