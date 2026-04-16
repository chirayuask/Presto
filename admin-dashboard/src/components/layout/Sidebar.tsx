import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Plug,
  Receipt,
  Zap,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/stations', label: 'Stations', icon: Building2 },
  { to: '/chargers', label: 'Chargers', icon: Plug },
  { to: '/schedules', label: 'Pricing Schedules', icon: Receipt },
  { to: '/bulk', label: 'Bulk Operations', icon: Zap },
];

export const Sidebar = () => (
  <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border/60 bg-card/30 backdrop-blur-sm lg:block">
    <div className="flex h-16 items-center gap-2 border-b border-border/60 px-6">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
        <Sparkles className="h-5 w-5" />
      </div>
      <div>
        <div className="text-sm font-semibold tracking-tight">Presto TOU</div>
        <div className="text-xs text-muted-foreground">Admin Console</div>
      </div>
    </div>
    <nav className="flex flex-col gap-1 p-4">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
              isActive
                ? 'bg-primary/10 text-primary shadow-sm'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )
          }
        >
          <Icon className="h-4 w-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  </aside>
);
