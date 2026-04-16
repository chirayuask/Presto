import { useEffect } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { Building2, LayoutDashboard, Plug, Receipt, Zap } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const ITEMS = [
  { label: 'Overview', to: '/', icon: LayoutDashboard },
  { label: 'Stations', to: '/stations', icon: Building2 },
  { label: 'Chargers', to: '/chargers', icon: Plug },
  { label: 'Pricing Schedules', to: '/schedules', icon: Receipt },
  { label: 'Bulk Operations', to: '/bulk', icon: Zap },
];

export const CommandPalette = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden p-0">
        <Command className="bg-transparent">
          <div className="border-b border-border/60 px-4">
            <Command.Input
              autoFocus
              placeholder="Search pages, stations, chargers…"
              className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Command.List className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results.
            </Command.Empty>
            <Command.Group heading="Navigation" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-muted-foreground">
              {ITEMS.map(({ label, to, icon: Icon }) => (
                <Command.Item
                  key={to}
                  onSelect={() => {
                    navigate(to);
                    onOpenChange(false);
                  }}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {label}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
};
