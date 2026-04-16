import { useEffect, useState } from 'react';
import { Moon, Sun, Command, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHealth } from '@/hooks/useMeta';
import { cn } from '@/lib/utils';

export const Topbar = ({ onOpenCommand }: { onOpenCommand: () => void }) => {
  const [dark, setDark] = useState(true);
  const health = useHealth();

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [dark]);

  const healthy = health.data?.status === 'ok';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-end gap-3 border-b border-border/60 bg-background/70 px-6 backdrop-blur-xl">
      <Button
        variant="outline"
        size="sm"
        className="gap-2 pr-1.5"
        onClick={onOpenCommand}
      >
        <span className="text-muted-foreground">Quick search…</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
          <Command className="h-3 w-3" />K
        </kbd>
      </Button>

      <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-xs">
        <Circle
          className={cn(
            'h-2 w-2 fill-current',
            healthy ? 'text-emerald-400' : 'text-amber-400',
          )}
        />
        <span className="text-muted-foreground">
          {healthy ? 'API online' : health.isLoading ? 'Checking…' : 'API degraded'}
        </span>
      </div>

      <Button variant="ghost" size="icon" onClick={() => setDark((d) => !d)}>
        {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
    </header>
  );
};
