import React from 'react';
import { cn } from '@/lib/utils';

export type StatusPillVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'purple'
  | 'neutral';

export interface StatusPillProps {
  children: React.ReactNode;
  variant?: StatusPillVariant;
  pulse?: boolean;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

/**
 * StatusPill - Realtime Colors & Watermelon UI inspired status indicator badge.
 * Provides high-contrast, WCAG AA compliant visual state indicators with animated pulse dots.
 */
export function StatusPill({
  children,
  variant = 'neutral',
  pulse = false,
  size = 'md',
  icon,
  className,
}: StatusPillProps) {
  const variantStyles: Record<StatusPillVariant, { badge: string; dot: string }> = {
    success: {
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      dot: 'bg-emerald-500',
    },
    warning: {
      badge: 'bg-amber-50 text-amber-700 border-amber-200/80',
      dot: 'bg-amber-500',
    },
    danger: {
      badge: 'bg-rose-50 text-rose-700 border-rose-200/80',
      dot: 'bg-rose-500',
    },
    info: {
      badge: 'bg-sky-50 text-sky-700 border-sky-200/80',
      dot: 'bg-sky-500',
    },
    purple: {
      badge: 'bg-purple-50 text-purple-700 border-purple-200/80',
      dot: 'bg-purple-500',
    },
    neutral: {
      badge: 'bg-slate-50 text-slate-700 border-slate-200/80',
      dot: 'bg-slate-400',
    },
  };

  const currentVariant = variantStyles[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium border rounded-full tracking-tight',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        currentVariant.badge,
        className
      )}
    >
      {pulse ? (
        <span className="relative flex h-2 w-2 shrink-0">
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              currentVariant.dot
            )}
          />
          <span
            className={cn('relative inline-flex rounded-full h-2 w-2', currentVariant.dot)}
          />
        </span>
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : (
        <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', currentVariant.dot)} />
      )}
      <span>{children}</span>
    </span>
  );
}
