import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StepIndicatorStep {
  label: string;
  icon?: React.ReactNode;
}

export interface StepIndicatorProps {
  steps: StepIndicatorStep[];
  /** 1-indexed current step */
  currentStep: number;
  className?: string;
}

/**
 * StepIndicator — horizontal multi-step wizard progress bar.
 * Numbered circles with labels and connecting lines.
 */
export function StepIndicator({ steps, currentStep, className }: StepIndicatorProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center">
        {steps.map((step, idx) => {
          const stepNum = idx + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <React.Fragment key={idx}>
              {/* Step circle + label */}
              <div className="flex flex-col items-center gap-1.5 relative z-10">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.1 : 1,
                    backgroundColor: isCompleted
                      ? '#2563eb'
                      : isCurrent
                      ? '#2563eb'
                      : '#f1f5f9',
                    borderColor: isCompleted
                      ? '#2563eb'
                      : isCurrent
                      ? '#2563eb'
                      : '#e2e8f0',
                  }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold shadow-sm',
                    isCompleted || isCurrent ? 'text-white' : 'text-slate-400'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : step.icon ? (
                    step.icon
                  ) : (
                    stepNum
                  )}
                </motion.div>

                <span
                  className={cn(
                    'text-[10px] font-semibold tracking-tight whitespace-nowrap',
                    isCurrent ? 'text-blue-700' : isCompleted ? 'text-slate-600' : 'text-slate-400'
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {idx < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 rounded-full relative -mt-5">
                  <div className="absolute inset-0 bg-slate-200 rounded-full" />
                  <motion.div
                    initial={false}
                    animate={{ scaleX: isCompleted ? 1 : 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="absolute inset-0 bg-blue-500 rounded-full origin-left"
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
