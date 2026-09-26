'use client';
import {
  AnimatePresence,
  Transition,
  Variant,
  motion,
  MotionProps,
} from 'motion/react';
import { cn } from '@/lib/utils';
import React from 'react';

export type TransitionPanelProps = {
  children: React.ReactNode[];
  className?: string;
  transition?: Transition;
  activeIndex: number;
  variants?: { enter: Variant; center: Variant; exit: Variant };
} & MotionProps;

export function TransitionPanel({
  children,
  className,
  transition,
  variants,
  activeIndex,
  ...motionProps
}: TransitionPanelProps) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <AnimatePresence initial={false} mode='popLayout'>
        <motion.div
          key={activeIndex}
          initial='enter'
          animate='center'
          exit='exit'
          transition={transition}
          variants={variants}
          {...motionProps}
        >
          {children[activeIndex]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
