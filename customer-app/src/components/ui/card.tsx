import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md shadow-xl shadow-black/20',
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = 'Card';
