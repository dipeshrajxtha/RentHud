import React, { forwardRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FormSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  options: FormSelectOption[];
  containerClassName?: string;
}

/**
 * FormSelect - Watermelon UI inspired ergonomic select component.
 */
export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      options,
      className,
      containerClassName,
      id,
      required,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={cn('w-full space-y-1.5', containerClassName)}>
        {label && (
          <div className="flex items-center justify-between">
            <label
              htmlFor={selectId}
              className="block text-xs font-semibold text-slate-700 tracking-tight"
            >
              {label}
              {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
            </label>
            {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
          </div>
        )}

        <div
          className={cn(
            'group relative flex items-center rounded-xl border bg-white shadow-sm transition-all duration-200',
            error
              ? 'border-rose-300 ring-2 ring-rose-500/10 focus-within:border-rose-500 focus-within:ring-rose-500/20'
              : 'border-slate-200 hover:border-slate-300 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-500/10'
          )}
        >
          {leftIcon && (
            <div className="pl-3.5 pr-1 text-slate-400 pointer-events-none flex items-center justify-center shrink-0">
              {leftIcon}
            </div>
          )}

          <select
            ref={ref}
            id={selectId}
            required={required}
            className={cn(
              'w-full appearance-none bg-transparent px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 pr-9',
              leftIcon ? 'pl-2' : '',
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>

          <div className="pointer-events-none absolute right-3 text-slate-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-1.5 text-xs text-rose-600 pt-0.5"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

FormSelect.displayName = 'FormSelect';
