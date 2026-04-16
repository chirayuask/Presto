import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Plug, Receipt, TrendingUp, ArrowUpRight, Globe2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { useStations } from '@/hooks/useStations';
import { useChargers } from '@/hooks/useChargers';
import { cn } from '@/lib/utils';

const StatCard = ({
  icon: Icon,
  label,
  value,
  sublabel,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sublabel?: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay }}
  >
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-medium text-muted-foreground">{label}</div>
            <div className="mt-2 text-3xl font-bold tracking-tight">{value}</div>
            {sublabel && <div className="mt-1 text-xs text-muted-foreground">{sublabel}</div>}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export const OverviewPage = () => {
  const stations = useStations();
  const chargers = useChargers();

  const totalChargers = chargers.data?.length ?? 0;
  const uniqueZones = new Set(stations.data?.map((s) => s.timezone) ?? []).size;

  return (
    <>
      <PageHeader
        title="Overview"
        description="Live snapshot of your EV charging network and TOU pricing."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stations.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)
        ) : (
          <>
            <StatCard
              icon={Building2}
              label="Stations"
              value={stations.data?.length ?? 0}
              sublabel="across your network"
              delay={0}
            />
            <StatCard
              icon={Plug}
              label="Chargers"
              value={totalChargers}
              sublabel="active endpoints"
              delay={0.05}
            />
            <StatCard
              icon={Globe2}
              label="Timezones"
              value={uniqueZones}
              sublabel="regions covered"
              delay={0.1}
            />
            <StatCard
              icon={Receipt}
              label="Avg rate / kWh"
              value={averagePrice(chargers.data?.length ?? 0)}
              sublabel="across all chargers"
              delay={0.15}
            />
          </>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> Stations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stations.isLoading && (
              <>
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
              </>
            )}
            {stations.data?.map((s) => (
              <Link
                key={s.id}
                to={`/chargers?stationId=${s.id}`}
                className="group flex items-center justify-between rounded-lg border border-border/40 bg-card/40 p-4 transition-colors hover:border-primary/40 hover:bg-card"
              >
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {s.address} · {s.timezone}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{s.chargerCount ?? 0} chargers</Badge>
                  <ArrowUpRight className={cn('h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100')} />
                </div>
              </Link>
            ))}
            {!stations.isLoading && !stations.data?.length && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No stations yet. Create one from the Stations page.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Quick actions
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Link
              to="/stations"
              className="rounded-lg border border-border/40 p-3 text-sm transition-colors hover:border-primary/40 hover:bg-card"
            >
              + New station
            </Link>
            <Link
              to="/chargers"
              className="rounded-lg border border-border/40 p-3 text-sm transition-colors hover:border-primary/40 hover:bg-card"
            >
              + New charger
            </Link>
            <Link
              to="/schedules"
              className="rounded-lg border border-border/40 p-3 text-sm transition-colors hover:border-primary/40 hover:bg-card"
            >
              Manage pricing schedules
            </Link>
            <Link
              to="/bulk"
              className="rounded-lg border border-border/40 p-3 text-sm transition-colors hover:border-primary/40 hover:bg-card"
            >
              Bulk update prices
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

const averagePrice = (_chargersCount: number) => '—';
