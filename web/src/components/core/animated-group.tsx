'use client';
import { ReactNode } from 'react';
import { motion, Variants } from 'motion/react';
import React from 'react';

export type PresetType =
  | 'fade'
  | 'slide'
  | 'scale'
  | 'blur'
  | 'blur-slide'
  | 'zoom'
  | 'flip'
  | 'bounce'
  | 'rotate'
  | 'swing';

export type AnimatedGroupProps = {
  children: ReactNode;
  className?: string;
  variants?: {
    container?: Variants;
    item?: Variants;
  };
  preset?: PresetType;
  as?: React.ElementType;
};

const defaultContainerVariants: Variants = {
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const defaultItemVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const presetVariants: Record<PresetType, { container?: Variants; item: Variants }> = {
  fade: {
    item: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    },
  },
  slide: {
    item: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    },
  },
  scale: {
    item: {
      hidden: { opacity: 0, scale: 0.8 },
      visible: { opacity: 1, scale: 1 },
    },
  },
  blur: {
    item: {
      hidden: { opacity: 0, filter: 'blur(4px)' },
      visible: { opacity: 1, filter: 'blur(0px)' },
    },
  },
  'blur-slide': {
    item: {
      hidden: { opacity: 0, filter: 'blur(4px)', y: 20 },
      visible: { opacity: 1, filter: 'blur(0px)', y: 0 },
    },
  },
  zoom: {
    item: {
      hidden: { opacity: 0, scale: 0.5 },
      visible: { opacity: 1, scale: 1 },
    },
  },
  flip: {
    item: {
      hidden: { opacity: 0, rotateX: -90 },
      visible: { opacity: 1, rotateX: 0 },
    },
  },
  bounce: {
    item: {
      hidden: { opacity: 0, y: -50 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 400, damping: 10 },
      },
    },
  },
  rotate: {
    item: {
      hidden: { opacity: 0, rotate: -180 },
      visible: { opacity: 1, rotate: 0 },
    },
  },
  swing: {
    item: {
      hidden: { opacity: 0, rotate: -10 },
      visible: {
        opacity: 1,
        rotate: 0,
        transition: { type: 'spring', stiffness: 300, damping: 8 },
      },
    },
  },
};

export function AnimatedGroup({
  children,
  className,
  variants,
  preset = 'fade',
  as = 'div',
}: AnimatedGroupProps) {
  const selectedVariants = {
    container: variants?.container || defaultContainerVariants,
    item: variants?.item || presetVariants[preset]?.item || defaultItemVariants,
  };

  const Component = motion.create(as);

  return (
    <Component
      initial='hidden'
      animate='visible'
      variants={selectedVariants.container}
      className={className}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={selectedVariants.item}>
          {child}
        </motion.div>
      ))}
    </Component>
  );
}
