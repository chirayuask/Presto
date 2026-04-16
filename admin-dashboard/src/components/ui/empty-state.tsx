import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 p-12 text-center',
      className,
    )}
  >
    {icon && (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
    )}
    <h3 className="text-base font-semibold">{title}</h3>
    {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);
