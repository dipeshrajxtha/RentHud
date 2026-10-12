import { cn } from '@/lib/utils';

export interface FilterTab {
  id: string;
  label: string;
  count?: number;
}

export interface FilterTabsProps {
  tabs: FilterTab[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  /** Color accent: 'blue' (default), 'indigo', 'violet' */
  accent?: 'blue' | 'indigo' | 'violet';
}

const ACCENT_STYLES = {
  blue: {
    active: 'bg-blue-600 text-white shadow-sm shadow-blue-200',
    badge: 'bg-blue-500 text-white',
  },
  indigo: {
    active: 'bg-indigo-500 text-white shadow-sm shadow-indigo-200',
    badge: 'bg-indigo-500 text-white',
  },
  violet: {
    active: 'bg-violet-600 text-white shadow-sm shadow-violet-200',
    badge: 'bg-violet-500 text-white',
  },
};

/**
 * FilterTabs — segmented tab switcher with optional counts.
 * Replaces hand-styled filter pill bars for consistency.
 */
export function FilterTabs({
  tabs,
  activeId,
  onChange,
  className,
  accent = 'blue',
}: FilterTabsProps) {
  const styles = ACCENT_STYLES[accent];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeId === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap',
              isActive
                ? cn(styles.active, 'font-semibold')
                : 'text-slate-500 hover:text-slate-700 hover:bg-white'
            )}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={cn(
                  'ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-md text-[10px] font-bold',
                  isActive ? styles.badge : 'bg-slate-200 text-slate-600'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
