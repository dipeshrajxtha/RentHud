import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * BentoGrid - Aceternity UI inspired asymmetric container for rich dashboard widgets.
 */
export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 auto-rows-[minmax(180px,auto)]',
        className
      )}
    >
      {children}
    </div>
  );
}

export interface BentoCardProps {
  children?: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  colSpan?: 1 | 2 | 3;
  rowSpan?: 1 | 2;
  gradient?: boolean;
  onClick?: () => void;
}

/**
 * BentoCard - Aceternity & Manus.im inspired sleek elevated card item.
 */
export function BentoCard({
  children,
  className,
  title,
  description,
  header,
  icon,
  badge,
  colSpan = 1,
  rowSpan = 1,
  gradient = false,
  onClick,
}: BentoCardProps) {
  const colSpanClasses = {
    1: 'col-span-1',
    2: 'col-span-1 md:col-span-2',
    3: 'col-span-1 md:col-span-2 lg:col-span-3',
  };

  const rowSpanClasses = {
    1: 'row-span-1',
    2: 'row-span-2',
  };

  return (
    <motion.div
      whileHover={onClick ? { y: -2 } : undefined}
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 md:p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300 flex flex-col justify-between',
        colSpanClasses[colSpan],
        rowSpanClasses[rowSpan],
        onClick && 'cursor-pointer',
        className
      )}
    >
      {/* Subtle Ambient Background Gradient */}
      {gradient && (
        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-blue-50/70 blur-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-60" />
      )}

      {header && <div className="mb-4 w-full">{header}</div>}

      <div className="relative z-10 w-full space-y-2">
        {(icon || badge) && (
          <div className="flex items-center justify-between pb-1">
            {icon && (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600">
                {icon}
              </div>
            )}
            {badge && <div>{badge}</div>}
          </div>
        )}

        {title && (
          <h3 className="font-display text-base font-bold text-slate-900 tracking-tight">
            {title}
          </h3>
        )}

        {description && (
          <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
        )}

        {children && <div className="pt-2">{children}</div>}
      </div>
    </motion.div>
  );
}
