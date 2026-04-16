import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

export const PageHeader = ({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) => (
  <motion.div
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="mb-8 flex flex-wrap items-start justify-between gap-4"
  >
    <div>
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </motion.div>
);
