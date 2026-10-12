import React, { forwardRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  containerClassName?: string;
  /** Show a character counter: pass the maxLength value */
  maxChars?: number;
}

/**
 * FormTextarea — styled textarea matching FormInput design language.
 * Features animated focus rings, accessible label, optional char counter.
 */
export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      className,
      containerClassName,
      id,
      required,
      maxChars,
      value,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const charCount = typeof value === 'string' ? value.length : 0;

    return (
      <div className={cn('w-full space-y-1.5', containerClassName)}>
        {label && (
          <div className="flex items-center justify-between">
            <label
              htmlFor={inputId}
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
            'group relative flex rounded-xl border bg-white shadow-sm transition-all duration-200',
            error
              ? 'border-rose-300 ring-2 ring-rose-500/10 focus-within:border-rose-500 focus-within:ring-rose-500/20'
              : 'border-slate-200 hover:border-slate-300 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-500/10'
          )}
        >
          {leftIcon && (
            <div className="pl-3.5 pt-3 text-slate-400 pointer-events-none flex items-start justify-center shrink-0">
              {leftIcon}
            </div>
          )}

          <textarea
            ref={ref}
            id={inputId}
            required={required}
            value={value}
            className={cn(
              'w-full bg-transparent px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 resize-none rounded-xl',
              leftIcon ? 'pl-2' : '',
              className
            )}
            {...props}
          />
        </div>

        {/* Footer: char counter + error */}
        <div className="flex items-center justify-between">
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

          {maxChars && (
            <span
              className={cn(
                'text-[11px] ml-auto tabular-nums',
                charCount > maxChars ? 'text-rose-500 font-semibold' : 'text-slate-400'
              )}
            >
              {charCount}/{maxChars}
            </span>
          )}
        </div>
      </div>
    );
  }
);

FormTextarea.displayName = 'FormTextarea';
